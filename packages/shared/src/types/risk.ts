export type RiskStatus = 'IDENTIFIED' | 'ASSESSING' | 'TREATING' | 'MONITORING' | 'ACCEPTED' | 'CLOSED';
export type TreatmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type ControlEffectiveness = 'HIGHLY_EFFECTIVE' | 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'UNKNOWN';
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'REMEDIATED' | 'VERIFIED' | 'CLOSED' | 'ACCEPTED';
export type ExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export interface Risk {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  source: string | null;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentRiskScore: number;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualRiskScore: number | null;
  status: RiskStatus;
  treatmentPlan: string | null;
  treatmentStatus: TreatmentStatus;
  identifiedDate: Date;
  targetDate: Date | null;
  lastReviewDate: Date | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskControlLink {
  id: string;
  riskId: string;
  policyId: string | null;
  frameworkControlId: string | null;
  effectiveness: ControlEffectiveness;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Finding {
  id: string;
  code: string;
  title: string;
  description: string | null;
  source: string | null;
  severity: FindingSeverity;
  status: FindingStatus;
  riskId: string | null;
  assigneeId: string | null;
  dueDate: Date | null;
  closedDate: Date | null;
  remediationPlan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceArtifact {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  policyStatementId: string | null;
  findingId: string | null;
  collectedDate: Date;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exception {
  id: string;
  code: string;
  title: string;
  description: string | null;
  justification: string;
  riskId: string | null;
  status: ExceptionStatus;
  approverId: string | null;
  requestedDate: Date;
  approvalDate: Date | null;
  expiryDate: Date;
  compensatingControls: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskWithRelations extends Risk {
  owner?: { id: string; name: string; email: string } | null;
  controlLinks?: RiskControlLinkWithRelations[];
  findings?: Finding[];
  exceptions?: Exception[];
  _count?: {
    controlLinks: number;
    findings: number;
    exceptions: number;
  };
}

export interface RiskControlLinkWithRelations extends RiskControlLink {
  risk?: Risk;
  policy?: { id: string; code: string; title: string } | null;
  frameworkControl?: { id: string; code: string; title: string; framework?: { code: string; name: string } } | null;
}

export interface FindingWithRelations extends Finding {
  risk?: Risk | null;
  assignee?: { id: string; name: string; email: string } | null;
  evidence?: EvidenceArtifact[];
}

export interface ExceptionWithRelations extends Exception {
  risk?: Risk | null;
  approver?: { id: string; name: string; email: string } | null;
}

export function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function getRiskLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 20) return 'CRITICAL';
  if (score >= 12) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  return 'LOW';
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH': return '#ea580c';
    case 'MEDIUM': return '#ca8a04';
    case 'LOW': return '#16a34a';
  }
}
