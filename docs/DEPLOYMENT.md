# aegisCISO Deployment Guide

## SABIC AI Cybersecurity Director Platform - POC Deployment

This guide covers the deployment steps for the aegisCISO platform, a SABIC-branded AI Cybersecurity Director solution.

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | Runtime environment |
| pnpm | 8.x or higher | Package manager |
| PostgreSQL | 14.x or higher | Primary database |
| Docker | 20.x or higher | Container runtime (optional) |
| Ollama | Latest | Local LLM inference |

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 16GB minimum (32GB recommended for LLM)
- **Storage**: 50GB+ free space
- **OS**: macOS, Linux, or Windows with WSL2

---

## Quick Start (Development)

```bash
# 1. Clone and navigate to project
cd /Users/asma/AI-Projects/aegisCISO

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env

# 4. Start database (Docker)
docker-compose up -d postgres

# 5. Run migrations
pnpm db:migrate

# 6. Seed database with NCA policies
pnpm db:seed

# 7. Start development server
pnpm dev
```

---

## Detailed Setup

### Step 1: Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://aegis:aegis123@localhost:5432/aegisciso?schema=public"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-here"
NEXTAUTH_URL="http://localhost:3000"

# Sovereign AI (Local LLM)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3:70b"
CHROMA_HOST="localhost"
CHROMA_PORT="8000"

# Application
NODE_ENV="development"
```

### Step 2: Database Setup

#### Option A: Docker (Recommended)

```bash
# Start PostgreSQL container
docker run -d \
  --name aegis-postgres \
  -e POSTGRES_USER=aegis \
  -e POSTGRES_PASSWORD=aegis123 \
  -e POSTGRES_DB=aegisciso \
  -p 5432:5432 \
  postgres:14-alpine
```

#### Option B: Local PostgreSQL

```bash
# Create database and user
psql -U postgres <<EOF
CREATE USER aegis WITH PASSWORD 'aegis123';
CREATE DATABASE aegisciso OWNER aegis;
GRANT ALL PRIVILEGES ON DATABASE aegisciso TO aegis;
EOF
```

### Step 3: Run Migrations

```bash
# Navigate to project root
cd /Users/asma/AI-Projects/aegisCISO

# Generate Prisma client
pnpm --filter @aegisciso/db db:generate

# Run migrations
pnpm --filter @aegisciso/db db:migrate

# Or using npx directly
cd packages/db
npx prisma migrate deploy
```

### Step 4: Seed Database

The seed script populates the database with:
- NCA ECC framework and 20 controls
- 10 NCA-based cybersecurity policies with statements
- 8 sample risks with remediation plans
- 5 strategic objectives
- 12 months of posture snapshot history
- 4 test user accounts

```bash
# Run seed script
pnpm --filter @aegisciso/db db:seed

# Or directly
cd packages/db
npx prisma db seed
```

### Step 5: Start Application

```bash
# Development mode (with hot reload)
pnpm dev

# Or start specific app
pnpm --filter executive-dashboard dev
```

Access the application at: **http://localhost:3000**

---

## Test Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| CISO | ciso@sabic.com | CisoPass123! | Full access |
| Admin | admin@sabic.com | AdminPass123! | Administrative access |
| Analyst | analyst@sabic.com | AnalystPass123! | Read/write access |
| Viewer | viewer@sabic.com | ViewerPass123! | Read-only access |

---

## Sovereign AI Setup (Optional)

For the AI Cyber Director functionality, set up the local LLM infrastructure:

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
ollama serve
```

### Download LLM Model

```bash
# Download LLaMA 3 70B (recommended for production)
ollama pull llama3:70b

# Or use smaller model for development
ollama pull llama3:8b
```

### Start ChromaDB (Vector Database)

```bash
# Using Docker
docker run -d \
  --name aegis-chromadb \
  -p 8000:8000 \
  chromadb/chroma:latest
```

### Start Sovereign AI Backend

```bash
# Navigate to sovereign-ai package
cd packages/sovereign-ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Production Deployment

### Build for Production

```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter executive-dashboard build
```

### Environment Variables (Production)

```env
# Production database
DATABASE_URL="postgresql://user:password@db-host:5432/aegisciso?schema=public&sslmode=require"

# Production auth
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="https://aegis.sabic.com"

# Production AI
OLLAMA_BASE_URL="http://ai-server:11434"

# Environment
NODE_ENV="production"
```

### Docker Compose (Full Stack)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: aegis
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: aegisciso
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chroma_data:/chroma/chroma
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://aegis:${DB_PASSWORD}@postgres:5432/aegisciso
      NEXTAUTH_SECRET: ${AUTH_SECRET}
      NEXTAUTH_URL: ${APP_URL}
      OLLAMA_BASE_URL: http://ollama:11434
      CHROMA_HOST: chromadb
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - chromadb
      - ollama
    restart: unless-stopped

volumes:
  postgres_data:
  chroma_data:
  ollama_data:
```

### Run Production

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec app pnpm db:migrate

# Seed database
docker-compose exec app pnpm db:seed
```

---

## Verification Steps

### 1. Database Connection

```bash
# Check database connection
pnpm --filter @aegisciso/db db:studio

# Opens Prisma Studio at http://localhost:5555
```

### 2. Application Health

Visit these endpoints after starting the app:

| Endpoint | Expected Result |
|----------|-----------------|
| http://localhost:3000 | Login page or dashboard |
| http://localhost:3000/api/health | `{"status": "ok"}` |

### 3. Verify Seed Data

After seeding, check:
- **Policies tab**: Should show 10 NCA-based policies
- **Risks tab**: Should show 8 risks with heatmap
- **Dashboard**: Should show posture score and KPIs
- **AI Director**: Should show security context cards

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
psql "postgresql://aegis:aegis123@localhost:5432/aegisciso"
```

#### Prisma Client Not Generated

```bash
# Regenerate Prisma client
cd packages/db
npx prisma generate
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Ollama Model Not Found

```bash
# List available models
ollama list

# Pull required model
ollama pull llama3:70b
```

#### Migration Failed

```bash
# Reset database (WARNING: deletes all data)
cd packages/db
npx prisma migrate reset

# Or manually fix
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Support

For issues or questions:
- Review logs: `pnpm dev` output
- Check Prisma Studio: `pnpm db:studio`
- Database logs: `docker logs aegis-postgres`

---

## Architecture Overview

```
aegisCISO/
├── apps/
│   └── executive-dashboard/     # Main Next.js application
│       └── src/
│           ├── app/(dashboard)/ # Dashboard routes (4 tabs)
│           ├── components/      # React components
│           └── lib/             # Utilities & theme
├── packages/
│   ├── db/                      # Prisma ORM & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Data models
│   │   │   └── seed-data.ts     # NCA seed data
│   ├── ui/                      # Shared UI components
│   ├── shared/                  # Shared utilities
│   └── sovereign-ai/            # Local LLM backend
└── docs/                        # Documentation
```

---

## Data Model Summary

| Model | Purpose |
|-------|---------|
| User | Authentication & RBAC |
| Policy | Cybersecurity policies with NCA controls |
| PolicyStatement | Individual policy statements |
| Risk | Risk register with scoring |
| RemediationPlan | Risk treatment plans |
| StrategyObjective | Business objectives |
| PostureSnapshot | Historical posture metrics |
| Framework | Compliance frameworks (NCA, NIST, ISO) |
| FrameworkControl | Framework controls for mapping |

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Platform**: aegisCISO - SABIC AI Cybersecurity Director
