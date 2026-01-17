export const dynamic = 'force-dynamic';

import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@aegisciso/ui';
import { Shield, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, Target } from 'lucide-react';

async function getPostureData() {
  const latestSnapshot = await prisma.postureSnapshot.findFirst({
    orderBy: { snapshotDate: 'desc' },
  });

  const previousSnapshot = await prisma.postureSnapshot.findFirst({
    orderBy: { snapshotDate: 'desc' },
    skip: 1,
  });

  return { latestSnapshot, previousSnapshot };
}

function getTrend(current: number, previous: number | undefined) {
  if (!previous) return { icon: Minus, color: 'text-gray-500', text: 'No data' };
  const diff = current - previous;
  if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${diff}%` };
  if (diff < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${diff}%` };
  return { icon: Minus, color: 'text-gray-500', text: 'No change' };
}

export default async function PosturePage() {
  const { latestSnapshot, previousSnapshot } = await getPostureData();

  if (!latestSnapshot) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Posture</h1>
          <p className="text-muted-foreground">Overall security posture and maturity assessment</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium">No posture data available</p>
            <p className="text-sm text-muted-foreground">Posture snapshots will appear here once generated.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = [
    { label: 'Overall Score', value: latestSnapshot.overallScore, prev: previousSnapshot?.overallScore },
    { label: 'Policy Health', value: latestSnapshot.policyHealthScore, prev: previousSnapshot?.policyHealthScore },
    { label: 'Compliance Coverage', value: latestSnapshot.complianceCoverage, prev: previousSnapshot?.complianceCoverage },
    { label: 'Risk Exposure', value: latestSnapshot.riskExposureScore, prev: previousSnapshot?.riskExposureScore, inverse: true },
    { label: 'Strategy Alignment', value: latestSnapshot.strategyAlignmentScore, prev: previousSnapshot?.strategyAlignmentScore },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Posture</h1>
        <p className="text-muted-foreground">
          Overall security posture and maturity assessment • Last updated: {latestSnapshot.snapshotDate.toLocaleDateString()}
        </p>
      </div>

      {/* Overall Score */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Security Posture</p>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-bold text-primary">{latestSnapshot.overallScore}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {(() => {
                  const trend = getTrend(latestSnapshot.overallScore, previousSnapshot?.overallScore);
                  return (
                    <>
                      <trend.icon className={`h-4 w-4 ${trend.color}`} />
                      <span className={`text-sm ${trend.color}`}>{trend.text} from previous</span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Maturity Level {latestSnapshot.maturityLevel}/5
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => {
          const trend = getTrend(metric.value, metric.prev);
          const isGood = metric.inverse ? metric.value < 50 : metric.value >= 70;
          return (
            <Card key={metric.label}>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-bold ${isGood ? 'text-green-600' : metric.value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {metric.value}%
                  </span>
                  <trend.icon className={`h-4 w-4 ${trend.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Policies</span>
              <span className="font-medium">{latestSnapshot.totalPolicies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active</span>
              <span className="font-medium text-green-600">{latestSnapshot.activePolicies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Needs Review</span>
              <span className="font-medium text-amber-600">{latestSnapshot.policiesNeedingReview}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Risks</span>
              <span className="font-medium">{latestSnapshot.totalRisks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Critical</span>
              <span className="font-medium text-red-600">{latestSnapshot.criticalRisks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">High</span>
              <span className="font-medium text-orange-600">{latestSnapshot.highRisks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue Remediations</span>
              <span className="font-medium text-red-600">{latestSnapshot.overdueRemediations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Objectives</span>
              <span className="font-medium">{latestSnapshot.totalObjectives}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">On Track</span>
              <span className="font-medium text-green-600">{latestSnapshot.objectivesOnTrack}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">At Risk</span>
              <span className="font-medium text-amber-600">{latestSnapshot.objectivesAtRisk}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
