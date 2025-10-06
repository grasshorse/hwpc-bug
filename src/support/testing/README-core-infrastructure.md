# Core Test Data Independence Infrastructure

This document describes the core infrastructure components that enable test data independence in the dual-testing architecture.

## Overview

The core infrastructure provides a comprehensive system for managing test data lifecycle, ensuring tests can create their own data and clean up after themselves, making the test suite independent of database state.

## Core Components

### 1. TestDataFactory Interface

**File:** `TestDataFactory.ts`

Provides factory methods for creating test data in both isolated and production modes.

```typescript
import { TestDataFactory, BaseTestDataFactory, TestMode } from './TestDataFactory';

// Create a factory instance
const factory = new ConcreteTestDataFactory('test_123');

// Create customers with mode-appropriate naming
const customers = await factory.createCustomers(5, TestMode.PRODUCTION, {
  looneyTunesCharacter: 'Bugs Bunny'
});
```

**Key Features:**
- Dual-mode support (isolated vs production)
- Mode-aware naming conventions
- Validation of test data naming
- Data creation tracking

### 2. TestContextManager

**File:** `TestContextManager.ts`

Manages test context with mode detection and data registry.

```typescript
import { TestContextManager } from './TestContextManager';

const contextManager = new TestContextManager({
  enableProductionSafety: true,
  autoCleanup: true,
  trackDataCreation: true
});

// Initialize context with mode detection from tags
const context = await contextManager.initializeContext(
  'my-test-scenario',
  ['@production', '@customer-management']
);

// Register created data for cleanup tracking
await contextManager.registerCreatedData(context.testId, 'customers', createdCustomers);

// Execute cleanup when test completes
await contextManager.executeCleanup(context.testId);
```

**Key Features:**
- Automatic mode detection from tags (@isolated, @production, @dual)
- Data registry for tracking created entities
- Cleanup task scheduling and execution
- Production safety validation

### 3. IsolationManager

**File:** `IsolationManager.ts`

Handles data isolation with mode-specific naming strategies.

```typescript
import { IsolationManager, TestMode } from './IsolationManager';

const isolationManager = new IsolationManager();

// Generate unique names based on mode
const isolatedName = isolationManager.createIsolatedName(
  'customer',
  'test_123_sample_abc',
  TestMode.ISOLATED
);
// Result: "test_1699123456_abc_customer"

const productionName = isolationManager.createProductionTestName('customer');
// Result: "Bugs Bunny - looneyTunesTest"

// Validate naming conventions
const validation = isolationManager.validateLooneyTunesNaming(testData);
```

**Key Features:**
- Dual naming strategies (unique IDs vs looneyTunesTest)
- Validation for naming convention compliance
- Conflict detection for parallel test execution
- Production safety validation

### 4. CleanupService

**File:** `CleanupService.ts`

Manages test data cleanup with production safety validation.

```typescript
import { CleanupService } from './CleanupService';

const cleanupService = new CleanupService({
  enableProductionSafety: true,
  maxRetries: 3,
  batchSize: 10
});

// Register cleanup task
await cleanupService.registerCleanupTask({
  type: 'delete',
  entityType: 'customers',
  entityIds: ['test_123_customer_1', 'test_123_customer_2'],
  priority: 1,
  maxRetries: 2,
  testId: 'test_123_sample',
  mode: TestMode.ISOLATED
});

// Execute cleanup
const result = await cleanupService.executeCleanup('test_123_sample');
console.log(`Cleanup: ${result.completedTasks}/${result.completedTasks + result.failedTasks} successful`);
```

**Key Features:**
- Production safety validation
- Retry logic for failed operations
- Batch processing for performance
- Comprehensive error handling and reporting

### 5. ProductionSafetyValidator

**File:** `ProductionSafetyValidator.ts`

Validates operations to ensure production safety.

