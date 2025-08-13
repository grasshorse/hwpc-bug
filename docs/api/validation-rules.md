# Validation Rules and Constraints Documentation

## Overview

This document provides comprehensive documentation for all input validation requirements, constraints, and error handling in the Local Backend API system. The API uses **Joi** validation library for input validation and implements multiple layers of validation including format validation, business logic validation, and database constraint validation.

## Validation Architecture

### Validation Layers

1. **Input Format Validation** - Joi schema validation (middleware)
2. **Business Logic Validation** - Application-level rules (controllers)
3. **Database Constraint Validation** - Foreign keys, unique constraints (database)
4. **Error Response Formatting** - Consistent error response structure

### Validation Flow

```
Request → Joi Validation → Business Logic → Database Constraints → Response
    ↓           ↓               ↓                ↓
  400 Bad    400 Bad        409 Conflict    500 Internal
  Request    Request                        Error
```

## Input Validation Requirements

### Ticket Endpoint Validation

#### POST /api/v1/tickets - Create Ticket

**Required Fields:**
- `customerId` (UUID)
- `title` (string, 1-255 characters)

**Optional Fields:**
- `routeId` (UUID or null)
- `description` (string, max 1000 characters)
- `status` (enum: open, in_progress, completed, cancelled)
- `priority` (enum: low, medium, high, urgent)
- `assignedTo` (string, max 255 characters)
- `scheduledDate` (ISO 8601 datetime)
- `completedDate` (ISO 8601 datetime)
- `address` (string, max 500 characters)
- `lat` (number, -90 to 90)
- `lng` (number, -180 to 180)

**Validation Examples:**

Valid Request:
```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Fix heating system",
  "description": "Customer reports heating system not working",
  "status": "open",
  "priority": "high",
  "scheduledDate": "2025-01-10T09:00:00.000Z"
}
```

Invalid Request:
```json
{
  "customerId": "invalid-uuid",
  "title": "",
  "status": "invalid_status",
  "lat": 100
}
```

**Expected Validation Errors:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "customerId",
        "message": "customerId must be a valid UUID",
        "value": "invalid-uuid"
      },
      {
        "field": "title",
        "message": "title is required",
        "value": ""
      },
      {
        "field": "status",
        "message": "status must be one of [open, in_progress, completed, cancelled]",
        "value": "invalid_status"
      },
      {
        "field": "lat",
        "message": "lat must be less than or equal to 90",
        "value": 100
      }
    ]
  }
}
```

#### PUT /api/v1/tickets/:id - Update Ticket

**Validation Rules:**
- All fields are optional for updates
- Same validation rules apply as create, but fields can be omitted
- `id` parameter must be valid UUID

**Update Mode Behavior:**
- Joi schema is modified to make all fields optional using `schema.fork()`
- Only provided fields are validated and updated
- Missing fields retain their current values

#### GET /api/v1/tickets - Query Parameters

**Query Parameter Validation:**
```javascript
{
  status: "open|in_progress|completed|cancelled",
  priority: "low|medium|high|urgent", 
  customerId: "valid UUID",
  routeId: "valid UUID",
  assignedTo: "string",
  startDate: "ISO 8601 date",
  endDate: "ISO 8601 date",
  search: "string (max 255 chars)",
  page: "integer ≥ 1 (default: 1)",
  limit: "integer 1-100 (default: 50)",
  sortBy: "string (default: 'createdAt')",
  sortOrder: "ASC|DESC|asc|desc (default: 'DESC')"
}
```

**Invalid Query Examples:**
```
GET /api/v1/tickets?status=invalid&page=0&limit=200
```

**Expected Validation Errors:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "status",
        "message": "status must be one of [open, in_progress, completed, cancelled]",
        "value": "invalid"
      },
      {
        "field": "page",
        "message": "page must be greater than or equal to 1",
        "value": 0
      },
      {
        "field": "limit",
        "message": "limit must be less than or equal to 100",
        "value": 200
      }
    ]
  }
}
```

### Customer Endpoint Validation

#### POST /api/v1/customers - Create Customer

**Required Fields:**
- `name` (string, 1-255 characters)

**Optional Fields:**
- `email` (valid email format)
- `phone` (string, max 20 characters)
- `street` (string, max 255 characters)
- `city` (string, max 100 characters)
- `state` (string, max 50 characters)
- `zipCode` (string, max 10 characters)
- `lat` (number, -90 to 90)
- `lng` (number, -180 to 180)
- `serviceType` (string, max 100 characters)
- `notes` (string, max 1000 characters)
- `isActive` (boolean or 0/1)

