# Error Handling Reference

## Overview

This guide provides comprehensive information about error handling, HTTP status codes, error response formats, and troubleshooting for the Local Backend API system.

## Error Response Format

All API errors follow a consistent response structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "<optional_error_details>"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

## HTTP Status Codes

### Success Codes (2xx)

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST requests (resource created) |
| 204 | No Content | Successful DELETE with no response body |

### Client Error Codes (4xx)

| Code | Status | Usage |
|------|--------|-------|
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflicts (duplicate email, etc.) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limiting exceeded |

### Server Error Codes (5xx)

| Code | Status | Usage |
|------|--------|-------|
| 500 | Internal Server Error | Unexpected server errors |
| 502 | Bad Gateway | Upstream service errors |
| 503 | Service Unavailable | Service temporarily unavailable |
| 504 | Gateway Timeout | Request timeout |

## Error Code Categories

### VALIDATION_ERROR (400)
Input validation failures and malformed requests.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Email is required",
          "value": null
        },
        {
          "field": "name",
          "message": "Name must be between 1 and 255 characters",
          "value": ""
        }
      ]
    }
  }
}
```

### AUTHENTICATION_ERROR (401)
Authentication failures and token issues.

**Examples:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token"
  }
}
```

### AUTHORIZATION_ERROR (403)
Permission denied and access control violations.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions for this operation"
  }
}
```

### NOT_FOUND (404)
Resource not found errors.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket not found",
    "details": {
      "resource": "ticket",
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### CONFLICT_ERROR (409)
Resource conflicts and constraint violations.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT_ERROR",
    "message": "Email address already in use",
    "details": {
      "field": "email",
      "value": "existing@example.com"
    }
  }
}
```

### CONSTRAINT_ERROR (422)
Database constraint violations and business rule failures.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Cannot delete customer with active tickets",
    "details": {
      "constraint": "active_tickets_exist",
      "activeTickets": 3
    }
  }
}
```

### RATE_LIMIT_EXCEEDED (429)
Rate limiting and throttling errors.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "retryAfter": 3600
    }
  }
}
```

### INTERNAL_ERROR (500)
Server-side errors and unexpected failures.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### SERVICE_UNAVAILABLE (503)
Service unavailability and maintenance errors.

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable for maintenance"
  }
}
```

## Common Error Scenarios

### Validation Errors

**Missing Required Fields**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Invalid Data Types**
```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "priority": "invalid_priority"
  }'
```

**Invalid Email Format**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "invalid-email"
  }'
```

### Resource Not Found

**Non-existent Ticket**
```bash
curl -X GET http://localhost:3000/api/v1/tickets/00000000-0000-0000-0000-000000000000
```

**Non-existent Customer**
```bash
curl -X PUT http://localhost:3000/api/v1/customers/invalid-id \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

### Conflict Errors

**Duplicate Email**
```bash
# First request succeeds
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer 1",
    "email": "duplicate@example.com"
  }'

# Second request fails with conflict
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer 2",
    "email": "duplicate@example.com"
  }'
```

### Malformed Requests

**Invalid JSON**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", invalid json}'
```

**Wrong Content-Type**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: text/plain" \
  -d '{"name": "Test Customer"}'
```

## Error Testing Strategies

### Systematic Error Testing

1. **Field Validation Testing**
   - Test each required field individually
   - Test field length limits
   - Test invalid data types
   - Test invalid formats (email, phone, etc.)

2. **Resource Testing**
   - Test with non-existent IDs
   - Test with malformed UUIDs
   - Test with deleted resources

3. **Constraint Testing**
   - Test unique constraint violations
   - Test foreign key constraint violations
   - Test business rule violations

4. **Authentication Testing**
   - Test without authentication headers
   - Test with invalid tokens
   - Test with expired tokens
   - Test insufficient permissions

### Edge Case Testing

**Boundary Values**
- Empty strings
- Maximum length strings
- Null values
- Zero values
- Negative numbers

**Special Characters**
- Unicode characters
- SQL injection attempts
- XSS attempts
- Special symbols

**Large Datasets**
- Very long request bodies
- Large arrays
- Deep nested objects

## Troubleshooting Guide

### Common Issues and Solutions

**"Request validation failed"**
- Check required fields are present
- Verify data types match expected formats
- Ensure field lengths are within limits
- Validate enum values are correct

**"Resource not found"**
- Verify the resource ID exists
- Check the resource hasn't been deleted
- Ensure correct endpoint path
- Confirm proper UUID format

**"Email address already in use"**
- Use a different email address
- Check if updating existing resource
- Verify the email isn't already in database

**"Service temporarily unavailable"**
- Check if API server is running
- Verify database connectivity
- Check for maintenance windows
- Retry after specified delay

### Debugging Steps

1. **Check Request Format**
   - Verify JSON syntax
   - Confirm Content-Type header
   - Validate required fields

2. **Verify Endpoint**
   - Check HTTP method
   - Confirm URL path
   - Validate parameters

3. **Review Response**
   - Check HTTP status code
   - Read error message
   - Examine error details

4. **Test Isolation**
   - Try with minimal data
   - Test individual fields
   - Use known good data

### Getting Help

When reporting issues:
1. Include the full request (headers and body)
2. Include the complete error response
3. Specify the environment (development/testing)
4. Provide steps to reproduce
5. Include relevant logs if available

For more specific error scenarios, see the individual endpoint documentation in the [API Reference](../endpoints/README.md).