# Reports Endpoints Documentation

## Overview

The reports endpoints provide comprehensive reporting and analytics functionality for the Local Backend API system. These endpoints support dashboard data aggregation, customizable reports with filtering options, summary statistics, and chart-ready data visualization. All endpoints are prefixed with `/api/v1/reports` and follow RESTful design principles.

## Base URL

```
http://localhost:3000/api/v1/reports
```

## Authentication

Currently, the reports endpoints do not require authentication. However, when authentication is implemented, protected endpoints will require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Dashboard Data

Retrieve comprehensive dashboard data with ticket counts by status, priority, and date ranges, including optional chart-ready data.

**Endpoint:** `GET /api/v1/reports/dashboard`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dateFrom | ISO datetime | No | - | Start date filter for date-filtered data (ISO 8601 format) |
| dateTo | ISO datetime | No | - | End date filter for date-filtered data (ISO 8601 format) |
| includeCharts | string | No | true | Include chart-ready data in response (true/false) |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z&includeCharts=true" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTickets": 150,
      "totalCustomers": 45,
      "totalRoutes": 12,
      "overdueTickets": 8,
      "todayTickets": 5
    },
    "statusCounts": [
      { "status": "open", "count": 45 },
      { "status": "in_progress", "count": 32 },
      { "status": "completed", "count": 68 },
      { "status": "cancelled", "count": 5 }
    ],
    "priorityCounts": [
      { "priority": "urgent", "count": 8 },
      { "priority": "high", "count": 25 },
      { "priority": "medium", "count": 89 },
      { "priority": "low", "count": 28 }
    ],
    "dateFilteredData": {
      "totalTickets": 42,
      "statusCounts": [
        { "status": "open", "count": 15 },
        { "status": "in_progress", "count": 12 },
        { "status": "completed", "count": 13 },
        { "status": "cancelled", "count": 2 }
      ],
      "priorityCounts": [
        { "priority": "urgent", "count": 3 },
        { "priority": "high", "count": 8 },
        { "priority": "medium", "count": 25 },
        { "priority": "low", "count": 6 }
      ]
    },
    "charts": {
      "statusChart": {
        "labels": ["open", "in_progress", "completed", "cancelled"],
        "data": [45, 32, 68, 5],
        "type": "doughnut"
      },
      "priorityChart": {
        "labels": ["urgent", "high", "medium", "low"],
        "data": [8, 25, 89, 28],
        "type": "bar"
      }
    },
    "performance": {
      "responseTime": 125,
      "timestamp": "2025-01-08T16:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123456",
    "method": "GET",
    "url": "/api/v1/reports/dashboard"
  }
}
```

### 2. Get Customizable Reports

Retrieve customizable reports with comprehensive filtering options and different report types.

**Endpoint:** `GET /api/v1/reports`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| reportType | string | No | summary | Type of report: summary, performance, customer, route, trends |
| dateFrom | ISO datetime | No | - | Start date filter (ISO 8601 format) |
| dateTo | ISO datetime | No | - | End date filter (ISO 8601 format) |
| status | string | No | - | Filter by ticket status: open, in_progress, completed, cancelled |
| priority | string | No | - | Filter by priority: low, medium, high, urgent |
| customerId | uuid | No | - | Filter by specific customer ID |
| routeId | uuid | No | - | Filter by specific route ID |
| assignedTo | string | No | - | Filter by assigned person |
| groupBy | string | No | status | Group results by: status, priority, customer, route |
| includeDetails | string | No | false | Include detailed records in response (true/false) |

#### Report Types

##### Summary Report (`reportType=summary`)
Provides aggregated ticket statistics with breakdowns by status, priority, and assignee.

##### Performance Report (`reportType=performance`)
Analyzes completion times, completion rates, and overdue tickets.

##### Customer Report (`reportType=customer`)
Focuses on customer-specific metrics and ticket counts per customer.

##### Route Report (`reportType=route`)
Analyzes route utilization and performance metrics.

##### Trends Report (`reportType=trends`)
Shows ticket creation trends over time with daily breakdowns.

#### Example Request - Summary Report

```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=summary&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z&status=open&groupBy=priority" \
  -H "Content-Type: application/json"
