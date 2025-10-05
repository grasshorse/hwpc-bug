# Best Practices for Dual Testing Architecture

## Overview

This guide outlines best practices for effectively using the dual testing architecture. Following these practices will help ensure reliable, maintainable, and efficient tests across both isolated and production environments.

## Test Design Best Practices

### 1. Write Mode-Agnostic Tests

Design tests that work consistently across both testing modes:

**Good Practice:**
```gherkin
@dual
Scenario: User can navigate to customer details
  Given I am on the customers page
  When I click on the first customer in the list
  Then I should see the customer details page
  And the customer information should be displayed
```

**Avoid:**
```gherkin
# Too specific to one mode
Scenario: View John Doe customer details
  Given I am on the customers page
  When I click on "John Doe"
  Then I should see "John Doe" details
```

### 2. Use Appropriate Test Tags

Choose the right tag based on test requirements:

- **@dual**: Tests that work in both modes (navigation, UI functionality)
- **@isolated**: Tests requiring specific data states or edge cases
- **@production**: Tests validating real system integrations

```gherkin
@dual
Scenario: Basic navigation works
  # Tests that don't depend on specific data

@isolated
Scenario: Handle empty customer list
  # Tests requiring specific data states

@production
Scenario: Integration with external payment system
  # Tests requiring real system connections
```

### 3. Design Flexible Assertions

Create assertions that work with variable data:

**Good Practice:**
```typescript
Then('I should see customer information', async function() {
  // Flexible assertion that works with any customer
  const customerName = await this.page.textContent('[data-testid="customer-name"]');
  expect(customerName).toBeTruthy();
  expect(customerName.length).toBeGreaterThan(0);
  
  if (this.testMode === TestMode.PRODUCTION) {
    expect(customerName).toContain('looneyTunesTest');
  }
});
```

**Avoid:**
```typescript
Then('I should see customer information', async function() {
  // Too rigid - only works with specific data
  const customerName = await this.page.textContent('[data-testid="customer-name"]');
  expect(customerName).toBe('John Doe');
});
```

### 4. Handle Data Variability

Account for differences between isolated and production environments:

```typescript
class DataContext {
  getExpectedCustomerCount(): number {
    if (this.mode === TestMode.ISOLATED) {
      return 5; // Exact count in controlled environment
    } else {
      return this.getMinimumTestCustomers(); // Minimum expected in production
    }
  }

  validateCustomerData(customer: Customer): boolean {
    const baseValidation = customer.name && customer.email;
    
    if (this.mode === TestMode.PRODUCTION) {
      return baseValidation && customer.name.includes('looneyTunesTest');
    }
    
    return baseValidation;
  }
}
```

## Test Data Management

### 1. Isolated Test Data Organization

Structure isolated test data for maintainability:

```
.kiro/test-data/isolated/
├── baseline/                 # Standard dataset
│   ├── customers.sql
│   ├── routes.sql
│   └── tickets.sql
├── scenarios/
│   ├── empty-database/       # Edge case: no data
│   ├── large-dataset/        # Performance testing
│   ├── edge-cases/           # Boundary conditions
│   └── error-conditions/     # Error scenarios
└── verification/
    ├── queries.sql           # Data validation queries
    └── expected-results.json # Expected query results
```

### 2. Production Test Data Standards

Follow strict naming conventions for production test data:

**Customer Naming:**
```
[Character Name] - looneyTunesTest
Examples:
- Bugs Bunny - looneyTunesTest
- Daffy Duck - looneyTunesTest
- Porky Pig - looneyTunesTest
```

**Route Naming:**
```
[Location] Test Route - looneyTunesTest
Examples:
- Cedar Falls Test Route - looneyTunesTest
- Winfield Test Route - looneyTunesTest
- O'Fallon Test Route - looneyTunesTest
```

**Email Conventions:**
```
[character].[lastname]@looneytunestest.com
Examples:
- bugs.bunny@looneytunestest.com
- daffy.duck@looneytunestest.com
```

### 3. Data Lifecycle Management

Implement proper data lifecycle management:

```typescript
class ProductionTestDataManager {
  async ensureTestDataExists(): Promise<void> {
    const requiredCustomers = this.getRequiredTestCustomers();
    
    for (const customer of requiredCustomers) {
      const exists = await this.customerExists(customer.name);
      if (!exists) {
        await this.createTestCustomer(customer);
        console.log(`Created test customer: ${customer.name}`);
      }
    }
  }

  async validateTestDataIntegrity(): Promise<ValidationResult> {
    const issues: string[] = [];
    
    // Check naming conventions
    const customers = await this.getAllTestCustomers();
    for (const customer of customers) {
      if (!customer.name.includes('looneyTunesTest')) {
        issues.push(`Invalid customer name: ${customer.name}`);
      }
    }
    
    // Check data relationships
    const orphanedCustomers = await this.findOrphanedCustomers();
    if (orphanedCustomers.length > 0) {
      issues.push(`Found ${orphanedCustomers.length} customers without routes`);
    }
    
    return { valid: issues.length === 0, issues };
  }
}
```

