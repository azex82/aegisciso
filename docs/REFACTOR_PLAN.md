# AegisCISO Refactor Plan: SABIC AI Cybersecurity Director Platform

## Overview

This plan outlines the step-by-step transformation of the existing aegisCISO POC into a SABIC-branded AI Cybersecurity Director platform.

---

## Phase 1: Project Structure Consolidation

### 1.1 Create Unified Application

**Action**: Create new unified Next.js app from `executive-dashboard` base

```
apps/
├── executive-dashboard/     → RENAME TO: web/
├── policy-mapper/          → MERGE INTO: web/
├── risk-policy-hub/        → MERGE INTO: web/
├── strategy-health/        → DEPRECATE (absorb into dashboard)
```

**New Structure**:
```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with SABIC theme
│   │   ├── page.tsx                      # Redirect to /dashboard
│   │   ├── login/page.tsx                # Authentication
│   │   ├── api/                          # API routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── ai/
│   │   │   ├── dashboard/
│   │   │   ├── policies/
│   │   │   └── risks/
│   │   └── (main)/                       # Main app routes
│   │       ├── layout.tsx                # Tab navigation layout
│   │       ├── dashboard/page.tsx        # Tab 1: Executive Dashboard
│   │       ├── ai-director/page.tsx      # Tab 2: AI Cyber Director Chat
│   │       ├── policies/                 # Tab 3: Cybersecurity Policies
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── risks/                    # Tab 4: Risks
│   │           ├── page.tsx
│   │           └── [id]/page.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   ├── layout/
│   │   │   ├── main-nav.tsx              # Tab navigation
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/                    # Dashboard widgets
│   │   │   ├── kpi-tiles.tsx
│   │   │   ├── posture-trend.tsx
│   │   │   ├── maturity-gauge.tsx
│   │   │   ├── compliance-bars.tsx
│   │   │   ├── policy-health-chart.tsx
│   │   │   ├── top-risks-table.tsx
│   │   │   └── strategy-impact.tsx
│   │   ├── ai/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── chat-message.tsx
│   │   │   └── context-panel.tsx
│   │   ├── policies/
│   │   │   ├── policy-table.tsx
│   │   │   ├── policy-detail.tsx
│   │   │   ├── framework-matrix.tsx
│   │   │   ├── document-control.tsx
│   │   │   └── expiry-alerts.tsx
│   │   └── risks/
│   │       ├── risk-heatmap.tsx
│   │       ├── risk-table.tsx
│   │       ├── remediation-panel.tsx
│   │       ├── overdue-panel.tsx
│   │       └── expiring-soon.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   └── computations/
│   │       ├── posture.ts
│   │       ├── maturity.ts
│   │       ├── compliance.ts
│   │       └── risk-score.ts
│   └── styles/
│       ├── globals.css                   # Global styles + SABIC theme
│       └── theme.ts                      # Design tokens
├── public/
│   └── sabic-logo.svg
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### 1.2 Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/styles/theme.ts` | SABIC design tokens |
| `apps/web/src/components/layout/main-nav.tsx` | 4-tab navigation |
| `apps/web/src/components/dashboard/maturity-gauge.tsx` | Maturity visualization |
| `apps/web/src/components/dashboard/compliance-bars.tsx` | Framework compliance |
| `apps/web/src/components/dashboard/strategy-impact.tsx` | Risk-strategy mapping |
| `apps/web/src/components/policies/framework-matrix.tsx` | Policy-framework matrix |
| `apps/web/src/components/policies/expiry-alerts.tsx` | Document expiry panel |
| `apps/web/src/components/risks/remediation-panel.tsx` | Remediation tracking |
| `apps/web/src/lib/computations/posture.ts` | Posture calculation |
| `apps/web/src/lib/computations/maturity.ts` | Maturity calculation |

### 1.3 Files to Modify

