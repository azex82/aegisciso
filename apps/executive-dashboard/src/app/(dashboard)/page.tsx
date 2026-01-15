import { prisma } from '@aegisciso/db';
import { PostureCard } from '@/components/dashboard/posture-card';
import { KPITiles } from '@/components/dashboard/kpi-tiles';
import { PostureChart } from '@/components/dashboard/posture-chart';
import { ComplianceBars } from '@/components/dashboard/compliance-bars';
import { StrategyImpact } from '@/components/dashboard/strategy-impact';
import { TopRisksTable } from '@/components/dashboard/top-risks-table';
import { getSampleFrameworkCoverage, getSampleStrategyImpact, getSampleTopRisks } from '@/lib/sample-data';

async function getDashboardData() {
  const [
    latestSnapshot,
    snapshotHistory,
    risks,
    objectives,
  ] = await Promise.all([
    prisma.postureSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
    }),
    prisma.postureSnapshot.findMany({
      orderBy: { snapshotDate: 'asc' },
      take: 12,
    }),
    prisma.risk.findMany({
      where: { status: { not: 'CLOSED' } },
      orderBy: { inherentRiskScore: 'desc' },
      take: 10,
      include: { owner: { select: { name: true } } },
    }),
    prisma.strategyObjective.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { priority: 'asc' },
      take: 10,
      include: {
        owner: { select: { name: true } },
        riskLinks: { include: { risk: true } },
      },
    }),
  ]);

  // Transform risks for the top risks table
  const transformedRisks = risks.map((risk) => ({
    id: risk.id,
    code: risk.code,
    title: risk.title,
    category: risk.category || 'Uncategorized',
    inherentRiskScore: risk.inherentRiskScore,
    residualRiskScore: risk.residualRiskScore,
    priority: risk.priority,
    status: risk.status,
    targetDate: risk.targetDate?.toISOString() || null,
    owner: risk.owner,
    isOverdue: risk.targetDate ? new Date(risk.targetDate) < new Date() : false,
    daysOverdue: risk.targetDate && new Date(risk.targetDate) < new Date()
      ? Math.floor((new Date().getTime() - new Date(risk.targetDate).getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  }));

  // Transform objectives for strategy impact
  const transformedObjectives = objectives.map((obj) => ({
    id: obj.id,
    code: obj.code,
    title: obj.title,
    status: obj.status,
    progressPercent: obj.progressPercent,
    impactingRisks: obj.riskLinks?.length || 0,
    impactLevel: obj.riskLinks && obj.riskLinks.length > 2 ? 'HIGH' :
                 obj.riskLinks && obj.riskLinks.length > 0 ? 'MEDIUM' : 'NONE',
  }));

  const impactedObjectives = transformedObjectives.filter((obj) => obj.impactingRisks > 0);

  return {
    snapshot: latestSnapshot,
    history: snapshotHistory,
    risks: transformedRisks,
    objectives: transformedObjectives,
    totalImpactedObjectives: impactedObjectives.length,
    strategyImpactScore: Math.round((impactedObjectives.length / Math.max(objectives.length, 1)) * 100),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Prepare KPI data
  const kpiData = data.snapshot ? {
    overallScore: data.snapshot.overallScore,
    complianceCoverage: data.snapshot.complianceCoverage,
    policyHealthScore: data.snapshot.policyHealthScore,
    criticalRisks: data.snapshot.criticalRisks,
    highRisks: data.snapshot.highRisks,
    overdueActions: data.snapshot.overdueActions || 0,
    maturityLevel: data.snapshot.maturityLevel || 3,
    policyViolations: data.snapshot.policyViolations || 0,
    scoreTrend: 3,
    complianceTrend: 2,
    riskTrend: -1,
  } : null;

  // Get sample data for demo (fallback)
  const frameworkCoverage = getSampleFrameworkCoverage();
  const strategyData = data.objectives.length > 0
    ? {
        objectives: data.objectives as any[],
        totalImpactedObjectives: data.totalImpactedObjectives,
        strategyImpactScore: data.strategyImpactScore,
      }
    : getSampleStrategyImpact();

  const risksData = data.risks.length > 0 ? data.risks : getSampleTopRisks();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-muted-foreground">
            Security posture overview and executive metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last updated:</span>
          <span className="font-medium">
            {data.snapshot?.snapshotDate
              ? new Date(data.snapshot.snapshotDate).toLocaleString()
              : 'No data available'}
          </span>
        </div>
      </div>

      {/* KPI Tiles Row */}
      <KPITiles data={kpiData} />

      {/* Main Posture Card */}
      <PostureCard snapshot={data.snapshot} />

      {/* Posture Trend Chart - Full Width */}
      <PostureChart history={data.history} />

      {/* Compliance & Strategy Impact Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceBars frameworks={frameworkCoverage} />
        <StrategyImpact
          objectives={strategyData.objectives}
          totalImpactedObjectives={strategyData.totalImpactedObjectives}
          strategyImpactScore={strategyData.strategyImpactScore}
        />
      </div>

      {/* Top Risks Table */}
      <TopRisksTable risks={risksData as any[]} />
    </div>
  );
}
