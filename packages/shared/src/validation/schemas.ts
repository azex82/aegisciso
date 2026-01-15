import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.string().cuid('Invalid role ID'),
});

// Policy schemas
export const policySchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must be 50 characters or less'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  version: z.string().default('1.0'),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED']).default('DRAFT'),
  effectiveDate: z.coerce.date().optional().nullable(),
  reviewDate: z.coerce.date().optional().nullable(),
  category: z.string().optional(),
  department: z.string().optional(),
  ownerId: z.string().cuid().optional().nullable(),
});

export const policyStatementSchema = z.object({
  policyId: z.string().cuid('Invalid policy ID'),
  code: z.string().min(1, 'Code is required'),
  content: z.string().min(1, 'Content is required'),
  requirement: z.string().optional(),
  guidance: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['ACTIVE', 'DEPRECATED', 'PENDING_REVIEW']).default('ACTIVE'),
});

export const mappingSchema = z.object({
  policyStatementId: z.string().cuid('Invalid policy statement ID'),
  frameworkControlId: z.string().cuid('Invalid framework control ID'),
  mappingType: z.enum(['IMPLEMENTS', 'PARTIALLY_IMPLEMENTS', 'SUPPORTS', 'RELATED']).default('IMPLEMENTS'),
  coverageLevel: z.enum(['FULL', 'PARTIAL', 'MINIMAL', 'NONE']).default('PARTIAL'),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  isAiSuggested: z.boolean().default(false),
  isVerified: z.boolean().default(false),
});

// Risk schemas
export const riskSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  inherentLikelihood: z.number().min(1).max(5),
  inherentImpact: z.number().min(1).max(5),
  residualLikelihood: z.number().min(1).max(5).optional(),
  residualImpact: z.number().min(1).max(5).optional(),
  status: z.enum(['IDENTIFIED', 'ASSESSING', 'TREATING', 'MONITORING', 'ACCEPTED', 'CLOSED']).default('IDENTIFIED'),
  treatmentPlan: z.string().optional(),
  treatmentStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).default('NOT_STARTED'),
  targetDate: z.coerce.date().optional().nullable(),
  ownerId: z.string().cuid().optional().nullable(),
});

export const findingSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  source: z.string().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'REMEDIATED', 'VERIFIED', 'CLOSED', 'ACCEPTED']).default('OPEN'),
  riskId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  remediationPlan: z.string().optional(),
});

export const exceptionSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  justification: z.string().min(1, 'Justification is required'),
  riskId: z.string().cuid().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED']).default('PENDING'),
  expiryDate: z.coerce.date(),
  compensatingControls: z.string().optional(),
});

// Strategy schemas
export const objectiveSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'DELAYED', 'COMPLETED', 'CANCELLED']).default('NOT_STARTED'),
  targetDate: z.coerce.date().optional().nullable(),
  progressPercent: z.number().min(0).max(100).default(0),
  ownerId: z.string().cuid().optional().nullable(),
  fiscalYear: z.string().optional(),
  quarter: z.string().optional(),
});

export const initiativeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  objectiveId: z.string().cuid('Invalid objective ID'),
  ownerId: z.string().cuid().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
  progressPercent: z.number().min(0).max(100).default(0),
  budget: z.number().optional(),
  actualSpend: z.number().optional(),
});

export const kpiSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  objectiveId: z.string().cuid('Invalid objective ID'),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  frequency: z.string().optional(),
  status: z.enum(['ON_TARGET', 'AT_RISK', 'OFF_TARGET', 'NOT_MEASURED']).default('NOT_MEASURED'),
  trend: z.enum(['IMPROVING', 'STABLE', 'DECLINING', 'UNKNOWN']).default('UNKNOWN'),
});

// Framework schemas
export const frameworkSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  version: z.string().min(1, 'Version is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const frameworkControlSchema = z.object({
  frameworkId: z.string().cuid('Invalid framework ID'),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  priority: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PolicyInput = z.infer<typeof policySchema>;
export type PolicyStatementInput = z.infer<typeof policyStatementSchema>;
export type MappingInput = z.infer<typeof mappingSchema>;
export type RiskInput = z.infer<typeof riskSchema>;
export type FindingInput = z.infer<typeof findingSchema>;
export type ExceptionInput = z.infer<typeof exceptionSchema>;
export type ObjectiveInput = z.infer<typeof objectiveSchema>;
export type InitiativeInput = z.infer<typeof initiativeSchema>;
export type KPIInput = z.infer<typeof kpiSchema>;
export type FrameworkInput = z.infer<typeof frameworkSchema>;
export type FrameworkControlInput = z.infer<typeof frameworkControlSchema>;
