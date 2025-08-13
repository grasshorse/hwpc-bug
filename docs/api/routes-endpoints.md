# Routes Endpoints Documentation

## Overview

The routes endpoints provide comprehensive route management functionality for the Local Backend API system. These endpoints support full CRUD operations, advanced search capabilities, filtering, pagination, sorting, and statistical reporting for route management. Routes represent service paths or areas that can be assigned to tickets for efficient service delivery. All endpoints are prefixed with `/api/v1/routes` and follow RESTful design principles.

## Base URL

```
http://localhost:3000/api/v1/routes
```

## Authentication

Currently, the routes endpoints do not require authentication. However, when authentication is implemented, protected endpoints will require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Data Model

### Route Schema

```javascript
{
  id: "uuid",                    // Auto-generated UUID
  name: "string",               // Required - Max 255 characters
  description: "string",        // Optional - Max 1000 characters
  startLocation: "string",      // Optional - Max 255 characters
  endLocation: "string",        // Optional - Max 255 characters
  estimatedDuration: "integer", // Optional - Duration in minutes (min: 0)
  isActive: "boolean",          // Default: true
  createdAt: "ISO datetime",    // Auto-generated
  updatedAt: "ISO datetime"     // Auto-updated
}
```

### Field Descriptions

- **id**: Unique identifier for the route (UUID v4 format)
- **name**: Route name or identifier (required field)
- **description**: Detailed description of the route or service area
- **startLocation**: Starting point or location of the route
- **endLocation**: Ending point or destination of the route
- **estimatedDuration**: Estimated time to complete the route in minutes
- **isActive**: Whether the route is active and available for assignment (soft delete functionality)

## Endpoints

### 1. Get All Routes

Retrieve all routes with optional filtering, pagination, and sorting.

**Endpoint:** `GET /api/v1/routes`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination (min: 1) |
| limit | integer | No | 50 | Number of items per page (min: 1, max: 100) |
| search | string | No | - | Search in name, description, startLocation, or endLocation fields (max: 255 chars) |
| isActive | boolean | No | - | Filter by active status (true/false) |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes?page=1&limit=10&search=downtown&isActive=true" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174003",
      "name": "Downtown Service Route",
      "description": "Main downtown area service route covering business district",
      "startLocation": "Central Station",
      "endLocation": "Business District",
      "estimatedDuration": 120,
      "isActive": true,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123456",
    "method": "GET",
    "url": "/api/v1/routes",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPage": 2,
      "previousPage": null
    }
  }
}
```

### 2. Get Single Route

Retrieve a specific route by ID.

**Endpoint:** `GET /api/v1/routes/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Route ID |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174003",
    "name": "Downtown Service Route",
    "description": "Main downtown area service route covering business district",
    "startLocation": "Central Station",
    "endLocation": "Business District",
    "estimatedDuration": 120,
    "isActive": true,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T15:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123457"
  }
}
```

### 3. Create New Route

Create a new route.

**Endpoint:** `POST /api/v1/routes`

#### Request Body

```json
{
  "name": "Downtown Service Route",
  "description": "Main downtown area service route covering business district",
  "startLocation": "Central Station",
  "endLocation": "Business District",
  "estimatedDuration": 120,
  "isActive": true
}
```

#### Required Fields
- `name` (string, 1-255 chars) - Route name or identifier

#### Optional Fields
- `description` (string, max 1000 chars) - Route description
- `startLocation` (string, max 255 chars) - Starting location
- `endLocation` (string, max 255 chars) - Ending location
- `estimatedDuration` (integer, min 0) - Duration in minutes
- `isActive` (boolean) - Active status (defaults to true)

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Service Route",
    "description": "Main downtown area service route",
    "startLocation": "Central Station",
    "endLocation": "Business District",
    "estimatedDuration": 120
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174003",
    "name": "Downtown Service Route",
    "description": "Main downtown area service route",
    "startLocation": "Central Station",
    "endLocation": "Business District",
    "estimatedDuration": 120,
    "isActive": true,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T15:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-08T15:30:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123458"
  }
}
```

### 4. Update Route

Update an existing route.

**Endpoint:** `PUT /api/v1/routes/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Route ID |

#### Request Body

All fields are optional for updates. Only include fields you want to change.

```json
{
  "name": "Updated Downtown Route",
  "description": "Updated description for downtown service route",
  "estimatedDuration": 150
}
```

#### Example Request

```bash
curl -X PUT "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Downtown Route",
    "estimatedDuration": 150
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174003",
    "name": "Updated Downtown Route",
    "description": "Main downtown area service route covering business district",
    "startLocation": "Central Station",
    "endLocation": "Business District",
    "estimatedDuration": 150,
    "isActive": true,
    "createdAt": "2025-01-08T15:30:00.000Z",
    "updatedAt": "2025-01-08T16:15:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-08T16:15:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123459"
  }
}
```

### 5. Delete Route

Delete a route by ID. Note: Routes with associated tickets cannot be deleted.

**Endpoint:** `DELETE /api/v1/routes/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Route ID |

#### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174003",
    "message": "Route deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-08T16:20:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123460"
  }
}
```

### 6. Search Routes

Search routes by name, description, start location, or end location.

**Endpoint:** `GET /api/v1/routes/search`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search term (searches name, description, startLocation, endLocation) |
| limit | integer | No | 20 | Number of results to return (max: 100) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=downtown&limit=10" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174003",
      "name": "Downtown Service Route",
      "description": "Main downtown area service route covering business district",
      "startLocation": "Central Station",
      "endLocation": "Business District",
      "estimatedDuration": 120,
      "isActive": true,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    },
    {
      "id": "abc12345-e89b-12d3-a456-426614174004",
      "name": "Express Downtown",
      "description": "Fast route through downtown core",
      "startLocation": "North Terminal",
      "endLocation": "Downtown Plaza",
      "estimatedDuration": 90,
      "isActive": true,
      "createdAt": "2025-01-07T10:15:00.000Z",
      "updatedAt": "2025-01-07T10:15:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123461",
    "searchTerm": "downtown",
    "resultCount": 2
  }
}
```

### 7. Get Route Tickets

Retrieve all tickets assigned to a specific route with pagination and filtering.

**Endpoint:** `GET /api/v1/routes/:id/tickets`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Route ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 50 | Number of items per page |
| status | string | No | - | Filter by ticket status (open, in_progress, completed, cancelled) |
| priority | string | No | - | Filter by ticket priority (low, medium, high, urgent) |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?page=1&limit=10&status=open" \
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
      "routeId": "789e0123-e89b-12d3-a456-426614174003",
      "title": "Service request on downtown route",
      "description": "Customer needs service along the downtown route",
      "status": "open",
      "priority": "medium",
      "assignedTo": "John Smith",
      "scheduledDate": "2025-01-09T10:00:00.000Z",
      "completedDate": null,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123462",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null
    },
    "route": {
      "id": "789e0123-e89b-12d3-a456-426614174003",
      "name": "Downtown Service Route",
      "description": "Main downtown area service route covering business district"
    }
  }
}
```

### 8. Get Route Statistics

Retrieve statistical information about routes including totals, duration statistics, and top routes by ticket count.

**Endpoint:** `GET /api/v1/routes/stats`

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes/stats" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 22,
    "inactive": 3,
    "duration": {
      "average": 95,
      "minimum": 30,
      "maximum": 180
    },
    "topRoutesByTickets": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174003",
        "name": "Downtown Service Route",
        "ticketCount": 15
      },
      {
        "id": "abc12345-e89b-12d3-a456-426614174004",
        "name": "Express Downtown",
        "ticketCount": 12
      },
      {
        "id": "def67890-e89b-12d3-a456-426614174005",
        "name": "Suburban Loop",
        "ticketCount": 8
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123463"
  }
}
```

### 9. Get Routes by Status

Retrieve routes filtered by their active status (active or inactive).

**Endpoint:** `GET /api/v1/routes/status/:status`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | Yes | Route status: "active" or "inactive" |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 50 | Number of items per page |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/active?page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174003",
      "name": "Downtown Service Route",
      "description": "Main downtown area service route covering business district",
      "startLocation": "Central Station",
      "endLocation": "Business District",
      "estimatedDuration": 120,
      "isActive": true,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123464",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 22,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPage": 2,
      "previousPage": null
    },
    "status": "active",
    "isActive": true
  }
}
```

## Route Management and Status Handling

### Status Management

Routes support active/inactive status management for operational control:

#### 1. Active Routes
Active routes are available for ticket assignment and service operations:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/active" \
  -H "Content-Type: application/json"
```

#### 2. Inactive Routes
Inactive routes are temporarily or permanently disabled but preserved for historical data:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/inactive" \
  -H "Content-Type: application/json"
```

#### 3. Deactivating Routes
Routes can be deactivated by updating their `isActive` status:
```bash
curl -X PUT "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

#### 4. Reactivating Routes
Inactive routes can be reactivated by setting `isActive` to true:
```bash
curl -X PUT "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

### Route Search and Filtering Capabilities

The routes API provides comprehensive search and filtering capabilities:

#### 1. Multi-field Search
Search across multiple route fields simultaneously:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=downtown" \
  -H "Content-Type: application/json"
```

