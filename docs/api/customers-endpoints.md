# Customers Endpoints Documentation

## Overview

The customers endpoints provide comprehensive customer management functionality for the Local Backend API system. These endpoints support full CRUD operations, advanced search capabilities, filtering, pagination, sorting, and statistical reporting for customer management. All endpoints are prefixed with `/api/v1/customers` and follow RESTful design principles.

## Base URL

```
http://localhost:3000/api/v1/customers
```

## Authentication

Currently, the customers endpoints do not require authentication. However, when authentication is implemented, protected endpoints will require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Data Model

### Customer Schema

```javascript
{
  id: "uuid",                    // Auto-generated UUID
  name: "string",               // Required - Max 255 characters
  email: "string",              // Optional - Valid email format
  phone: "string",              // Optional - Max 20 characters
  street: "string",             // Optional - Max 255 characters
  city: "string",               // Optional - Max 100 characters
  state: "string",              // Optional - Max 50 characters
  zipCode: "string",            // Optional - Max 10 characters
  lat: "number",                // Optional - Latitude (-90 to 90)
  lng: "number",                // Optional - Longitude (-180 to 180)
  serviceType: "string",        // Optional - Max 100 characters
  notes: "string",              // Optional - Max 1000 characters
  isActive: "boolean",          // Default: true
  createdAt: "ISO datetime",    // Auto-generated
  updatedAt: "ISO datetime"     // Auto-updated
}
```

### Field Descriptions

- **id**: Unique identifier for the customer (UUID v4 format)
- **name**: Customer's full name (required field)
- **email**: Customer's email address (must be valid email format if provided)
- **phone**: Customer's phone number (flexible format, max 20 characters)
- **street**: Street address of the customer
- **city**: City where the customer is located
- **state**: State/province where the customer is located
- **zipCode**: Postal/ZIP code for the customer's location
- **lat/lng**: Geographic coordinates for mapping and location-based services
- **serviceType**: Type of service the customer requires (e.g., "residential", "commercial")
- **notes**: Additional notes or comments about the customer
- **isActive**: Whether the customer account is active (soft delete functionality)

## Endpoints

### 1. Get All Customers

Retrieve all customers with optional filtering, pagination, and sorting.

**Endpoint:** `GET /api/v1/customers`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination (min: 1) |
| limit | integer | No | 50 | Number of items per page (min: 1, max: 100) |
| search | string | No | - | Search in name, email, or phone fields (max: 255 chars) |
| serviceType | string | No | - | Filter by service type |
| isActive | boolean | No | - | Filter by active status (true/false) |
| city | string | No | - | Filter by city (partial match) |
| state | string | No | - | Filter by state (exact match) |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/customers?page=1&limit=10&search=john&serviceType=residential&isActive=true" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567",
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "lat": 40.7128,
      "lng": -74.0060,
      "serviceType": "residential",
      "notes": "Preferred contact method: email",
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
    "url": "/api/v1/customers",
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

### 2. Get Single Customer

Retrieve a specific customer by ID.

**Endpoint:** `GET /api/v1/customers/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Customer ID |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "lat": 40.7128,
    "lng": -74.0060,
    "serviceType": "residential",
    "notes": "Preferred contact method: email",
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

### 3. Create New Customer

Create a new customer.

**Endpoint:** `POST /api/v1/customers`

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "street": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "lat": 40.7128,
  "lng": -74.0060,
  "serviceType": "residential",
  "notes": "Preferred contact method: email",
  "isActive": true
}
```

#### Required Fields
- `name` (string, 1-255 chars) - Customer's full name

#### Optional Fields
- `email` (string) - Valid email format
- `phone` (string, max 20 chars) - Phone number
- `street` (string, max 255 chars) - Street address
- `city` (string, max 100 chars) - City name
- `state` (string, max 50 chars) - State/province
- `zipCode` (string, max 10 chars) - Postal code
- `lat` (number, -90 to 90) - Latitude coordinate
- `lng` (number, -180 to 180) - Longitude coordinate
- `serviceType` (string, max 100 chars) - Service type
- `notes` (string, max 1000 chars) - Additional notes
- `isActive` (boolean) - Active status (defaults to true)

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "serviceType": "residential"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "street": null,
    "city": null,
    "state": null,
    "zipCode": null,
    "lat": null,
    "lng": null,
    "serviceType": "residential",
    "notes": null,
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

### 4. Update Customer

Update an existing customer.

**Endpoint:** `PUT /api/v1/customers/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Customer ID |

#### Request Body

All fields are optional for updates. Only include fields you want to change.

```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-987-6543",
  "serviceType": "commercial"
}
```

#### Example Request

```bash
curl -X PUT "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "serviceType": "commercial"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "John Smith",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "lat": 40.7128,
    "lng": -74.0060,
    "serviceType": "commercial",
    "notes": "Preferred contact method: email",
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

### 5. Delete Customer

Delete a customer by ID. Note: Customers with associated tickets cannot be deleted.

**Endpoint:** `DELETE /api/v1/customers/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Customer ID |

#### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "message": "Customer deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-08T16:20:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123460"
  }
}
```

