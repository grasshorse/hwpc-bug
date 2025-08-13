# Data Models and Validation Documentation

## Overview

This document provides comprehensive documentation for all data models used in the Local Backend API system, including entity schemas, relationships, validation rules, and constraints. The API uses SQLite as the database with foreign key constraints enabled and follows RESTful design principles.

## Database Configuration

- **Database Engine:** SQLite 3
- **Foreign Key Constraints:** Enabled (`PRAGMA foreign_keys = ON`)
- **Journal Mode:** WAL (Write-Ahead Logging) for better performance
- **Primary Key Type:** UUID (Text)
- **Timestamp Format:** ISO 8601 datetime strings

## Entity Schemas and Relationships

### 1. Ticket Model

The Ticket entity represents service tickets in the system and serves as the central entity connecting customers and routes.

#### Schema Definition

```sql
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  routeId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assignedTo TEXT,
  scheduledDate DATETIME,
  completedDate DATETIME,
  address TEXT,
  lat REAL,
  lng REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE SET NULL
);
```

#### Field Specifications

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT (UUID) | Yes | Generated | Unique identifier for the ticket |
| `customerId` | TEXT (UUID) | Yes | - | Foreign key reference to customers table |
| `routeId` | TEXT (UUID) | No | NULL | Foreign key reference to routes table |
| `title` | TEXT | Yes | - | Brief title/summary of the ticket (1-255 chars) |
| `description` | TEXT | No | NULL | Detailed description (max 1000 chars) |
| `status` | TEXT | No | 'open' | Current status: 'open', 'in_progress', 'completed', 'cancelled' |
| `priority` | TEXT | No | 'medium' | Priority level: 'low', 'medium', 'high', 'urgent' |
| `assignedTo` | TEXT | No | NULL | Name/identifier of assigned person (max 255 chars) |
| `scheduledDate` | DATETIME | No | NULL | ISO 8601 datetime when ticket is scheduled |
| `completedDate` | DATETIME | No | NULL | ISO 8601 datetime when ticket was completed |
| `address` | TEXT | No | NULL | Service address (max 500 chars) |
| `lat` | REAL | No | NULL | Latitude coordinate (-90 to 90) |
| `lng` | REAL | No | NULL | Longitude coordinate (-180 to 180) |
| `createdAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record last update timestamp |

#### Relationships

- **Many-to-One with Customer:** Each ticket belongs to exactly one customer (required)
- **Many-to-One with Route:** Each ticket can optionally be assigned to a route
- **Foreign Key Constraints:**
  - `customerId` → `customers.id` (CASCADE DELETE)
  - `routeId` → `routes.id` (SET NULL on DELETE)

#### Indexes

```sql
CREATE INDEX idx_tickets_customer ON tickets(customerId);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_scheduled ON tickets(scheduledDate);
CREATE INDEX idx_tickets_route ON tickets(routeId);
CREATE INDEX idx_tickets_created ON tickets(createdAt);
```

### 2. Customer Model

The Customer entity represents service customers and their contact information.

#### Schema Definition

```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zipCode TEXT,
  lat REAL,
  lng REAL,
  serviceType TEXT,
  notes TEXT,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Field Specifications

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT (UUID) | Yes | Generated | Unique identifier for the customer |
| `name` | TEXT | Yes | - | Customer full name (1-255 chars) |
| `email` | TEXT | No | NULL | Email address (unique, valid email format) |
| `phone` | TEXT | No | NULL | Phone number (max 20 chars) |
| `street` | TEXT | No | NULL | Street address (max 255 chars) |
| `city` | TEXT | No | NULL | City name (max 100 chars) |
| `state` | TEXT | No | NULL | State/province (max 50 chars) |
| `zipCode` | TEXT | No | NULL | Postal/ZIP code (max 10 chars) |
| `lat` | REAL | No | NULL | Latitude coordinate (-90 to 90) |
| `lng` | REAL | No | NULL | Longitude coordinate (-180 to 180) |
| `serviceType` | TEXT | No | NULL | Type of service provided (max 100 chars) |
| `notes` | TEXT | No | NULL | Additional notes (max 1000 chars) |
| `isActive` | BOOLEAN | No | 1 | Whether customer is active (1=active, 0=inactive) |
| `createdAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record last update timestamp |

#### Relationships

- **One-to-Many with Tickets:** Each customer can have multiple tickets
- **Cascade Behavior:** When a customer is deleted, all associated tickets are deleted (CASCADE)

#### Unique Constraints

- `email` field must be unique across all customers (when not NULL)

#### Indexes

```sql
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_active ON customers(isActive);
```

### 3. Route Model

The Route entity represents service routes that can be assigned to tickets.

#### Schema Definition

```sql
CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  startLocation TEXT,
  endLocation TEXT,
  estimatedDuration INTEGER,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Field Specifications

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT (UUID) | Yes | Generated | Unique identifier for the route |
| `name` | TEXT | Yes | - | Route name/identifier (1-255 chars) |
| `description` | TEXT | No | NULL | Route description (max 1000 chars) |
| `startLocation` | TEXT | No | NULL | Starting location (max 255 chars) |
| `endLocation` | TEXT | No | NULL | Ending location (max 255 chars) |
| `estimatedDuration` | INTEGER | No | NULL | Estimated duration in minutes (≥ 0) |
| `isActive` | BOOLEAN | No | 1 | Whether route is active (1=active, 0=inactive) |
| `createdAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | DATETIME | Yes | CURRENT_TIMESTAMP | Record last update timestamp |

#### Relationships

- **One-to-Many with Tickets:** Each route can be assigned to multiple tickets
- **Cascade Behavior:** When a route is deleted, associated tickets have their `routeId` set to NULL (SET NULL)

#### Indexes

```sql
CREATE INDEX idx_routes_name ON routes(name);
CREATE INDEX idx_routes_active ON routes(isActive);
```

### 4. User Model

The User entity represents system users for authentication and authorization.

#### Schema Definition

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  roles TEXT DEFAULT '["user"]',
  preferences TEXT DEFAULT '{}',
  is_active BOOLEAN DEFAULT 1,
  last_login_at TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

#### Field Specifications

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT (UUID) | Yes | Generated | Unique identifier for the user |
| `email` | TEXT | Yes | - | Email address (unique, valid email format) |
| `name` | TEXT | Yes | - | User full name |
| `password_hash` | TEXT | Yes | - | Hashed password (never returned in API responses) |
| `roles` | TEXT (JSON) | No | '["user"]' | JSON array of user roles |
| `preferences` | TEXT (JSON) | No | '{}' | JSON object of user preferences |
| `is_active` | BOOLEAN | No | 1 | Whether user account is active |
| `last_login_at` | TEXT | No | NULL | ISO 8601 timestamp of last login |
| `createdAt` | TEXT | Yes | Generated | Record creation timestamp |
| `updatedAt` | TEXT | Yes | Generated | Record last update timestamp |

#### Relationships

- **No direct foreign key relationships** with other entities
- Users may be referenced by name in `tickets.assignedTo` field (soft reference)

#### Unique Constraints

- `email` field must be unique across all users

#### JSON Field Handling

- `roles`: Stored as JSON string, parsed to array in application
- `preferences`: Stored as JSON string, parsed to object in application

#### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_roles ON users(roles);
```

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Customer  │       │   Ticket    │       │    Route    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄─────┤│ id (PK)     │├────►│ id (PK)     │
│ name        │  1:N  ││ customerId  ││ N:1  │ name        │
│ email       │       ││ routeId     ││      │ description │
│ phone       │       ││ title       ││      │ startLoc    │
│ address...  │       ││ description ││      │ endLoc      │
│ isActive    │       ││ status      ││      │ duration    │
│ ...         │       ││ priority    ││      │ isActive    │
└─────────────┘       ││ assignedTo  ││      │ ...         │
                      ││ ...         ││      └─────────────┘
                      │└─────────────┘│
                      │               │
                      │ ┌─────────────┐│
                      │ │    User     ││
                      │ ├─────────────┤│
                      │ │ id (PK)     ││
                      │ │ email       ││
                      │ │ name        ││ (soft reference)
                      │ │ roles       ││
                      │ │ is_active   ││
                      │ │ ...         ││
                      │ └─────────────┘│
                      └─────────────────┘