This searches in:
- Route name
- Route description
- Start location
- End location

#### 2. Combined Filtering
Combine multiple filters for precise results:
```bash
curl -X GET "http://localhost:3000/api/v1/routes?search=express&isActive=true&sortBy=name&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

#### 3. Location-based Filtering
Filter routes by start or end locations:
```bash
# Search for routes starting from or ending at specific locations
curl -X GET "http://localhost:3000/api/v1/routes/search?q=Central%20Station" \
  -H "Content-Type: application/json"
```

#### 4. Duration-based Analysis
While not exposed as direct query parameters, routes can be analyzed by duration through the statistics endpoint:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/stats" \
  -H "Content-Type: application/json"
```

### Advanced Filtering Examples

#### 1. Active Routes with Search
```bash
curl -X GET "http://localhost:3000/api/v1/routes?isActive=true&search=downtown&sortBy=estimatedDuration&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

#### 2. Routes by Name Pattern
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=express&limit=5" \
  -H "Content-Type: application/json"
```

#### 3. Inactive Routes for Review
```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/inactive&sortBy=updatedAt&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

## Route-Ticket Relationship Management

### Relationship Overview

Routes have a one-to-many relationship with tickets:
- One route can have multiple tickets assigned to it
- Tickets can optionally be assigned to a route (routeId can be null)
- Routes cannot be deleted if they have associated tickets

### Managing Route-Ticket Relationships

#### 1. View Route Tickets
Get all tickets assigned to a specific route:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets" \
  -H "Content-Type: application/json"
```

#### 2. Filter Route Tickets by Status
View only open tickets for a route:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?status=open" \
  -H "Content-Type: application/json"
```

#### 3. Filter Route Tickets by Priority
View high-priority tickets for a route:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?priority=high" \
  -H "Content-Type: application/json"
```

#### 4. Combined Ticket Filtering
Filter route tickets by multiple criteria:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?status=in_progress&priority=high&sortBy=scheduledDate&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

### Route Assignment Workflows

#### 1. Assign Ticket to Route
When creating or updating a ticket, specify the routeId:
```bash
# Create ticket with route assignment
curl -X POST "http://localhost:3000/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "456e7890-e89b-12d3-a456-426614174001",
    "routeId": "789e0123-e89b-12d3-a456-426614174003",
    "title": "Service request on downtown route",
    "status": "open",
    "priority": "medium"
  }'
```

#### 2. Reassign Ticket to Different Route
Update an existing ticket's route assignment:
```bash
curl -X PUT "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "abc12345-e89b-12d3-a456-426614174004"
  }'
```

#### 3. Remove Route Assignment
Set routeId to null to remove route assignment:
```bash
curl -X PUT "http://localhost:3000/api/v1/tickets/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": null
  }'
```

### Route Performance Analysis

#### 1. Route Utilization
View routes with their ticket counts and performance metrics:
```bash
curl -X GET "http://localhost:3000/api/v1/routes/stats" \
  -H "Content-Type: application/json"
```

#### 2. Route Efficiency Analysis
The statistics endpoint provides insights into:
- Total tickets per route
- Average estimated duration
- Top-performing routes by ticket volume

#### 3. Route Workload Distribution
Use the route tickets endpoint to analyze workload:
```bash
# Get all tickets for workload analysis
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?limit=100" \
  -H "Content-Type: application/json"
```

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Route not found |
| 409 | Conflict | Constraint violations |
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
          "field": "name",
          "message": "name is required",
          "value": null
        },
        {
          "field": "estimatedDuration",
          "message": "estimatedDuration must be a positive integer",
          "value": -30
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
    "message": "Route not found",
    "details": {
      "resource": "Route",
      "id": "789e0123-e89b-12d3-a456-426614174003"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123466"
  }
}
```

### Constraint Error Example (Delete with Associated Tickets)

```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Cannot delete route with associated tickets",
    "details": {
      "ticketCount": 8
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123467"
  }
}
```

### Search Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Search term is required",
    "details": {
      "field": "q",
      "message": "Query parameter q is required"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123468"
  }
}
```

### Status Parameter Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status parameter. Must be \"active\" or \"inactive\"",
    "details": {
      "field": "status",
      "value": "invalid_status"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123469"
  }
}
```

## Testing Scenarios

### Positive Test Cases

#### 1. Create Route with Minimum Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Route"
  }'
```

#### 2. Create Route with All Fields
```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complete Service Route",
    "description": "Comprehensive route covering all service areas",
    "startLocation": "Main Depot",
    "endLocation": "Service Center",
    "estimatedDuration": 180,
    "isActive": true
  }'
```