```

#### Example Response - Summary Report

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTickets": 45,
      "statusBreakdown": {
        "open": 45
      },
      "priorityBreakdown": {
        "urgent": 3,
        "high": 12,
        "medium": 25,
        "low": 5
      },
      "assigneeBreakdown": {
        "John Smith": 15,
        "Jane Doe": 12,
        "Bob Johnson": 10,
        "Unassigned": 8
      }
    },
    "tickets": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Urgent repair needed",
        "status": "open",
        "priority": "high",
        "assignedTo": "John Smith",
        "createdAt": "2025-01-08T15:30:00.000Z"
      }
    ],
    "metadata": {
      "reportType": "summary",
      "filters": {
        "dateFrom": "2025-01-01T00:00:00.000Z",
        "dateTo": "2025-01-31T23:59:59.999Z",
        "status": "open",
        "groupBy": "priority"
      },
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 145
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123457"
  }
}
```

#### Example Request - Performance Report

```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=performance&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z&assignedTo=John%20Smith" \
  -H "Content-Type: application/json"
```

#### Example Response - Performance Report

```json
{
  "success": true,
  "data": {
    "performance": {
      "totalTickets": 25,
      "completedTickets": 18,
      "completionRate": 72.0,
      "avgCompletionTimeMinutes": 145,
      "overdueTickets": 3
    },
    "completionTimes": [120, 180, 95, 200, 160, 135, 175, 110, 190, 155],
    "metadata": {
      "reportType": "performance",
      "filters": {
        "dateFrom": "2025-01-01T00:00:00.000Z",
        "dateTo": "2025-01-31T23:59:59.999Z",
        "assignedTo": "John Smith"
      },
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 98
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123458"
  }
}
```

#### Example Request - Customer Report

```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=customer&includeDetails=true" \
  -H "Content-Type: application/json"
```

#### Example Response - Customer Report

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "ticketCount": 8,
        "openTickets": 3,
        "completedTickets": 5,
        "serviceType": "residential"
      },
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "ticketCount": 15,
        "openTickets": 5,
        "completedTickets": 10,
        "serviceType": "commercial"
      }
    ],
    "summary": {
      "totalCustomers": 45,
      "avgTicketsPerCustomer": 3.33
    },
    "metadata": {
      "reportType": "customer",
      "filters": {
        "includeDetails": "true"
      },
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 167
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123459"
  }
}
```

### 3. Get Summary Statistics

Retrieve summary statistics for customers, routes, and tickets with time period filtering.

**Endpoint:** `GET /api/v1/reports/summary`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | string | No | 30d | Time period: 7d, 30d, 90d, 1y |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/reports/summary?period=30d" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "totals": {
      "totalTickets": 150,
      "totalCustomers": 45,
      "totalRoutes": 12
    },
    "period": {
      "range": {
        "from": "2024-12-09T16:00:00.000Z",
        "to": "2025-01-08T16:00:00.000Z"
      },
      "duration": "30d",
      "totalTickets": 42,
      "statusCounts": [
        { "status": "open", "count": 15 },
        { "status": "in_progress", "count": 12 },
        { "status": "completed", "count": 13 },
        { "status": "cancelled", "count": 2 }
      ],
      "priorityCounts": [
        { "priority": "urgent", "count": 3 },
        { "priority": "high", "count": 8 },
        { "priority": "medium", "count": 25 },
        { "priority": "low", "count": 6 }
      ],
      "completionRate": 30.95
    },
    "customers": {
      "serviceTypes": [
        { "serviceType": "residential", "count": 28 },
        { "serviceType": "commercial", "count": 12 },
        { "serviceType": "industrial", "count": 5 }
      ],
      "totalActive": 42,
      "totalInactive": 3
    },
    "routes": {
      "utilization": [
        {
          "id": "789e0123-e89b-12d3-a456-426614174002",
          "name": "Downtown Route",
          "totalTickets": 25,
          "completedTickets": 18,
          "utilizationRate": 72.0
        },
        {
          "id": "abc1234d-e89b-12d3-a456-426614174003",
          "name": "Suburban Route",
          "totalTickets": 15,
          "completedTickets": 12,
          "utilizationRate": 80.0
        }
      ],
      "totalActive": 10,
      "totalInactive": 2
    },
    "performance": {
      "responseTime": 189,
      "timestamp": "2025-01-08T16:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123460"
  }
}
```