| File | Changes |
|------|---------|
| `packages/db/prisma/schema.prisma` | Add RemediationPlan, enhance Policy |
| `packages/ui/src/globals.css` | SABIC theme colors |
| `packages/ui/tailwind.config.ts` | SABIC theme tokens |
| `sovereign-ai/api/main.py` | Add context-aware endpoints |
| `sovereign-ai/llm/prompts.py` | Executive response style |

---

## Phase 2: SABIC Theme Implementation

### 2.1 Design Tokens

**File**: `apps/web/src/styles/theme.ts`

```typescript
export const sabicTheme = {
  colors: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#003366',  // SABIC Primary Blue
      600: '#002b57',
      700: '#002347',
      800: '#001a38',
      900: '#001229',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0284c7',  // Accent Blue
      600: '#0369a1',
      700: '#075985',
      800: '#0c4a6e',
      900: '#083344',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  spacing: {
    section: '2rem',
    card: '1.5rem',
    element: '1rem',
    tight: '0.5rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 51, 102, 0.05)',
    md: '0 4px 6px rgba(0, 51, 102, 0.07)',
    lg: '0 10px 15px rgba(0, 51, 102, 0.1)',
    xl: '0 20px 25px rgba(0, 51, 102, 0.15)',
  },
};
```

### 2.2 Tailwind Config Updates

**File**: `packages/ui/tailwind.config.ts`

```typescript
// Add SABIC colors
colors: {
  sabic: {
    blue: '#003366',
    'blue-light': '#0284c7',
    'blue-dark': '#001a38',
  },
  // ... extend existing colors
}
```

### 2.3 CSS Variables

**File**: `packages/ui/src/globals.css`

```css
:root {
  /* SABIC Theme */
  --sabic-primary: 210 100% 20%;
  --sabic-secondary: 201 96% 40%;
  --sabic-accent: 199 89% 48%;

  /* Override shadcn defaults */
  --primary: 210 100% 20%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;

  /* Executive card styling */
  --card: 0 0% 100%;
  --card-foreground: 210 100% 20%;
  --border: 214.3 31.8% 91.4%;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 51, 102, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 51, 102, 0.07);
}
```

---

## Phase 3: Executive Dashboard Implementation

### 3.1 KPI Tiles Component

**File**: `apps/web/src/components/dashboard/kpi-tiles.tsx`

Features:
- Posture Score (0-100 with color indicator)
- Compliance % (by top framework)
- Policy Health % (valid/total)
- Open Critical Risks (count with trend)
- Overdue Actions (count with urgency)

### 3.2 Maturity Gauge Component

**File**: `apps/web/src/components/dashboard/maturity-gauge.tsx`

Features:
- 5-level gauge visualization
- Current level highlight
- Level descriptions
- Driver indicators

### 3.3 Posture Trend Chart

**File**: `apps/web/src/components/dashboard/posture-trend.tsx`

Features:
- 12-month line chart
- Multiple metrics overlay
- Hover tooltips
- Period selector

### 3.4 Compliance Coverage Bars

**File**: `apps/web/src/components/dashboard/compliance-bars.tsx`

Features:
- Stacked bars per framework
- Coverage percentages
- Gap indicators
- Click-through to details

### 3.5 Top Risks Table

**File**: `apps/web/src/components/dashboard/top-risks-table.tsx`

Features:
- Multi-column sortable
- Priority, Severity, Criticality columns
- Overdue indicator
- Action buttons

---

## Phase 4: AI Cyber Director Chat Implementation

### 4.1 Chat Interface

**File**: `apps/web/src/components/ai/chat-interface.tsx`

Features:
- Professional styling
- Message history
- Typing indicators
- Context panel toggle

### 4.2 Executive Response Style

**File**: `sovereign-ai/llm/prompts.py`

