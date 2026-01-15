# AegisCISO Platform

A production-ready Turborepo monorepo containing four Next.js 14 applications for security governance, risk management, and compliance.

## Applications

| App | Port | Description |
|-----|------|-------------|
| **Executive Dashboard** | 3001 | Security posture overview, metrics, and trends |
| **Policy Mapper** | 3002 | Map policies to compliance framework controls |
| **Risk & Policy Hub** | 3003 | Risk register, findings, and exceptions |
| **Strategy Health** | 3004 | Objectives, initiatives, and KPIs tracking |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Monorepo**: Turborepo + pnpm workspaces
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Charts**: Recharts
- **Testing**: Playwright E2E
- **TypeScript**: Full type safety

## Project Structure

```
aegisciso/
├── apps/
│   ├── executive-dashboard/   # Port 3001
│   ├── policy-mapper/         # Port 3002
│   ├── risk-policy-hub/       # Port 3003
│   └── strategy-health/       # Port 3004
├── packages/
│   ├── db/                    # Prisma schema & client
│   ├── shared/                # Types, RBAC, utilities
│   └── ui/                    # shadcn components
├── tests/                     # Playwright E2E tests
├── docker-compose.yml         # PostgreSQL setup
└── turbo.json                 # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL)

### Installation

```bash
# Clone the repository
cd aegisciso

# Install dependencies
pnpm install

# Start PostgreSQL
pnpm db:up

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed the database
pnpm seed
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Or start individual apps
pnpm --filter @aegisciso/executive-dashboard dev
pnpm --filter @aegisciso/policy-mapper dev
pnpm --filter @aegisciso/risk-policy-hub dev
pnpm --filter @aegisciso/strategy-health dev
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| CISO | ciso@aegisciso.com | SecurePass123! |
| Admin | admin@aegisciso.com | AdminPass123! |
| Analyst | analyst@aegisciso.com | AnalystPass123! |
| Viewer | viewer@aegisciso.com | ViewerPass123! |

## Building for Production

```bash
# Build all apps
pnpm build

# Start production servers
pnpm start
```

## Testing

```bash
# Run Playwright tests
cd tests
pnpm test

# Run with UI
pnpm test:ui

# View test report
pnpm test:report
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure project settings:
   - Root Directory: `apps/executive-dashboard` (or other app)
   - Build Command: `cd ../.. && pnpm build --filter=@aegisciso/executive-dashboard`
   - Output Directory: `.next`
3. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Random secret for JWT signing
   - `NEXTAUTH_URL`: Your app URL

Deploy each app as a separate Vercel project.

### Self-Hosted (VPS)

```bash
# Build all apps
pnpm build

# Run with PM2
pm2 start ecosystem.config.js
```

Example `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'executive-dashboard',
      cwd: './apps/executive-dashboard',
      script: 'pnpm',
      args: 'start',
      env: { PORT: 3001 }
    },
    {
      name: 'policy-mapper',
      cwd: './apps/policy-mapper',
      script: 'pnpm',
      args: 'start',
      env: { PORT: 3002 }
    },
    {
      name: 'risk-policy-hub',
      cwd: './apps/risk-policy-hub',
      script: 'pnpm',
      args: 'start',
      env: { PORT: 3003 }
    },
    {
      name: 'strategy-health',
      cwd: './apps/strategy-health',
      script: 'pnpm',
      args: 'start',
      env: { PORT: 3004 }
    }
  ]
};
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base
RUN npm i -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3001 3002 3003 3004
CMD ["pnpm", "start"]
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3001"

# Feature Flags
ENABLE_AI_FEATURES="false"

# Optional: OpenAI
OPENAI_API_KEY=""
```

## RBAC Roles

| Role | Permissions |
|------|-------------|
| **CISO** | Full access to all resources |
| **ADMIN** | Full access, manage users |
| **ANALYST** | Create/Read/Update policies, risks, findings |
| **VIEWER** | Read-only access |

## Database Models

- **Auth**: User, Role, Permission, AuditLog
- **Policies**: Policy, PolicyStatement, Framework, FrameworkControl, Mapping
- **Risks**: Risk, RiskControlLink, Finding, Exception, EvidenceArtifact
- **Strategy**: StrategyObjective, Initiative, KPI, KPIMeasurement
- **Dashboard**: PostureSnapshot

## Features by App

### Executive Dashboard
- Security posture score (0-100)
- Policy health, compliance coverage, risk exposure metrics
- Historical trend charts
- Risk heatmap overview
- Strategic objectives summary
- Recent activity feed

### Policy Mapper
- Policy CRUD with statements
- Framework control browser
- Policy-to-control mapping
- AI-suggested mappings (confidence scores)
- Coverage level tracking
- Gap analysis

### Risk & Policy Hub
- Risk register with CRUD
- 5x5 risk heatmap (likelihood x impact)
- Control effectiveness tracking
- Finding management
- Exception workflow
- CSV export

### Strategy Health
- Objective tracking with progress
- Initiative management
- KPI monitoring with trends
- Budget tracking
- Fiscal year/quarter filtering

## License

MIT
