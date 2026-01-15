export interface PostureSnapshot {
  id: string;
  snapshotDate: Date;
  overallScore: number;
  policyHealthScore: number;
  complianceCoverage: number;
  riskExposureScore: number;
  strategyAlignmentScore: number;
  totalPolicies: number;
  activePolicies: number;
  policiesNeedingReview: number;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  risksWithoutControls: number;
  totalControls: number;
  implementedControls: number;
  totalObjectives: number;
  objectivesOnTrack: number;
  objectivesAtRisk: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface DashboardMetrics {
  posture: {
    overallScore: number;
    policyHealth: number;
    complianceCoverage: number;
    riskExposure: number;
    strategyAlignment: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  policies: {
    total: number;
    active: number;
    draft: number;
    needingReview: number;
    statementsCount: number;
    mappingsCount: number;
  };
  risks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    withoutControls: number;
    avgResidualScore: number;
  };
  compliance: {
    frameworksCount: number;
    controlsTotal: number;
    controlsMapped: number;
    coveragePercent: number;
    gapsCount: number;
  };
  objectives: {
    total: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
    completed: number;
    avgProgress: number;
  };
  findings: {
    total: number;
    open: number;
    critical: number;
    overdue: number;
    closedThisMonth: number;
  };
  exceptions: {
    total: number;
    pending: number;
    approved: number;
    expiringSoon: number;
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface RiskHeatmapCell {
  likelihood: number;
  impact: number;
  count: number;
  risks: Array<{ id: string; code: string; title: string }>;
}

export interface ComplianceGap {
  frameworkCode: string;
  frameworkName: string;
  controlCode: string;
  controlTitle: string;
  coverageLevel: string;
  missingPolicies: boolean;
}

export interface ExecutiveSummary {
  generatedAt: Date;
  period: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  metrics: DashboardMetrics;
  postureHistory: ChartDataPoint[];
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#dc2626';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export function formatTrend(current: number, previous: number): { direction: 'up' | 'down' | 'stable'; change: number } {
  const change = current - previous;
  if (Math.abs(change) < 0.5) {
    return { direction: 'stable', change: 0 };
  }
  return {
    direction: change > 0 ? 'up' : 'down',
    change: Math.abs(change),
  };
}
