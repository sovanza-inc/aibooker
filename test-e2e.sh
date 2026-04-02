#!/bin/bash
# AiBooker E2E Test Suite
# Tests the full user journey from signup to dashboard

BASE="http://localhost:3000"
COOKIE_JAR="/tmp/aibooker_e2e_cookies.txt"
PASS=0
FAIL=0

rm -f $COOKIE_JAR

test_result() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ $name (got $actual)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (expected $expected, got $actual)"
    FAIL=$((FAIL+1))
  fi
}

test_contains() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓ $name"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (expected to contain '$expected', got: ${actual:0:100})"
    FAIL=$((FAIL+1))
  fi
}

echo "============================================"
echo "  AiBooker E2E Test Suite"
echo "============================================"
echo ""

# ---- TEST 1: Public pages ----
echo "--- Test 1: Public Pages ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
test_result "Landing page returns 200" "200" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sign-in")
test_result "Sign-in page returns 200" "200" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sign-up")
test_result "Sign-up page returns 200" "200" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
test_result "Health endpoint returns 200" "200" "$CODE"

# ---- TEST 2: Protected pages redirect ----
echo ""
echo "--- Test 2: Protected Pages Redirect (no auth) ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE/overview" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" "$BASE/overview")
test_result "Overview redirects without auth" "307" "$CODE"

# ---- TEST 3: Auth - Get CSRF ----
echo ""
echo "--- Test 3: Authentication ---"
CSRF_RESPONSE=$(curl -s -c $COOKIE_JAR "$BASE/api/auth/csrf")
CSRF=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
test_contains "CSRF token obtained" "csrfToken" "$CSRF_RESPONSE"

