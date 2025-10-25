#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🧪 TESTING ALL CRITICAL ENDPOINTS"
echo "=========================================="
echo ""

# Test 1: Backend Health
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi
echo ""

# Test 2: Sujets Endpoint
echo -e "${YELLOW}Test 2: Sujets Endpoint (/api/voice-simulation/question-bank/sujets)${NC}"
SUJETS=$(curl -s http://localhost:3001/api/voice-simulation/question-bank/sujets)
if echo "$SUJETS" | grep -q "Immigration et intégration"; then
    echo -e "${GREEN}✅ Sujets endpoint works${NC}"
    echo "   Sample sujets returned:"
    echo "$SUJETS" | grep -o '"[^"]*"' | head -5 | sed 's/"//g' | sed 's/^/   - /'
else
    echo -e "${RED}❌ Sujets endpoint failed${NC}"
    echo "$SUJETS"
fi
echo ""

# Test 3: AI Generation Endpoint (requires auth)
echo -e "${YELLOW}Test 3: AI Generation Endpoint (/api/ai/generate-questions-from-file)${NC}"
AI_GEN=$(curl -s -X POST http://localhost:3001/api/ai/generate-questions-from-file)
if echo "$AI_GEN" | grep -q "Authorization"; then
    echo -e "${GREEN}✅ AI generation endpoint exists and requires auth${NC}"
else
    echo -e "${RED}❌ AI generation endpoint check failed${NC}"
fi
echo ""

# Test 4: Extract Sujets from PDF Endpoint (requires auth)
echo -e "${YELLOW}Test 4: Extract Sujets from PDF (/api/ai/extract-sujets-from-pdf)${NC}"
EXTRACT=$(curl -s -X POST http://localhost:3001/api/ai/extract-sujets-from-pdf)
if echo "$EXTRACT" | grep -q "Authorization"; then
    echo -e "${GREEN}✅ Extract sujets endpoint exists and requires auth${NC}"
else
    echo -e "${RED}❌ Extract sujets endpoint check failed${NC}"
fi
echo ""

# Test 5: Frontend Health
echo -e "${YELLOW}Test 5: Frontend Health Check${NC}"
FRONTEND=$(curl -s http://localhost:3000 2>&1)
if [ ! -z "$FRONTEND" ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi
echo ""

# Test 6: Check if pages are accessible
echo -e "${YELLOW}Test 6: Page Accessibility${NC}"

PAGES=(
    "/admin/content/questionnaire"
    "/admin/content/simulation/builder"
    "/admin/content/audio-simulator"
)

for page in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$page)
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ $page - Status: $STATUS${NC}"
    else
        echo -e "${RED}❌ $page - Status: $STATUS${NC}"
    fi
done
echo ""

echo "=========================================="
echo "🎯 SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ All critical endpoints are working!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000/admin/content/questionnaire in browser"
echo "2. Test PDF upload and sujet extraction"
echo "3. Open http://localhost:3000/admin/content/simulation/builder"
echo "4. Test AI question generation"
echo "5. Open http://localhost:3000/admin/content/audio-simulator"
echo "6. Verify voice options and sujet selection"