**Email Format Validation:**
```javascript
// Valid emails
"user@example.com"
"test.email+tag@domain.co.uk"
"user123@subdomain.example.org"

// Invalid emails
"invalid-email"
"@domain.com"
"user@"
"user space@domain.com"
```

**Boolean Field Handling:**
```javascript
// Accepted values for isActive
true, false          // Boolean values
1, 0                 // Numeric values (converted to boolean)
"true", "false"      // String values (not accepted - validation error)
```

**Geographic Coordinate Validation:**
```javascript
// Valid coordinates
{ "lat": 40.7128, "lng": -74.0060 }    // New York City
{ "lat": -33.8688, "lng": 151.2093 }   // Sydney
{ "lat": 0, "lng": 0 }                 // Null Island

// Invalid coordinates
{ "lat": 91, "lng": 0 }                // Latitude out of range
{ "lat": 0, "lng": 181 }               // Longitude out of range
{ "lat": "40.7128", "lng": -74.0060 }  // String instead of number
```

#### GET /api/v1/customers - Query Parameters

**Query Parameter Validation:**
```javascript
{
  search: "string (max 255 chars)",
  serviceType: "string",
  isActive: "boolean",
  city: "string",
  state: "string",
  page: "integer ≥ 1 (default: 1)",
  limit: "integer 1-100 (default: 50)",
  sortBy: "string (default: 'createdAt')",
  sortOrder: "ASC|DESC|asc|desc (default: 'DESC')"
}
```

### Route Endpoint Validation

#### POST /api/v1/routes - Create Route

**Required Fields:**
- `name` (string, 1-255 characters)

**Optional Fields:**
- `description` (string, max 1000 characters)
- `startLocation` (string, max 255 characters)
- `endLocation` (string, max 255 characters)
- `estimatedDuration` (integer ≥ 0, in minutes)
- `isActive` (boolean, default: true)

**Duration Validation:**
```javascript
// Valid durations
30        // 30 minutes
120       // 2 hours
0         // Immediate/no duration

// Invalid durations
-30       // Negative duration
30.5      // Decimal (must be integer)
"30"      // String (must be number)
```

### User Endpoint Validation

#### POST /api/v1/auth/user - Create/Update User

**Required Fields (Create):**
- `email` (valid email format, unique)
- `name` (string, 1-255 characters)
- `password` (string, minimum 8 characters)

**Optional Fields:**
- `roles` (array of strings, default: ["user"])
- `preferences` (object, default: {})
- `is_active` (boolean, default: true)

**Password Validation:**
```javascript
// Valid passwords
"password123"      // Minimum 8 characters
"MySecurePass!"    // Mixed case with special chars
"verylongpassword" // Long password

// Invalid passwords
"short"            // Less than 8 characters
""                 // Empty string
123456789          // Number instead of string
```

**Roles Validation:**
```javascript
// Valid roles
["user"]                    // Default role
["admin", "user"]          // Multiple roles
["manager", "technician"]  // Custom roles

// Invalid roles
"user"                     // String instead of array
[""]                       // Empty string in array
[123]                      // Number in array
```

## Format Validation Rules

### UUID Validation

**Valid UUID Formats:**
```
123e4567-e89b-12d3-a456-426614174000  // Version 4 UUID
550e8400-e29b-41d4-a716-446655440000  // Version 1 UUID
6ba7b810-9dad-11d1-80b4-00c04fd430c8  // Version 1 UUID
```

**Invalid UUID Formats:**
```
123e4567-e89b-12d3-a456-42661417400   // Too short
123e4567-e89b-12d3-a456-4266141740000 // Too long
123e4567e89b12d3a456426614174000      // Missing hyphens
not-a-uuid-at-all                     // Invalid format
```

### Email Validation

**Email Validation Rules:**
- Must contain exactly one @ symbol
- Local part (before @) can contain letters, numbers, periods, hyphens, plus signs
- Domain part (after @) must be valid domain format
- Maximum length typically 254 characters
- Case insensitive

**Valid Email Examples:**
```
user@example.com
test.email@domain.co.uk
user+tag@subdomain.example.org
123@numbers.com
user-name@example-domain.com
```

**Invalid Email Examples:**
```
plainaddress           // Missing @ symbol
@missinglocal.com     // Missing local part
missing@.com          // Missing domain
user@                 // Missing domain
user space@domain.com // Space in local part
user@domain           // Missing TLD
```

### Date/Time Validation

**ISO 8601 Format Requirements:**
- Must be valid ISO 8601 datetime string
- Timezone information recommended
- Milliseconds optional

**Valid DateTime Examples:**
```
2025-01-08T10:30:00.000Z     // UTC with milliseconds
2025-01-08T10:30:00Z         // UTC without milliseconds
2025-01-08T10:30:00-05:00    // With timezone offset
2025-01-08T10:30:00.123Z     // With milliseconds
```

