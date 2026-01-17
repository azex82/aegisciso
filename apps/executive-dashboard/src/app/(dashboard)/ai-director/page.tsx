import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@aegisciso/ui';
import {
  Brain,
  Shield,
  FileText,
  AlertTriangle,
  Target,
  Lock,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  MessageSquare,
  BarChart3,
  FileSearch,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { AIChat } from '@/components/ai/ai-chat';
import { QuickQuestions } from '@/components/ai/quick-questions';

async function getSecurityContext() {
  const [snapshot, previousSnapshot, criticalRisks, highRisks, policiesNeedReview, draftPolicies, openFindings, frameworks] = await Promise.all([
    prisma.postureSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
    }),
    prisma.postureSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
      skip: 1,
    }),
    prisma.risk.count({
      where: { status: { not: 'CLOSED' }, inherentRiskScore: { gte: 20 } },
    }),
    prisma.risk.count({
      where: { status: { not: 'CLOSED' }, inherentRiskScore: { gte: 12, lt: 20 } },
    }),
    prisma.policy.count({
      where: { status: 'PUBLISHED', reviewDate: { lte: new Date() } },
    }),
    prisma.policy.count({
      where: { status: 'DRAFT' },
    }),
    prisma.finding.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    prisma.framework.findMany({
      where: { isActive: true },
      include: { controls: { include: { mappings: true } } },
    }),
  ]);

  // Calculate compliance coverage
  const totalControls = frameworks.reduce((sum, f) => sum + f.controls.length, 0);
  const mappedControls = frameworks.reduce(
    (sum, f) => sum + f.controls.filter(c => c.mappings.length > 0).length,
    0
  );
  const complianceCoverage = totalControls > 0 ? Math.round((mappedControls / totalControls) * 100) : 0;

  const postureTrend = snapshot && previousSnapshot
    ? snapshot.overallScore - previousSnapshot.overallScore
    : 0;

  return {
    snapshot,
    postureTrend,
    criticalRisks,
    highRisks,
    policiesNeedReview,
    draftPolicies,
    openFindings,
    complianceCoverage,
    frameworkCount: frameworks.length,
  };
}

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Ask Anything',
    description: 'Natural language queries about your security posture',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Risk Analysis',
    description: 'Deep insights into risks and treatment strategies',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: FileSearch,
    title: 'Policy Mapping',
    description: 'Map policies to NCA ECC, NIST CSF, ISO 27001',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Lightbulb,
    title: 'Recommendations',
    description: 'Actionable insights to improve security posture',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

export default async function AIDirectorPage() {
  const context = await getSecurityContext();

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-500';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number | undefined) => {
    if (!score) return 'from-gray-500/10';
    if (score >= 70) return 'from-green-500/10';
    if (score >= 50) return 'from-amber-500/10';
    return 'from-red-500/10';
  };

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

      {/* Live Security Context */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* Posture Score - Larger */}
        <Card className={`col-span-2 lg:col-span-1 border-2 bg-gradient-to-br ${getScoreBgColor(context.snapshot?.overallScore)} to-transparent`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Security Posture</p>
              <Activity className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(context.snapshot?.overallScore)}`}>
                {context.snapshot?.overallScore || '--'}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            {context.postureTrend !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${context.postureTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {context.postureTrend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{context.postureTrend > 0 ? '+' : ''}{context.postureTrend} from last period</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Risks */}
        <Card className={context.criticalRisks > 0 ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Critical Risks</p>
              <AlertTriangle className={`h-4 w-4 ${context.criticalRisks > 0 ? 'text-red-500' : 'text-muted-foreground/50'}`} />
            </div>
            <p className={`text-3xl font-bold ${context.criticalRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {context.criticalRisks}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {context.highRisks} high risk{context.highRisks !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Policies Needing Review */}
        <Card className={context.policiesNeedReview > 0 ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Review Due</p>
              <FileText className={`h-4 w-4 ${context.policiesNeedReview > 0 ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
            </div>
            <p className={`text-3xl font-bold ${context.policiesNeedReview > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {context.policiesNeedReview}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {context.draftPolicies} draft{context.draftPolicies !== 1 ? 's' : ''} pending
            </p>
          </CardContent>
        </Card>

        {/* Compliance Coverage */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Compliance</p>
              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className={`text-3xl font-bold ${context.complianceCoverage >= 70 ? 'text-green-600' : context.complianceCoverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {context.complianceCoverage}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {context.frameworkCount} framework{context.frameworkCount !== 1 ? 's' : ''} tracked
            </p>
          </CardContent>
        </Card>

        {/* Open Findings */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Open Findings</p>
              <Target className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {context.openFindings}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Capabilities */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {capabilities.map((cap, idx) => (
          <Card key={idx} className="group hover:border-primary/30 transition-colors cursor-default">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${cap.bgColor} transition-colors`}>
                  <cap.icon className={`h-4 w-4 ${cap.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cap.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cap.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
