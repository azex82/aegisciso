export type PolicyStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';
export type StatementPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type StatementStatus = 'ACTIVE' | 'DEPRECATED' | 'PENDING_REVIEW';
export type MappingType = 'IMPLEMENTS' | 'PARTIALLY_IMPLEMENTS' | 'SUPPORTS' | 'RELATED';
export type CoverageLevel = 'FULL' | 'PARTIAL' | 'MINIMAL' | 'NONE';

export interface Policy {
  id: string;
  code: string;
  title: string;
  description: string | null;
  version: string;
  status: PolicyStatus;
  effectiveDate: Date | null;
  reviewDate: Date | null;
  approvalDate: Date | null;
  category: string | null;
  department: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyStatement {
  id: string;
  policyId: string;
  code: string;
  content: string;
  requirement: string | null;
  guidance: string | null;
  priority: StatementPriority;
  status: StatementStatus;
  wordingScore: number | null;
  wordingFlags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Framework {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrameworkControl {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  priority: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mapping {
  id: string;
  policyStatementId: string;
  frameworkControlId: string;
  mappingType: MappingType;
  coverageLevel: CoverageLevel;
  confidence: number | null;
  notes: string | null;
  isAiSuggested: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyWithRelations extends Policy {
  owner?: { id: string; name: string; email: string } | null;
  statements?: PolicyStatementWithMappings[];
  _count?: {
    statements: number;
  };
}

export interface PolicyStatementWithMappings extends PolicyStatement {
  policy?: Policy;
  mappings?: MappingWithControl[];
}

export interface MappingWithControl extends Mapping {
  frameworkControl?: FrameworkControl & { framework?: Framework };
  policyStatement?: PolicyStatement & { policy?: Policy };
}

export interface FrameworkWithControls extends Framework {
  controls?: FrameworkControl[];
  _count?: {
    controls: number;
  };
}

export interface FrameworkControlWithMappings extends FrameworkControl {
  framework?: Framework;
  mappings?: MappingWithControl[];
}
