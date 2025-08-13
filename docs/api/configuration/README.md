# Environment Configuration

## Overview

This guide covers environment setup, configuration options, and deployment considerations for the Local Backend API system.

## Environment Variables

### Required Variables

```bash
# Database Configuration
DATABASE_URL=./database/database.sqlite
DATABASE_TYPE=sqlite

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_VERSION=v1
API_BASE_PATH=/api/v1

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true
```

### Optional Variables

```bash
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE=./logs/api.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12

# Performance
REQUEST_TIMEOUT=30000
BODY_LIMIT=10mb
```

## Environment Files

### Development (.env)

```bash
# Development Environment Configuration
NODE_ENV=development
PORT=3000
DATABASE_URL=./database/database.sqlite

# Debug Settings
DEBUG=api:*
LOG_LEVEL=debug

# CORS - Allow all origins in development
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Development Features
ENABLE_API_DOCS=true
ENABLE_REQUEST_LOGGING=true
```

### Testing (.env.test)

```bash
# Testing Environment Configuration
NODE_ENV=test
PORT=3001
DATABASE_URL=./database/test.sqlite

# Test-specific Settings
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false

# Faster bcrypt for tests
BCRYPT_ROUNDS=1

# Test Database
TEST_DATABASE_RESET=true
```

### Production (.env.production)

```bash
# Production Environment Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=/var/lib/api/database.sqlite

# Security Settings
JWT_SECRET=your-production-secret-key
BCRYPT_ROUNDS=12

# CORS - Restrict to specific origins
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Performance Settings
REQUEST_TIMEOUT=15000
RATE_LIMIT_MAX_REQUESTS=60

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/api/api.log
```

## Database Configuration

### SQLite Setup (Default)

```bash
# Database file location
DATABASE_URL=./database/database.sqlite

# Initialize database
npm run db:init

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### Database Scripts

**Initialize Database**
```bash
#!/bin/bash
# scripts/init-db.sh

DB_PATH="./database"
DB_FILE="$DB_PATH/database.sqlite"

# Create database directory
mkdir -p $DB_PATH

# Create database file if it doesn't exist
if [ ! -f "$DB_FILE" ]; then
    touch "$DB_FILE"
    echo "Created database file: $DB_FILE"
fi

# Run schema creation
node scripts/create-schema.js

echo "Database initialized successfully"
```

**Reset Database**
```bash
#!/bin/bash
# scripts/reset-db.sh

DB_FILE="./database/database.sqlite"

# Backup existing database
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$DB_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backed up existing database"
fi

# Remove existing database
rm -f "$DB_FILE"

# Reinitialize
./scripts/init-db.sh

echo "Database reset complete"
```

## Server Configuration

### Express.js Settings

```javascript
// config/server.js
module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  
  // Request settings
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  
  // Security settings
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP'
  }
};
```

### Logging Configuration

```javascript
// config/logging.js
const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || './logs/api.log';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

## Health Check Configuration

### Health Endpoint Setup

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');

router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version
    },
    environment: process.env.NODE_ENV
  };

  // Check database connectivity
  try {
    // Add database health check here
    healthData.database = 'connected';
  } catch (error) {
    healthData.database = 'disconnected';
    healthData.status = 'unhealthy';
  }

  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: healthData.status === 'healthy',
    data: healthData
  });
});

module.exports = router;
```

## Docker Configuration

### Dockerfile

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p database logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/app/data/database.sqlite
      - LOG_FILE=/app/logs/api.log
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
    restart: unless-stopped
```

## Testing Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### Test Setup

```javascript
// tests/setup.js
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = path.join(__dirname, '../database/test.sqlite');
process.env.LOG_LEVEL = 'error';

// Global test setup
beforeAll(async () => {
  // Initialize test database
  await require('../scripts/init-test-db');
});

afterAll(async () => {
  // Cleanup test database
  await require('../scripts/cleanup-test-db');
});
```

## Monitoring Configuration

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'local-backend-api',
    script: './src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server localhost:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location /api/ {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://api;
            access_log off;
        }
    }
}
```

## Troubleshooting

### Common Configuration Issues

**Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <process_id> /F
```

**Database Permission Issues**
```bash
# Fix database file permissions
chmod 664 database/database.sqlite
chown www-data:www-data database/database.sqlite
```

**Environment Variable Issues**
```bash
# Check loaded environment variables
node -e "console.log(process.env)" | grep API

# Validate .env file
cat .env | grep -v '^#' | grep -v '^$'
```

### Configuration Validation

```javascript
// scripts/validate-config.js
const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('Configuration validation passed');
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] SSL certificates installed (production)
- [ ] Firewall rules configured
- [ ] Monitoring tools set up

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] All API endpoints accessible
- [ ] Database connectivity verified
- [ ] Logs being written correctly
- [ ] Performance monitoring active

For specific deployment scenarios, refer to the deployment guide in the main documentation.