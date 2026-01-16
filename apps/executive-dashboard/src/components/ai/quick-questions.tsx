'use client';

import { Sparkles } from 'lucide-react';

const questions = [
  { label: "Executive Risk Summary", query: "Generate an executive risk summary for the board" },
  { label: "Policy Gaps", query: "What are our top policy gaps against NIST CSF?" },
  { label: "NCA ECC Compliance", query: "What controls does NCA ECC require for access management?" },
  { label: "SOC Maturity", query: "What is our current SOC maturity level?" },
  { label: "Top Priorities", query: "What should be our top 3 security priorities this quarter?" },
  { label: "Compliance Status", query: "Summarize our compliance status across all frameworks" },
];

export function QuickQuestions() {
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
        <span>Quick questions:</span>
      </div>
      {questions.map((q, idx) => (
        <button
          key={idx}
          onClick={() => handleClick(q.query)}
          className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 rounded-full text-muted-foreground hover:text-foreground transition-all"
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}