Update system prompts:
```python
CYBER_DIRECTOR_SYSTEM_PROMPT = """
You are the AI Cyber Director for SABIC, a senior cybersecurity executive assistant.

Response Style:
- Clear, concise, and decision-oriented
- Executive summary first, details on request
- Actionable recommendations with priorities
- Risk-based context for all advice
- Reference relevant policies and frameworks
- Cite specific metrics when available

Context Available:
- Current security posture: {posture_score}
- Open critical risks: {critical_risks}
- Policy compliance: {compliance_pct}%
- Maturity level: {maturity_level}/5
"""
```

### 4.3 Context Integration

**File**: `apps/web/src/app/api/ai/chat/route.ts`

- Inject real-time data into AI context
- Policy awareness
- Risk data integration
- Posture metrics inclusion

---

## Phase 5: Cybersecurity Policies Implementation

### 5.1 Policy Table Component

**File**: `apps/web/src/components/policies/policy-table.tsx`

Features:
- Filterable columns
- Framework filter
- Owner filter
- Status filter
- Maturity filter
- Expiry filter
- Sort capabilities
- Bulk actions

### 5.2 Policy Detail Page

**File**: `apps/web/src/app/(main)/policies/[id]/page.tsx`

Features:
- Policy metadata
- Statement list
- Framework mappings
- Coverage gaps
- Maturity assessment
- Evidence/notes

### 5.3 Framework Matrix View

**File**: `apps/web/src/components/policies/framework-matrix.tsx`

Features:
- Policy rows × Framework columns
- Coverage indicators
- Gap highlighting
- Interactive cells

### 5.4 Document Control Panel

**File**: `apps/web/src/components/policies/document-control.tsx`

Features:
- Validity status
- Owner display
- Version history
- Approval workflow
- Expiry tracking

### 5.5 Expiry Alerts Panel

**File**: `apps/web/src/components/policies/expiry-alerts.tsx`

Features:
- Expiring soon list
- Calendar view option
- Review due dates
- Quick actions

---

## Phase 6: Risks Implementation

### 6.1 Interactive Heatmap

**File**: `apps/web/src/components/risks/risk-heatmap.tsx`

Features:
- 5×5 matrix
- Color intensity by count
- Click-through to filtered list
- Hover tooltips
- Risk count per cell

### 6.2 Remediation Panel

**File**: `apps/web/src/components/risks/remediation-panel.tsx`

Features:
- Active plans list
- Progress indicators
- Owner assignment
- Due date tracking
- Status updates

### 6.3 Overdue Panel

**File**: `apps/web/src/components/risks/overdue-panel.tsx`

Features:
- Overdue remediation plans
- Days overdue indicator
- Escalation status
- Quick action buttons

### 6.4 Expiring Soon Panel

**File**: `apps/web/src/components/risks/expiring-soon.tsx`

Features:
- Plans due within 30 days
- Timeline view
- Priority sorting
- Owner contact

### 6.5 All Risks Table

**File**: `apps/web/src/components/risks/risk-table.tsx`

Features:
- Full CRUD
- Advanced filters
- Search functionality
- Export (CSV, Excel)
- Bulk operations

---

## Phase 7: Data Model Updates

### 7.1 Prisma Schema Changes

**File**: `packages/db/prisma/schema.prisma`

```prisma
// Add RemediationPlan model
model RemediationPlan {
  id          String   @id @default(cuid())
  riskId      String
  risk        Risk     @relation(fields: [riskId], references: [id])
  title       String
  description String?
  status      RemediationStatus @default(NOT_STARTED)
  priority    Int      @default(3)
  progress    Int      @default(0)
  ownerId     String?
  owner       User?    @relation(fields: [ownerId], references: [id])
  dueDate     DateTime
  startDate   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum RemediationStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  OVERDUE
  CANCELLED
}

// Enhance Policy model
model Policy {
  // ... existing fields
  expiryDate    DateTime?
  reviewDueDate DateTime?
  validityStatus PolicyValidity @default(VALID)
  maturityLevel Int @default(1)
}

enum PolicyValidity {
  VALID
  EXPIRING_SOON
  EXPIRED
  UNDER_REVIEW
}

// Enhance PostureSnapshot
model PostureSnapshot {
  // ... existing fields
  policyViolations   Int @default(0)
  overdueActions     Int @default(0)
  strategyImpact     Float @default(0)
  maturityLevel      Int @default(1)
}
```