```

## Validation Rules and Constraints

### Input Validation Framework

The API uses **Joi** validation library for comprehensive input validation. All validation rules are defined in `/backend/src/middleware/validation.js`.

### Ticket Validation Rules

#### Create/Update Validation Schema

```javascript
const ticketSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  routeId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').default('open'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  assignedTo: Joi.string().max(255).optional().allow(''),
  scheduledDate: Joi.date().iso().optional().allow(null),
  completedDate: Joi.date().iso().optional().allow(null),
  address: Joi.string().max(500).optional().allow(''),
  lat: Joi.number().min(-90).max(90).optional().allow(null),
  lng: Joi.number().min(-180).max(180).optional().allow(null)
});
```

#### Field-Specific Validation Rules

| Field | Validation Rules | Error Messages |
|-------|------------------|----------------|
| `customerId` | Required UUID format | "customerId is required", "customerId must be a valid UUID" |
| `routeId` | Optional UUID format or null | "routeId must be a valid UUID" |
| `title` | Required, 1-255 characters | "title is required", "title must be between 1 and 255 characters" |
| `description` | Optional, max 1000 characters | "description must be less than 1000 characters" |
| `status` | Must be one of: open, in_progress, completed, cancelled | "status must be one of [open, in_progress, completed, cancelled]" |
| `priority` | Must be one of: low, medium, high, urgent | "priority must be one of [low, medium, high, urgent]" |
| `assignedTo` | Optional, max 255 characters | "assignedTo must be less than 255 characters" |
| `scheduledDate` | Optional ISO 8601 date | "scheduledDate must be a valid ISO date" |
| `completedDate` | Optional ISO 8601 date | "completedDate must be a valid ISO date" |
| `address` | Optional, max 500 characters | "address must be less than 500 characters" |
| `lat` | Optional number between -90 and 90 | "lat must be between -90 and 90" |
| `lng` | Optional number between -180 and 180 | "lng must be between -180 and 180" |

#### Query Parameter Validation

```javascript
const ticketQuerySchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  customerId: Joi.string().uuid().optional(),
  routeId: Joi.string().uuid().optional(),
  assignedTo: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().max(255).optional(),
  // Pagination parameters
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});
```

### Customer Validation Rules

#### Create/Update Validation Schema

```javascript
const customerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  street: Joi.string().max(255).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  state: Joi.string().max(50).optional().allow(''),
  zipCode: Joi.string().max(10).optional().allow(''),
  lat: Joi.number().min(-90).max(90).optional().allow(null),
  lng: Joi.number().min(-180).max(180).optional().allow(null),
  serviceType: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
  isActive: Joi.alternatives().try(
    Joi.boolean(),
    Joi.number().valid(0, 1).custom((value) => Boolean(value))
  ).default(true)
});
```

#### Field-Specific Validation Rules

| Field | Validation Rules | Error Messages |
|-------|------------------|----------------|
| `name` | Required, 1-255 characters | "name is required", "name must be between 1 and 255 characters" |
| `email` | Optional valid email format | "email must be a valid email" |
| `phone` | Optional, max 20 characters | "phone must be less than 20 characters" |
| `street` | Optional, max 255 characters | "street must be less than 255 characters" |
| `city` | Optional, max 100 characters | "city must be less than 100 characters" |
| `state` | Optional, max 50 characters | "state must be less than 50 characters" |
| `zipCode` | Optional, max 10 characters | "zipCode must be less than 10 characters" |
| `lat` | Optional number between -90 and 90 | "lat must be between -90 and 90" |
| `lng` | Optional number between -180 and 180 | "lng must be between -180 and 180" |
| `serviceType` | Optional, max 100 characters | "serviceType must be less than 100 characters" |
| `notes` | Optional, max 1000 characters | "notes must be less than 1000 characters" |
| `isActive` | Boolean or 0/1 number | "isActive must be a boolean" |

#### Unique Constraints

- **Email Uniqueness:** The `email` field must be unique across all customers
- **Validation Method:** `Customer.isEmailTaken(email, excludeId)` checks for duplicates
- **Error Response:** HTTP 409 Conflict with error code `CONSTRAINT_ERROR`

### Route Validation Rules

#### Create/Update Validation Schema

```javascript
const routeSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  startLocation: Joi.string().max(255).optional().allow(''),
  endLocation: Joi.string().max(255).optional().allow(''),
  estimatedDuration: Joi.number().integer().min(0).optional().allow(null),
  isActive: Joi.boolean().default(true)
});
```

#### Field-Specific Validation Rules

| Field | Validation Rules | Error Messages |
|-------|------------------|----------------|
| `name` | Required, 1-255 characters | "name is required", "name must be between 1 and 255 characters" |
| `description` | Optional, max 1000 characters | "description must be less than 1000 characters" |
| `startLocation` | Optional, max 255 characters | "startLocation must be less than 255 characters" |
| `endLocation` | Optional, max 255 characters | "endLocation must be less than 255 characters" |
| `estimatedDuration` | Optional integer ≥ 0 | "estimatedDuration must be a positive integer" |
| `isActive` | Boolean | "isActive must be a boolean" |

### User Validation Rules

#### Create/Update Validation Schema

```javascript
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(255).required(),
  password: Joi.string().min(8).required(), // Only for creation
  roles: Joi.array().items(Joi.string()).default(['user']),
  preferences: Joi.object().default({}),
  is_active: Joi.boolean().default(true)
});
```

#### Field-Specific Validation Rules

| Field | Validation Rules | Error Messages |
|-------|------------------|----------------|
| `email` | Required valid email format | "email is required", "email must be a valid email" |
| `name` | Required, 1-255 characters | "name is required", "name must be between 1 and 255 characters" |
| `password` | Required, minimum 8 characters | "password is required", "password must be at least 8 characters" |
| `roles` | Array of strings | "roles must be an array of strings" |
| `preferences` | Valid JSON object | "preferences must be a valid object" |
| `is_active` | Boolean | "is_active must be a boolean" |

#### Unique Constraints

- **Email Uniqueness:** The `email` field must be unique across all users
- **Validation Method:** `User.isEmailTaken(email, excludeId)` checks for duplicates
- **Error Response:** HTTP 409 Conflict with error code `CONSTRAINT_ERROR`

## Business Logic Validation

### Status Transition Rules

#### Ticket Status Transitions

Valid status transitions for tickets:

```
open → in_progress → completed
  ↓         ↓           ↑
