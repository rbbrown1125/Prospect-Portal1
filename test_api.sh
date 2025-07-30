#!/bin/bash

# Login and save cookies
echo "=== Testing Authentication ==="
curl -s -X POST http://localhost:5000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sam.brown@godlan.com", "password": "testing123"}' \
  -c cookies.txt -o /dev/null

# Test authenticated endpoints
echo "=== Testing User Endpoint ==="
curl -s -X GET http://localhost:5000/api/user -b cookies.txt | jq -r '.email' 2>/dev/null || echo "Failed"

echo "=== Testing Dashboard Data ==="
curl -s -X GET http://localhost:5000/api/dashboard/data -b cookies.txt | jq -r 'keys[]' 2>/dev/null || echo "Failed"

echo "=== Testing Sites Endpoint ==="
curl -s -X GET http://localhost:5000/api/sites -b cookies.txt | jq 'length' 2>/dev/null || echo "Failed"

echo "=== Testing Templates ==="
curl -s -X GET http://localhost:5000/api/templates -b cookies.txt | jq 'length' 2>/dev/null || echo "Failed"

echo "=== Testing Prospects ==="
curl -s -X GET http://localhost:5000/api/prospects -b cookies.txt | jq 'length' 2>/dev/null || echo "Failed"