### 4. Get Chart Data for Visualization

Retrieve chart-ready data for various visualization types with date range filtering and grouping options.

**Endpoint:** `GET /api/v1/reports/charts`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| chartType | string | No | status-distribution | Chart type: status-distribution, priority-distribution, tickets-over-time, completion-rate, route-performance, customer-activity |
| dateFrom | ISO datetime | No | - | Start date filter (ISO 8601 format) |
| dateTo | ISO datetime | No | - | End date filter (ISO 8601 format) |
| groupBy | string | No | day | Time grouping for time-series charts: hour, day, week, month |

#### Chart Types

##### Status Distribution (`chartType=status-distribution`)
Doughnut chart showing ticket distribution by status.

##### Priority Distribution (`chartType=priority-distribution`)
Bar chart showing ticket distribution by priority.

##### Tickets Over Time (`chartType=tickets-over-time`)
Line chart showing ticket creation trends over time.

##### Completion Rate (`chartType=completion-rate`)
Line chart showing completion rate trends over time.

##### Route Performance (`chartType=route-performance`)
Bar chart comparing route performance metrics.

##### Customer Activity (`chartType=customer-activity`)
Horizontal bar chart showing top customer activity.

#### Example Request - Status Distribution

```bash
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=status-distribution&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z" \
  -H "Content-Type: application/json"
```

#### Example Response - Status Distribution

```json
{
  "success": true,
  "data": {
    "type": "doughnut",
    "title": "Ticket Status Distribution",
    "labels": ["open", "in_progress", "completed", "cancelled"],
    "datasets": [{
      "data": [15, 12, 13, 2],
      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
    }],
    "metadata": {
      "chartType": "status-distribution",
      "filters": {
        "dateFrom": "2025-01-01T00:00:00.000Z",
        "dateTo": "2025-01-31T23:59:59.999Z"
      },
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 87
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123461"
  }
}
```

#### Example Request - Tickets Over Time

```bash
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=tickets-over-time&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z&groupBy=day" \
  -H "Content-Type: application/json"
```

#### Example Response - Tickets Over Time

```json
{
  "success": true,
  "data": {
    "type": "line",
    "title": "Tickets Over Time",
    "labels": ["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05"],
    "datasets": [{
      "label": "Tickets Created",
      "data": [3, 5, 2, 7, 4],
      "borderColor": "#36A2EB",
      "fill": false
    }],
    "metadata": {
      "chartType": "tickets-over-time",
      "filters": {
        "dateFrom": "2025-01-01T00:00:00.000Z",
        "dateTo": "2025-01-31T23:59:59.999Z",
        "groupBy": "day"
      },
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 112
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123462"
  }
}
```

#### Example Request - Route Performance

```bash
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=route-performance" \
  -H "Content-Type: application/json"
```

#### Example Response - Route Performance

```json
{
  "success": true,
  "data": {
    "type": "bar",
    "title": "Route Performance",
    "labels": ["Downtown Route", "Suburban Route", "Industrial Route"],
    "datasets": [
      {
        "label": "Total Tickets",
        "data": [25, 15, 8],
        "backgroundColor": "#36A2EB"
      },
      {
        "label": "Completed Tickets",
        "data": [18, 12, 6],
        "backgroundColor": "#4BC0C0"
      }
    ],
    "metadata": {
      "chartType": "route-performance",
      "filters": {},
      "generatedAt": "2025-01-08T16:00:00.000Z",
      "responseTime": 134
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
| 200 | OK | Successful GET requests |
| 400 | Bad Request | Invalid parameters, unsupported report/chart types |
| 500 | Internal Server Error | Server-side errors, database issues |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "parameter": "parameterName",
      "message": "Parameter-specific error message",
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

### Invalid Report Type Error Example

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REPORT_TYPE",
    "message": "Report type 'invalid_type' is not supported",
    "details": {
      "supportedTypes": ["summary", "performance", "customer", "route", "trends"],
      "providedType": "invalid_type"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123465"
  }
}
```

