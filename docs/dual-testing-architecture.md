# Dual Testing Architecture Documentation

## Overview

The Dual Testing Architecture enables seamless execution of tests in both isolated database environments and live production environments using identifiable test data. This system extends the existing Cucumber/Playwright framework to support automatic mode detection, data context switching, and consistent test execution across environments.

## Key Benefits

- **Flexibility**: Run the same tests in isolated or production environments
- **Data Safety**: Production tests use clearly identifiable test data that won't affect real customers
- **Automation**: Automatic mode detection based on environment variables and test tags
- **Consistency**: Same test logic works across both testing modes
- **Reliability**: Built-in error handling and recovery mechanisms

## Architecture Components

### 1. Mode Detection System

The `TestModeDetector` automatically determines the appropriate testing mode based on:
- Environment variables (`TEST_MODE`, `NODE_ENV`)
- Test tags (`@isolated`, `@production`, `@dual`)
- Configuration files
- Fallback to isolated mode when uncertain

### 2. Data Context Management

**Isolated Mode (`DatabaseContextManager`)**
- Loads predefined database states from backup files
- Manages database snapshots and restoration
- Provides data verification utilities
- Handles cleanup after test execution

**Production Mode (`ProductionTestDataManager`)**
- Manages looneyTunesTest entities (customers, routes, tickets)
- Validates test data existence and integrity
- Creates missing test entities when needed
- Ensures data follows naming conventions

### 3. Test Data Providers

**IsolatedDataProvider**
- Loads database dumps from `.kiro/test-data/isolated/`
- Provides data verification queries
- Manages test database connections
- Supports multiple database states per test scenario

