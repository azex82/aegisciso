import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@aegisciso/ui';
import { Brain, Shield, FileText, AlertTriangle, Target, Lock, Server, Cpu, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { AIChat } from '@/components/ai/ai-chat';

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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">AI Cyber Director</h2>
            <Badge variant="outline" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Sovereign AI
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Executive AI advisor for cybersecurity decisions - Clear, concise, action-oriented
          </p>
        </div>
      </div>

      {/* Live Security Context */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Security Posture</p>
                <p className="text-2xl font-bold" style={{ color: context.snapshot?.overallScore && context.snapshot.overallScore >= 70 ? '#16a34a' : context.snapshot?.overallScore && context.snapshot.overallScore >= 50 ? '#d97706' : '#dc2626' }}>
                  {context.snapshot?.overallScore || '--'}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={context.criticalRisks > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical Risks</p>
                <p className={`text-2xl font-bold ${context.criticalRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {context.criticalRisks}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${context.criticalRisks > 0 ? 'text-red-200' : 'text-green-200'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={context.policiesNeedReview > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Policies Need Review</p>
                <p className={`text-2xl font-bold ${context.policiesNeedReview > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {context.policiesNeedReview}
                </p>
              </div>
              <FileText className={`h-8 w-8 ${context.policiesNeedReview > 0 ? 'text-amber-200' : 'text-green-200'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open Findings</p>
                <p className="text-2xl font-bold text-primary">
                  {context.openFindings}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sovereignty Status */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Sovereign AI - Data Never Leaves Your Infrastructure</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <Server className="h-3 w-3" />
                <span>Local LLM</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Cpu className="h-3 w-3" />
                <span>Private RAG</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Lock className="h-3 w-3" />
                <span>Zero Trust</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Chat - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AIChat contextType="general" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/ai-director/policy-mapping" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Policy Mapping</p>
                    <p className="text-xs text-muted-foreground">Map to NCA, NIST, ISO frameworks</p>
                  </div>
                </div>
              </a>

              <a href="/ai-director/risk-analysis" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Risk Analysis</p>
                    <p className="text-xs text-muted-foreground">AI-powered risk assessment</p>
                  </div>
                </div>
              </a>

              <a href="/ai-director/soc-cmm" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">SOC-CMM Assessment</p>
                    <p className="text-xs text-muted-foreground">Maturity model analysis</p>
                  </div>
                </div>
              </a>

              <a href="/ai-director/threat-intel" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Threat Intelligence</p>
                    <p className="text-xs text-muted-foreground">Attack path analysis</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Compliance Frameworks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>NCA ECC</Badge>
                <Badge>SAMA CSF</Badge>
                <Badge>NIST CSF</Badge>
                <Badge>ISO 27001</Badge>
                <Badge>SOC 2</Badge>
                <Badge>CIS CSC</Badge>
                <Badge variant="outline">PDPL</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sample Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Try These Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {[
              "What controls does NCA ECC require for access management?",
              "Analyze our policy gaps against NIST CSF",
              "What is our current SOC maturity level?",
              "Generate an executive risk summary",
              "Map our incident response policy to ISO 27001",
              "What are the SAMA CSF requirements for cloud security?",
              "Identify attack paths for our infrastructure",
              "Recommend improvements for SOC operations"
            ].map((question, idx) => (
              <div
                key={idx}
                className="p-2 text-sm bg-muted/50 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                "{question}"
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
