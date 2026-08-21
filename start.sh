#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         🌿 Elixir & Stem — Full Stack           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Cleanup on exit ──────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null
    echo -e "  ${RED}✓ Backend stopped (PID $SERVER_PID)${NC}"
  fi
  if [ -n "$EXPO_PID" ]; then
    kill $EXPO_PID 2>/dev/null
    echo -e "  ${RED}✓ Frontend stopped (PID $EXPO_PID)${NC}"
  fi
  echo -e "${GREEN}Goodbye! 🌿${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Check prerequisites ──────────────────────────────────────────────────
echo -e "${CYAN}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install Node.js 20+ first.${NC}"
  exit 1
fi

if ! command -v npx &> /dev/null; then
  echo -e "${RED}✗ npx not found.${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓ Node.js $(node -v)${NC}"

# ── Install dependencies if needed ───────────────────────────────────────
if [ ! -d "$PROJECT_DIR/server/node_modules" ]; then
  echo -e "${CYAN}Installing server dependencies...${NC}"
  cd "$PROJECT_DIR/server" && npm install
fi

if [ ! -d "$PROJECT_DIR/app/node_modules" ]; then
  echo -e "${CYAN}Installing app dependencies...${NC}"
  cd "$PROJECT_DIR/app" && npm install
fi

# ── Database setup ────────────────────────────────────────────────────────
echo -e "${CYAN}Checking database...${NC}"
cd "$PROJECT_DIR/server"

# Run migrations
npx prisma migrate dev --skip-generate 2>/dev/null || true
npx prisma generate 2>/dev/null || true

# Seed if empty
PRODUCT_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.product.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$PRODUCT_COUNT" = "0" ]; then
  echo -e "${CYAN}Seeding database...${NC}"
  npm run seed 2>/dev/null
fi

echo -e "  ${GREEN}✓ Database ready (${PRODUCT_COUNT} products)${NC}"

# ── Detect LAN IP ─────────────────────────────────────────────────────────
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo -e "  ${GREEN}✓ LAN IP: ${LAN_IP}${NC}"

# ── Write app .env ────────────────────────────────────────────────────────
cat > "$PROJECT_DIR/app/.env" << EOF
EXPO_PUBLIC_API_URL=http://${LAN_IP}:4000
EOF
echo -e "  ${GREEN}✓ App .env → http://${LAN_IP}:4000${NC}"

# ── Kill existing processes on ports ──────────────────────────────────────
kill $(lsof -ti:4000) 2>/dev/null || true
kill $(lsof -ti:8081) 2>/dev/null || true
sleep 1

# ── Start backend ─────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Starting backend on port 4000...${NC}"
cd "$PROJECT_DIR/server"
npx ts-node src/index.ts > /tmp/es-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend running (PID $SERVER_PID)${NC}"
    break
  fi
  sleep 1
done

# Verify backend
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo -e "  ${RED}✗ Backend failed to start. Check /tmp/es-server.log${NC}"
  cat /tmp/es-server.log
  exit 1
fi

# ── Start frontend ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Starting Expo frontend...${NC}"
cd "$PROJECT_DIR/app"
npx expo start --lan > /tmp/es-expo.log 2>&1 &
EXPO_PID=$!

# Wait for Expo to be ready
for i in $(seq 1 30); do
  if grep -q "QR Code" /tmp/es-expo.log 2>/dev/null || grep -q "Metro waiting" /tmp/es-expo.log 2>/dev/null; then
    echo -e "  ${GREEN}✓ Expo running (PID $EXPO_PID)${NC}"
    break
  fi
  sleep 1
done

# ── Display status ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              🌿 ALL SYSTEMS GO                  ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║                                                  ║${NC}"
echo -e "${BOLD}║  🌐 Backend:  http://localhost:4000              ║${NC}"
echo -e "${BOLD}║  📱 Frontend: http://localhost:8081              ║${NC}"
echo -e "${BOLD}║  🔗 API URL:  http://${LAN_IP}:4000              ║${NC}"
echo -e "${BOLD}║                                                  ║${NC}"
echo -e "${BOLD}║  Scan the QR code above with Expo Go            ║${NC}"
echo -e "${BOLD}║                                                  ║${NC}"
echo -e "${BOLD}║  Credentials (password: password123):            ║${NC}"
echo -e "${BOLD}║  • customer@example.com  → Customer              ║${NC}"
echo -e "${BOLD}║  • shop@elixirandstem.com → Merchant            ║${NC}"
echo -e "${BOLD}║  • admin@elixirandstem.com → Admin              ║${NC}"
echo -e "${BOLD}║                                                  ║${NC}"
echo -e "${BOLD}║  Press Ctrl+C to stop both servers              ║${NC}"
echo -e "${BOLD}║                                                  ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Tail Expo output to show QR code ──────────────────────────────────────
# Wait a bit for the QR code to render, then show it
sleep 3
if [ -f /tmp/es-expo.log ]; then
  # Extract and display the QR code
  QR_START=$(grep -n "▄" /tmp/es-expo.log 2>/dev/null | head -1 | cut -d: -f1 || echo "")
  if [ -n "$QR_START" ]; then
    QR_END=$((QR_START + 12))
    echo -e "${CYAN}QR Code:${NC}"
    sed -n "${QR_START},${QR_END}p" /tmp/es-expo.log 2>/dev/null
    echo ""
  fi
fi

echo -e "${YELLOW}Logs: ${GREEN}/tmp/es-server.log${NC} ${YELLOW}|${NC} ${GREEN}/tmp/es-expo.log${NC}"
echo -e "${YELLOW}Waiting for Ctrl+C to exit...${NC}"
echo ""

# Keep script alive and show logs
wait
