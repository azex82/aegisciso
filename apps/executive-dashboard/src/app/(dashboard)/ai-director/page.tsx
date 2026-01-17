import { Card, CardContent, Badge } from '@aegisciso/ui';
import { Brain, Shield, Lock, Zap } from 'lucide-react';
import { AIChat } from '@/components/ai/ai-chat';
import { QuickQuestions } from '@/components/ai/quick-questions';

export default function AIDirectorPage() {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -ml-24 -mb-24" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">AI Cyber Director</h1>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Sovereign AI
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Your intelligent security advisor powered by private, on-premise AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>Data stays local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <QuickQuestions />
        </CardContent>
      </Card>

      {/* AI Chat - Full Width */}
      <AIChat contextType="general" className="min-h-[550px]" />

      {/* Footer Disclaimer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
        <Zap className="h-3.5 w-3.5" />
        <span>AI responses are generated based on your organization's data. Always verify critical decisions.</span>
      </div>
    </div>
  );
}