### 4. Version Control for Test Data

Keep test data under version control:

```bash
# Include in repository
git add .kiro/test-data/isolated/
git add scripts/create-production-test-data.js

# Exclude sensitive data
echo "*.backup" >> .gitignore
echo "test-results/" >> .gitignore
```

## Performance Optimization

### 1. Database Loading Optimization

Optimize database operations for faster test execution:

```typescript
class OptimizedDatabaseLoader {
  private cache = new Map<string, DatabaseState>();

  async loadDatabaseState(scenario: string): Promise<void> {
    // Use cached state if available
    if (this.cache.has(scenario)) {
      await this.restoreFromCache(scenario);
      return;
    }

    // Load and cache for future use
    await this.loadFromBackup(scenario);
    await this.cacheCurrentState(scenario);
  }

  async loadIncrementally(changes: DatabaseChange[]): Promise<void> {
    // Apply only necessary changes instead of full restore
    for (const change of changes) {
      await this.applyChange(change);
    }
  }
}
```

### 2. Parallel Test Execution

Design tests for parallel execution:

```typescript
// Use unique test data identifiers
class TestDataGenerator {
  generateUniqueCustomer(): Customer {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      name: `Test Customer ${timestamp}-${random} - looneyTunesTest`,
      email: `test.${timestamp}.${random}@looneytunestest.com`
    };
  }
}
```

### 3. Resource Management

Implement efficient resource management:

```typescript
class ResourceManager {
  private connections = new Map<string, DatabaseConnection>();
  private browsers = new Map<string, Browser>();

  async getConnection(testId: string): Promise<DatabaseConnection> {
    if (!this.connections.has(testId)) {
      const connection = await this.createConnection();
      this.connections.set(testId, connection);
    }
    return this.connections.get(testId)!;
  }

  async cleanup(): Promise<void> {
    // Clean up all resources
    for (const [id, connection] of this.connections) {
      await connection.close();
    }
    this.connections.clear();

    for (const [id, browser] of this.browsers) {
      await browser.close();
    }
    this.browsers.clear();
  }
}
```

## Error Handling and Recovery

### 1. Graceful Degradation

Implement fallback strategies:

```typescript
class TestModeDetector {
  async detectMode(context: TestContext): Promise<TestMode> {
    try {
      // Try to detect from environment
      const envMode = this.detectFromEnvironment();
      if (envMode) return envMode;

      // Try to detect from test tags
      const tagMode = this.detectFromTags(context.tags);
      if (tagMode) return tagMode;

      // Fallback to safe default
      console.warn('Unable to detect test mode, falling back to isolated');
      return TestMode.ISOLATED;
    } catch (error) {
      console.error('Mode detection failed:', error);
      return TestMode.ISOLATED;
    }
  }
}
```

### 2. Retry Logic

Implement intelligent retry mechanisms:

```typescript
class RetryableOperation {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, backoffMs = 1000, retryCondition } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !this.shouldRetry(error, retryCondition)) {
          throw error;
        }

        const delay = backoffMs * Math.pow(2, attempt - 1);
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw new Error('Retry logic error'); // Should never reach here
  }

  private shouldRetry(error: Error, condition?: (error: Error) => boolean): boolean {
    if (condition) return condition(error);
    
    // Default retry conditions
    return error.message.includes('timeout') ||
           error.message.includes('connection') ||
           error.message.includes('network');
  }
}
```

### 3. Comprehensive Error Reporting

Provide detailed error information:

```typescript
class TestError extends Error {
  constructor(
    message: string,
    public readonly context: {
      testMode: TestMode;
      testId: string;
      dataContext?: DataContext;
      browserState?: BrowserState;
      timestamp: Date;
    }
  ) {
    super(message);
    this.name = 'TestError';
  }

  toDetailedString(): string {
    return `
TestError: ${this.message}
  Test Mode: ${this.context.testMode}
  Test ID: ${this.context.testId}
  Timestamp: ${this.context.timestamp.toISOString()}
  Data Context: ${this.context.dataContext ? 'Available' : 'Not Available'}
  Browser State: ${this.context.browserState ? 'Available' : 'Not Available'}
  Stack: ${this.stack}
    `.trim();
  }
}
```

## Security Best Practices

### 1. Production Data Protection

Ensure production tests don't affect real data:

```typescript
class ProductionSafetyValidator {
  validateTestOperation(operation: TestOperation): void {
    // Ensure operation only affects test data
    if (operation.targetEntity && !this.isTestEntity(operation.targetEntity)) {
      throw new Error(`Operation targets non-test entity: ${operation.targetEntity}`);
    }

    // Validate naming conventions
    if (operation.entityName && !operation.entityName.includes('looneyTunesTest')) {
      throw new Error(`Entity name doesn't follow test convention: ${operation.entityName}`);
    }
  }

  private isTestEntity(entity: any): boolean {
    return entity.name?.includes('looneyTunesTest') ||
           entity.email?.includes('looneytunestest.com') ||
           entity.identifier?.startsWith('test-');
  }
}
```

### 2. Credential Management

Handle credentials securely:

```typescript
class SecureConfigManager {
  getConnectionString(): string {
    // Use environment variables, not hardcoded values
    const connection = process.env.TEST_DB_CONNECTION;
    if (!connection) {
      throw new Error('TEST_DB_CONNECTION environment variable not set');
    }
    return connection;
  }

