#!/bin/bash

# Production server smoke tests
# Run this after deploying to production to verify all APIs are working

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BACKEND_URL:-http://localhost:8000}"
API_PREFIX="/api"
TIMEOUT=10

echo "🚀 Production Smoke Tests for Khmer Sign Language Platform"
echo "========================================================="
echo "Target: $BASE_URL"
echo ""

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Test results storage
RESULTS_FILE="/tmp/smoke_test_results_$(date +%s).txt"
> "$RESULTS_FILE"

# Function to run a test
run_test() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local auth_token="$5"
    local body="$6"
    
    TOTAL=$((TOTAL + 1))
    
    local url="${BASE_URL}${API_PREFIX}${endpoint}"
    local headers=""
    
    if [ -n "$auth_token" ]; then
        headers="-H 'Authorization: Bearer $auth_token'"
    fi
    
    if [ -n "$body" ]; then
        headers="$headers -H 'Content-Type: application/json' -d '$body'"
    fi
    
    # Make request
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        --max-time "$TIMEOUT" \
        -H "Content-Type: application/json" \
        ${auth_token:+-H "Authorization: Bearer $auth_token"} \
        ${body:+-d "$body"} \
        "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅${NC} [$TOTAL] $name: $method $endpoint → $response (expected $expected_status)"
        echo "PASS: $name | $method $endpoint | Got: $response | Expected: $expected_status" >> "$RESULTS_FILE"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} [$TOTAL] $name: $method $endpoint → $response (expected $expected_status)"
        echo "FAIL: $name | $method $endpoint | Got: $response | Expected: $expected_status" >> "$RESULTS_FILE"
        FAILED=$((FAILED + 1))
    fi
}

# Function to get auth token
get_auth_token() {
    local email="$1"
    local password="$2"
    
    local response
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}" \
        "${BASE_URL}${API_PREFIX}/auth/login")
    
    echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null
}

# ============================================
# HEALTH CHECK TESTS
# ============================================
echo "🏥 Health Check Tests"
echo "-------------------"

# Test server is running
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$BASE_URL/docs")
if [ "$response" -eq "200" ]; then
    echo -e "${GREEN}✅${NC} [$TOTAL] Server is running (Swagger docs accessible)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} [$TOTAL] Server is not running or docs not accessible"
    FAILED=$((FAILED + 1))
fi

# Test health endpoint (if exists)
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$BASE_URL/health")
if [ "$response" -eq "200" ] || [ "$response" -eq "404" ]; then
    echo -e "${GREEN}✅${NC} [$TOTAL] Health endpoint check completed (status: $response)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} [$TOTAL] Health endpoint check failed (status: $response)"
    FAILED=$((FAILED + 1))
fi

echo ""

# ============================================
# AUTHENTICATION TESTS
# ============================================
echo "🔐 Authentication Tests"
echo "----------------------"

# Test login with invalid credentials
run_test "Login with invalid credentials" \
    "POST" "/auth/login" \
    401 \
    "" \
    '{"email": "invalid@example.com", "password": "wrongpassword"}'

# Test login with missing fields
run_test "Login with missing fields" \
    "POST" "/auth/login" \
    422 \
    "" \
    '{"email": "test@example.com"}'

# Test get current user without auth
run_test "Get current user without auth" \
    "GET" "/auth/login/me" \
    401

echo ""

# ============================================
# USER API TESTS
# ============================================
echo "👥 User API Tests"
echo "----------------"

# Test register with invalid data
run_test "Register with invalid data" \
    "POST" "/users/register" \
    422 \
    "" \
    '{"email": "invalid-email", "password": "123"}'

# Test get users without auth
run_test "Get users without auth" \
    "GET" "/users" \
    401

# Test get non-existent user
run_test "Get non-existent user" \
    "GET" "/users/00000000-0000-0000-0000-000000000000" \
    404

echo ""

# ============================================
# FINGER SPELLING API TESTS
# ============================================
echo "🤟 Finger Spelling API Tests"
echo "----------------------------"

# Test get finger units (public endpoint)
run_test "Get finger units" \
    "GET" "/finger_spelling/units" \
    200

# Test get finger chapters (public endpoint)
run_test "Get finger chapters" \
    "GET" "/finger_spelling/chapters" \
    200

# Test get finger lessons (public endpoint)
run_test "Get finger lessons" \
    "GET" "/finger_spelling/lessons" \
    200

# Test get categories
run_test "Get finger spelling categories" \
    "GET" "/finger_spelling/categories" \
    200

# Test search
run_test "Search finger spelling" \
    "GET" "/finger_spelling/search?q=test" \
    200

# Test random
run_test "Get random finger spelling" \
    "GET" "/finger_spelling/random?count=5" \
    200

# Test get non-existent unit
run_test "Get non-existent finger unit" \
    "GET" "/finger_spelling/units/00000000-0000-0000-0000-000000000000" \
    404

# Test create unit without auth
run_test "Create finger unit without auth" \
    "POST" "/finger_spelling/units" \
    401 \
    "" \
    '{"name": "Test", "description": "Test"}'

echo ""

# ============================================
# AUTHENTICATED TESTS (if credentials provided)
# ============================================
if [ -n "$TEST_USER_EMAIL" ] && [ -n "$TEST_USER_PASSWORD" ]; then
    echo "🔑 Authenticated Tests"
    echo "--------------------"
    
    # Get auth token
    TOKEN=$(get_auth_token "$TEST_USER_EMAIL" "$TEST_USER_PASSWORD")
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✅ Successfully authenticated${NC}"
        
        # Test get current user
        run_test "Get current user" \
            "GET" "/auth/login/me" \
            200 \
            "$TOKEN"
        
        # Test get users (admin only - might be 403)
        run_test "Get users list" \
            "GET" "/users" \
            200 \
            "$TOKEN"
        
        # Test create finger unit
        run_test "Create finger unit" \
            "POST" "/finger_spelling/units" \
            201 \
            "$TOKEN" \
            '{"name": "Smoke Test Unit", "description": "Created by smoke test", "category": "test"}'
        
    else
        echo -e "${RED}❌ Failed to authenticate with provided credentials${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping authenticated tests. Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run them.${NC}"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=========================="
echo "📊 Test Summary"
echo "=========================="
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Your API is healthy.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check the results above.${NC}"
    echo "Results saved to: $RESULTS_FILE"
    exit 1
fi