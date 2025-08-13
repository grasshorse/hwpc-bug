# API Endpoints Reference

## Overview

This section provides comprehensive documentation for all API endpoints in the Local Backend API system. Each endpoint includes detailed specifications, request/response examples, and testing scenarios.

## Endpoint Categories

### 🔐 Authentication Endpoints
- [User Profile](./auth/user.md) - `GET /api/v1/auth/user`
- [User Preferences](./auth/preferences.md) - `PUT /api/v1/auth/user/preferences`

### 🎫 Ticket Management
- [List Tickets](./tickets/list.md) - `GET /api/v1/tickets`
- [Create Ticket](./tickets/create.md) - `POST /api/v1/tickets`
- [Get Ticket](./tickets/get.md) - `GET /api/v1/tickets/:id`
- [Update Ticket](./tickets/update.md) - `PUT /api/v1/tickets/:id`
- [Delete Ticket](./tickets/delete.md) - `DELETE /api/v1/tickets/:id`
- [Tickets by Customer](./tickets/by-customer.md) - `GET /api/v1/tickets/customer/:id`
- [Tickets by Status](./tickets/by-status.md) - `GET /api/v1/tickets/status/:status`
- [Ticket Statistics](./tickets/stats.md) - `GET /api/v1/tickets/stats`

### 👥 Customer Management
- [List Customers](./customers/list.md) - `GET /api/v1/customers`
- [Create Customer](./customers/create.md) - `POST /api/v1/customers`
- [Get Customer](./customers/get.md) - `GET /api/v1/customers/:id`
- [Update Customer](./customers/update.md) - `PUT /api/v1/customers/:id`
- [Delete Customer](./customers/delete.md) - `DELETE /api/v1/customers/:id`
- [Search Customers](./customers/search.md) - `GET /api/v1/customers/search`

### 🛣️ Route Management
- [List Routes](./routes/list.md) - `GET /api/v1/routes`
- [Create Route](./routes/create.md) - `POST /api/v1/routes`
- [Get Route](./routes/get.md) - `GET /api/v1/routes/:id`
- [Update Route](./routes/update.md) - `PUT /api/v1/routes/:id`
- [Delete Route](./routes/delete.md) - `DELETE /api/v1/routes/:id`

### 📊 Reports & Analytics
- [Dashboard Data](./reports/dashboard.md) - `GET /api/v1/reports/dashboard`
- [Custom Reports](./reports/custom.md) - `GET /api/v1/reports/custom`
- [Chart Data](./reports/charts.md) - `GET /api/v1/reports/charts`

### 🏥 Health Monitoring
- [Health Check](./health.md) - `GET /health`
- [API Health](./health.md) - `GET /api/v1/health`

## Common Patterns

### Pagination
Most list endpoints support pagination:

```
GET /api/v1/tickets?page=1&limit=50
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Filtering
Many endpoints support filtering:

```
GET /api/v1/tickets?status=open&priority=high
GET /api/v1/customers?serviceType=premium&isActive=true
```

### Sorting
List endpoints support sorting:

```
GET /api/v1/tickets?sortBy=createdAt&sortOrder=desc
GET /api/v1/customers?sortBy=name&sortOrder=asc
```

### Search
Search endpoints use query parameters:

```
GET /api/v1/customers/search?q=john&fields=name,email
```

## Response Standards

All endpoints follow consistent response formatting:

- **Success**: HTTP 200/201 with `success: true`
- **Client Error**: HTTP 4xx with `success: false` and error details
- **Server Error**: HTTP 5xx with `success: false` and error message
- **Metadata**: All responses include timestamp and request tracking

## Testing Guidelines

When testing endpoints:

1. **Positive Cases**: Test with valid data and expected scenarios
2. **Negative Cases**: Test with invalid data, missing fields, wrong types
3. **Edge Cases**: Test boundary conditions, empty results, large datasets
4. **Authentication**: Test protected endpoints with/without valid tokens
5. **Performance**: Monitor response times and handle large datasets

## Quick Reference

| HTTP Method | Purpose | Response Code |
|-------------|---------|---------------|
| GET | Retrieve data | 200 OK |
| POST | Create new resource | 201 Created |
| PUT | Update existing resource | 200 OK |
| DELETE | Remove resource | 200 OK |
| PATCH | Partial update | 200 OK |

For detailed endpoint documentation, select the specific endpoint from the categories above.