# ---- TEST 4: Auth - Sign in with credentials ----
LOGIN_CODE=$(curl -s -b $COOKIE_JAR -c $COOKIE_JAR -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=martijn@jimani.nl&password=admin123" \
  -o /dev/null -w "%{http_code}")
test_result "Credential login returns 302" "302" "$LOGIN_CODE"

# ---- TEST 5: Session check ----
SESSION=$(curl -s -b $COOKIE_JAR "$BASE/api/auth/session")
test_contains "Session has user email" "martijn@jimani.nl" "$SESSION"
test_contains "Session has user role" "role" "$SESSION"

# ---- TEST 6: Provider API ----
echo ""
echo "--- Test 4: Provider API ---"
PROVIDER=$(curl -s -b $COOKIE_JAR "$BASE/api/providers/me")
PROV_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/providers/me")
test_result "Provider API returns 200" "200" "$PROV_CODE"
test_contains "Provider has name" "La Piazza" "$PROVIDER"
test_contains "Provider has location" "location" "$PROVIDER"

# ---- TEST 7: Stats API ----
STATS=$(curl -s -b $COOKIE_JAR "$BASE/api/providers/me/stats")
STATS_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/providers/me/stats")
test_result "Stats API returns 200" "200" "$STATS_CODE"
test_contains "Stats has todayCount" "todayCount" "$STATS"
test_contains "Stats has platformStats" "platformStats" "$STATS"

# ---- TEST 8: Reservations API ----
RES=$(curl -s -b $COOKIE_JAR "$BASE/api/providers/me/reservations")
RES_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/providers/me/reservations")
test_result "Reservations API returns 200" "200" "$RES_CODE"

# ---- TEST 9: Booking Types API ----
BT=$(curl -s -b $COOKIE_JAR "$BASE/api/providers/me/booking-types")
BT_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/providers/me/booking-types")
test_result "Booking Types API returns 200" "200" "$BT_CODE"
test_contains "Has Lunch booking type" "Lunch" "$BT"
test_contains "Has Dinner booking type" "Dinner" "$BT"

# ---- TEST 10: Settings API ----
SETTINGS_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/settings" \
  -H "Content-Type: application/json" \
  -d '{"name":"La Piazza Amsterdam Updated"}')
test_result "Settings update returns 200" "200" "$SETTINGS_CODE"

# Revert
curl -s -b $COOKIE_JAR -X PUT "$BASE/api/providers/me/settings" \
  -H "Content-Type: application/json" \
  -d '{"name":"La Piazza Amsterdam"}' -o /dev/null

# ---- TEST 11: AI Endpoints ----
echo ""
echo "--- Test 5: AI Platform Endpoints ---"
SEARCH=$(curl -s -X POST "$BASE/api/v1/ai/search" \
  -H "Authorization: Bearer aibooker_test_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"city":"Amsterdam"}')
SEARCH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/search" \
  -H "Authorization: Bearer aibooker_test_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"city":"Amsterdam"}')
test_result "AI Search returns 200" "200" "$SEARCH_CODE"
test_contains "Search finds La Piazza" "La Piazza" "$SEARCH"

AVAIL=$(curl -s -X POST "$BASE/api/v1/ai/availability" \
  -H "Authorization: Bearer aibooker_test_key_2026" \
  -H "Content-Type: application/json" \
  -d "{\"provider_id\":13,\"date\":\"$(date -d '+1 day' '+%Y-%m-%d' 2>/dev/null || date -v+1d '+%Y-%m-%d')\"}")
AVAIL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/availability" \
  -H "Authorization: Bearer aibooker_test_key_2026" \
  -H "Content-Type: application/json" \
  -d "{\"provider_id\":13,\"date\":\"$(date -d '+1 day' '+%Y-%m-%d' 2>/dev/null || date -v+1d '+%Y-%m-%d')\"}")
test_result "AI Availability returns 200" "200" "$AVAIL_CODE"
test_contains "Has slots array" "slots" "$AVAIL"

# AI Book
BOOK=$(curl -s -X POST "$BASE/api/v1/ai/book" \
  -H "Authorization: Bearer aibooker_test_key_2026" \
  -H "Content-Type: application/json" \
  -H "X-AI-Platform: openai" \
  -d "{\"provider_id\":13,\"booking_type_id\":17,\"date\":\"$(date -d '+1 day' '+%Y-%m-%d' 2>/dev/null || date -v+1d '+%Y-%m-%d')\",\"time\":\"19:00\",\"party_size\":2,\"customer\":{\"first_name\":\"E2E\",\"last_name\":\"Test\",\"email\":\"e2e@test.com\"}}")
test_contains "Booking created with hold" "booking_id" "$BOOK"
test_contains "Booking status is held" "held" "$BOOK"

BOOKING_ID=$(echo "$BOOK" | grep -o '"booking_id":[0-9]*' | cut -d: -f2)
if [ -n "$BOOKING_ID" ]; then
  STATUS=$(curl -s -X POST "$BASE/api/v1/ai/booking-status" \
    -H "Authorization: Bearer aibooker_test_key_2026" \
    -H "Content-Type: application/json" \
    -d "{\"booking_id\":$BOOKING_ID}")
  test_contains "Booking status returns data" "booking_id" "$STATUS"
fi

# AI Auth - no key
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/search" \
  -H "Content-Type: application/json" \
  -d '{"city":"Amsterdam"}')
test_result "AI Search rejects no auth" "401" "$NOAUTH"

# AI Auth - bad key
BADAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/search" \
  -H "Authorization: Bearer invalid_key" \
  -H "Content-Type: application/json" \
  -d '{"city":"Amsterdam"}')
test_result "AI Search rejects bad key" "401" "$BADAUTH"

# ---- TEST 12: Admin API ----
echo ""
echo "--- Test 6: Admin API ---"
ADMIN_STATS_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/admin/stats")
test_result "Admin stats returns 200" "200" "$ADMIN_STATS_CODE"

ADMIN_PROV_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/admin/providers")
test_result "Admin providers returns 200" "200" "$ADMIN_PROV_CODE"

ADMIN_KEYS_CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE/api/admin/api-keys")
test_result "Admin API keys returns 200" "200" "$ADMIN_KEYS_CODE"

# ---- TEST 13: New user signup + onboarding ----
echo ""
echo "--- Test 7: Signup + Onboarding Flow ---"
rm -f /tmp/aibooker_new_user.txt

# Signup via the server action won't work from curl easily, so test the onboard API directly
# First create a user manually
CSRF2=$(curl -s -c /tmp/aibooker_new_user.txt "$BASE/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# We can't easily test signup+auto-signin from curl, but we can test the onboard endpoint
# with an existing logged-in user who has no provider

# Test that onboard endpoint exists and validates input
ONBOARD_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}')
test_result "Onboard rejects without auth" "401" "$ONBOARD_NOAUTH"

# Test onboard with auth but missing fields
ONBOARD_INVALID=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" \
  -d '{"name":""}')
test_result "Onboard rejects missing fields" "400" "$ONBOARD_INVALID"

# ---- TEST 14: Page loads (HTML check) ----
echo ""
echo "--- Test 8: Page HTML Loads ---"
for page in "/" "/sign-in" "/sign-up"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$page")
  test_result "Page $page loads" "200" "$CODE"
done

# Protected pages with auth
for page in "/overview" "/reservations" "/booking-types" "/settings" "/pricing" "/admin"; do
  CODE=$(curl -s -b $COOKIE_JAR -o /dev/null -w "%{http_code}" "$BASE$page")
  test_result "Page $page loads with auth" "200" "$CODE"
done

# ---- SUMMARY ----
echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"

rm -f $COOKIE_JAR /tmp/aibooker_new_user.txt

if [ $FAIL -gt 0 ]; then
  exit 1
fi