**Invalid DateTime Examples:**
```
2025-01-08                   // Date only
10:30:00                     // Time only
2025/01/08 10:30:00         // Wrong format
2025-13-08T10:30:00Z        // Invalid month
2025-01-32T10:30:00Z        // Invalid day
2025-01-08T25:30:00Z        // Invalid hour
not-a-date                   // Invalid format
```

### String Length Validation

**Field Length Limits:**

| Field Type | Maximum Length | Examples |
|------------|----------------|----------|
| Name fields | 255 characters | Customer name, route name, user name |
| Email | 254 characters | Standard email length limit |
| Phone | 20 characters | International phone numbers |
| Title | 255 characters | Ticket titles |
| Description | 1000 characters | Detailed descriptions |
| Address | 500 characters | Full addresses |
| Notes | 1000 characters | Additional notes |
| City | 100 characters | City names |
| State | 50 characters | State/province names |
| ZIP Code | 10 characters | Postal codes |
| Service Type | 100 characters | Service categories |
| Assigned To | 255 characters | Person names/identifiers |

## Unique Constraints and Business Logic Validation

### Email Uniqueness Validation

**Customer Email Uniqueness:**
- Email must be unique across all customers
- Case-insensitive comparison
- NULL emails are allowed (multiple customers can have NULL email)
- Validation occurs before database insert/update

**Validation Process:**
1. Check if email is provided and not empty
2. Call `Customer.isEmailTaken(email, excludeId)` method
3. If email exists, return 409 Conflict error
4. If unique, proceed with operation

**Error Response for Duplicate Email:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Email address already exists",
    "details": {
      "field": "email",
      "value": "duplicate@example.com",
      "constraint": "UNIQUE"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**User Email Uniqueness:**
- Email must be unique across all users
- Required field (cannot be NULL)
- Same validation process as customers

### Foreign Key Constraint Validation

#### Customer-Ticket Relationship

**Validation Rules:**
- `tickets.customerId` must reference existing `customers.id`
- Customer cannot be deleted if tickets exist (CASCADE DELETE configured)
- Validation occurs at database level

**Error Response for Invalid Customer ID:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Referenced customer does not exist",
    "details": {
      "field": "customerId",
      "value": "non-existent-uuid",
      "constraint": "FOREIGN_KEY",
      "referencedTable": "customers"
    }
  }
}
```

#### Route-Ticket Relationship

**Validation Rules:**
- `tickets.routeId` can be NULL or must reference existing `routes.id`
- Route deletion sets `tickets.routeId` to NULL (SET NULL configured)
- Validation occurs at database level

### Status Transition Validation

**Valid Ticket Status Transitions:**

```
open → in_progress
open → cancelled
in_progress → completed
in_progress → cancelled
completed → open (reopening)
cancelled → open (reopening)
```

**Business Logic Validation:**
- When status changes to `completed`, `completedDate` should be set
- When status changes from `completed`, `completedDate` should be cleared
- `scheduledDate` cannot be in the past for new tickets (configurable)

**Implementation Example:**
```javascript
// In ticket update controller
if (status === 'completed' && !completedDate) {
  updateData.completedDate = new Date().toISOString();
}

if (status !== 'completed' && completedDate) {
  updateData.completedDate = null;
}
```

### Geographic Coordinate Validation

**Coordinate Pair Validation:**
- If latitude is provided, longitude should also be provided
- If longitude is provided, latitude should also be provided
- Both can be NULL together

**Validation Logic:**
```javascript
if ((lat !== null && lng === null) || (lat === null && lng !== null)) {
  return validationError("Both latitude and longitude must be provided together");
}
```

## Validation Error Examples

### Field-Specific Error Messages

#### String Length Errors

```json
{
  "field": "title",
  "message": "title length must be at least 1 characters long",
  "value": ""
}
```

```json
{
  "field": "description",
  "message": "description length must be less than or equal to 1000 characters long",
  "value": "very long description..."
}
```

#### Enum Value Errors

```json
{
  "field": "status",
  "message": "status must be one of [open, in_progress, completed, cancelled]",
  "value": "invalid_status"
}
```

```json
{
  "field": "priority",
  "message": "priority must be one of [low, medium, high, urgent]",
  "value": "super_urgent"
}
```

#### Numeric Range Errors

```json
{
  "field": "lat",
  "message": "lat must be less than or equal to 90",
  "value": 100
}
```

```json
{
  "field": "estimatedDuration",
  "message": "estimatedDuration must be greater than or equal to 0",
  "value": -30
}
```

#### Type Validation Errors

```json
{
  "field": "isActive",
  "message": "isActive must be a boolean",
  "value": "yes"
}
```

```json
{
  "field": "scheduledDate",
  "message": "scheduledDate must be a valid ISO 8601 date",
  "value": "2025/01/08"
}
```

### Multiple Field Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "customerId",
        "message": "customerId is required",
        "value": null
      },
      {
        "field": "title",
        "message": "title is required",
        "value": ""
      },
      {
        "field": "email",
        "message": "email must be a valid email",
        "value": "invalid-email"
      },
      {
        "field": "lat",
        "message": "lat must be between -90 and 90",
        "value": 100
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

## Database Constraint Error Handling

### SQLite Constraint Errors

**Unique Constraint Violation:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Database constraint violation",
    "details": {
      "constraint": "UNIQUE constraint failed: customers.email",
      "field": "email",
      "value": "duplicate@example.com"
    }
  }
}
```