---

## Phase 8: Computation Logic

### 8.1 Posture Calculation

**File**: `apps/web/src/lib/computations/posture.ts`

```typescript
export function calculatePostureScore(data: PostureData): number {
  const weights = {
    riskExposure: 0.30,      // 30%
    policyCompliance: 0.25,  // 25%
    frameworkCoverage: 0.25, // 25%
    remediationHealth: 0.20, // 20%
  };

  const riskScore = calculateRiskExposureScore(data.risks);
  const policyScore = calculatePolicyComplianceScore(data.policies);
  const coverageScore = calculateFrameworkCoverageScore(data.mappings);
  const remediationScore = calculateRemediationHealthScore(data.remediations);

  return Math.round(
    riskScore * weights.riskExposure +
    policyScore * weights.policyCompliance +
    coverageScore * weights.frameworkCoverage +
    remediationScore * weights.remediationHealth
  );
}
```

### 8.2 Maturity Calculation

**File**: `apps/web/src/lib/computations/maturity.ts`

```typescript
export function calculateMaturityLevel(data: MaturityData): MaturityResult {
  // Level 1: Initial (ad-hoc)
  // Level 2: Developing (documented)
  // Level 3: Defined (standardized)
  // Level 4: Managed (measured)
  // Level 5: Optimizing (continuous improvement)

  const factors = {
    mappingCompleteness: calculateMappingCompleteness(data),
    policyValidity: calculatePolicyValidityScore(data),
    remediationHealth: calculateRemediationHealth(data),
    processMaturity: calculateProcessMaturity(data),
  };

  const score = Object.values(factors).reduce((a, b) => a + b, 0) / 4;

  return {
    level: Math.ceil(score / 20),  // 0-20=1, 21-40=2, etc.
    score,
    factors,
    drivers: identifyMaturityDrivers(factors),
  };
}
```

---

## Phase 9: Seed Data

### 9.1 NCA ECC Framework Controls

**File**: `packages/db/prisma/seed/nca-ecc.ts`

- Full NCA ECC control library
- Control mappings to policies
- Saudi regulatory requirements

### 9.2 Sample Policies

**File**: `packages/db/prisma/seed/policies.ts`

- 10+ sample policies based on NCA templates
- With statements and mappings
- Various statuses and maturity levels

### 9.3 Sample Risks

**File**: `packages/db/prisma/seed/risks.ts`

- 20+ sample risks
- Various severity/priority combinations
- Remediation plans
- Linked to policies

---

## Phase 10: Migration Steps

### 10.1 Database Migration

```bash
# Generate migration
cd packages/db
npx prisma migrate dev --name add-remediation-and-enhancements

# Apply migration
npx prisma migrate deploy

# Regenerate client
npx prisma generate
```

### 10.2 Application Migration

```bash
# 1. Create new unified app
cd apps
cp -r executive-dashboard web

# 2. Update package.json
# Change name to "@aegisciso/web"

# 3. Install dependencies
pnpm install

# 4. Run development
pnpm dev --filter @aegisciso/web
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Seed data loaded
- [ ] Theme tokens verified
- [ ] All 4 tabs functional
- [ ] API routes tested
- [ ] AI integration verified
- [ ] Authentication working
- [ ] RBAC permissions correct
- [ ] Export functionality tested
- [ ] Mobile responsiveness checked

---

## Timeline Phases

1. **Phase 1-2**: Structure + Theme (Foundation)
2. **Phase 3**: Executive Dashboard (Core)
3. **Phase 4**: AI Chat Enhancement
4. **Phase 5**: Policy Management
5. **Phase 6**: Risk Management
6. **Phase 7-8**: Data Model + Logic
7. **Phase 9-10**: Seed Data + Migration
