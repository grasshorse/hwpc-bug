# Tickets Endpoints Documentation

## Overview

The tickets endpoints provide comprehensive ticket management functionality for the Local Backend API system. These endpoints support full CRUD operations, advanced filtering, pagination, sorting, and statistical reporting for ticket management. All endpoints are prefixed with `/api/v1/tickets` and follow RESTful design principles.

## Base URL

```
http://localhost:3000/api/v1/tickets
```

## Authentication

Currently, the tickets endpoints do not require authentication. However, when authentication is implemented, protected endpoints will require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Data Model

### Ticket Schema

```javascript
{
  id: "uuid",                    // Auto-generated UUID
  customerId: "uuid",            // Required - Foreign key to customers table
  routeId: "uuid",              // Optional - Foreign key to routes table
  title: "string",              // Required - Max 255 characters
  description: "string",        // Optional - Max 1000 characters
  status: "enum",               // open|in_progress|completed|cancelled (default: open)
  priority: "enum",             // low|medium|high|urgent (default: medium)
  assignedTo: "string",         // Optional - Max 255 characters
  scheduledDate: "ISO datetime", // Optional - ISO 8601 format
  completedDate: "ISO datetime", // Optional - ISO 8601 format
  address: "string",            // Optional - Max 500 characters
  lat: "number",                // Optional - Latitude (-90 to 90)
  lng: "number",                // Optional - Longitude (-180 to 180)
  createdAt: "ISO datetime",    // Auto-generated
  updatedAt: "ISO datetime"     // Auto-updated
}
```

### Status Values
- `open` - Ticket is newly created and not yet assigned
- `in_progress` - Ticket is being worked on
- `completed` - Ticket has been completed successfully
- `cancelled` - Ticket has been cancelled

### Priority Values
- `low` - Low priority ticket
- `medium` - Medium priority ticket (default)
- `high` - High priority ticket
- `urgent` - Urgent priority ticket

## Endpoints

### 1. Get All Tickets

Retrieve all tickets with optional filtering, pagination, and sorting.

**Endpoint:** `GET /api/v1/tickets`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination (min: 1) |
| limit | integer | No | 50 | Number of items per page (min: 1, max: 100) |
| status | string | No | - | Filter by status: open, in_progress, completed, cancelled |
| priority | string | No | - | Filter by priority: low, medium, high, urgent |
| customerId | uuid | No | - | Filter by customer ID |
| routeId | uuid | No | - | Filter by route ID |
| assignedTo | string | No | - | Filter by assigned person |
| startDate | ISO datetime | No | - | Filter tickets scheduled from this date |
| endDate | ISO datetime | No | - | Filter tickets scheduled until this date |
| search | string | No | - | Search in title, description, and assignedTo fields (max: 255 chars) |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/tickets?page=1&limit=10&status=open&priority=high&search=urgent" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "customerId": "456e7890-e89b-12d3-a456-426614174001",
      "routeId": "789e0123-e89b-12d3-a456-426614174002",
      "title": "Urgent repair needed",
      "description": "Customer reports water leak in basement",
      "status": "open",
      "priority": "high",
      "assignedTo": "John Smith",
      "scheduledDate": "2025-01-09T10:00:00.000Z",
      "completedDate": null,
      "address": "123 Main St, Anytown, ST 12345",
      "lat": 40.7128,
      "lng": -74.0060,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123456",
    "method": "GET",
    "url": "/api/v1/tickets",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPage": 2,
      "previousPage": null
    }
  }
}
```

### 2. Get Single Ticket

Retrieve a specific ticket by ID with customer information.

**Endpoint:** `GET /api/v1/tickets/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Ticket ID |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "routeId": "789e0123-e89b-12d3-a456-426614174002",
    "title": "Urgent repair needed",
    "description": "Customer reports water leak in basement",
    "status": "open",
    "priority": "high",
    "assignedTo": "John Smith",
    "scheduledDate": "2025-01-09T10:00:00.000Z",
    "completedDate": null,
    "address": "123 Main St, Anytown, ST 12345",
    "lat": 40.7128,
    "lng": -74.0060,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T15:30:00.000Z",
    "customerName": "Jane Doe",
    "customerEmail": "jane.doe@example.com",
    "customerPhone": "+1-555-123-4567",
    "customerStreet": "123 Main St",
    "customerCity": "Anytown",
    "customerState": "ST",
    "customerZipCode": "12345"
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123457"
  }
}
```

### 3. Create New Ticket

Create a new ticket.

**Endpoint:** `POST /api/v1/tickets`

#### Request Body

```json
{
  "customerId": "456e7890-e89b-12d3-a456-426614174001",
  "routeId": "789e0123-e89b-12d3-a456-426614174002",
  "title": "Urgent repair needed",
  "description": "Customer reports water leak in basement",
  "status": "open",
  "priority": "high",
  "assignedTo": "John Smith",
  "scheduledDate": "2025-01-09T10:00:00.000Z",
  "address": "123 Main St, Anytown, ST 12345",
  "lat": 40.7128,
  "lng": -74.0060
}
```

#### Required Fields
- `customerId` (uuid) - Must reference an existing customer
- `title` (string, 1-255 chars) - Ticket title

#### Optional Fields
- `routeId` (uuid) - Must reference an existing route if provided
- `description` (string, max 1000 chars)
- `status` (enum) - Defaults to "open"
- `priority` (enum) - Defaults to "medium"
- `assignedTo` (string, max 255 chars)
- `scheduledDate` (ISO datetime)
- `completedDate` (ISO datetime)
- `address` (string, max 500 chars)
- `lat` (number, -90 to 90)
- `lng` (number, -180 to 180)

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Urgent repair needed",
    "description": "Customer reports water leak in basement",
    "priority": "high",
    "assignedTo": "John Smith",
    "scheduledDate": "2025-01-09T10:00:00.000Z"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "routeId": null,
    "title": "Urgent repair needed",
    "description": "Customer reports water leak in basement",
    "status": "open",
    "priority": "high",
    "assignedTo": "John Smith",
    "scheduledDate": "2025-01-09T10:00:00.000Z",
    "completedDate": null,
    "address": null,
    "lat": null,
    "lng": null,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T15:30:00.000Z",
    "customerName": "Jane Doe",
    "customerEmail": "jane.doe@example.com",
    "customerPhone": "+1-555-123-4567",
    "customerStreet": "123 Main St",
    "customerCity": "Anytown",
    "customerState": "ST",
    "customerZipCode": "12345"
  },
  "meta": {
    "timestamp": "2025-01-08T15:30:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123458"
  }
}
```