cancelled ← cancelled   ↑
  ↓                     ↑
  └─────────────────────┘
```

- **open** → **in_progress**, **cancelled**
- **in_progress** → **completed**, **cancelled**
- **completed** → **open** (reopening)
- **cancelled** → **open** (reopening)

#### Validation Logic

- When status changes to **completed**, `completedDate` should be set automatically
- When status changes from **completed** to another status, `completedDate` should be cleared
- **scheduledDate** cannot be in the past for new tickets (business rule)

### Foreign Key Validation

#### Customer-Ticket Relationship

- **Constraint:** `tickets.customerId` must reference an existing `customers.id`
- **Validation:** Performed at database level with foreign key constraint
- **Error Response:** HTTP 400 Bad Request with error code `CONSTRAINT_ERROR`

#### Route-Ticket Relationship

- **Constraint:** `tickets.routeId` must reference an existing `routes.id` or be NULL
- **Validation:** Performed at database level with foreign key constraint
- **Cascade Behavior:** When route is deleted, `tickets.routeId` is set to NULL

### Data Integrity Rules

#### Geographic Coordinates

- **Latitude:** Must be between -90 and 90 degrees
- **Longitude:** Must be between -180 and 180 degrees
- **Validation:** Both coordinates must be provided together or both be NULL

#### Date Validation

- **ISO 8601 Format:** All dates must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Logical Validation:** `completedDate` should not be before `scheduledDate`
- **Future Dates:** `scheduledDate` can be in the future, `completedDate` typically in the past

## Validation Error Response Format

### Standard Error Response

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
          "message": "email must be a valid email",
          "value": "invalid-email"
        },
        {
          "field": "title",
          "message": "title is required",
          "value": null
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

### Constraint Violation Response

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
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

### Foreign Key Violation Response

```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Foreign key constraint violation",
    "details": {
      "constraint": "FOREIGN KEY constraint failed",
      "field": "customerId",
      "value": "non-existent-uuid",
      "referencedTable": "customers"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

## Testing Data Models and Validation

### Positive Test Cases

#### Valid Ticket Creation

```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "routeId": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Fix heating system",
  "description": "Customer reports heating system not working properly",
  "status": "open",
  "priority": "high",
  "assignedTo": "John Smith",
  "scheduledDate": "2025-01-10T09:00:00.000Z",
  "address": "123 Main St, Anytown, ST 12345",
  "lat": 40.7128,
  "lng": -74.0060
}
```

#### Valid Customer Creation

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-123-4567",
  "street": "456 Oak Avenue",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "serviceType": "HVAC Maintenance",
  "isActive": true
}
```

### Negative Test Cases

#### Invalid Ticket Data

```json
{
  "customerId": "invalid-uuid",
  "title": "",
  "status": "invalid_status",
  "priority": "super_urgent",
  "lat": 100,
  "lng": -200,
  "scheduledDate": "not-a-date"
}
```

**Expected Validation Errors:**
- `customerId`: "customerId must be a valid UUID"
- `title`: "title is required"
- `status`: "status must be one of [open, in_progress, completed, cancelled]"
- `priority`: "priority must be one of [low, medium, high, urgent]"
- `lat`: "lat must be between -90 and 90"
- `lng`: "lng must be between -180 and 180"
- `scheduledDate`: "scheduledDate must be a valid ISO date"

#### Duplicate Email Constraint

```json
{
  "name": "John Smith",
  "email": "existing@example.com"
}
```

**Expected Response:** HTTP 409 Conflict with `CONSTRAINT_ERROR`

### Edge Cases

#### Boundary Value Testing

- **String Length Limits:** Test with strings at exactly the maximum length
- **Coordinate Boundaries:** Test with lat/lng at exactly -90/90 and -180/180
- **Date Boundaries:** Test with dates at the edge of valid ranges
- **Null vs Empty String:** Test difference between null and empty string handling

#### Unicode and Special Characters

- **Unicode Support:** Test with international characters in names and addresses
- **Special Characters:** Test with quotes, apostrophes, and other special characters
- **SQL Injection Prevention:** Test with SQL injection attempts (should be prevented by parameterized queries)

## Performance Considerations

### Index Usage

All frequently queried fields have appropriate indexes to ensure optimal query performance:

- **Ticket Queries:** Indexed on customerId, status, priority, scheduledDate, routeId
- **Customer Queries:** Indexed on email, name, isActive
- **Route Queries:** Indexed on name, isActive
- **User Queries:** Indexed on email, name, is_active, roles

### Query Optimization

- **Pagination:** All list endpoints support pagination to limit result set size
- **Selective Fields:** Consider implementing field selection to reduce data transfer
- **Batch Operations:** For bulk operations, consider implementing batch endpoints

### Validation Performance

- **Early Validation:** Input validation occurs before database operations
- **Cached Validation:** Joi schemas are compiled once and reused
- **Minimal Database Hits:** Unique constraint checks are optimized with indexes