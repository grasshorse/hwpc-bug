# Dual Testing Architecture

This directory contains the implementation of the dual testing architecture that supports both isolated database testing and live production testing.

## Components

### Core Infrastructure

- **`types.ts`** - Core types and interfaces for the testing framework
- **`DataContextManager.ts`** - Base interface and implementation for managing test data contexts
- **`DatabaseContextManager.ts`** - Context manager for isolated testing mode
- **`ProductionTestDataManager.ts`** - Context manager for production testing mode
- **`IsolatedDataProvider.ts`** - Database state management for isolated testing

### Isolated Database Testing

The isolated database testing infrastructure allows you to:

1. Load predefined database states from backup files
2. Run tests against controlled data sets
3. Verify data integrity through validation queries
4. Restore database state after test completion

#### Usage Example

```typescript
import { DatabaseContextManager } from './DatabaseContextManager';
import { TestMode, TestConfig } from './types';

const manager = new DatabaseContextManager();

const config: TestConfig = {
  mode: TestMode.ISOLATED,
  databaseConfig: {
    backupPath: 'sample-backup.sql',
    connectionString: 'postgresql://localhost:5432/test_db',
    restoreTimeout: 30000,
    verificationQueries: [
      'SELECT COUNT(*) as customer_count FROM customers WHERE is_test_data = true',
      'SELECT COUNT(*) as route_count FROM routes WHERE is_test_data = true'
    ]
  },
  tags: ['@isolated'],
  retries: 3,
  timeout: 60000
};

// Setup test context
const context = await manager.setupContext(TestMode.ISOLATED, config);

// Validate context
const isValid = await manager.validateContext(context);

// Use context for testing...

// Cleanup when done
await manager.cleanupContext(context);
```

#### Backup File Formats

The system supports both SQL and JSON backup formats:

**SQL Format** (`.sql` files):
```sql
INSERT INTO customers (id, name, email, phone, is_test_data) VALUES 
('cust-001', 'Test Customer 1', 'test1@example.com', '555-0001', true);

INSERT INTO routes (id, name, location, is_test_data) VALUES 
('route-001', 'Test Route 1', 'Test Location 1', true);
```

**JSON Format** (`.json` files):
```json
{
  "customers": [
    {
      "id": "cust-001",
      "name": "Test Customer 1",
      "email": "test1@example.com",
      "phone": "555-0001",
      "is_test_data": true
    }
  ],
  "routes": [
    {
      "id": "route-001",
      "name": "Test Route 1",
      "location": "Test Location 1",
      "is_test_data": true
    }
  ]
}
```

#### Test Data Directory Structure

```
.kiro/test-data/isolated/
├── sample-backup.sql
├── sample-backup.json
├── customer-scenarios/
│   ├── basic-customers.sql
│   └── complex-customers.json
└── route-scenarios/
    ├── standard-routes.sql
    └── special-routes.json
```

### Key Features

1. **Database State Management**: Load and restore database states from backup files
2. **Connection Management**: Create isolated test database connections
3. **Data Verification**: Run verification queries to ensure data integrity
4. **Error Handling**: Comprehensive error handling with recovery mechanisms
5. **Cleanup Guarantees**: Automatic cleanup of test data and connections
6. **Multiple Formats**: Support for both SQL and JSON backup formats

### Testing

Run the tests to verify the implementation:

```bash
# Run IsolatedDataProvider tests
npx vitest run src/support/testing/__tests__/IsolatedDataProvider.test.ts

# Run DatabaseContextManager tests
npx vitest run src/support/testing/__tests__/DatabaseContextManager.test.ts

# Run all testing infrastructure tests
npx vitest run src/support/testing/__tests__/
```

### Next Steps

This implementation completes the isolated database testing infrastructure. The next tasks in the dual testing architecture include:

1. Implementing production test data management (LooneyTunesDataProvider)
2. Extending Cucumber framework for dual-mode support
3. Creating test configuration and environment management
4. Updating page objects for context awareness

See the `tasks.md` file in the spec directory for the complete implementation plan.