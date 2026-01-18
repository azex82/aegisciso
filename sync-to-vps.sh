#!/bin/bash
# SHARP AI - Sync to VPS Script
# Syncs local changes to VPS and rebuilds

VPS_HOST="root@76.13.5.121"
VPS_PATH="/root/aegisciso"
LOCAL_PATH="/Users/asma/AI-Projects/aegisciso"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Syncing to VPS...${NC}"

# Sync files (excluding node_modules, .next, .git)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env.local' \
  "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"

echo -e "${GREEN}Files synced!${NC}"

# Rebuild and restart on VPS
echo -e "${YELLOW}Rebuilding on VPS...${NC}"
ssh $VPS_HOST "cd $VPS_PATH && pnpm install && pnpm build --filter=executive-dashboard && pm2 restart sharp-ai"

echo -e "${GREEN}Done! App updated on VPS.${NC}"
