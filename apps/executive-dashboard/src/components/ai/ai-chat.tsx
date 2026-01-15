'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from '@aegisciso/ui';
import { Send, Bot, User, Shield, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { sovereignAI, type ChatMessage } from '@/lib/sovereign-ai-client';

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={elements.length} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-4 my-2 space-y-1`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{renderInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    // Numbered list (1. item)
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[2]);
      return;
    }

    // Bullet list (- item or * item)
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      return;
    }

    // Flush any pending list
    flushList();

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="font-semibold text-sm mt-3 mb-1">
          {renderInlineMarkdown(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="font-semibold text-base mt-3 mb-1">
          {renderInlineMarkdown(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="font-bold text-base mt-3 mb-1">
          {renderInlineMarkdown(line.slice(2))}
        </h2>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="text-sm my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}

// Render inline markdown (bold, italic, code)
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/[*_](.+?)[*_]/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // Code: `text`
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
      }
      parts.push(
        <code key={key++} className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more matches, add remaining text
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  sources?: Array<{ id: string; type: string; relevance: number; excerpt: string }>;
  confidence?: number;
  processing_time_ms?: number;
}

interface AIChatProps {
  contextType?: 'general' | 'policy' | 'risk' | 'compliance';
  initialSystemPrompt?: string;
  className?: string;
}

export function AIChat({ contextType = 'general', initialSystemPrompt, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI backend status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function checkAIStatus() {
    try {
      const health = await sovereignAI.healthCheck();
      setAiStatus(health.llm_available ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Use RAG-enhanced query for better context
      const response = await sovereignAI.query({
        query: userMessage.content,
        context_type: contextType,
        include_sources: true,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        confidence: response.confidence,
        processing_time_ms: response.processing_time_ms,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }

  function getContextIcon() {
    switch (contextType) {
      case 'policy':
        return '📋';
      case 'risk':
        return '⚠️';
      case 'compliance':
        return '✅';
      default:
        return '🤖';
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Cybersecurity Director</CardTitle>
            <Badge variant="outline" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Sovereign
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{getContextIcon()} {contextType}</span>
            <div className={`h-2 w-2 rounded-full ${
              aiStatus === 'online' ? 'bg-green-500' :
              aiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {aiStatus === 'online' ? 'Online' : aiStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-medium">Sovereign AI Director</p>
              <p className="text-sm mt-1">
                Ask about policies, risks, compliance, or security strategy.
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                All processing is local. No data leaves your infrastructure.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMarkdown(message.content)}
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>

                {/* Metadata for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mt-2 space-y-2">
                    {message.confidence !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          Confidence: {Math.round(message.confidence * 100)}%
                        </Badge>
                        {message.processing_time_ms && (
                          <span>{Math.round(message.processing_time_ms)}ms</span>
                        )}
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-background border rounded p-2"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {source.type}
                              </Badge>
                              <span className="text-muted-foreground">
                                Relevance: {Math.round(source.relevance * 100)}%
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                              {source.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center order-2">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about security policies, risks, compliance..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading || aiStatus === 'offline'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim() || aiStatus === 'offline'}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Sovereignty Notice */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          <Lock className="h-3 w-3 inline mr-1" />
          Fully sovereign - All AI processing runs locally on private infrastructure
        </p>
      </CardContent>
    </Card>
  );
}
