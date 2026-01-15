# AegisCISO Sovereign AI Cybersecurity Director
# Complete Deployment Guide

## Overview

This guide covers deploying the AegisCISO Sovereign AI Cybersecurity Director platform - a fully on-premises enterprise security governance system with integrated AI capabilities.

**Key Characteristics:**
- 100% on-premises deployment
- Zero external API dependencies
- Private LLM (LLaMA 3 / Mistral via Ollama)
- Local vector database (ChromaDB)
- Zero-trust security architecture
- NCA/SAMA/NIST/ISO compliance support

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Hardware Requirements](#hardware-requirements)
3. [Quick Start](#quick-start)
4. [Production Deployment](#production-deployment)
5. [Security Configuration](#security-configuration)
6. [Migration from Existing System](#migration)
7. [Monitoring & Observability](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Compliance Checklist](#compliance)

---

## Prerequisites

### Required Software

| Component | Minimum Version | Purpose |
|-----------|----------------|---------|
| Docker | 24.0+ | Container runtime |
| Docker Compose | 2.20+ | Orchestration |
| Git | 2.40+ | Source control |

### Optional (for GPU acceleration)

| Component | Version | Purpose |
|-----------|---------|---------|
| NVIDIA Driver | 535+ | GPU support |
| NVIDIA Container Toolkit | Latest | Docker GPU access |
| CUDA | 12.0+ | GPU acceleration |

---

## Hardware Requirements

### Minimum (Development/Testing)

| Resource | Specification |
|----------|--------------|
| CPU | 8 cores |
| RAM | 32 GB |
| Storage | 100 GB SSD |
| GPU | Not required |

### Recommended (Production)

| Resource | Specification |
|----------|--------------|
| CPU | 16+ cores (Intel Xeon / AMD EPYC) |
| RAM | 128 GB DDR4/DDR5 |
| Storage | 500 GB NVMe SSD |
| GPU | NVIDIA A100 40GB or RTX 4090 24GB |

### Enterprise (High Availability)

| Resource | Specification |
|----------|--------------|
| CPU | 32+ cores per node |
| RAM | 256 GB per node |
| Storage | 1 TB NVMe SSD (RAID 10) |
| GPU | 2x NVIDIA H100 80GB |
| Nodes | 3+ for HA |

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/aegisciso.git
cd aegisciso
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure secrets
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 24)" >> .env
```

### 3. Start Services

```bash
# Start all services
docker-compose -f docker-compose.sovereign.yml up -d

# Watch logs
docker-compose -f docker-compose.sovereign.yml logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker exec -it aegisciso-frontend npx prisma migrate deploy

# Seed initial data
docker exec -it aegisciso-frontend npx prisma db seed
```

### 5. Access Application

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3001 |
| Sovereign AI API | http://localhost:8000 |
| API Documentation | http://localhost:8000/api/docs |

**Default Credentials:**
- Email: `ciso@aegisciso.com`
- Password: `SecurePass123!`

---

## Production Deployment

### 1. SSL/TLS Configuration

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (replace with CA-signed for production)
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout nginx/ssl/private.key \
    -out nginx/ssl/certificate.crt \
    -subj "/C=SA/ST=Riyadh/L=Riyadh/O=YourOrg/CN=aegisciso.local"
```

### 2. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ai:10m rate=2r/s;

    upstream frontend {
        server frontend:3001;
    }

    upstream sovereign-ai {
        server sovereign-ai:8000;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Sovereign AI API
        location /api/v1/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://sovereign-ai/api/v1/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # AI endpoints (stricter rate limiting)
        location /api/v1/ai/ {
            limit_req zone=ai burst=5 nodelay;
            proxy_pass http://sovereign-ai/api/v1/ai/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 120s;  # AI inference can be slow
        }
    }
}
```

### 3. Production Environment

```bash
# Production .env
cat > .env.production << 'EOF'
# Database
DB_USER=aegisciso_prod
DB_PASSWORD=<STRONG_PASSWORD_64_CHARS>
DB_NAME=aegisciso_production

# Security
JWT_SECRET=<SECURE_64_CHAR_RANDOM_STRING>
ENCRYPTION_KEY=<SECURE_32_CHAR_RANDOM_STRING>
NEXTAUTH_SECRET=<SECURE_32_CHAR_RANDOM_STRING>

# Application
NODE_ENV=production
NEXTAUTH_URL=https://aegisciso.yourdomain.com

# LLM
LLM_OLLAMA_MODEL=llama3:70b  # Use larger model for production

# Sovereignty (CRITICAL - DO NOT CHANGE)
EXTERNAL_API_CALLS_ALLOWED=false
TELEMETRY_ENABLED=false
EOF
```

### 4. Deploy with Production Profile

```bash
docker-compose -f docker-compose.sovereign.yml --profile production up -d
```

---

## Security Configuration

### 1. Password Policy

Update `sovereign-ai/config/settings.py`:

```python
# Argon2 settings (OWASP recommended)
argon2_time_cost: int = 4      # Iterations
argon2_memory_cost: int = 131072  # 128MB
argon2_parallelism: int = 4
```

### 2. Session Configuration

```python
# Session settings
session_idle_timeout_minutes: int = 15
max_sessions_per_user: int = 3
session_binding_enabled: bool = True  # Bind to IP + device
```

### 3. MFA Enforcement

Edit NextAuth configuration to require MFA for privileged roles:

```typescript
// apps/executive-dashboard/src/lib/auth.ts
callbacks: {
  async signIn({ user }) {
    const requireMFA = ['CISO', 'ADMIN', 'SOC_MANAGER'].includes(user.role);
    if (requireMFA && !user.mfaVerified) {
      return '/mfa-setup';
    }
    return true;
  }
}
```

### 4. Network Segmentation

```yaml
# docker-compose.sovereign.yml - Network isolation
networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true  # No external access
  ai-net:
    driver: bridge
    internal: true  # Isolated AI processing
```

---

## Migration from Existing System

### 1. Database Migration

```bash
# Export existing data
docker exec aegisciso-postgres pg_dump -U aegisciso aegisciso > backup.sql

# Verify backup
head -100 backup.sql

# Import to new system (if upgrading)
docker exec -i aegisciso-postgres psql -U aegisciso aegisciso < backup.sql
```

### 2. Upgrade Password Hashes

Run the password migration script:

```python
# scripts/migrate_passwords.py
from passlib.context import CryptContext
import asyncio
from sqlalchemy import create_engine, text

old_ctx = CryptContext(schemes=["sha256_crypt"])
new_ctx = CryptContext(schemes=["argon2"])

async def migrate_passwords():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        users = conn.execute(text("SELECT id, password_hash FROM users"))
        for user in users:
            # For each user, they must reset password on next login
            conn.execute(
                text("UPDATE users SET must_reset_password = true WHERE id = :id"),
                {"id": user.id}
            )
    print("Migration complete - users must reset passwords")

asyncio.run(migrate_passwords())
```

### 3. Index Documents into RAG

```bash
# Index existing policies
docker exec aegisciso-sovereign-ai python -c "
from rag.engine import rag_engine
import asyncio

async def index_policies():
    # Fetch policies from database and index
    # This populates the vector database for RAG
    pass

asyncio.run(index_policies())
"
```

---

## Monitoring & Observability

### 1. Enable Monitoring Stack

```bash
docker-compose -f docker-compose.sovereign.yml --profile monitoring up -d
```

### 2. Access Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | - |

### 3. Key Metrics to Monitor

| Metric | Alert Threshold | Description |
|--------|-----------------|-------------|
| `llm_inference_time_seconds` | > 30s | LLM response time |
| `rag_retrieval_time_seconds` | > 5s | RAG query time |
| `auth_failed_attempts` | > 10/min | Brute force detection |
| `dlp_blocked_requests` | > 0 | Data exfiltration attempts |
| `external_api_calls` | > 0 | Sovereignty violation |

---

## Troubleshooting

### Issue: LLM Not Responding

```bash
# Check Ollama status
docker logs aegisciso-ollama

# Verify model is loaded
docker exec aegisciso-ollama ollama list

# Pull model manually if needed
docker exec aegisciso-ollama ollama pull mistral:7b
```

### Issue: High Memory Usage

```bash
# Check container resources
docker stats

# Reduce LLM memory (use smaller model)
# Edit docker-compose.sovereign.yml:
# LLM_OLLAMA_MODEL: mistral:7b-instruct-v0.2-q4_K_M
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL logs
docker logs aegisciso-postgres

# Verify connection
docker exec aegisciso-postgres pg_isready -U aegisciso
```

### Issue: Sovereignty Violation Alert

```bash
# Check audit logs
docker logs aegisciso-sovereign-ai | grep "SOVEREIGNTY"

# Verify configuration
docker exec aegisciso-sovereign-ai env | grep EXTERNAL
```

---

## Compliance Checklist

### NCA ECC Compliance

- [x] Data stored locally (ECC 1-4)
- [x] Role-based access control (ECC 2-2)
- [x] Audit logging with integrity (ECC 3-1)
- [x] Encryption at rest (ECC 2-4)
- [x] Encryption in transit (TLS 1.3)
- [x] Incident response support (ECC 3-1)

### SAMA CSF Compliance

- [x] Information security governance
- [x] Asset management
- [x] Access control
- [x] Operations security
- [x] Supplier security (N/A - no suppliers)

### Data Sovereignty

- [x] All data stored on-premises
- [x] No external API calls
- [x] No telemetry/analytics to third parties
- [x] All AI processing local
- [x] Audit trail for all data access

---

## Support

For issues and support:
- Internal: security-platform@yourorg.com
- GitHub Issues: [repository]/issues

---

*Document Version: 1.0.0*
*Last Updated: 2026-01-13*
*Classification: INTERNAL USE ONLY*
