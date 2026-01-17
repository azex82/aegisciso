'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Question {
  label: string;
  query: string;
  category: 'risk' | 'policy' | 'compliance' | 'strategy' | 'general';
}

interface QuickQuestionsResponse {
  questions: Question[];
  context: {
    totalRisks: number;
    criticalRisks: number;
    totalPolicies: number;
    frameworkCount: number;
    postureScore: number | null;
    userRole: string;
  };
}

// Fallback questions if API fails
const fallbackQuestions: Question[] = [
  { label: "Executive Risk Summary", query: "Generate an executive risk summary for the board", category: 'risk' },
  { label: "Policy Gaps", query: "What are our top policy gaps against NCA ECC?", category: 'policy' },
  { label: "NCA ECC Compliance", query: "What controls does NCA ECC require for access management?", category: 'compliance' },
  { label: "SOC Maturity", query: "What is our current SOC maturity level?", category: 'strategy' },
  { label: "Top Priorities", query: "What should be our top 3 security priorities this quarter?", category: 'strategy' },
  { label: "Compliance Status", query: "Summarize our compliance status across all frameworks", category: 'compliance' },
];

const categoryColors: Record<string, string> = {
  risk: 'hover:border-red-500/30 hover:bg-red-500/5',
  policy: 'hover:border-blue-500/30 hover:bg-blue-500/5',
  compliance: 'hover:border-green-500/30 hover:bg-green-500/5',
  strategy: 'hover:border-purple-500/30 hover:bg-purple-500/5',
  general: 'hover:border-primary/20 hover:bg-muted',
};

export function QuickQuestions() {
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/ai/quick-questions');
      if (response.ok) {
        const data: QuickQuestionsResponse = await response.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Failed to fetch quick questions:', error);
      // Keep using fallback questions
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchQuestions();
  };

  const handleClick = (query: string) => {
    // Find the textarea in the AI chat and populate it
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = query;
      textarea.focus();
      // Trigger React's onChange
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Suggested questions:</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          title="Refresh suggestions"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {isLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-24 bg-muted/50 rounded-full animate-pulse"
            />
          ))}
        </div>
      ) : (
        questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(q.query)}
            className={`px-3 py-1.5 text-xs bg-muted/50 border border-transparent rounded-full text-muted-foreground hover:text-foreground transition-all ${categoryColors[q.category] || categoryColors.general}`}
            title={q.query}
          >
            {q.label}
          </button>
        ))
      )}
    </div>
  );
}