### 6. Search Customers

Search customers by name, email, or phone number.

**Endpoint:** `GET /api/v1/customers/search`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search term (searches name, email, phone) |
| limit | integer | No | 20 | Number of results to return (max: 100) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/customers/search?q=john&limit=10" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567",
      "serviceType": "residential",
      "isActive": true,
      "createdAt": "2025-01-08T15:30:00.000Z"
    },
    {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "name": "Johnny Smith",
      "email": "johnny.smith@example.com",
      "phone": "+1-555-987-6543",
      "serviceType": "commercial",
      "isActive": true,
      "createdAt": "2025-01-07T10:15:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123461",
    "searchTerm": "john",
    "resultCount": 2
  }
}
```

### 7. Get Customer Tickets

Retrieve all tickets for a specific customer with pagination and filtering.

**Endpoint:** `GET /api/v1/customers/:id/tickets`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Customer ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| limit | integer | No | 50 | Number of items per page |
| status | string | No | - | Filter by ticket status |
| priority | string | No | - | Filter by ticket priority |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | DESC | Sort order: ASC or DESC |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001/tickets?page=1&limit=10&status=open" \
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
      "scheduledDate": "2025-01-09T10:00:00.000Z",
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
      "total": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null
    },
    "customer": {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

### 8. Get Customer Statistics

Retrieve statistical information about customers including totals, service type distribution, and geographic distribution.

**Endpoint:** `GET /api/v1/customers/stats`

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/customers/stats" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 142,
    "inactive": 8,
    "byServiceType": {
      "residential": 89,
      "commercial": 45,
      "industrial": 12,
      "municipal": 4
    },
    "byState": {
      "CA": 45,
      "NY": 32,
      "TX": 28,
      "FL": 18,
      "IL": 15,
      "PA": 12
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123463"
  }
}
```

## Geographic and Service Type Filtering

### Geographic Filtering

The customers API supports geographic filtering through several mechanisms:

#### 1. City Filtering
Filter customers by city using partial matching:
```bash
curl -X GET "http://localhost:3000/api/v1/customers?city=Los%20Angeles" \
  -H "Content-Type: application/json"
```

#### 2. State Filtering
Filter customers by exact state match:
```bash
curl -X GET "http://localhost:3000/api/v1/customers?state=CA" \
  -H "Content-Type: application/json"
```

#### 3. Combined Geographic Filtering
Combine city and state filters:
```bash
curl -X GET "http://localhost:3000/api/v1/customers?city=Los%20Angeles&state=CA" \
  -H "Content-Type: application/json"
```

#### 4. Coordinate-Based Filtering
While not exposed as query parameters, the Customer model supports coordinate-based searches for location services:

**Find customers by ZIP code:**
```javascript
// Internal API method (not exposed as HTTP endpoint)
Customer.findByZipCode('90210')
```

**Find customers near coordinates:**
```javascript
// Internal API method (not exposed as HTTP endpoint)
Customer.findNearLocation(34.0522, -118.2437, 10) // 10km radius
```

### Service Type Filtering

Filter customers by service type to segment different customer categories:

#### 1. Single Service Type
```bash
curl -X GET "http://localhost:3000/api/v1/customers?serviceType=residential" \
  -H "Content-Type: application/json"
```

#### 2. Combined with Other Filters
```bash
curl -X GET "http://localhost:3000/api/v1/customers?serviceType=commercial&state=CA&isActive=true" \
  -H "Content-Type: application/json"
```

#### Common Service Types
- `residential` - Residential customers
- `commercial` - Commercial/business customers
- `industrial` - Industrial customers
- `municipal` - Municipal/government customers
- `emergency` - Emergency service customers

### Advanced Filtering Examples

#### 1. Active Commercial Customers in California
```bash
curl -X GET "http://localhost:3000/api/v1/customers?serviceType=commercial&state=CA&isActive=true&sortBy=name&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

#### 2. Search with Geographic and Service Constraints
```bash
curl -X GET "http://localhost:3000/api/v1/customers?search=smith&city=San%20Francisco&serviceType=residential" \
  -H "Content-Type: application/json"
