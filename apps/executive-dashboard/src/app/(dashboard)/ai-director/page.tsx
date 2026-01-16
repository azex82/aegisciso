import { prisma } from '@aegisciso/db';
import { Card, CardContent, Badge } from '@aegisciso/ui';
import { Brain, Shield, FileText, AlertTriangle, Target, Lock, Activity } from 'lucide-react';
import { AIChat } from '@/components/ai/ai-chat';
import { QuickQuestions } from '@/components/ai/quick-questions';

async function getSecurityContext() {
  const [snapshot, criticalRisks, policiesNeedReview, openFindings] = await Promise.all([
    prisma.postureSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
    }),
    prisma.risk.count({
      where: { status: { not: 'CLOSED' }, inherentRiskScore: { gte: 20 } },
    }),
    prisma.policy.count({
      where: { status: 'PUBLISHED', reviewDate: { lte: new Date() } },
    }),
    prisma.finding.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
  ]);

  return { snapshot, criticalRisks, policiesNeedReview, openFindings };
}

export default async function AIDirectorPage() {
  const context = await getSecurityContext();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">AI Cyber Director</h2>
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Sovereign
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Your AI-powered security advisor - Ask questions, get actionable insights
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Lock className="h-3 w-3 text-green-600" />
          <span>All data stays on your infrastructure</span>
        </div>
      </div>

      {/* Live Security Context - Compact */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Posture</p>
                <p className="text-xl font-bold" style={{ color: context.snapshot?.overallScore && context.snapshot.overallScore >= 70 ? '#16a34a' : context.snapshot?.overallScore && context.snapshot.overallScore >= 50 ? '#d97706' : '#dc2626' }}>
                  {context.snapshot?.overallScore || '--'}%
                </p>
              </div>
              <Activity className="h-6 w-6 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className={context.criticalRisks > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Critical Risks</p>
                <p className={`text-xl font-bold ${context.criticalRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {context.criticalRisks}
                </p>
              </div>
              <AlertTriangle className={`h-6 w-6 ${context.criticalRisks > 0 ? 'text-red-200' : 'text-green-200'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={context.policiesNeedReview > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Review Due</p>
                <p className={`text-xl font-bold ${context.policiesNeedReview > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {context.policiesNeedReview}
                </p>
              </div>
              <FileText className={`h-6 w-6 ${context.policiesNeedReview > 0 ? 'text-amber-200' : 'text-green-200'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Findings</p>
                <p className="text-xl font-bold text-primary">
                  {context.openFindings}
                </p>
              </div>
              <Target className="h-6 w-6 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Questions */}
      <QuickQuestions />

      {/* Full-width AI Chat */}
      <AIChat contextType="general" className="min-h-[600px]" />
    </div>
  );
}
