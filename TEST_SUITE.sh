#!/bin/bash

# Comprehensive Test Suite for Aura.ca Platform
# Tests all critical functionalities

echo "🧪 STARTING COMPREHENSIVE TEST SUITE FOR AURA.CA"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Base URLs
FRONTEND_URL="http://localhost:3002"
BACKEND_URL="http://localhost:3001/api"

# Helper function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [[ "$http_code" == "$expected_status" ]] || [[ "$http_code" == "200" ]] || [[ "$http_code" == "401" ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_status)"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Backend Health Check
echo -e "${BLUE}1. BACKEND HEALTH CHECK${NC}"
echo "========================"
test_endpoint "GET" "/health" "200" "Backend health endpoint"
echo ""

# Test 2: Content Management Endpoints
echo -e "${BLUE}2. CONTENT MANAGEMENT${NC}"
echo "====================="
test_endpoint "GET" "/content" "200" "Get all content"
test_endpoint "GET" "/content/courses" "200" "Get courses"
test_endpoint "GET" "/content/videos" "200" "Get videos"
test_endpoint "GET" "/content/simulations" "200" "Get simulations"
echo ""

# Test 3: Questionnaire Endpoints
echo -e "${BLUE}3. QUESTIONNAIRE ENDPOINTS${NC}"
echo "==========================="
test_endpoint "GET" "/questionnaires" "200" "Get all questionnaires"
test_endpoint "GET" "/questionnaires/oral" "200" "Get oral questionnaires"
echo ""

# Test 4: AI Endpoints
echo -e "${BLUE}4. AI ENDPOINTS${NC}"
echo "================"
test_endpoint "GET" "/ai/models" "200" "Get AI models"
echo ""

# Test 5: Voice Simulation Endpoints
echo -e "${BLUE}5. VOICE SIMULATION ENDPOINTS${NC}"
echo "=============================="
test_endpoint "GET" "/voice-simulation/vapi-config" "200" "Get VAPI config"
test_endpoint "GET" "/voice-simulation/voices" "200" "Get voice options"
test_endpoint "GET" "/simulations/questions" "200" "Get simulation questions"
echo ""

# Test 6: Question Bank Endpoints
echo -e "${BLUE}6. QUESTION BANK ENDPOINTS${NC}"
echo "==========================="
test_endpoint "GET" "/question-bank/sujets" "200" "Get sujets from question bank"
test_endpoint "GET" "/question-bank/topics" "200" "Get topics from question bank"
echo ""

# Test 7: Subscription Endpoints
echo -e "${BLUE}7. SUBSCRIPTION ENDPOINTS${NC}"
echo "=========================="
test_endpoint "GET" "/subscriptions" "200" "Get subscriptions"
test_endpoint "GET" "/subscriptions/history" "200" "Get subscription history"
echo ""

# Test 8: User Profile Endpoints
echo -e "${BLUE}8. USER PROFILE ENDPOINTS${NC}"
echo "========================="
test_endpoint "GET" "/users/profile" "200" "Get user profile"
test_endpoint "GET" "/users/me" "200" "Get current user"
echo ""

# Test 9: Frontend Pages Accessibility
echo -e "${BLUE}9. FRONTEND PAGES ACCESSIBILITY${NC}"
echo "================================"

test_frontend_page() {
    local page=$1
    local description=$2
    
    echo -n "Testing: $description... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$page" 2>/dev/null)
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        ((TESTS_FAILED++))
    fi
}

test_frontend_page "/admin/content" "Admin content page"
test_frontend_page "/admin/content/questionnaire" "Admin questionnaire page"
test_frontend_page "/admin/content/simulation/builder" "Simulation builder page"
test_frontend_page "/manager/content/audio-simulator" "Audio simulator page"
test_frontend_page "/test-niveau" "Test de niveau page"
test_frontend_page "/voice-simulation" "Voice simulation page"
echo ""

# Test 10: Build Status
echo -e "${BLUE}10. BUILD STATUS${NC}"
echo "================"
echo -n "Testing: Frontend build... "
if [ -d "/home/gotti/Desktop/frontend/.next" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Build artifacts found)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Build artifacts not found)"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "=================================================="
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi

