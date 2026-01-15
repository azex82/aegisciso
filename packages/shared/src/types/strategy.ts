export type ObjectivePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ObjectiveStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';
export type InitiativeStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type KPIStatus = 'ON_TARGET' | 'AT_RISK' | 'OFF_TARGET' | 'NOT_MEASURED';
export type KPITrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';

export interface StrategyObjective {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
  targetDate: Date | null;
  completionDate: Date | null;
  progressPercent: number;
  ownerId: string | null;
  fiscalYear: string | null;
  quarter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Initiative {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: InitiativeStatus;
  objectiveId: string;
  ownerId: string | null;
  startDate: Date | null;
  targetDate: Date | null;
  completionDate: Date | null;
  progressPercent: number;
  budget: number | null;
  actualSpend: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObjectiveControlLink {
  id: string;
  objectiveId: string;
  policyId: string | null;
  frameworkControlId: string | null;
  linkType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPI {
  id: string;
  code: string;
  name: string;
  description: string | null;
  objectiveId: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  frequency: string | null;
  status: KPIStatus;
  trend: KPITrend;
  lastMeasuredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIMeasurement {
  id: string;
  kpiId: string;
  value: number;
  measuredAt: Date;
  notes: string | null;
  createdAt: Date;
}

export interface StrategyObjectiveWithRelations extends StrategyObjective {
  owner?: { id: string; name: string; email: string } | null;
  initiatives?: InitiativeWithRelations[];
  kpis?: KPIWithMeasurements[];
  controlLinks?: ObjectiveControlLinkWithRelations[];
  _count?: {
    initiatives: number;
    kpis: number;
  };
}

export interface InitiativeWithRelations extends Initiative {
  objective?: StrategyObjective;
  owner?: { id: string; name: string; email: string } | null;
}

export interface ObjectiveControlLinkWithRelations extends ObjectiveControlLink {
  objective?: StrategyObjective;
  policy?: { id: string; code: string; title: string } | null;
  frameworkControl?: { id: string; code: string; title: string } | null;
}

export interface KPIWithMeasurements extends KPI {
  objective?: StrategyObjective;
  measurements?: KPIMeasurement[];
}

export function getStatusColor(status: ObjectiveStatus): string {
  switch (status) {
    case 'COMPLETED': return '#16a34a';
    case 'ON_TRACK': return '#22c55e';
    case 'AT_RISK': return '#eab308';
    case 'DELAYED': return '#f97316';
    case 'CANCELLED': return '#6b7280';
    case 'NOT_STARTED': return '#94a3b8';
  }
}

export function getKPIStatusColor(status: KPIStatus): string {
  switch (status) {
    case 'ON_TARGET': return '#16a34a';
    case 'AT_RISK': return '#eab308';
    case 'OFF_TARGET': return '#dc2626';
    case 'NOT_MEASURED': return '#94a3b8';
  }
}

export function getTrendIcon(trend: KPITrend): string {
  switch (trend) {
    case 'IMPROVING': return '↑';
    case 'STABLE': return '→';
    case 'DECLINING': return '↓';
    case 'UNKNOWN': return '?';
  }
}
