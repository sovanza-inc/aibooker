#!/bin/bash
# AiBooker Full Validation Suite - Edge Cases + E2E
BASE="http://localhost:3000"
CJ="/tmp/ab_full_test.txt"
PASS=0; FAIL=0

rm -f $CJ

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1 — $2"; FAIL=$((FAIL+1)); }
check() {
  local name="$1" expected="$2" actual="$3"
  [ "$actual" = "$expected" ] && ok "$name" || fail "$name" "expected $expected, got $actual"
}
contains() {
  local name="$1" expected="$2" actual="$3"
  echo "$actual" | grep -q "$expected" && ok "$name" || fail "$name" "missing '$expected'"
}

get_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
get_body() { curl -s "$@"; }

login() {
  rm -f $CJ
  local CSRF=$(curl -s -c $CJ "$BASE/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  curl -s -b $CJ -c $CJ -X POST "$BASE/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=$CSRF&email=$1&password=$2" -o /dev/null
}

echo "============================================"
echo "  AiBooker Full Validation Suite"
echo "============================================"

# ========== 1. PUBLIC PAGES ==========
echo -e "\n--- 1. Public Pages ---"
check "GET /" "200" "$(get_code $BASE/)"
check "GET /sign-in" "200" "$(get_code $BASE/sign-in)"
check "GET /sign-up" "200" "$(get_code $BASE/sign-up)"
check "GET /api/health" "200" "$(get_code $BASE/api/health)"
check "GET /openapi.json" "200" "$(get_code $BASE/openapi.json)"

# ========== 2. AUTH PROTECTION ==========
echo -e "\n--- 2. Auth Protection (no session) ---"
for path in /overview /reservations /booking-types /settings /pricing /onboarding /admin; do
  CODE=$(get_code "$BASE$path")
  check "GET $path redirects (307)" "307" "$CODE"
done

# ========== 3. API AUTH (no session) ==========
echo -e "\n--- 3. API Auth (no session) ---"
check "GET /api/providers/me → 401" "401" "$(get_code $BASE/api/providers/me)"
check "GET /api/providers/me/stats → 401" "401" "$(get_code $BASE/api/providers/me/stats)"
check "GET /api/providers/me/reservations → 401" "401" "$(get_code $BASE/api/providers/me/reservations)"
check "GET /api/providers/me/booking-types → 401" "401" "$(get_code $BASE/api/providers/me/booking-types)"
check "PUT /api/providers/me/settings → 401" "401" "$(get_code -X PUT $BASE/api/providers/me/settings -H 'Content-Type: application/json' -d '{}')"
check "POST /api/providers/onboard → 401" "401" "$(get_code -X POST $BASE/api/providers/onboard -H 'Content-Type: application/json' -d '{}')"

# ========== 4. AI ENDPOINTS AUTH ==========
echo -e "\n--- 4. AI Endpoints Auth ---"
check "AI search no key → 401" "401" "$(get_code -X POST $BASE/api/v1/ai/search -H 'Content-Type: application/json' -d '{}')"
check "AI search bad key → 401" "401" "$(get_code -X POST $BASE/api/v1/ai/search -H 'Authorization: Bearer bad' -H 'Content-Type: application/json' -d '{}')"
check "AI availability no key → 401" "401" "$(get_code -X POST $BASE/api/v1/ai/availability -H 'Content-Type: application/json' -d '{}')"
check "AI book no key → 401" "401" "$(get_code -X POST $BASE/api/v1/ai/book -H 'Content-Type: application/json' -d '{}')"
check "AI status no key → 401" "401" "$(get_code -X POST $BASE/api/v1/ai/booking-status -H 'Content-Type: application/json' -d '{}')"

# ========== 5. AI VALIDATION ==========
echo -e "\n--- 5. AI Input Validation ---"
AI_H='-H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json"'

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/search" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"party_size": -1}')
check "AI search negative party_size → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/availability" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"provider_id": 1}')
check "AI availability missing date → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/availability" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"provider_id": 1, "date": "bad-date"}')
check "AI availability bad date → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/book" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"provider_id": 1}')
check "AI book missing fields → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/booking-status" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"booking_id": 999999}')
check "AI booking-status not found → 404" "404" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/ai/book" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"provider_id":1,"booking_type_id":1,"date":"2020-01-01","time":"19:00","party_size":2,"customer":{"first_name":"Test","last_name":"User","email":"t@t.com"}}')
check "AI book past date → 409 (no availability)" "409" "$CODE"

# ========== 6. LOGIN + SESSION ==========
echo -e "\n--- 6. Credential Login ---"
login "martijn@jimani.nl" "admin123"
SESSION=$(get_body -b $CJ "$BASE/api/auth/session")
contains "Session has email" "martijn@jimani.nl" "$SESSION"