#### 3. Search Routes by Name
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=downtown&limit=10" \
  -H "Content-Type: application/json"
```

#### 4. Search Routes by Location
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=Central%20Station" \
  -H "Content-Type: application/json"
```

#### 5. Filter Active Routes
```bash
curl -X GET "http://localhost:3000/api/v1/routes?isActive=true&sortBy=name&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

#### 6. Get Routes by Status
```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/active?page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### 7. Update Route Information
```bash
curl -X PUT "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated route description",
    "estimatedDuration": 150
  }'
```

#### 8. Get Route with Tickets
```bash
curl -X GET "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003/tickets?status=open" \
  -H "Content-Type: application/json"
```

#### 9. Get Route Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/routes/stats" \
  -H "Content-Type: application/json"
```

#### 10. Deactivate Route
```bash
curl -X PUT "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Negative Test Cases

#### 1. Create Route Without Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Route without name"
  }'
```
Expected: 400 Bad Request with validation error for missing name

#### 2. Create Route with Invalid Duration
```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Route",
    "estimatedDuration": -30
  }'
```
Expected: 400 Bad Request with duration validation error

#### 3. Create Route with Oversized Fields
```bash
curl -X POST "http://localhost:3000/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "' + 'A'.repeat(256) + '",
    "description": "' + 'B'.repeat(1001) + '"
  }'
```
Expected: 400 Bad Request with field length validation errors

#### 4. Get Non-existent Route
```bash
curl -X GET "http://localhost:3000/api/v1/routes/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

#### 5. Update Non-existent Route
```bash
curl -X PUT "http://localhost:3000/api/v1/routes/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```
Expected: 404 Not Found

#### 6. Delete Non-existent Route
```bash
curl -X DELETE "http://localhost:3000/api/v1/routes/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

#### 7. Delete Route with Associated Tickets
```bash
# First create a route and assign tickets, then try to delete the route
curl -X DELETE "http://localhost:3000/api/v1/routes/789e0123-e89b-12d3-a456-426614174003" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with constraint error

#### 8. Search Without Query Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with missing query parameter error

#### 9. Search with Empty Query Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with empty search term error

#### 10. Invalid UUID Format
```bash
curl -X GET "http://localhost:3000/api/v1/routes/invalid-uuid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with UUID validation error

#### 11. Invalid Status Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/routes/status/invalid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with status validation error

#### 12. Invalid Pagination Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/routes?page=0&limit=101" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with pagination validation errors

#### 13. Invalid Boolean Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/routes?isActive=invalid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with boolean validation error

#### 14. Invalid Sort Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/routes?sortOrder=INVALID" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with sort order validation error

#### 15. Get Tickets for Non-existent Route
```bash
curl -X GET "http://localhost:3000/api/v1/routes/00000000-0000-0000-0000-000000000000/tickets" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

## Performance Considerations

### Pagination
- Default limit is 50 items per page
- Maximum limit is 100 items per page
- Use pagination for large datasets to improve response times

### Filtering and Search
- Database indexes are recommended on frequently filtered fields:
  - `name`
  - `isActive`
  - `createdAt`
  - `estimatedDuration`

### Search Performance
- Text search is performed on `name`, `description`, `startLocation`, and `endLocation` fields
- Search uses LIKE queries with wildcards for partial matching
- Consider implementing full-text search for better performance with large datasets

### Response Times
- Expected response times:
  - Single route retrieval: < 50ms
  - Paginated list (50 items): < 150ms
  - Search operations: < 200ms
  - Statistics endpoint: < 250ms
  - Create/Update operations: < 100ms
  - Route tickets retrieval: < 200ms

### Caching Recommendations
- Route statistics can be cached for 5-10 minutes
- Search results can be cached for 1-2 minutes
- Individual route records can be cached for 10-15 minutes
- Route-ticket relationships can be cached for 2-5 minutes

## Data Relationships

### Route-Ticket Relationship
- One route can have many tickets (one-to-many relationship)
- Routes cannot be deleted if they have associated tickets
- Use the `/routes/:id/tickets` endpoint to retrieve route tickets
- Ticket creation can optionally include a route ID

### Route-Customer Relationship
- Routes are indirectly related to customers through tickets
- A route may have tickets from different customers
- No direct foreign key relationship between routes and customers

### Data Integrity
- Route names should be descriptive and unique for operational clarity
- Route IDs are referenced by tickets as foreign keys
- Soft delete functionality through `isActive` field preserves data integrity
- Estimated duration should reflect realistic time expectations for route completion