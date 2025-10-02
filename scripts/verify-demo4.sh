#!/bin/bash
# Verify Demo 4 Requirements Implementation

echo "🔍 VERIFYING DEMO 4 REQUIREMENTS"
echo "=================================="
echo ""

# Test query matching Demo 4 spec
QUERY='{"query": "Im studying at FGV in Sao Paulo for 4 months, 2000 dollars budget, love art and local food, coming from Virginia"}'

echo "📝 Testing API with Demo 4 query..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/destination/analyze \
  -H "Content-Type: application/json" \
  -d "$QUERY" \
  --max-time 120)

if [ -z "$RESPONSE" ]; then
  echo "❌ No response from API"
  exit 1
fi

echo "✅ Got response from API"
echo ""

# Parse and check requirements
echo "📋 CHECKING DEMO 4 REQUIREMENTS:"
echo ""

# 1. Real-time cost analysis
echo "1️⃣  Real-time cost analysis (flights, seasonal trends)"
echo "$RESPONSE" | grep -q '"flights"' && echo "   ✅ Flight data present" || echo "   ❌ Missing flight data"
echo "$RESPONSE" | grep -q '"trend"' && echo "   ✅ Seasonal trends present" || echo "   ⚠️  Trends data"
echo "$RESPONSE" | grep -q '"priceRange"' && echo "   ✅ Price ranges present" || echo "   ⚠️  Price range data"
echo ""

# 2. Live housing intelligence
echo "2️⃣  Live housing intelligence (FGV, Airbnb, apartments, utilities)"
echo "$RESPONSE" | grep -q '"housing"' && echo "   ✅ Housing data present" || echo "   ❌ Missing housing data"
echo "$RESPONSE" | grep -q 'airbnb\|Airbnb' && echo "   ✅ Airbnb rates present" || echo "   ⚠️  Airbnb data"
echo "$RESPONSE" | grep -q '"utilities"' && echo "   ✅ Utilities costs present" || echo "   ⚠️  Utilities data"
echo ""

# 3. Cultural integration
echo "3️⃣  Cultural integration (art, food, language basics)"
echo "$RESPONSE" | grep -q '"culturalGuide"' && echo "   ✅ Cultural guide present" || echo "   ❌ Missing cultural guide"
echo "$RESPONSE" | grep -q '"language"' && echo "   ✅ Language basics present" || echo "   ⚠️  Language data"
echo "$RESPONSE" | grep -q '"essentialPhrases"' && echo "   ✅ Portuguese phrases present" || echo "   ⚠️  Phrases data"
echo ""

# 4. Budget optimization
echo "4️⃣  Budget optimization (breakdown, currency conversion)"
echo "$RESPONSE" | grep -q '"budgetPlan"' && echo "   ✅ Budget plan present" || echo "   ❌ Missing budget plan"
echo "$RESPONSE" | grep -q '"breakdown"' && echo "   ✅ Budget breakdown present" || echo "   ⚠️  Breakdown data"
echo "$RESPONSE" | grep -q '"currency"' && echo "   ✅ Currency data present" || echo "   ⚠️  Currency data"
echo "$RESPONSE" | grep -q '"exchangeRate"' && echo "   ✅ Live exchange rate present" || echo "   ⚠️  Exchange rate"
echo ""

# 5. Safety & practicalities
echo "5️⃣  Safety & practicalities (neighborhoods, metro, banking)"
echo "$RESPONSE" | grep -q '"safety"' && echo "   ✅ Safety data present" || echo "   ❌ Missing safety data"
echo "$RESPONSE" | grep -q '"safeNeighborhoods"' && echo "   ✅ Safe neighborhoods present" || echo "   ⚠️  Neighborhoods"
echo "$RESPONSE" | grep -q '"emergencyContacts"' && echo "   ✅ Emergency contacts present" || echo "   ⚠️  Emergency data"
echo ""

# 6. Cultural context (origin-based)
echo "6️⃣  Cultural context (origin connection)"
echo "$RESPONSE" | grep -q '"culturalContext"' && echo "   ✅ Cultural context present" || echo "   ⚠️  Cultural context"
echo "$RESPONSE" | grep -q '"basedOnOrigin"' && echo "   ✅ Origin-based recommendations" || echo "   ⚠️  Origin recommendations"
echo ""

echo "=================================="
echo "✅ DEMO 4 VERIFICATION COMPLETE"
echo ""
echo "Response size: $(echo "$RESPONSE" | wc -c) bytes"
echo "Success: $(echo "$RESPONSE" | grep -q '"success":true' && echo 'YES' || echo 'NO')"