### 4. Update Ticket

Update an existing ticket.

**Endpoint:** `PUT /api/v1/tickets/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Ticket ID |

#### Request Body

All fields are optional for updates. Only include fields you want to change.

```json
{
  "title": "Updated ticket title",
  "status": "in_progress",
  "assignedTo": "Jane Smith",
  "completedDate": "2025-01-08T16:00:00.000Z"
}
```

#### Example Request

```bash
curl -X PUT "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assignedTo": "Jane Smith"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "routeId": null,
    "title": "Urgent repair needed",
    "description": "Customer reports water leak in basement",
    "status": "in_progress",
    "priority": "high",
    "assignedTo": "Jane Smith",
    "scheduledDate": "2025-01-09T10:00:00.000Z",
    "completedDate": null,
    "address": null,
    "lat": null,
    "lng": null,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T16:15:00.000Z",
    "customerName": "Jane Doe",
    "customerEmail": "jane.doe@example.com",
    "customerPhone": "+1-555-123-4567",
    "customerStreet": "123 Main St",
    "customerCity": "Anytown",
    "customerState": "ST",
    "customerZipCode": "12345"
  },
  "meta": {
    "timestamp": "2025-01-08T16:15:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123459"
  }
}
```

### 5. Delete Ticket

Delete a ticket by ID.

**Endpoint:** `DELETE /api/v1/tickets/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Ticket ID |

#### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Ticket deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-08T16:20:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123460"
  }
}
```

### 6. Get Tickets by Customer

Retrieve all tickets for a specific customer with pagination.

**Endpoint:** `GET /api/v1/tickets/customer/:customerId`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | uuid | Yes | Customer ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 50 | Number of items per page |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/tickets/customer/456e7890-e89b-12d3-a456-426614174001?page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "customerId": "456e7890-e89b-12d3-a456-426614174001",
      "title": "Urgent repair needed",
      "status": "open",
      "priority": "high",
      "createdAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123461",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null
    }
  }
}
```

### 7. Get Tickets by Status

Retrieve all tickets with a specific status.

