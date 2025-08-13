# Getting Started Guide

## Overview

This guide will help you set up your environment and make your first API calls to the Local Backend API system.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- SQLite3
- Git
- API testing tool (Postman, cURL, or similar)

## Environment Setup

### 1. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### 2. Verify Installation

Test that the API is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "0:00:30",
    "timestamp": "2025-01-08T10:30:00.000Z"
  }
}
```

## Quick Start Examples

### Health Check
```bash
curl -X GET http://localhost:3000/api/v1/health
```

### List Tickets
```bash
curl -X GET http://localhost:3000/api/v1/tickets
```

### Create Customer
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "555-0123"
  }'
```

## Next Steps

1. [Review API Endpoints](../endpoints/README.md)
2. [Set up Authentication](../authentication/README.md)
3. [Import Postman Collection](../tools/postman.md)
4. [Explore Testing Scenarios](../testing/README.md)

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <process_id> /F
```

**Database Connection Issues**
- Ensure SQLite3 is installed
- Check database file permissions
- Verify environment variables

**CORS Issues**
- API includes CORS headers for development
- Check browser console for specific errors

For more troubleshooting help, see the [Error Handling Guide](../errors/README.md).