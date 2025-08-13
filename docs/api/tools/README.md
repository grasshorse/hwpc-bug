# Tools & Collections

## Overview

This section provides ready-to-use tools, collections, and automation resources for testing the Local Backend API system.

## Available Tools

### 📮 [Postman Collection](./postman.md)
Complete Postman collection with all endpoints, environment variables, and test scripts.

### 🖥️ [cURL Examples](./curl.md)
Command-line examples for all API endpoints with proper formatting and authentication.

### 🤖 [Automation Scripts](./automation.md)
Shell scripts and automation tools for testing workflows and data management.

### 📋 [Testing Templates](./templates.md)
Reusable templates for creating test cases and documentation.

## Quick Setup

### Postman Collection Import

1. **Download Collection**
   ```bash
   curl -o local-backend-api.postman_collection.json \
     http://localhost:3000/docs/api/tools/postman-collection.json
   ```

2. **Import to Postman**
   - Open Postman
   - Click "Import" button
   - Select the downloaded JSON file
   - Collection will be added to your workspace

3. **Set Environment Variables**
   ```json
   {
     "baseUrl": "http://localhost:3000",
     "apiVersion": "v1"
   }
   ```

### cURL Quick Reference

**Health Check**
```bash
curl -X GET http://localhost:3000/health
```

**List Tickets**
```bash
curl -X GET http://localhost:3000/api/v1/tickets
```

**Create Customer**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "555-0123"
  }'
```

## Testing Automation

### Bash Test Runner

```bash
#!/bin/bash
# run-api-tests.sh

BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/v1"

echo "Running API Tests..."

# Test 1: Health Check
echo "Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.success' || echo "FAIL: Health check"

# Test 2: List Tickets
echo "Testing tickets list..."
curl -s "$API_BASE/tickets" | jq '.success' || echo "FAIL: Tickets list"

# Test 3: Create and Delete Customer
echo "Testing customer CRUD..."
CUSTOMER_ID=$(curl -s -X POST "$API_BASE/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}' | \
  jq -r '.data.id')

if [ "$CUSTOMER_ID" != "null" ]; then
  echo "Created customer: $CUSTOMER_ID"
  curl -s -X DELETE "$API_BASE/customers/$CUSTOMER_ID" | jq '.success'
  echo "Deleted customer: $CUSTOMER_ID"
else
  echo "FAIL: Customer creation"
fi

echo "API Tests Complete"
```

### Python Test Script

```python
#!/usr/bin/env python3
# api_test_runner.py

import requests
import json
import sys

BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api/v1"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["success"] == True
    print("✓ Health check passed")

def test_customer_crud():
    """Test customer CRUD operations"""
    # Create customer
    customer_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "555-0123"
    }
    
    response = requests.post(f"{API_BASE}/customers", json=customer_data)
    assert response.status_code == 201
    customer_id = response.json()["data"]["id"]
    print(f"✓ Customer created: {customer_id}")
    
    # Read customer
    response = requests.get(f"{API_BASE}/customers/{customer_id}")
    assert response.status_code == 200
    assert response.json()["data"]["name"] == customer_data["name"]
    print("✓ Customer read")
    
    # Update customer
    update_data = {"name": "Updated Customer"}
    response = requests.put(f"{API_BASE}/customers/{customer_id}", json=update_data)
    assert response.status_code == 200
    print("✓ Customer updated")
    
    # Delete customer
    response = requests.delete(f"{API_BASE}/customers/{customer_id}")
    assert response.status_code == 200
    print("✓ Customer deleted")

