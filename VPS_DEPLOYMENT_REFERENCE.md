# Sharp AI - VPS Deployment Reference

**Deployed:** 2025-01-18
**Status:** ✅ Live and Working

---

## 🌐 Access URLs

| Environment | URL |
|-------------|-----|
| **Production** | http://76.13.5.121:3001 |
| Health Check | http://76.13.5.121:3001/api/ai/health |
| AI Director | http://76.13.5.121:3001/ai-director |

---

## 🔐 Login Credentials

| Field | Value |
|-------|-------|
| Email | `ciso@aegisciso.com` |
| Password | `SecurePass123!` |

---

## 🖥️ VPS Details

| Setting | Value |
|---------|-------|
| IP Address | `76.13.5.121` |
| SSH User | `root` |
| SSH Password | `[STORED SECURELY - ASK ADMIN]` |
| OS | Ubuntu 24.04 LTS |
| RAM | 3.8 GB |
| Disk | 48 GB |
| CPU | 1 Core |

### SSH Access

```bash
ssh root@76.13.5.121
# Password: [STORED SECURELY]
```

---

## 📁 Project Location

```
/root/aegisciso
```

### Key Files

| File | Purpose |
|------|---------|
| `/root/aegisciso/apps/executive-dashboard/.env.local` | Environment config |
| `/root/aegisciso/ecosystem.config.js` | PM2 configuration |
| `/root/.pm2/logs/sharp-ai-out-0.log` | Application logs |
| `/root/.pm2/logs/sharp-ai-error-0.log` | Error logs |

---

## ⚙️ Environment Configuration

**File:** `/root/aegisciso/apps/executive-dashboard/.env.local`

```env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
NEXTAUTH_SECRET="[GENERATE WITH: openssl rand -base64 32]"
NEXTAUTH_URL="http://76.13.5.121:3001"

# AI Configuration
AI_DEMO_MODE="false"
GROQ_API_KEY="[YOUR_GROQ_API_KEY]"
```

---

## 🔧 Admin Commands

### Check Status

```bash
pm2 status
```

### View Logs

```bash
# Real-time logs
pm2 logs sharp-ai

# Last 100 lines
pm2 logs sharp-ai --lines 100
```

### Restart Application

```bash
pm2 restart sharp-ai
```

### Stop Application

```bash
pm2 stop sharp-ai
```

### Start Application

```bash
pm2 start sharp-ai
```

---

## 🔄 Update Deployment

### Pull Latest Code & Rebuild

```bash
cd /root/aegisciso
git pull origin main
pnpm install
pnpm build
pm2 restart sharp-ai
```

### Quick Restart (No Rebuild)

```bash
pm2 restart sharp-ai
```

---

## 🔥 Firewall

Port 3001 is open in UFW firewall.

```bash
# Check firewall status
ufw status

# Open additional port (if needed)
ufw allow PORT/tcp
```

---

## 🗄️ Database

| Setting | Value |
|---------|-------|
| Provider | Neon (PostgreSQL) |
| Host | `ep-little-dust-ahe4u13n-pooler.c-3.us-east-1.aws.neon.tech` |
| Database | `neondb` |
| User | `neondb_owner` |

### Run Migrations

```bash
cd /root/aegisciso/packages/db
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
cd /root/aegisciso/packages/db
npx prisma generate
```

---

## 🤖 AI Configuration

| Setting | Value |
|---------|-------|
| Provider | Groq (FREE) |
| Model | Llama 3.3 70B Versatile |
| API Key | `[STORED IN .env.local]` |

### Get New Groq API Key

1. Go to https://console.groq.com
2. Sign in / Sign up
3. Create new API key
4. Update in `.env.local`

---

## 🚨 Troubleshooting

### AI Chat Not Working

1. **Clear browser cookies** for `76.13.5.121`
2. **Log in again**
3. Check logs: `pm2 logs sharp-ai`

### Application Not Starting

```bash
# Check logs
pm2 logs sharp-ai --lines 50

# Rebuild if needed
cd /root/aegisciso
pnpm build
pm2 restart sharp-ai
```

### 502 Bad Gateway

```bash
# Check if PM2 is running
pm2 status

# Restart if needed
pm2 restart sharp-ai
```

### Database Connection Error

```bash
# Test database connection
cd /root/aegisciso/packages/db
npx prisma db pull
```

---

## 📊 Health Check

### Via Browser

```
http://76.13.5.121:3001/api/ai/health
```

### Via Command Line

```bash
curl http://76.13.5.121:3001/api/ai/health
```

### Expected Response

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "mode": "production",
  "providers": {
    "groq": {
      "configured": true,
      "status": "available"
    }
  },
  "llm_available": true,
  "features": {
    "streaming": true,
    "caching": true,
    "rateLimiting": true,
    "inputValidation": true
  }
}
```

---

## 🔄 Rollback

### Quick Rollback

```bash
cd /root/aegisciso
git checkout HEAD~1
pnpm build
pm2 restart sharp-ai
```

### Full Reinstall

```bash
pm2 delete sharp-ai
rm -rf /root/aegisciso
git clone https://github.com/azex82/aegisciso.git /root/aegisciso
cd /root/aegisciso
pnpm install
# Copy .env.local (see Environment Configuration above)
pnpm build
pm2 start ecosystem.config.js
```

---

## 📝 GitHub Repository

```
https://github.com/azex82/aegisciso
```

---

*Last Updated: 2025-01-18*