### Invalid Chart Type Error Example

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CHART_TYPE",
    "message": "Chart type 'invalid_chart' is not supported",
    "details": {
      "supportedTypes": ["status-distribution", "priority-distribution", "tickets-over-time", "completion-rate", "route-performance", "customer-activity"],
      "providedType": "invalid_chart"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T16:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req-123466"
  }
}
```

## Date Range Filtering and Grouping

### Date Range Parameters

All date parameters should be provided in ISO 8601 format:

```
YYYY-MM-DDTHH:mm:ss.sssZ
```

Examples:
- `2025-01-01T00:00:00.000Z` (Start of January 1, 2025 UTC)
- `2025-01-31T23:59:59.999Z` (End of January 31, 2025 UTC)

### Time Period Options

For the `/summary` endpoint, the following period options are available:

| Period | Description | Date Range |
|--------|-------------|------------|
| 7d | Last 7 days | Current date - 7 days |
| 30d | Last 30 days | Current date - 30 days |
| 90d | Last 90 days | Current date - 90 days |
| 1y | Last 1 year | Current date - 1 year |

### Grouping Options

For time-series charts, the following grouping options are available:

| GroupBy | Description | Format Example |
|---------|-------------|----------------|
| hour | Group by hour | 2025-01-08 14:00 |
| day | Group by day | 2025-01-08 |
| week | Group by week | 2025-W02 |
| month | Group by month | 2025-01 |

## Testing Scenarios

### Positive Test Cases

#### 1. Get Basic Dashboard Data
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard" \
  -H "Content-Type: application/json"
```

#### 2. Get Dashboard Data with Date Range
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z" \
  -H "Content-Type: application/json"
```

#### 3. Get Dashboard Data without Charts
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?includeCharts=false" \
  -H "Content-Type: application/json"
```

#### 4. Get Summary Report with Filters
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=summary&status=open&priority=high&groupBy=assignee" \
  -H "Content-Type: application/json"
```

#### 5. Get Performance Report for Specific Assignee
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=performance&assignedTo=John%20Smith&dateFrom=2025-01-01T00:00:00.000Z" \
  -H "Content-Type: application/json"
```

#### 6. Get Customer Report with Details
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=customer&includeDetails=true" \
  -H "Content-Type: application/json"
```

#### 7. Get Route Report for Specific Route
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=route&routeId=789e0123-e89b-12d3-a456-426614174002" \
  -H "Content-Type: application/json"
```

#### 8. Get Trends Report with Date Range
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=trends&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z&groupBy=day" \
  -H "Content-Type: application/json"
```

#### 9. Get Summary Statistics for Different Periods
```bash
curl -X GET "http://localhost:3000/api/v1/reports/summary?period=7d" \
  -H "Content-Type: application/json"

curl -X GET "http://localhost:3000/api/v1/reports/summary?period=90d" \
  -H "Content-Type: application/json"

curl -X GET "http://localhost:3000/api/v1/reports/summary?period=1y" \
  -H "Content-Type: application/json"
```

#### 10. Get Different Chart Types
```bash
# Status distribution chart
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=status-distribution" \
  -H "Content-Type: application/json"

# Priority distribution chart
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=priority-distribution" \
  -H "Content-Type: application/json"

# Tickets over time with weekly grouping
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=tickets-over-time&groupBy=week&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z" \
  -H "Content-Type: application/json"

# Completion rate chart
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=completion-rate&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z" \
  -H "Content-Type: application/json"

# Route performance chart
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=route-performance" \
  -H "Content-Type: application/json"

# Customer activity chart
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=customer-activity" \
  -H "Content-Type: application/json"
```

### Negative Test Cases

#### 1. Invalid Report Type
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=invalid_type" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with INVALID_REPORT_TYPE error

#### 2. Invalid Chart Type
```bash
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=invalid_chart" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with INVALID_CHART_TYPE error

#### 3. Invalid Date Format
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?dateFrom=invalid-date&dateTo=2025-01-31" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with date validation error

#### 4. Invalid Period Value
```bash
curl -X GET "http://localhost:3000/api/v1/reports/summary?period=invalid_period" \
  -H "Content-Type: application/json"
```
Expected: Defaults to 30d (graceful handling)

