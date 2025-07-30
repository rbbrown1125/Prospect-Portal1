#!/bin/bash
echo "=== Testing Access Code Validation ==="
# Test with valid access code
curl -s -X POST http://localhost:5000/api/public/validate-access-code \
  -H "Content-Type: application/json" \
  -d '{"accessCode": "6RD4LM4A"}' | jq '.valid' 2>/dev/null || echo "Validation failed"

# Test with invalid access code  
curl -s -X POST http://localhost:5000/api/public/validate-access-code \
  -H "Content-Type: application/json" \
  -d '{"accessCode": "INVALID123"}' | jq '.valid' 2>/dev/null || echo "Expected failure"
