# Testing Scenarios and Examples

## Overview

This section provides comprehensive testing scenarios, examples, and guidelines for validating the Local Backend API system. It includes positive test cases, negative test cases, edge cases, and performance testing considerations.

## Testing Categories

### 🟢 [Positive Test Cases](./positive-tests.md)
Successful scenarios with valid data and expected workflows.

### 🔴 [Negative Test Cases](./negative-tests.md)
Error scenarios, invalid data, and failure conditions.

### ⚠️ [Edge Case Testing](./edge-cases.md)
Boundary conditions, special characters, and unusual scenarios.

### 📊 [Performance Testing](./performance-tests.md)
Load testing, response time validation, and scalability testing.

### 🔄 [Workflow Testing](./workflow-tests.md)
Multi-step processes and dependent API operations.

## Quick Test Examples

### Basic CRUD Testing

**Create → Read → Update → Delete**
```bash
# 1. Create a customer
CUSTOMER_ID=$(curl -s -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "555-0123"
  }' | jq -r '.data.id')

# 2. Read the customer
curl -X GET http://localhost:3000/api/v1/customers/$CUSTOMER_ID

# 3. Update the customer
curl -X PUT http://localhost:3000/api/v1/customers/$CUSTOMER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Customer",
    "phone": "555-0456"
  }'

# 4. Delete the customer
curl -X DELETE http://localhost:3000/api/v1/customers/$CUSTOMER_ID
```

### Validation Testing

**Test Required Fields**
```bash
# Missing required field (name)
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
# Expected: 400 Bad Request with validation error
```

**Test Invalid Data Types**
```bash
# Invalid email format
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "invalid-email"
  }'
# Expected: 400 Bad Request with validation error
```

### Relationship Testing

**Test Foreign Key Relationships**
```bash
# Create ticket with valid customer ID
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "customerId": "'$CUSTOMER_ID'",
    "status": "open",
    "priority": "medium"
  }'

# Create ticket with invalid customer ID
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "customerId": "00000000-0000-0000-0000-000000000000",
    "status": "open",
    "priority": "medium"
  }'
# Expected: 400 Bad Request or 422 Unprocessable Entity
```

## Test Data Management

### Sample Test Data

**Valid Customer Data**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-0123",
  "street": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "serviceType": "premium",
  "isActive": true
}
```

**Valid Ticket Data**
```json
{
  "title": "Service Request",
  "description": "Customer needs assistance with service",
  "status": "open",
  "priority": "medium",
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "660e8400-e29b-41d4-a716-446655440001",
  "scheduledDate": "2025-01-10T09:00:00.000Z"
}
```

**Valid Route Data**
```json
{
  "name": "Downtown Route",
  "description": "Covers downtown business district",
  "startLocation": "Main Office",
  "endLocation": "Downtown Hub",
  "estimatedDuration": 120,
  "status": "active"
}
```

### Test Data Cleanup

**Cleanup Script Example**
```bash
#!/bin/bash
# cleanup-test-data.sh

# Delete test customers (by email pattern)
curl -X GET "http://localhost:3000/api/v1/customers/search?q=test@example.com" | \
  jq -r '.data[].id' | \
  while read id; do
    curl -X DELETE "http://localhost:3000/api/v1/customers/$id"
  done

# Delete test tickets (by title pattern)
curl -X GET "http://localhost:3000/api/v1/tickets?search=Test%20Ticket" | \
  jq -r '.data[].id' | \
  while read id; do
    curl -X DELETE "http://localhost:3000/api/v1/tickets/$id"
  done
```

## Automated Testing Integration

### Jest Test Example

```javascript
// tests/api/customers.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Customer API', () => {
  let customerId;

  afterEach(async () => {
    // Cleanup created customer
    if (customerId) {
      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .expect(200);
      customerId = null;
    }
  });

  describe('POST /api/v1/customers', () => {
    it('should create a customer with valid data', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0123'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(customerData.name);
      
      customerId = response.body.data.id;
    });

    it('should return validation error for missing name', async () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### Postman Test Scripts

```javascript
// Postman test script for customer creation
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success true", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Customer has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data).to.have.property('name');
    pm.expect(jsonData.data).to.have.property('email');
});

// Store customer ID for subsequent tests
pm.test("Store customer ID", function () {
    const jsonData = pm.response.json();
    pm.globals.set("customerId", jsonData.data.id);
});
```

## Performance Testing Guidelines

### Response Time Benchmarks

| Endpoint Type | Expected Response Time |
|---------------|----------------------|
| Simple GET | < 100ms |
| List with pagination | < 200ms |
| CREATE operations | < 300ms |
| UPDATE operations | < 250ms |
| DELETE operations | < 150ms |
| Complex reports | < 500ms |

### Load Testing Scenarios

**Concurrent User Testing**
```bash
# Using Apache Bench (ab)
ab -n 1000 -c 10 http://localhost:3000/api/v1/tickets

# Using curl with parallel requests
seq 1 100 | xargs -n1 -P10 -I{} curl -s http://localhost:3000/api/v1/customers > /dev/null
```

**Large Dataset Testing**
```bash
# Test pagination with large datasets
curl "http://localhost:3000/api/v1/tickets?page=1&limit=100"
curl "http://localhost:3000/api/v1/tickets?page=10&limit=100"
curl "http://localhost:3000/api/v1/tickets?page=100&limit=100"
```

## Testing Checklist

### Pre-Test Setup
- [ ] API server is running
- [ ] Database is initialized with sample data
- [ ] Test environment variables are set
- [ ] Testing tools are configured

### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] Validation rules are enforced
- [ ] Error responses are properly formatted
- [ ] Pagination works correctly
- [ ] Search and filtering work as expected

### Data Integrity Testing
- [ ] Foreign key constraints are enforced
- [ ] Unique constraints prevent duplicates
- [ ] Required fields are validated
- [ ] Data types are enforced
- [ ] Business rules are applied

### Error Handling Testing
- [ ] Invalid requests return appropriate errors
- [ ] Missing resources return 404
- [ ] Validation errors include field details
- [ ] Server errors are handled gracefully
- [ ] Rate limiting works correctly

### Performance Testing
- [ ] Response times meet benchmarks
- [ ] API handles concurrent requests
- [ ] Large datasets are paginated properly
- [ ] Memory usage is reasonable
- [ ] Database queries are optimized

### Security Testing
- [ ] Authentication is required where appropriate
- [ ] Authorization rules are enforced
- [ ] Input validation prevents injection
- [ ] Sensitive data is not exposed
- [ ] CORS policies are correct

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        cd backend
        npm install
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Run API integration tests
      run: |
        cd backend
        npm start &
        sleep 10
        npm run test:integration
```

For detailed testing scenarios and examples, explore the specific testing categories linked at the top of this document.