#!/bin/bash

# Comprehensive Testing Script for Aura.ca Platform
# Tests all critical functionalities

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST] $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

# Test 1: Backend Health
print_header "SECTION 1: BACKEND HEALTH CHECK"
print_test "Checking backend health..."
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "healthy"; then
    print_pass "Backend is healthy"
else
    print_fail "Backend health check failed"
fi

# Test 2: Frontend Health
print_header "SECTION 2: FRONTEND HEALTH CHECK"
print_test "Checking frontend health..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ] || [ "$FRONTEND" = "307" ]; then
    print_pass "Frontend is running"
else
    print_fail "Frontend returned status $FRONTEND"
fi

# Test 3: API Endpoints
print_header "SECTION 3: API ENDPOINTS"

print_test "Testing /api/voice-simulation/question-bank/sujets..."
SUJETS=$(curl -s http://localhost:3001/api/voice-simulation/question-bank/sujets)
if echo "$SUJETS" | grep -q "success"; then
    print_pass "Sujets endpoint working"
else
    print_fail "Sujets endpoint failed"
fi

print_test "Testing /api/simulations/free-attempts/count (requires auth)..."
FREE_ATTEMPTS=$(curl -s -X GET http://localhost:3001/api/simulations/free-attempts/count)
if echo "$FREE_ATTEMPTS" | grep -q "Authorization"; then
    print_pass "Free attempts endpoint requires auth (correct)"
else
    print_fail "Free attempts endpoint auth check failed"
fi

# Test 4: Page Accessibility
print_header "SECTION 4: PAGE ACCESSIBILITY"

PAGES=(
    "/admin/content/questionnaire"
    "/admin/content/simulation/builder"
    "/admin/content/audio-simulator"
    "/immigration-simulations"
    "/simulation-vocale"
    "/test-niveau"
    "/live"
    "/admin/live-sessions"
    "/admin/create-manager"
    "/admin/settings"
)

for page in "${PAGES[@]}"; do
    print_test "Testing $page..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$page)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ]; then
        print_pass "$page is accessible (Status: $STATUS)"
    else
        print_fail "$page returned status $STATUS"
    fi
done

# Test 5: Build Status
print_header "SECTION 5: BUILD STATUS"
print_test "Checking frontend build..."
if [ -d "/home/gotti/Desktop/frontend/.next" ]; then
    print_pass "Frontend build exists"
else
    print_fail "Frontend build not found"
fi

# Summary
print_header "TEST SUMMARY"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED!${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}\n"
    exit 1
fi