#### 5. Invalid GroupBy Value
```bash
curl -X GET "http://localhost:3000/api/v1/reports/charts?chartType=tickets-over-time&groupBy=invalid_group" \
  -H "Content-Type: application/json"
```
Expected: Defaults to day (graceful handling)

#### 6. Invalid UUID for Customer/Route Filters
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=customer&customerId=invalid-uuid" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with UUID validation error

#### 7. Date Range with End Date Before Start Date
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?dateFrom=2025-01-31T00:00:00.000Z&dateTo=2025-01-01T00:00:00.000Z" \
  -H "Content-Type: application/json"
```
Expected: 400 Bad Request with date range validation error

#### 8. Invalid Boolean Values
```bash
curl -X GET "http://localhost:3000/api/v1/reports/dashboard?includeCharts=invalid_boolean" \
  -H "Content-Type: application/json"
```
Expected: Defaults to true (graceful handling)

#### 9. Non-existent Customer ID
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=customer&customerId=00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: Empty results with success response

#### 10. Non-existent Route ID
```bash
curl -X GET "http://localhost:3000/api/v1/reports?reportType=route&routeId=00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json"
```
Expected: Empty results with success response

## Performance Considerations

### Response Times
Expected response times for different endpoints:

| Endpoint | Expected Response Time | Notes |
|----------|----------------------|-------|
| `/dashboard` | < 200ms | Basic dashboard data |
| `/dashboard` (with date range) | < 300ms | Additional filtering |
| `/reports` (summary) | < 250ms | Aggregated data |
| `/reports` (performance) | < 400ms | Complex calculations |
| `/reports` (customer/route) | < 300ms | Relationship queries |
| `/reports` (trends) | < 500ms | Time-series analysis |
| `/summary` | < 350ms | Comprehensive statistics |
| `/charts` | < 200ms | Chart data generation |

### Optimization Recommendations

#### Database Indexes
Recommended indexes for optimal performance:
- `tickets.status`
- `tickets.priority`
- `tickets.customerId`
- `tickets.routeId`
- `tickets.assignedTo`
- `tickets.createdAt`
- `tickets.scheduledDate`
- `tickets.completedDate`

#### Caching Strategy
Consider implementing caching for:
- Dashboard summary data (5-minute cache)
- Chart data (10-minute cache)
- Summary statistics (15-minute cache)

#### Large Dataset Handling
- Implement pagination for detailed reports
- Use database aggregation functions
- Consider background processing for complex reports
- Implement request timeouts (30 seconds recommended)

### Memory Usage
- Chart data responses are optimized for visualization libraries
- Large datasets are automatically limited (e.g., 100 detailed tickets in summary reports)
- Time-series data is grouped to prevent excessive data points

## Integration Examples

### Chart.js Integration

```javascript
// Fetch status distribution chart data
fetch('/api/v1/reports/charts?chartType=status-distribution')
  .then(response => response.json())
  .then(result => {
    const chartData = result.data;
    
    new Chart(ctx, {
      type: chartData.type,
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        title: {
          display: true,
          text: chartData.title
        }
      }
    });
  });
```

### Dashboard Widget Integration

```javascript
// Fetch dashboard data for widgets
fetch('/api/v1/reports/dashboard')
  .then(response => response.json())
  .then(result => {
    const data = result.data;
    
    // Update summary widgets
    document.getElementById('total-tickets').textContent = data.summary.totalTickets;
    document.getElementById('overdue-tickets').textContent = data.summary.overdueTickets;
    
    // Update status chart
    updateStatusChart(data.charts.statusChart);
    
    // Update priority chart
    updatePriorityChart(data.charts.priorityChart);
  });
```

### Report Export Integration

```javascript
// Generate and download report
async function exportReport(reportType, filters) {
  const params = new URLSearchParams({
    reportType,
    includeDetails: 'true',
    ...filters
  });
  
  const response = await fetch(`/api/v1/reports?${params}`);
  const result = await response.json();
  
  // Convert to CSV or PDF
  const csvData = convertToCSV(result.data);
  downloadFile(csvData, `${reportType}-report.csv`);
}
```