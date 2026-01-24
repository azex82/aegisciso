'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from '@aegisciso/ui';
import { Send, Bot, User, Shield, Loader2, AlertTriangle, Lock, Copy, Check, ThumbsUp, ThumbsDown, Settings2, Cloud, Home } from 'lucide-react';
import { ModelSelector } from './model-selector';
import { AIProvider, PROVIDER_ICONS, PROVIDER_CONFIGS, getStoredSelection } from '@/lib/ai-models';

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

    // Bullet list (- item or * item or + item)
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
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
    if (line.startsWith('#### ')) {
      elements.push(
        <h5 key={index} className="font-semibold text-sm mt-2 mb-1">
          {renderInlineMarkdown(line.slice(5))}
        </h5>
      );
      return;
    }
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  sources?: Array<{ id: string; type: string; relevance: number; excerpt: string }>;
  confidence?: number;
  processing_time_ms?: number;
  model?: string;
  provider?: string;
}

interface AIChatProps {
  contextType?: 'general' | 'policy' | 'risk' | 'compliance';
  initialSystemPrompt?: string;
  className?: string;
}

const examplePrompts = [
  { icon: '📊', text: 'Summarize our current risk landscape' },
  { icon: '📋', text: 'Which policies need immediate review?' },
  { icon: '🎯', text: 'What are our compliance gaps?' },
  { icon: '💡', text: 'Recommend security improvements' },
];

export function AIChat({ contextType = 'general', initialSystemPrompt, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.OPENAI);
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load stored selection on mount
  useEffect(() => {
    const stored = getStoredSelection();
    setSelectedProvider(stored.provider);
    setSelectedModelId(stored.modelId);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModelChange = (provider: AIProvider, modelId: string) => {
    setSelectedProvider(provider);
    setSelectedModelId(modelId);
    setError(null); // Clear any previous errors when model changes
  };

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !selectedModelId) return;

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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModelId,
          message: userMessage.content,
          context_type: contextType,
          conversation_id: messages.length > 0 ? messages[0].id : undefined,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        sources: data.sources,
        confidence: data.confidence,
        processing_time_ms: data.processing_time_ms,
        model: data.model,
        provider: data.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExampleClick(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  async function handleCopy(text: string, messageId: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getContextBadge() {
    switch (contextType) {
      case 'policy':
        return { label: 'Policy Context', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'risk':
        return { label: 'Risk Context', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      case 'compliance':
        return { label: 'Compliance Context', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      default:
        return { label: 'General', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' };
    }
  }

  const contextBadge = getContextBadge();

  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Security Advisor</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Multi-model AI assistant for cybersecurity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${contextBadge.color}`}>
              {contextBadge.label}
            </Badge>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              title="Model settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Model Selector Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Model</p>
                <p className="text-xs text-muted-foreground">Select the model for your conversation</p>
              </div>
              <ModelSelector onModelChange={handleModelChange} disabled={isLoading} />
            </div>
          </div>
        )}

        {/* Compact Model Display (when settings closed) */}
        {!showSettings && selectedModelId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Model:</span>
            <div className="flex items-center gap-1.5 text-xs bg-muted/50 rounded-full px-2.5 py-1">
              <span>{PROVIDER_ICONS[selectedProvider]}</span>
              <span className="font-medium">{selectedModelId}</span>
              <span className="text-muted-foreground">({PROVIDER_CONFIGS[selectedProvider]?.name || selectedProvider})</span>
            </div>
            {/* Data processing indicator */}
            {selectedProvider === AIProvider.OLLAMA ? (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Home className="h-3 w-3" />
                <span>Local</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Cloud className="h-3 w-3" />
                <span>Cloud</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col h-[480px] p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Ask me about security policies, risk assessments, compliance status, or get recommendations to improve your security posture.
              </p>

              {/* Example Prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(prompt.text)}
                    className="flex items-center gap-2 p-3 text-left text-sm bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 rounded-lg transition-all group"
                  >
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Select Ollama for local processing, or OpenAI/DeepSeek for cloud</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted/70 rounded-bl-md'
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

                    {/* Actions and Metadata for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="Copy response"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground hover:text-green-600" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                          </button>

                          {message.model && (
                            <Badge variant="outline" className="text-[10px] ml-2">
                              {message.model}
                            </Badge>
                          )}
                          {message.processing_time_ms && (
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(message.processing_time_ms)}ms
                            </span>
                          )}
                        </div>

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sources</p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map((source, idx) => (
                                <div
                                  key={idx}
                                  className="text-[10px] bg-background border rounded-md px-2 py-1 flex items-center gap-1.5"
                                  title={source.excerpt}
                                >
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                    {source.type}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {Math.round(source.relevance * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/70 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {selectedModelId ? `Thinking with ${selectedModelId}...` : 'Analyzing...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mx-4">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-muted/30 relative z-40">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedModelId ? `Ask ${selectedModelId} about security policies, risks, compliance...` : 'Select a model to start...'}
                className="min-h-[52px] max-h-[120px] resize-none pr-4 bg-background"
                disabled={isLoading || !selectedModelId}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              size="icon"
              disabled={isLoading || !input.trim() || !selectedModelId}
              className="h-[52px] w-[52px] rounded-xl"
              onClick={() => handleSubmit()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line {selectedProvider === AIProvider.OLLAMA && '| Data processed locally'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
