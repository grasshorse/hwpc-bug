# [HTTP Method] [Endpoint Path]

## Overview

Brief description of what this endpoint does and its purpose.

## Endpoint Details

- **URL**: `[HTTP Method] [Full URL Path]`
- **Authentication**: Required/Not Required
- **Content-Type**: `application/json`

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Resource identifier |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number for pagination |
| `limit` | Integer | No | 50 | Number of items per page |

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Request Body

```json
{
  "field1": "string",
  "field2": "integer",
  "field3": "boolean"
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `field1` | String | Yes | 1-255 chars | Field description |
| `field2` | Integer | No | > 0 | Field description |
| `field3` | Boolean | No | - | Field description |

## Response

### Success Response (200/201)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "field1": "value1",
    "field2": 42,
    "field3": true,
    "createdAt": "2025-01-08T10:30:00.000Z",
    "updatedAt": "2025-01-08T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "field1",
          "message": "Field1 is required",
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

#### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

## Examples

### cURL Example

```bash
curl -X [METHOD] http://localhost:3000/api/v1/[endpoint] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "field1": "example value",
    "field2": 42,
    "field3": true
  }'
```

### JavaScript Example

```javascript
const response = await fetch('http://localhost:3000/api/v1/[endpoint]', {
  method: '[METHOD]',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    field1: 'example value',
    field2: 42,
    field3: true
  })
});

const data = await response.json();
console.log(data);
```

### Python Example

```python
import requests

url = 'http://localhost:3000/api/v1/[endpoint]'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
}
data = {
    'field1': 'example value',
    'field2': 42,
    'field3': True
}

response = requests.[method](url, headers=headers, json=data)
result = response.json()
print(result)
```

## Testing Scenarios

### Positive Test Cases

1. **Valid Request with All Fields**
   - Send request with all required and optional fields
   - Expect: 200/201 response with created/updated resource

2. **Valid Request with Minimum Fields**
   - Send request with only required fields
   - Expect: 200/201 response with default values for optional fields

### Negative Test Cases

1. **Missing Required Fields**
   - Send request without required fields
   - Expect: 400 Bad Request with validation errors

2. **Invalid Data Types**
   - Send request with wrong data types
   - Expect: 400 Bad Request with validation errors

3. **Invalid Field Values**
   - Send request with out-of-range or invalid values
   - Expect: 400 Bad Request with validation errors

4. **Resource Not Found** (for endpoints with path parameters)
   - Send request with non-existent resource ID
   - Expect: 404 Not Found

### Edge Cases

1. **Boundary Values**
   - Test with minimum and maximum allowed values
   - Test with empty strings and null values

2. **Special Characters**
   - Test with Unicode characters, special symbols
   - Test with potential injection attempts

## Related Endpoints

- [Related Endpoint 1](./related-endpoint-1.md)
- [Related Endpoint 2](./related-endpoint-2.md)

## Notes

- Additional implementation notes
- Known limitations or considerations
- Performance characteristics
- Rate limiting information

---

*Last Updated: [Date]*
*API Version: 1.0.0*