**Foreign Key Constraint Violation:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR", 
    "message": "Database constraint violation",
    "details": {
      "constraint": "FOREIGN KEY constraint failed",
      "field": "customerId",
      "value": "non-existent-uuid"
    }
  }
}
```

**Not Null Constraint Violation:**
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Database constraint violation", 
    "details": {
      "constraint": "NOT NULL constraint failed: customers.name",
      "field": "name",
      "value": null
    }
  }
}
```

## Testing Validation Rules

### Positive Test Cases

#### Valid Ticket Creation
```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Fix heating system",
    "description": "Customer reports heating not working",
    "status": "open",
    "priority": "high",
    "scheduledDate": "2025-01-10T09:00:00.000Z"
  }'
```

#### Valid Customer Creation
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1-555-123-4567",
    "city": "Springfield",
    "state": "IL",
    "isActive": true
  }'
```

### Negative Test Cases

#### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Missing required customerId and title"
  }'
```

**Expected Response:** HTTP 400 with validation errors for `customerId` and `title`

#### Invalid Field Values
```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "invalid-uuid",
    "title": "",
    "status": "invalid_status",
    "priority": "super_urgent",
    "lat": 100,
    "lng": -200
  }'
```

**Expected Response:** HTTP 400 with multiple validation errors

#### Duplicate Email Constraint
```bash
# First request - should succeed
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com"
  }'

# Second request - should fail with constraint error
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith", 
    "email": "john@example.com"
  }'
```

**Expected Response:** HTTP 409 with constraint error

#### Foreign Key Constraint
```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "00000000-0000-0000-0000-000000000000",
    "title": "Test ticket with non-existent customer"
  }'
```

**Expected Response:** HTTP 400 with foreign key constraint error

### Edge Case Testing

#### Boundary Values
```bash
# Test maximum string lengths
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$(printf 'A%.0s' {1..255})'",
    "description": "'$(printf 'B%.0s' {1..1000})'"
  }'

# Test coordinate boundaries
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boundary Test",
    "lat": 90,
    "lng": -180
  }'
```

#### Unicode and Special Characters
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "José María García-López",
    "email": "josé@example.com",
    "street": "123 Main St, Apt #4B"
  }'
```

#### Empty vs Null Values
```bash
# Test empty string vs null
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "",
    "phone": null
  }'
```

## Performance Considerations

### Validation Performance

**Optimization Strategies:**
- Joi schemas are compiled once and reused
- Early validation prevents unnecessary database operations
- Indexed fields for unique constraint checks
- Minimal database queries for constraint validation

**Validation Timing:**
- Input validation: ~1-5ms per request
- Unique constraint checks: ~5-10ms per check
- Foreign key validation: Handled by database indexes

### Caching Validation Results

**Unique Constraint Caching:**
- Consider caching email existence checks for frequently accessed data
- Cache invalidation on create/update/delete operations
- Balance between performance and data consistency

### Batch Validation

**Bulk Operations:**
- Validate all items before processing any
- Fail fast on first validation error
- Provide detailed error information for each item

## Security Considerations

### Input Sanitization

**SQL Injection Prevention:**
- All database queries use parameterized statements
- Joi validation strips unknown fields
- No dynamic SQL construction from user input

**XSS Prevention:**
- HTML encoding of output (handled by frontend)
- Validation of input formats
- Rejection of script tags and dangerous content

### Data Validation Security

**UUID Validation:**
- Prevents path traversal attacks
- Ensures proper resource access control
- Validates format before database queries

**Email Validation:**
- Prevents header injection in email systems
- Validates format to prevent malformed addresses
- Length limits prevent buffer overflow attacks

**File Path Validation:**
- No file path inputs in current API
- If added, validate against directory traversal
- Whitelist allowed characters and patterns