#!/bin/bash
# Stop all Elixir & Stem processes

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Stopping Elixir & Stem services..."

# Kill backend
BACKEND_PID=$(lsof -ti:4000 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
  kill $BACKEND_PID 2>/dev/null
  echo -e "  ${RED}✓ Backend stopped (port 4000)${NC}"
else
  echo -e "  ${GREEN}  Backend was not running${NC}"
fi

# Kill Expo
EXPO_PID=$(lsof -ti:8081 2>/dev/null)
if [ -n "$EXPO_PID" ]; then
  kill $EXPO_PID 2>/dev/null
  echo -e "  ${RED}✓ Expo stopped (port 8081)${NC}"
else
  echo -e "  ${GREEN}  Expo was not running${NC}"
fi

# Kill Metro bundler
METRO_PID=$(lsof -ti:8082 2>/dev/null)
if [ -n "$METRO_PID" ]; then
  kill $METRO_PID 2>/dev/null
  echo -e "  ${RED}✓ Metro stopped (port 8082)${NC}"
fi

echo -e "${GREEN}All services stopped.${NC}"