def run_tests():
    """Run all tests"""
    try:
        test_health()
        test_customer_crud()
        print("\n🎉 All tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
```

## OpenAPI/Swagger Integration

### Generate OpenAPI Spec

```bash
# Using swagger-jsdoc (if implemented)
npm install -g swagger-jsdoc swagger-ui-express

# Generate spec from code comments
swagger-jsdoc -d swaggerDef.js src/routes/*.js > openapi.json
```

### Swagger UI Setup

```javascript
// swagger-setup.js
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

## IDE Integration

### VS Code REST Client

Create `.http` files for testing:

```http
### Health Check
GET http://localhost:3000/health

### List Tickets
GET http://localhost:3000/api/v1/tickets

### Create Customer
POST http://localhost:3000/api/v1/customers
Content-Type: application/json

{
  "name": "Test Customer",
  "email": "test@example.com",
  "phone": "555-0123"
}

### Update Customer
PUT http://localhost:3000/api/v1/customers/{{customerId}}
Content-Type: application/json

{
  "name": "Updated Customer"
}
```

### IntelliJ HTTP Client

```http
### Test Suite for Local Backend API

### Health Check
GET http://localhost:3000/health
Accept: application/json

> {%
client.test("Health check successful", function() {
    client.assert(response.status === 200, "Response status is not 200");
    client.assert(response.body.success === true, "Success is not true");
});
%}

### Create Customer
POST http://localhost:3000/api/v1/customers
Content-Type: application/json

{
  "name": "Test Customer",
  "email": "test@example.com"
}

> {%
client.test("Customer created", function() {
    client.assert(response.status === 201, "Response status is not 201");
    client.global.set("customerId", response.body.data.id);
});
%}
```

## Performance Testing Tools

### Apache Bench (ab)

```bash
# Basic load test
ab -n 1000 -c 10 http://localhost:3000/api/v1/tickets

# POST request test
ab -n 100 -c 5 -p customer.json -T application/json \
   http://localhost:3000/api/v1/customers
```

### Artillery.js

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/health"
      - get:
          url: "/api/v1/tickets"
      - post:
          url: "/api/v1/customers"
          json:
            name: "Load Test Customer"
            email: "loadtest@example.com"
```

```bash
# Run load test
artillery run artillery-config.yml
```

### k6 Load Testing

```javascript
// k6-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

export default function() {
  // Test health endpoint
  let healthResponse = http.get('http://localhost:3000/health');
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health success is true': (r) => r.json('success') === true,
  });

  // Test tickets endpoint
  let ticketsResponse = http.get('http://localhost:3000/api/v1/tickets');
  check(ticketsResponse, {
    'tickets status is 200': (r) => r.status === 200,
  });
}
```

```bash
# Run k6 test
k6 run k6-test.js
```

## Monitoring and Logging

### Request Logging

```bash
# Enable detailed curl logging
curl -v -X GET http://localhost:3000/api/v1/tickets

# Log to file
curl -v -X GET http://localhost:3000/api/v1/tickets 2>&1 | tee api-test.log
```

### Response Time Monitoring

```bash
# Measure response time with curl
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/tickets

# curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

## Data Management Tools

### Test Data Generator

```javascript
// generate-test-data.js
const faker = require('faker');
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function generateCustomers(count = 10) {
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const customer = {
      name: faker.name.findName(),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.stateAbbr(),
      zipCode: faker.address.zipCode(),
      serviceType: faker.random.arrayElement(['basic', 'premium', 'enterprise']),
      isActive: faker.random.boolean()
    };
    
    try {
      const response = await axios.post(`${API_BASE}/customers`, customer);
      customers.push(response.data.data);
      console.log(`Created customer: ${customer.name}`);
    } catch (error) {
      console.error(`Failed to create customer: ${error.message}`);
    }
  }
  
  return customers;
}

// Run generator
generateCustomers(50).then(() => {
  console.log('Test data generation complete');
});
```

### Database Backup/Restore

```bash
# Backup test database
cp backend/database/database.sqlite backend/database/backup-$(date +%Y%m%d).sqlite

# Restore from backup
cp backend/database/backup-20250108.sqlite backend/database/database.sqlite
```

For detailed tool documentation and examples, explore the specific tool guides linked at the top of this document.