  getApiCredentials(): ApiCredentials {
    return {
      apiKey: process.env.TEST_API_KEY || '',
      secret: process.env.TEST_API_SECRET || '',
      endpoint: process.env.TEST_API_ENDPOINT || 'http://localhost:3000'
    };
  }
}
```

## Monitoring and Maintenance

### 1. Test Health Monitoring

Monitor test execution health:

```typescript
class TestHealthMonitor {
  private metrics = {
    executionTimes: new Map<string, number[]>(),
    failureRates: new Map<string, number>(),
    dataLoadTimes: new Map<string, number[]>()
  };

  recordTestExecution(testId: string, duration: number, success: boolean): void {
    // Record execution time
    if (!this.metrics.executionTimes.has(testId)) {
      this.metrics.executionTimes.set(testId, []);
    }
    this.metrics.executionTimes.get(testId)!.push(duration);

    // Update failure rate
    const currentRate = this.metrics.failureRates.get(testId) || 0;
    const newRate = success ? currentRate * 0.9 : currentRate * 0.9 + 0.1;
    this.metrics.failureRates.set(testId, newRate);
  }

  getHealthReport(): HealthReport {
    return {
      slowTests: this.identifySlowTests(),
      flakyTests: this.identifyFlakyTests(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

### 2. Automated Maintenance

Implement automated maintenance tasks:

```bash
#!/bin/bash
# maintenance.sh - Daily maintenance script

echo "Starting dual testing maintenance..."

# Validate production test data
npm run test:validate-production-data

# Clean up old test artifacts
find test-results -name "*.png" -mtime +7 -delete
find test-results -name "*.log" -mtime +7 -delete

# Update isolated test data if needed
if [ -f ".kiro/test-data/update-needed" ]; then
  npm run test:update-isolated-data
  rm .kiro/test-data/update-needed
fi

# Generate health report
npm run test:health-report

echo "Maintenance completed."
```

## Team Collaboration

### 1. Code Review Guidelines

Establish clear review criteria:

**Checklist for Test Reviews:**
- [ ] Appropriate test tags are used (@isolated, @production, @dual)
- [ ] Test works in both modes (if tagged as @dual)
- [ ] Production test data follows naming conventions
- [ ] Error handling is implemented
- [ ] Cleanup code is present and correct
- [ ] Assertions are flexible enough for production variability

### 2. Documentation Standards

Maintain consistent documentation:

```gherkin
Feature: Customer Management
  # Purpose: Validate customer CRUD operations
  # Modes: Both isolated and production
  # Dependencies: Customer test data, route test data
  # Maintenance: Update when customer schema changes

  Background:
    Given the system is properly configured for dual testing
    And the appropriate test data exists

  @dual
  Scenario: View customer list
    # Works in both modes - tests basic navigation
    Given I am on the dashboard
    When I navigate to customers
    Then I should see the customer list

  @isolated
  Scenario: Handle empty customer database
    # Requires controlled empty state - isolated only
    Given the customer database is empty
    When I navigate to customers
    Then I should see "No customers found" message
```

### 3. Knowledge Sharing

Establish knowledge sharing practices:

- **Weekly Test Reviews**: Review test failures and improvements
- **Documentation Updates**: Keep guides current with changes
- **Training Sessions**: Regular training on new features and best practices
- **Troubleshooting Database**: Maintain shared knowledge of common issues

## Continuous Improvement

### 1. Metrics Collection

Track key performance indicators:

```typescript
interface TestMetrics {
  executionTime: {
    isolated: number[];
    production: number[];
  };
  successRate: {
    isolated: number;
    production: number;
  };
  dataLoadTime: number[];
  errorFrequency: Map<string, number>;
}
```

### 2. Regular Reviews

Schedule regular architecture reviews:

- **Monthly**: Review test performance and failure patterns
- **Quarterly**: Assess architecture effectiveness and needed improvements
- **Annually**: Major architecture review and planning

### 3. Feedback Integration

Collect and act on team feedback:

```typescript
class FeedbackCollector {
  collectFeedback(testId: string, feedback: TestFeedback): void {
    // Store feedback for analysis
    this.feedbackStore.add({
      testId,
      feedback,
      timestamp: new Date(),
      userId: this.getCurrentUser()
    });
  }

  generateImprovementSuggestions(): Suggestion[] {
    // Analyze feedback patterns and suggest improvements
    return this.analyzeFeedbackPatterns();
  }
}
```

By following these best practices, teams can maximize the benefits of the dual testing architecture while maintaining reliable, efficient, and maintainable test suites.