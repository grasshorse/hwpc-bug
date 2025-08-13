# Authentication Guide

## Overview

This guide covers authentication mechanisms, security features, and access control for the Local Backend API system.

## Current Authentication Status

**Note**: The API currently implements basic user profile endpoints. Full JWT authentication is planned for future implementation.

## Authentication Endpoints

### User Profile Management
- `GET /api/v1/auth/user` - Get current user profile
- `PUT /api/v1/auth/user/preferences` - Update user preferences

## Planned Authentication Flow

When JWT authentication is implemented, the flow will be:

### 1. User Registration
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123"
}
```

### 2. User Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

### 3. Authenticated Requests
```bash
GET /api/v1/tickets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Protected Endpoints

When authentication is implemented, the following endpoints will require authentication:

### Always Protected
- All `/api/v1/auth/*` endpoints (except login/register)
- User-specific data endpoints
- Administrative functions

### Conditionally Protected
- `POST`, `PUT`, `DELETE` operations on tickets, customers, routes
- Sensitive reporting data
- System configuration endpoints

### Public Endpoints
- `GET /health` - System health check
- `GET /api/v1/health` - API health check
- Some read-only endpoints (configuration dependent)

## Authorization Levels

### Planned User Roles

**Admin**
- Full access to all endpoints
- User management capabilities
- System configuration access
- All CRUD operations

**Manager**
- Access to reporting and analytics
- Customer and ticket management
- Route management
- Limited user management

**User**
- Basic ticket operations
- Customer lookup
- Personal profile management
- Limited reporting access

**Read-Only**
- View-only access to tickets and customers
- Basic reporting access
- No create/update/delete operations

## Security Headers

The API includes security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## CORS Configuration

CORS is enabled for development with the following settings:

```javascript
{
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
```

## Testing Authentication

### Current Testing (No Auth Required)
```bash
# Test user profile endpoint
curl -X GET http://localhost:3000/api/v1/auth/user

# Test preferences update
curl -X PUT http://localhost:3000/api/v1/auth/user/preferences \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark", "notifications": true}'
```

### Future Testing (With JWT)

**Test Valid Token**
```bash
curl -X GET http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer valid_jwt_token_here"
```

**Test Invalid Token**
```bash
curl -X GET http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer invalid_token"
```

**Test Missing Token**
```bash
curl -X GET http://localhost:3000/api/v1/tickets
```

## Error Responses

### Authentication Errors

**Missing Token (401)**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

**Invalid Token (401)**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token"
  }
}
```

**Insufficient Permissions (403)**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions for this operation"
  }
}
```

## Token Management

### Token Structure (Planned)
JWT tokens will include:
- User ID and username
- Role and permissions
- Expiration time
- Issued at timestamp

### Token Expiration
- Access tokens: 1 hour
- Refresh tokens: 7 days
- Remember me: 30 days

### Token Refresh (Planned)
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

## Security Best Practices

### For API Consumers
1. Store tokens securely (not in localStorage for web apps)
2. Include tokens in Authorization header, not URL parameters
3. Handle token expiration gracefully
4. Implement proper logout functionality
5. Use HTTPS in production

### For Testing
1. Test with expired tokens
2. Test with malformed tokens
3. Test role-based access control
4. Verify token refresh functionality
5. Test logout and token invalidation

## Environment Variables

Authentication-related environment variables:

```bash
# JWT Configuration (when implemented)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security Settings
BCRYPT_ROUNDS=12
SESSION_SECRET=session-secret-here
```

## Migration Notes

When JWT authentication is implemented:
1. Existing endpoints will require authentication headers
2. User registration/login endpoints will be added
3. Role-based access control will be enforced
4. API consumers will need to update their integration

For current testing, no authentication is required. Monitor API updates for authentication implementation timeline.