# Wrong password
rm -f /tmp/ab_bad.txt
CSRF=$(curl -s -c /tmp/ab_bad.txt "$BASE/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
curl -s -b /tmp/ab_bad.txt -c /tmp/ab_bad.txt -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=martijn@jimani.nl&password=wrong" -o /dev/null
BAD_SESSION=$(get_body -b /tmp/ab_bad.txt "$BASE/api/auth/session")
contains "Wrong password → no session" "null" "$BAD_SESSION"

# Non-existent user
rm -f /tmp/ab_bad2.txt
CSRF=$(curl -s -c /tmp/ab_bad2.txt "$BASE/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
curl -s -b /tmp/ab_bad2.txt -c /tmp/ab_bad2.txt -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=nobody@nobody.com&password=test1234" -o /dev/null
NONE_SESSION=$(get_body -b /tmp/ab_bad2.txt "$BASE/api/auth/session")
contains "Non-existent user → no session" "null" "$NONE_SESSION"

# ========== 7. PROVIDER APIS ==========
echo -e "\n--- 7. Provider APIs (authenticated) ---"
check "GET /api/providers/me → 200" "200" "$(get_code -b $CJ $BASE/api/providers/me)"
PROV=$(get_body -b $CJ "$BASE/api/providers/me")
contains "Provider has name" "name" "$PROV"
contains "Provider has location" "location" "$PROV"

check "GET /api/providers/me/stats → 200" "200" "$(get_code -b $CJ $BASE/api/providers/me/stats)"
STATS=$(get_body -b $CJ "$BASE/api/providers/me/stats")
contains "Stats has todayCount" "todayCount" "$STATS"
contains "Stats has todayCapacity" "todayCapacity" "$STATS"
contains "Stats has platformStats" "platformStats" "$STATS"
contains "Stats has todayBookings" "todayBookings" "$STATS"

check "GET /api/providers/me/reservations → 200" "200" "$(get_code -b $CJ $BASE/api/providers/me/reservations)"
check "GET /api/providers/me/booking-types → 200" "200" "$(get_code -b $CJ $BASE/api/providers/me/booking-types)"
BT=$(get_body -b $CJ "$BASE/api/providers/me/booking-types")
contains "Has booking types" "Lunch" "$BT"

# ========== 8. SETTINGS VALIDATION ==========
echo -e "\n--- 8. Settings Validation ---"
CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/settings" \
  -H "Content-Type: application/json" -d '{"email": "not-an-email"}')
check "Settings bad email → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/settings" \
  -H "Content-Type: application/json" -d '{"name": "Updated Name"}')
check "Settings valid update → 200" "200" "$CODE"

# Revert
curl -s -b $CJ -X PUT "$BASE/api/providers/me/settings" -H "Content-Type: application/json" \
  -d '{"name": "La Piazza Amsterdam"}' -o /dev/null

# ========== 9. BOOKING TYPE VALIDATION ==========
echo -e "\n--- 9. Booking Type Validation ---"
# Get first booking type ID
BT_ID=$(echo "$BT" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/booking-types/$BT_ID" \
  -H "Content-Type: application/json" -d '{"duration": 5}')
check "BT duration too short → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/booking-types/$BT_ID" \
  -H "Content-Type: application/json" -d '{"isActive": true}')
check "BT valid toggle → 200" "200" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/booking-types/999999" \
  -H "Content-Type: application/json" -d '{"name": "test"}')
check "BT non-existent → 404" "404" "$CODE"

# ========== 10. RESERVATION ACTIONS ==========
echo -e "\n--- 10. Reservation Actions ---"
CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/providers/me/reservations" \
  -H "Content-Type: application/json" -d '{}')
check "Reservation action empty → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/providers/me/reservations" \
  -H "Content-Type: application/json" -d '{"bookingId": 999999, "action": "confirm"}')
check "Reservation confirm non-existent → 200 (empty)" "200" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/providers/me/reservations" \
  -H "Content-Type: application/json" -d '{"bookingId": 1, "action": "invalid"}')
check "Reservation invalid action → 400" "400" "$CODE"

# ========== 11. ONBOARDING VALIDATION ==========
echo -e "\n--- 11. Onboarding Validation ---"
CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" -d '{}')
check "Onboard empty body → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" -d '{"name":"Test"}')
check "Onboard missing address → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" -d '{"name":"","streetAddress":"x","city":"x","postalCode":"x"}')
check "Onboard empty name → 400" "400" "$CODE"

# User already has provider → returns existing
BODY=$(curl -s -b $CJ -X POST "$BASE/api/providers/onboard" \
  -H "Content-Type: application/json" -d '{"name":"Duplicate","streetAddress":"x","city":"x","postalCode":"x"}')
