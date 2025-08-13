# Authentication Endpoints Documentation

## Overview

The authentication endpoints provide user authentication and profile management functionality. These endpoints handle user authentication, profile retrieval, and preference management.

**Base URL:** `/api/v1/auth`

## Authentication Requirements

All authentication endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Format
- **Type:** JWT (JSON Web Token)
- **Header:** `Authorization: Bearer <token>`
- **Expiration:** 24 hours (configurable via JWT_EXPIRES_IN environment variable)
- **Secret:** Configured via JWT_SECRET environment variable

### Development Mode
In development mode (`NODE_ENV=development`), authentication is optional and a mock user is provided for testing purposes.

## Endpoints

### GET /api/v1/auth/user

Retrieves the current authenticated user's profile information.

#### Request

**Method:** `GET`  
**URL:** `/api/v1/auth/user`  
**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:** None

#### Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user", "admin"],
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4",
    "method": "GET",
    "url": "/api/v1/auth/user"
  }
}
```

**Error Responses:**

**401 Unauthorized - Authentication Required:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "User authentication is required"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or malformed token"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**401 Unauthorized - Token Expired:**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token has expired"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**403 Forbidden - User Inactive:**
```json
{
  "success": false,
  "error": {
    "code": "USER_INACTIVE",
    "message": "User account is inactive"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Authenticated user not found in database"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while retrieving user information",
    "details": "Error details (development mode only)"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

#### Example Request

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/auth/user" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**JavaScript (fetch):**
```javascript
const response = await fetch('/api/v1/auth/user', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userData = await response.json();
```

---

### PUT /api/v1/auth/user/preferences

Updates the current authenticated user's preferences.

#### Request

**Method:** `PUT`  
**URL:** `/api/v1/auth/user/preferences`  
**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en",
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

**Request Body Schema:**
- `preferences` (object, required): User preferences object
  - Can contain any valid JSON key-value pairs
  - Common preference keys:
    - `theme` (string): UI theme preference ("light", "dark", "auto")
    - `notifications` (boolean): Notification preferences
    - `language` (string): Language preference (ISO 639-1 code)
    - `timezone` (string): Timezone preference
    - `dateFormat` (string): Date format preference

#### Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user", "admin"],
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en",
      "timezone": "UTC",
      "dateFormat": "YYYY-MM-DD"
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4",
    "method": "PUT",
    "url": "/api/v1/auth/user/preferences"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Preferences:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "preferences",
          "message": "Preferences must be a valid object"
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**401 Unauthorized - Authentication Required:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "User authentication is required"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while updating user preferences",
    "details": "Error details (development mode only)"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

#### Example Request

**cURL:**
```bash
curl -X PUT "http://localhost:3000/api/v1/auth/user/preferences" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  }'
```

**JavaScript (fetch):**
```javascript
const response = await fetch('/api/v1/auth/user/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  })
});

const updatedUser = await response.json();
```

## Authentication Flow

### Token-Based Authentication

1. **Obtain Token:** Acquire a JWT token through the authentication system
2. **Include Token:** Include the token in the Authorization header for all requests
3. **Token Validation:** The server validates the token on each request
4. **User Context:** The authenticated user information is available in the request context

### Development Mode

In development mode (`NODE_ENV=development`), authentication is bypassed and a mock user is provided:

```json
{
  "id": "dev-user-id",
  "name": "Development User",
  "email": "dev@example.com",
  "roles": ["admin", "user"]
}
```

## Error Handling

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Authentication is required but not provided
- `INVALID_TOKEN_FORMAT`: Authorization header format is invalid
- `INVALID_TOKEN`: Token is invalid or malformed
- `TOKEN_EXPIRED`: Token has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `USER_NOT_FOUND`: User not found in database
- `USER_INACTIVE`: User account is inactive
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server-side error occurred

### HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Testing Examples

### Positive Test Cases

**Test 1: Get authenticated user profile**
```bash
# Request
curl -X GET "http://localhost:3000/api/v1/auth/user" \
  -H "Authorization: Bearer valid_jwt_token"

# Expected Response: 200 OK with user data
```

**Test 2: Update user preferences**
```bash
# Request
curl -X PUT "http://localhost:3000/api/v1/auth/user/preferences" \
  -H "Authorization: Bearer valid_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"theme": "dark"}}'

# Expected Response: 200 OK with updated user data
```

### Negative Test Cases

**Test 3: Access without authentication**
```bash
# Request
curl -X GET "http://localhost:3000/api/v1/auth/user"

# Expected Response: 401 Unauthorized
```

**Test 4: Invalid token format**
```bash
# Request
curl -X GET "http://localhost:3000/api/v1/auth/user" \
  -H "Authorization: InvalidTokenFormat"

# Expected Response: 401 Unauthorized - INVALID_TOKEN_FORMAT
```

**Test 5: Invalid preferences data**
```bash
# Request
curl -X PUT "http://localhost:3000/api/v1/auth/user/preferences" \
  -H "Authorization: Bearer valid_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"preferences": "invalid_string"}'

# Expected Response: 400 Bad Request - VALIDATION_ERROR
```