#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if debug mode is enabled
DEBUG_MODE=${DEBUG:-0}

echo -e "${YELLOW}Starting E2E tests...${NC}"

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}Development server not running. Starting it now...${NC}"
    
    # Start server with or without debug output
    if [ "$DEBUG_MODE" = "1" ]; then
        echo -e "${YELLOW}[DEBUG MODE] Showing full server output${NC}"
        npm run dev &
    else
        npm run dev > /dev/null 2>&1 &
    fi
    
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo -e "${GREEN}Server is ready!${NC}"
            break
        fi
        sleep 1
    done
fi

# Run Playwright tests
npx playwright test --reporter=list

# Store exit code
EXIT_CODE=$?

# Kill server if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping development server (PID: $SERVER_PID)...${NC}"
    
    # Kill the entire process group to ensure all child processes are terminated
    kill -9 -$SERVER_PID 2>/dev/null || true
    
    # Also kill any remaining processes on port 3000 as backup
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}Development server stopped.${NC}"
fi

# Exit with Playwright's exit code
exit $EXIT_CODE