contains "Onboard existing user → returns provider" "La Piazza" "$BODY"

# ========== 12. OPENING HOURS ==========
echo -e "\n--- 12. Opening Hours ---"
check "GET opening-hours → 200" "200" "$(get_code -b $CJ "$BASE/api/providers/me/opening-hours?year=2026&month=3")"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/opening-hours" \
  -H "Content-Type: application/json" -d '{}')
check "Opening hours empty → 400" "400" "$CODE"

CODE=$(curl -s -b $CJ -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/providers/me/opening-hours" \
  -H "Content-Type: application/json" -d '{"hours":[{"date":"2026-04-01","openTime":"08:00","closeTime":"21:00","isClosed":false}]}')
check "Opening hours valid save → 200" "200" "$CODE"

# ========== 13. AI FULL FLOW ==========
echo -e "\n--- 13. AI Full Booking Flow ---"
SEARCH=$(curl -s -X POST "$BASE/api/v1/ai/search" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d '{"city":"Amsterdam","cuisine":"italian"}')
contains "Search returns results" "results" "$SEARCH"

PROV_ID=$(echo "$SEARCH" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
TOMORROW=$(date -d '+1 day' '+%Y-%m-%d' 2>/dev/null || date -v+1d '+%Y-%m-%d' 2>/dev/null || echo "2026-04-05")

AVAIL=$(curl -s -X POST "$BASE/api/v1/ai/availability" \
  -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
  -d "{\"provider_id\":$PROV_ID,\"date\":\"$TOMORROW\",\"party_size\":2}")
contains "Availability returns slots" "slots" "$AVAIL"

BT_ID_AI=$(echo "$AVAIL" | grep -o '"booking_type_id":[0-9]*' | head -1 | cut -d: -f2)
TIME_AI=$(echo "$AVAIL" | grep -o '"time":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$BT_ID_AI" ] && [ -n "$TIME_AI" ]; then
  BOOK=$(curl -s -X POST "$BASE/api/v1/ai/book" \
    -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
    -d "{\"provider_id\":$PROV_ID,\"booking_type_id\":$BT_ID_AI,\"date\":\"$TOMORROW\",\"time\":\"$TIME_AI\",\"party_size\":2,\"customer\":{\"first_name\":\"E2E\",\"last_name\":\"Full\",\"email\":\"e2e-full@test.com\"}}")
  contains "Booking created" "booking_id" "$BOOK"
  contains "Booking held" "held" "$BOOK"

  BK_ID=$(echo "$BOOK" | grep -o '"booking_id":[0-9]*' | cut -d: -f2)
  if [ -n "$BK_ID" ]; then
    STATUS=$(curl -s -X POST "$BASE/api/v1/ai/booking-status" \
      -H "Authorization: Bearer aibooker_test_key_2026" -H "Content-Type: application/json" \
      -d "{\"booking_id\":$BK_ID}")
    contains "Status check works" "booking_id" "$STATUS"
  fi
else
  fail "No availability to test booking" "BT_ID=$BT_ID_AI TIME=$TIME_AI"
fi

# ========== 14. ADMIN ==========
echo -e "\n--- 14. Admin APIs ---"
check "Admin stats → 200" "200" "$(get_code -b $CJ $BASE/api/admin/stats)"
check "Admin providers → 200" "200" "$(get_code -b $CJ $BASE/api/admin/providers)"
check "Admin api-keys → 200" "200" "$(get_code -b $CJ $BASE/api/admin/api-keys)"

ADMIN_STATS=$(get_body -b $CJ "$BASE/api/admin/stats")
contains "Admin has totalProviders" "totalProviders" "$ADMIN_STATS"
contains "Admin has totalBookings" "totalBookings" "$ADMIN_STATS"

# ========== 15. PAGES WITH AUTH ==========
echo -e "\n--- 15. All Pages Load ---"
for page in /overview /reservations /booking-types /settings /pricing /onboarding; do
  check "Page $page → 200" "200" "$(get_code -b $CJ $BASE$page)"
done

# ========== 16. HOLD EXPIRY ==========
echo -e "\n--- 16. Hold Expiry ---"
EXPIRE=$(curl -s -X POST "$BASE/api/v1/ai/expire-holds" \
  -H "Authorization: Bearer aibooker_test_key_2026")
contains "Expire holds returns count" "expired_count" "$EXPIRE"

# ========== SUMMARY ==========
echo -e "\n============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"

rm -f $CJ /tmp/ab_bad.txt /tmp/ab_bad2.txt
[ $FAIL -gt 0 ] && exit 1 || exit 0
