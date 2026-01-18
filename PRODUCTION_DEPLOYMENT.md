# Sharp AI Cybersecurity Director - Production Deployment Guide

## Overview

This guide covers deploying Sharp (AegisCISO) to a VPS with a working AI chat powered by Groq's free Llama 3.3 70B model.

**Stack:**
- Frontend: Next.js 14 (TypeScript)
- Database: PostgreSQL (Neon Cloud or self-hosted)
- AI: Groq API (FREE Llama 3.3 70B)
- Hosting: Any VPS (2GB+ RAM recommended)

---

## Quick Start (5 Minutes)

### 1. Clone and Configure

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone the repository
git clone https://github.com/your-org/aegisciso.git
cd aegisciso

# Install dependencies
npm install -g pnpm
pnpm install
```

### 2. Configure Environment

```bash
# Copy example environment
cp .env.example apps/executive-dashboard/.env.local

# Edit with your values
nano apps/executive-dashboard/.env.local
```

**Required environment variables:**

```env
# Database (use Neon for managed PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth (generate secret)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://YOUR_VPS_IP:3001"

# AI Configuration (IMPORTANT)
AI_DEMO_MODE="false"
GROQ_API_KEY="gsk_your_groq_key_here"
```

### 3. Get Groq API Key (FREE)

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env.local`

### 4. Build and Run

```bash
# Build the application
pnpm build

# Run database migrations
cd packages/db && npx prisma migrate deploy && cd ../..

# Start production server
cd apps/executive-dashboard
PORT=3001 pnpm start
```

### 5. Access Your App

Open `http://YOUR_VPS_IP:3001` in your browser.

---

## Production Deployment (Recommended)

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sharp-ai',
    cwd: './apps/executive-dashboard',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    time: true,
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration (auto-restart on reboot)
pm2 save
pm2 startup
```

### Using Docker

```bash
# Build Docker image
docker build -t sharp-ai -f Dockerfile.frontend .

# Run container
docker run -d \
  --name sharp-ai \
  -p 3001:3001 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://your-ip:3001" \
  -e AI_DEMO_MODE="false" \
  -e GROQ_API_KEY="your-groq-key" \
  --restart unless-stopped \
  sharp-ai
```

---

## Nginx Reverse Proxy (Optional - for HTTPS)

### Install Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/sharp
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sharp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Add SSL (if you have a domain)
sudo certbot --nginx -d your-domain.com
```

---

## AI Features

### Current Implementation

| Feature | Status | Description |
|---------|--------|-------------|
| AI Chat | ✅ Working | Llama 3.3 70B via Groq |
| Streaming | ✅ Available | Real-time response streaming |
| Caching | ✅ Enabled | 5-minute cache for repeated queries |
| Rate Limiting | ✅ Enabled | 20 requests/minute per user |
| Input Validation | ✅ Enabled | Prompt injection protection |
| Observability | ✅ Enabled | JSON logging for all requests |

### AI Provider Fallback Chain

1. **Groq (Primary)** - FREE Llama 3.3 70B
2. **OpenAI (Fallback)** - GPT-4o-mini (if configured)
3. **Demo Mode (Last Resort)** - Simulated responses

### Verify AI is Working

```bash
# Check health endpoint
curl http://localhost:3001/api/ai/health | jq

# Expected response:
{
  "status": "healthy",
  "providers": {
    "groq": { "configured": true, "status": "available" }
  },
  "llm_available": true
}
```

---

## Security Controls Implemented

| Control | Implementation |
|---------|---------------|
| Authentication | NextAuth.js with session management |
| Rate Limiting | 20 requests/minute per user |
| Input Validation | Length limits + prompt injection detection |
| API Key Protection | Environment variables only |
| CORS | Restricted to configured origins |
| Security Headers | X-Frame-Options, X-Content-Type-Options, etc. |

### Prompt Injection Protection