**LooneyTunesDataProvider**
- Manages production test customers (Bugs Bunny, Daffy Duck, etc.)
- Handles test routes (Cedar Falls, Winfield, O'Fallon)
- Creates and maintains test tickets
- Ensures data visibility for human operators

## Testing Modes

### Isolated Testing Mode

**When to Use:**
- Testing specific data scenarios
- Validating data rendering and functionality
- Testing edge cases with controlled data
- Development and debugging

**How it Works:**
1. Test tagged with `@isolated` or environment set to isolated
2. System loads predefined database state
3. Test executes against controlled data
4. Database state is restored after test completion

**Example:**
```gherkin
@isolated
Scenario: Verify customer data rendering
  Given the system is in isolated mode
  When I navigate to the customers page
  Then I should see the expected customer data
```

### Production Testing Mode

**When to Use:**
- End-to-end validation in production environment
- Testing real system integrations
- Validating production performance
- Smoke testing after deployments

**How it Works:**
1. Test tagged with `@production` or environment set to production
2. System uses looneyTunesTest entities
3. Test executes against production system with test data
4. Test data remains for future test runs

**Example:**
```gherkin
@production
Scenario: Verify production customer workflow
  Given the system is in production mode
  When I create a new ticket for "Bugs Bunny - looneyTunesTest"
  Then the ticket should be created successfully
```

### Dual Mode Support

Tests can support both modes by using the `@dual` tag:

```gherkin
@dual
Scenario: Basic navigation functionality
  Given I am on the dashboard
  When I navigate to customers
  Then I should see the customers page
```

## Configuration

### Environment Variables

```bash
# Set testing mode explicitly
TEST_MODE=isolated  # or 'production'

# Node environment (affects default mode)
NODE_ENV=test      # defaults to isolated
NODE_ENV=production # defaults to production
```

### Test Configuration Files

Create mode-specific configuration in your test setup:

```typescript
// test-config.ts
export const testConfig = {
  isolated: {
    databaseConfig: {
      backupPath: '.kiro/test-data/isolated/',
      connectionString: process.env.TEST_DB_CONNECTION,
      restoreTimeout: 30000,
      verificationQueries: ['SELECT COUNT(*) FROM customers']
    }
  },
  production: {
    productionConfig: {
      testDataPrefix: 'looneyTunesTest',
      locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
      customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
      cleanupPolicy: 'preserve'
    }
  }
};
```

## Test Data Management

### Isolated Test Data

**Location:** `.kiro/test-data/isolated/`

**Structure:**
```
.kiro/test-data/isolated/
├── baseline/
│   ├── customers.sql
│   ├── routes.sql
│   └── tickets.sql
├── scenarios/
│   ├── empty-database/
│   ├── full-customer-set/
│   └── edge-cases/
└── verification/
    └── queries.sql
```

**Creating New Test Data:**
1. Create database state manually or through scripts
2. Export data to SQL files
3. Place in appropriate scenario folder
4. Add verification queries

### Production Test Data

**Naming Convention:** All production test entities must include "looneyTunesTest" in their name.

**Test Customers:**
- Bugs Bunny - looneyTunesTest
- Daffy Duck - looneyTunesTest
- Porky Pig - looneyTunesTest
- Tweety Bird - looneyTunesTest

**Test Routes:**
- Cedar Falls Test Route - looneyTunesTest
- Winfield Test Route - looneyTunesTest
- O'Fallon Test Route - looneyTunesTest

**Management Commands:**
```bash
# Create production test data
npm run test:create-production-data

# Validate production test data
npm run test:validate-production-data

# Clean up production test data (if needed)
npm run test:cleanup-production-data
```

## Running Tests

### Command Line Options

```bash
# Run all tests in isolated mode
npm run test:isolated

# Run all tests in production mode
npm run test:production

# Run specific feature in isolated mode
npm run test:isolated -- features/navigation.feature

# Run tests with specific tags
npm run test -- --tags "@isolated and @navigation"

# Run dual-mode tests in both environments
npm run test:dual
```

### NPM Scripts

The following scripts are available in `package.json`:

```json
{
  "scripts": {
    "test:isolated": "TEST_MODE=isolated cucumber-js",
    "test:production": "TEST_MODE=production cucumber-js",
    "test:dual": "npm run test:isolated && npm run test:production",
    "test:create-production-data": "node scripts/create-production-test-data.js",
    "test:validate-production-data": "node scripts/validate-production-test-data.js"
  }
}
```

## Error Handling and Recovery

### Common Error Scenarios

1. **Database Connection Failures**
   - Automatic retry with exponential backoff
   - Fallback to alternative database if available
   - Clear error messages with recovery suggestions

2. **Missing Test Data**
   - Automatic creation of missing production test entities
   - Validation of test data integrity
   - Rollback to known good state if corruption detected

3. **Mode Detection Issues**
   - Fallback to isolated mode when uncertain
   - Clear warnings about mode selection
   - Validation of mode compatibility with test requirements

### Recovery Mechanisms

- **Graceful Degradation**: Fall back to isolated mode if production data unavailable
- **Retry Logic**: Automatic retry for transient database/network issues
- **Context Preservation**: Maintain test context information in error reports
- **Cleanup Guarantee**: Ensure cleanup runs even after test failures

## Monitoring and Debugging

### Test Execution Logs

The system provides detailed logging for:
- Mode detection decisions
- Data context setup and teardown
- Test data validation results
- Error conditions and recovery actions

### Debug Mode

Enable debug mode for detailed information:

```bash
DEBUG=dual-testing npm run test:isolated
```

### Performance Monitoring

Track key metrics:
- Database loading times
- Test execution duration by mode
- Data validation performance
- Error rates and recovery success

## Best Practices

### Test Design

1. **Write Mode-Agnostic Tests**: Design tests that work in both modes
2. **Use Appropriate Tags**: Tag tests with `@isolated`, `@production`, or `@dual`
3. **Validate Assumptions**: Don't assume specific data exists in production
4. **Handle Variability**: Production data may change; write flexible assertions

### Data Management

1. **Keep Test Data Minimal**: Only create necessary test entities
2. **Use Clear Naming**: Always include "looneyTunesTest" in production test data
3. **Regular Validation**: Periodically validate test data integrity
4. **Version Control**: Keep isolated test data in version control

### Performance

1. **Optimize Database Loading**: Use efficient backup/restore mechanisms
2. **Parallel Execution**: Design tests for parallel execution when possible
3. **Resource Cleanup**: Always clean up resources after tests
4. **Monitor Performance**: Track and optimize slow operations

### Security

1. **Protect Production**: Ensure production tests can't affect real data
2. **Secure Credentials**: Use secure methods for database credentials
3. **Audit Trail**: Log all production test activities
4. **Access Control**: Limit who can run production tests

## Team Workflow

### Development Process

1. **Write Tests**: Create tests with appropriate mode tags
2. **Test Locally**: Run in isolated mode during development
3. **Validate Production**: Run in production mode before deployment
4. **Monitor Results**: Check test results and performance metrics

### Code Review Guidelines

- Verify appropriate test tags are used
- Check that tests work in both modes (if tagged as dual)
- Ensure production test data follows naming conventions
- Validate error handling and cleanup logic

### Deployment Process

1. **Pre-deployment**: Run full test suite in production mode
2. **Post-deployment**: Run smoke tests in production mode
3. **Monitor**: Watch for test failures or performance issues
4. **Rollback**: Have rollback plan if tests fail consistently

## Related Documentation

### Complete Documentation Suite

This documentation is part of a comprehensive suite of guides for the dual testing architecture:

1. **[Dual Testing Architecture](./dual-testing-architecture.md)** (this document) - Main architecture overview and usage guide
2. **[Migration Guide](./dual-testing-migration-guide.md)** - Step-by-step instructions for converting existing tests
3. **[Troubleshooting Guide](./dual-testing-troubleshooting.md)** - Solutions to common issues and error scenarios
4. **[Best Practices Guide](./dual-testing-best-practices.md)** - Comprehensive best practices for test data management and implementation
5. **[Team Training Guide](./dual-testing-training.md)** - Complete training materials and exercises for team onboarding

### Quick Reference Links

- **Getting Started**: See [Migration Guide](./dual-testing-migration-guide.md) for converting your first test
- **Having Issues?**: Check the [Troubleshooting Guide](./dual-testing-troubleshooting.md) for solutions
- **Best Practices**: Review the [Best Practices Guide](./dual-testing-best-practices.md) for optimization tips
- **Team Training**: Use the [Training Guide](./dual-testing-training.md) for comprehensive team education