**Endpoint:** `GET /api/v1/tickets/status/:status`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | Yes | Ticket status: open, in_progress, completed, cancelled |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 50 | Number of items per page |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/tickets/status/open?page=1&limit=5" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "customerId": "456e7890-e89b-12d3-a456-426614174001",
      "title": "Urgent repair needed",
      "status": "open",
      "priority": "high",
      "assignedTo": "John Smith",
      "createdAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123462",
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 12,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPage": 2,
      "previousPage": null
    }
  }
}
```

### 8. Get Ticket Statistics

Retrieve statistical information about tickets.

**Endpoint:** `GET /api/v1/tickets/stats`

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/tickets/stats" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "open": 45,
      "in_progress": 32,
      "completed": 68,
      "cancelled": 5
    },
    "byPriority": {
      "urgent": 8,
      "high": 25,
      "medium": 89,
      "low": 28
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123463"
  }
}
```

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Ticket or referenced resource not found |
| 409 | Conflict | Resource conflicts |
| 500 | Internal Server Error | Server-side errors |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "fieldName",
      "message": "Field-specific error message",
      "value": "invalid_value"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123464"
  }
}
```

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "customerId",
          "message": "customerId is required",
          "value": null
        },
        {
          "field": "title",
          "message": "title must be between 1 and 255 characters",
          "value": ""
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123465"
  }
}
```

### Not Found Error Example

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket not found",
    "details": {
      "resource": "Ticket",
      "id": "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123466"
  }
}
```

## Testing Scenarios

### Positive Test Cases

#### 1. Create Ticket with Minimum Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Basic ticket"
  }'
```

#### 2. Create Ticket with All Fields
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "routeId": "789e0123-e89b-12d3-a456-426614174002",
    "title": "Complete ticket",
    "description": "Detailed description",
    "status": "open",
    "priority": "high",
    "assignedTo": "John Smith",
    "scheduledDate": "2025-01-09T10:00:00.000Z",
    "address": "123 Main St",
    "lat": 40.7128,
    "lng": -74.0060
  }'
```

#### 3. Filter Tickets by Multiple Criteria
```bash
curl -X GET "http://localhost:3000/api/v1/tickets?status=open&priority=high&assignedTo=John%20Smith&startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z" \
  -H "Content-Type: application/json"
```

#### 4. Search Tickets
```bash
curl -X GET "http://localhost:3000/api/v1/tickets?search=water%20leak" \
  -H "Content-Type: application/json"
```

#### 5. Update Ticket Status
```bash
curl -X PUT "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completedDate": "2025-01-08T16:00:00.000Z"
  }'
```

### Negative Test Cases

#### 1. Create Ticket Without Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Missing required fields"
  }'
```
Expected: 400 Bad Request with validation errors

#### 2. Create Ticket with Invalid Customer ID
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "invalid-uuid",
    "title": "Test ticket"
  }'
```
Expected: 400 Bad Request with UUID validation error

#### 3. Create Ticket with Non-existent Customer
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "00000000-0000-0000-0000-000000000000",
    "title": "Test ticket"
  }'
```
Expected: 400 Bad Request with customer not found error

#### 4. Get Non-existent Ticket
```bash
curl -X GET "http://localhost:3000/api/v1/tickets/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

#### 5. Update Non-existent Ticket
```bash
curl -X PUT "http://localhost:3000/api/v1/tickets/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title"
  }'
```
Expected: 404 Not Found

#### 6. Invalid Status Value
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Test ticket",
    "status": "invalid_status"
  }'
```
Expected: 400 Bad Request with validation error

#### 7. Invalid Priority Value
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Test ticket",
    "priority": "invalid_priority"
  }'
```
Expected: 400 Bad Request with validation error

#### 8. Invalid Date Format
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Test ticket",
    "scheduledDate": "invalid-date"
  }'
```
Expected: 400 Bad Request with date validation error

#### 9. Invalid Pagination Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/tickets?page=0&limit=101" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with pagination validation errors

#### 10. Invalid Coordinates
```bash
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "title": "Test ticket",
    "lat": 91,
    "lng": 181
  }'
```
Expected: 400 Bad Request with coordinate validation errors

## Performance Considerations

### Pagination
- Default limit is 50 items per page
- Maximum limit is 100 items per page
- Use pagination for large datasets to improve response times

### Filtering
- Database indexes are recommended on frequently filtered fields:
  - `status`
  - `priority`
  - `customerId`
  - `routeId`
  - `assignedTo`
  - `scheduledDate`
  - `createdAt`

### Search Performance
- Text search is performed on `title`, `description`, and `assignedTo` fields
- Consider implementing full-text search for better performance with large datasets

### Response Times
- Expected response times:
  - Single ticket retrieval: < 100ms
  - Paginated list (50 items): < 200ms
  - Statistics endpoint: < 300ms
  - Create/Update operations: < 150ms