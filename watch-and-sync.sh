#!/bin/bash
# SHARP AI - Watch and Auto-Sync to VPS
# Watches for file changes and syncs automatically

VPS_HOST="root@76.13.5.121"
VPS_PATH="/root/aegisciso"
LOCAL_PATH="/Users/asma/AI-Projects/aegisciso"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

sync_files() {
  echo -e "${YELLOW}[$(date +%H:%M:%S)] Syncing changes...${NC}"

  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude '.env.local' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    --exclude '.turbo' \
    --exclude 'sovereign-ai/venv' \
    --exclude 'sovereign-ai/data' \
    --exclude '*.pyc' \
    "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/" 2>/dev/null

  echo -e "${GREEN}[$(date +%H:%M:%S)] Synced! Rebuilding...${NC}"

  ssh $VPS_HOST "cd $VPS_PATH && pnpm build --filter=executive-dashboard 2>&1 | tail -3 && pm2 restart sharp-ai" 2>/dev/null

  echo -e "${GREEN}[$(date +%H:%M:%S)] Done!${NC}"
  echo ""
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SHARP AI - Auto-Sync to VPS${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Watching: $LOCAL_PATH"
echo -e "Target:   $VPS_HOST:$VPS_PATH"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Initial sync
sync_files

# Watch for changes using polling (works without fswatch)
LAST_HASH=""
while true; do
  # Get hash of all source files
  CURRENT_HASH=$(find "$LOCAL_PATH/apps" "$LOCAL_PATH/packages" -name "*.ts" -o -name "*.tsx" -o -name "*.css" 2>/dev/null | xargs cat 2>/dev/null | md5)

  if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
    sync_files
  fi

  LAST_HASH=$CURRENT_HASH
  sleep 3
done