```typescript
import { ProductionSafetyValidator, TestMode } from './ProductionSafetyValidator';

const validator = new ProductionSafetyValidator();

const operation = {
  type: 'delete',
  entityType: 'customer',
  entityName: 'Bugs Bunny - looneyTunesTest'
};

const validation = validator.validateTestOperation(operation, TestMode.PRODUCTION);
if (!validation.isValid) {
  console.error('Unsafe operation:', validation.issues);
}
```

**Key Features:**
- looneyTunesTest naming validation
- Dangerous pattern detection
- Risk level assessment
- Bulk operation validation

## Usage Patterns

### Basic Test Data Creation

```typescript
// 1. Initialize context
const context = await contextManager.initializeContext('my-test', ['@isolated']);

// 2. Create test data
const customers = await factory.createCustomers(3, context.mode);

// 3. Register for cleanup
await contextManager.registerCreatedData(context.testId, 'customers', customers);

// 4. Use data in test...

// 5. Cleanup (automatic if autoCleanup enabled)
await contextManager.executeCleanup(context.testId);
```

### Production Mode Testing

```typescript
// Production mode uses looneyTunesTest naming conventions
const context = await contextManager.initializeContext('prod-test', ['@production']);

const customers = await factory.createCustomers(2, TestMode.PRODUCTION, {
  looneyTunesCharacter: 'Daffy Duck'
});
// Creates: "Daffy Duck - looneyTunesTest" with email "daffy.duck@looneytunestest.com"
```

### Error Handling

```typescript
try {
  const result = await cleanupService.executeCleanup(testId);
  if (!result.success) {
    console.error(`Cleanup failed: ${result.errors.length} errors`);
    // Retry failed tasks
    await cleanupService.retryFailedCleanup(testId);
  }
} catch (error) {
  console.error('Cleanup error:', error.message);
}
```

## Integration with Existing Architecture

The core infrastructure integrates seamlessly with existing components:

- **ProductionTestDataManager**: Enhanced with new factory patterns
- **GeographicTestDataGenerator**: Uses new cleanup tracking
- **Dual-testing patterns**: Maintains @isolated/@production tag support
- **looneyTunesTest conventions**: Enforced in production mode

## Testing

Run the integration tests to verify the infrastructure:

```bash
npx vitest run src/support/testing/__tests__/core-infrastructure-integration.test.ts
```

## Configuration

### TestContextManager Options

```typescript
interface TestContextManagerOptions {
  enableProductionSafety?: boolean; // Default: true
  autoCleanup?: boolean;            // Default: true
  trackDataCreation?: boolean;      // Default: true
}
```

### CleanupService Options

```typescript
interface CleanupServiceOptions {
  enableProductionSafety?: boolean; // Default: true
  maxRetries?: number;              // Default: 3
  retryDelay?: number;              // Default: 1000ms
  batchSize?: number;               // Default: 10
  enableLogging?: boolean;          // Default: true
}
```

## Best Practices

1. **Always initialize context** before creating test data
2. **Register all created data** for proper cleanup tracking
3. **Use appropriate mode** (@isolated for parallel tests, @production for integration)
4. **Validate naming conventions** in production mode
5. **Handle cleanup failures** gracefully with retry logic
6. **Monitor cleanup statistics** for performance optimization

## Troubleshooting

### Common Issues

1. **Test data not cleaned up**: Check if cleanup tasks are registered properly
2. **Naming convention violations**: Ensure looneyTunesTest patterns in production mode
3. **Production safety errors**: Validate that operations only target test data
4. **Isolation conflicts**: Use unique test IDs and proper prefixes

### Debug Information

```typescript
// Get cleanup status
const status = cleanupService.getCleanupStatus(testId);
console.log('Cleanup status:', status);

// Get statistics
const stats = cleanupService.getStatistics();
console.log('Cleanup statistics:', stats);

// Get active contexts
const contexts = contextManager.getAllActiveContexts();
console.log('Active contexts:', contexts.length);
```