The API blocks queries containing:
- "ignore previous instructions"
- "disregard all previous"
- "you are now"
- System prompt manipulation attempts
- Template injection patterns

---

## Monitoring & Logs

### View Logs (PM2)

```bash
# Real-time logs
pm2 logs sharp-ai

# Specific log files
tail -f apps/executive-dashboard/logs/out.log
```

### Log Format

All AI requests are logged in JSON format:

```json
{
  "timestamp": "2025-01-18T10:30:45.123Z",
  "service": "sharp-ai-query",
  "level": "info",
  "event": "ai_query_complete",
  "userId": "user@example.com",
  "queryLength": 45,
  "contextType": "general",
  "model": "Llama 3.3 70B (Groq)",
  "processingTimeMs": 1523,
  "cached": false,
  "rateLimitRemaining": 18
}
```

### Health Check Monitoring

```bash
# Add to crontab for uptime monitoring
*/5 * * * * curl -s http://localhost:3001/api/ai/health | jq -r '.status' || echo "ALERT: Sharp AI is down"
```

---

## Admin Guide

### Add Documents to Knowledge Base (RAG)

```bash
# POST to documents endpoint
curl -X POST http://localhost:3001/api/ai/documents \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "content": "Your policy content here...",
    "doc_type": "policy",
    "title": "Information Security Policy"
  }'
```

Valid document types: `policy`, `framework`, `control`, `risk`, `evidence`, `threat_intel`

### Check Service Status

```bash
# PM2 status
pm2 status

# Health check
curl http://localhost:3001/api/ai/health

# Query endpoint health
curl http://localhost:3001/api/ai/query -X GET
```

### Restart Services

```bash
# Restart with PM2
pm2 restart sharp-ai

# Hard restart (stop + start)
pm2 stop sharp-ai && pm2 start sharp-ai

# Reload with zero downtime
pm2 reload sharp-ai
```

---

## Troubleshooting

### AI Returns Demo Mode Responses

1. Check Groq API key is set:
   ```bash
   grep GROQ_API_KEY apps/executive-dashboard/.env.local
   ```

2. Verify Groq API is accessible:
   ```bash
   curl -H "Authorization: Bearer YOUR_GROQ_KEY" \
     https://api.groq.com/openai/v1/models
   ```

3. Check `AI_DEMO_MODE` is `"false"`

### 502 Bad Gateway

1. Check if Next.js is running:
   ```bash
   pm2 status
   curl http://localhost:3001
   ```

2. Check logs for errors:
   ```bash
   pm2 logs sharp-ai --lines 50
   ```

### Rate Limit Exceeded

Rate limit is 20 requests per minute per user. Wait 60 seconds or adjust `MAX_REQUESTS_PER_MINUTE` in the API route.

### Database Connection Failed

1. Verify DATABASE_URL is correct
2. Check if database is accessible from VPS
3. Run migrations: `npx prisma migrate deploy`

---

## Rollback Plan

### Quick Rollback

```bash
# Stop current version
pm2 stop sharp-ai

# Checkout previous version
git checkout HEAD~1

# Rebuild and restart
pnpm build
pm2 start sharp-ai
```

### Full Rollback

```bash
# If deployment completely fails
pm2 delete sharp-ai
cd ..
rm -rf aegisciso
git clone https://github.com/your-org/aegisciso.git --branch v1.0.0
cd aegisciso
pnpm install && pnpm build
pm2 start ecosystem.config.js
```

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| AI Response Time | < 5s | ~2-3s (Groq) |
| Cache Hit Rate | > 20% | Variable |
| Memory Usage | < 500MB | ~300MB |
| Uptime | 99.9% | Depends on VPS |

---

## Support

- **Logs:** `pm2 logs sharp-ai`
- **Health:** `curl localhost:3001/api/ai/health`
- **Issues:** Check GitHub repository issues

---

*Last Updated: 2025-01-18*
*Version: 2.0.0*