```

#### 3. Inactive Customers for Cleanup
```bash
curl -X GET "http://localhost:3000/api/v1/customers?isActive=false&sortBy=updatedAt&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Customer not found |
| 409 | Conflict | Email already exists, constraint violations |
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
          "field": "email",
          "message": "email must be a valid email",
          "value": "invalid-email"
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
    "message": "Customer not found",
    "details": {
      "resource": "Customer",
      "id": "456e7890-e89b-12d3-a456-426614174001"
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
    "message": "Cannot delete customer with associated tickets",
    "details": {
      "ticketCount": 5
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

## Testing Scenarios

### Positive Test Cases

#### 1. Create Customer with Minimum Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe"
  }'
```

#### 2. Create Customer with All Fields
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+1-555-123-4567",
    "street": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "lat": 37.7749,
    "lng": -122.4194,
    "serviceType": "commercial",
    "notes": "VIP customer - priority service",
    "isActive": true
  }'
```

#### 3. Filter Customers by Multiple Criteria
```bash
curl -X GET "http://localhost:3000/api/v1/customers?serviceType=residential&state=CA&isActive=true&sortBy=name&sortOrder=ASC" \
  -H "Content-Type: application/json"
```

#### 4. Search Customers by Name
```bash
curl -X GET "http://localhost:3000/api/v1/customers/search?q=john&limit=10" \
  -H "Content-Type: application/json"
```

#### 5. Search Customers by Email
```bash
curl -X GET "http://localhost:3000/api/v1/customers/search?q=john.doe@example.com" \
  -H "Content-Type: application/json"
```

#### 6. Search Customers by Phone
```bash
curl -X GET "http://localhost:3000/api/v1/customers/search?q=555-123-4567" \
  -H "Content-Type: application/json"
```

#### 7. Update Customer Information
```bash
curl -X PUT "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "serviceType": "commercial",
    "notes": "Updated contact information"
  }'
```

#### 8. Get Customer with Tickets
```bash
curl -X GET "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001/tickets?status=open" \
  -H "Content-Type: application/json"
```

#### 9. Get Customer Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/customers/stats" \
  -H "Content-Type: application/json"
```

#### 10. Geographic Filtering
```bash
curl -X GET "http://localhost:3000/api/v1/customers?city=Los%20Angeles&state=CA" \
  -H "Content-Type: application/json"
```

### Negative Test Cases

#### 1. Create Customer Without Required Fields
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```
Expected: 400 Bad Request with validation error for missing name

#### 2. Create Customer with Invalid Email
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "invalid-email-format"
  }'
```
Expected: 400 Bad Request with email validation error

#### 3. Create Customer with Invalid Coordinates
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "lat": 91,
    "lng": 181
  }'
```
Expected: 400 Bad Request with coordinate validation errors

#### 4. Create Customer with Oversized Fields
```bash
curl -X POST "http://localhost:3000/api/v1/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "' + 'A'.repeat(256) + '",
    "phone": "' + '1'.repeat(21) + '"
  }'
```
Expected: 400 Bad Request with field length validation errors

#### 5. Get Non-existent Customer
```bash
curl -X GET "http://localhost:3000/api/v1/customers/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

#### 6. Update Non-existent Customer
```bash
curl -X PUT "http://localhost:3000/api/v1/customers/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```
Expected: 404 Not Found

#### 7. Delete Non-existent Customer
```bash
curl -X DELETE "http://localhost:3000/api/v1/customers/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: 404 Not Found

#### 8. Delete Customer with Associated Tickets
```bash
# First create a customer and ticket, then try to delete the customer
curl -X DELETE "http://localhost:3000/api/v1/customers/456e7890-e89b-12d3-a456-426614174001" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with constraint error

#### 9. Search Without Query Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/customers/search" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with missing query parameter error

#### 10. Search with Empty Query Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/customers/search?q=" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with empty search term error

#### 11. Invalid UUID Format
```bash
curl -X GET "http://localhost:3000/api/v1/customers/invalid-uuid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with UUID validation error

#### 12. Invalid Pagination Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/customers?page=0&limit=101" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with pagination validation errors

#### 13. Invalid Boolean Parameter
```bash
curl -X GET "http://localhost:3000/api/v1/customers?isActive=invalid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with boolean validation error

#### 14. Invalid Sort Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/customers?sortOrder=INVALID" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with sort order validation error

## Performance Considerations

### Pagination
- Default limit is 50 items per page
- Maximum limit is 100 items per page
- Use pagination for large datasets to improve response times

### Filtering and Search
- Database indexes are recommended on frequently filtered fields:
  - `name`
  - `email`
  - `serviceType`
  - `city`
  - `state`
  - `isActive`
  - `createdAt`

### Search Performance
- Text search is performed on `name`, `email`, and `phone` fields
- Search uses LIKE queries with wildcards for partial matching
- Consider implementing full-text search for better performance with large datasets

### Geographic Queries
- Coordinate-based searches use simple bounding box calculations
- For production use, consider implementing proper geographic indexing
- PostGIS or similar extensions recommended for complex geographic queries

### Response Times
- Expected response times:
  - Single customer retrieval: < 50ms
  - Paginated list (50 items): < 150ms
  - Search operations: < 200ms
  - Statistics endpoint: < 250ms
  - Create/Update operations: < 100ms

### Caching Recommendations
- Customer statistics can be cached for 5-10 minutes
- Search results can be cached for 1-2 minutes
- Individual customer records can be cached for 10-15 minutes

## Data Relationships

### Customer-Ticket Relationship
- One customer can have many tickets (one-to-many relationship)
- Customers cannot be deleted if they have associated tickets
- Use the `/customers/:id/tickets` endpoint to retrieve customer tickets
- Ticket creation requires a valid customer ID

### Customer-Route Relationship
- Customers are indirectly related to routes through tickets
- A customer may have tickets assigned to different routes
- No direct foreign key relationship between customers and routes

### Data Integrity
- Customer email addresses should be unique when provided
- Customer IDs are referenced by tickets as foreign keys
- Soft delete functionality through `isActive` field preserves data integrity