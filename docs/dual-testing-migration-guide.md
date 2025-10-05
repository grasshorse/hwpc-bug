# Migration Guide: Converting Tests to Dual Testing Architecture

## Overview

This guide provides step-by-step instructions for converting existing tests to use the new dual testing architecture. The migration process is designed to be incremental and backward-compatible, allowing teams to migrate tests gradually while maintaining existing functionality.

## Migration Strategy

### Phase 1: Assessment and Planning
1. **Inventory Existing Tests**: Catalog all current test files and scenarios
2. **Identify Test Types**: Classify tests by their data requirements and scope
3. **Plan Migration Order**: Prioritize tests based on complexity and importance
4. **Set Up Infrastructure**: Ensure dual testing infrastructure is properly configured

### Phase 2: Infrastructure Setup
1. **Install Dependencies**: Update test framework dependencies
2. **Configure Environments**: Set up isolated and production test environments
3. **Create Test Data**: Prepare isolated test data and production test entities
4. **Update Build Scripts**: Modify npm scripts and CI/CD pipelines

### Phase 3: Test Migration
1. **Start with Simple Tests**: Begin with navigation and UI tests
2. **Migrate Data-Dependent Tests**: Convert tests that rely on specific data
3. **Update API Tests**: Modify tests that interact with backend services
4. **Validate Functionality**: Ensure migrated tests work in both modes

### Phase 4: Cleanup and Optimization
1. **Remove Legacy Code**: Clean up old test infrastructure
2. **Optimize Performance**: Tune database loading and test execution
3. **Update Documentation**: Ensure all documentation reflects new architecture
4. **Train Team**: Provide training on new testing approach

## Pre-Migration Checklist

Before starting the migration, ensure the following are in place:

- [ ] Dual testing infrastructure is installed and configured
- [ ] Test databases are set up for isolated mode
- [ ] Production test data (looneyTunesTest entities) exists
- [ ] Environment variables are configured
- [ ] Team has been trained on new architecture
- [ ] Backup of existing tests is created

## Step-by-Step Migration Process

### Step 1: Update Test Infrastructure

#### 1.1 Update Package Dependencies

Ensure your `package.json` includes the necessary dependencies:

```json
{
  "devDependencies": {
    "@cucumber/cucumber": "^9.0.0",
    "@playwright/test": "^1.40.0",
    "typescript": "^5.0.0"
  }
}
```

#### 1.2 Update Cucumber Configuration

Modify `cucumber.js` to support dual-mode execution:

```javascript
// cucumber.js
const config = {
  default: {
    require: [
      'src/support/hooks.ts',
      'src/support/world.ts',
      'src/support/steps/**/*.ts'
    ],
    format: [
      'progress-bar',
      'json:test-results/cucumber-report.json',
      'html:test-results/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    worldParameters: {
      testMode: process.env.TEST_MODE || 'isolated'
    }
  }
};

module.exports = config;
```

#### 1.3 Update NPM Scripts

Add new scripts to `package.json`:

```json
{
  "scripts": {
    "test": "cucumber-js",
    "test:isolated": "TEST_MODE=isolated cucumber-js",
    "test:production": "TEST_MODE=production cucumber-js",
    "test:dual": "npm run test:isolated && npm run test:production",
    "test:create-production-data": "node scripts/create-production-test-data.js",
    "test:validate-production-data": "node scripts/validate-production-test-data.js"
  }
}
```

### Step 2: Migrate Feature Files

#### 2.1 Add Mode Tags to Scenarios

**Before (existing test):**
```gherkin
Feature: Customer Management

Scenario: View customer list
  Given I am on the dashboard
  When I navigate to customers
  Then I should see the customer list
```

**After (migrated test):**
```gherkin
Feature: Customer Management

@dual
Scenario: View customer list
  Given I am on the dashboard
  When I navigate to customers
  Then I should see the customer list

@isolated
Scenario: View specific customer data
  Given I am on the dashboard
  When I navigate to customers
  Then I should see customer "John Doe"
  And the customer should have email "john@example.com"

@production
Scenario: Create new customer ticket
  Given I am on the dashboard
  When I create a ticket for "Bugs Bunny - looneyTunesTest"
  Then the ticket should be created successfully
```

#### 2.2 Update Data-Specific Scenarios

For tests that depend on specific data, create separate scenarios for each mode:

**Before:**
```gherkin
Scenario: Edit customer information
  Given I am viewing customer "Test Customer"
  When I update the customer email to "newemail@example.com"
  Then the customer email should be updated
```

**After:**
```gherkin
@isolated
Scenario: Edit customer information in isolated mode
  Given I am viewing customer "Test Customer"
  When I update the customer email to "newemail@example.com"
  Then the customer email should be updated

@production
Scenario: Edit customer information in production mode
  Given I am viewing customer "Bugs Bunny - looneyTunesTest"
  When I update the customer email to "bugs.bunny.test@example.com"
  Then the customer email should be updated
```

### Step 3: Update Step Definitions

#### 3.1 Make Steps Context-Aware

**Before:**
```typescript
// steps/customer-steps.ts
Given('I am viewing customer {string}', async function(customerName: string) {
  await this.customerPage.searchForCustomer(customerName);
  await this.customerPage.selectCustomer(customerName);
});
```

**After:**
```typescript
// steps/customer-steps.ts
Given('I am viewing customer {string}', async function(customerName: string) {
  // Get the appropriate customer name based on test mode
  const contextualCustomerName = this.dataContext.getCustomerName(customerName);
  await this.customerPage.searchForCustomer(contextualCustomerName);
  await this.customerPage.selectCustomer(contextualCustomerName);
});
```

#### 3.2 Update Data Creation Steps

**Before:**
```typescript
When('I create a new customer with name {string}', async function(name: string) {
  await this.customerPage.createCustomer({ name, email: `${name}@example.com` });
});
```

**After:**
```typescript
When('I create a new customer with name {string}', async function(name: string) {
  const customerData = this.dataContext.createCustomerData(name);
  await this.customerPage.createCustomer(customerData);
});
```

### Step 4: Update Page Objects

#### 4.1 Make Page Objects Context-Aware

**Before:**
```typescript
// pages/CustomerPage.ts
export class CustomerPage {
  constructor(private page: Page) {}

  async searchForCustomer(name: string) {
    await this.page.fill('[data-testid="customer-search"]', name);
    await this.page.click('[data-testid="search-button"]');
  }
}
```

**After:**
```typescript
// pages/CustomerPage.ts
export class CustomerPage {
  constructor(
    private page: Page,
    private dataContext: DataContext
  ) {}

  async searchForCustomer(name: string) {
    const searchTerm = this.dataContext.getSearchTerm(name);
    await this.page.fill('[data-testid="customer-search"]', searchTerm);
    await this.page.click('[data-testid="search-button"]');
  }

  async createCustomer(customerData: CustomerData) {
    const contextualData = this.dataContext.prepareCustomerData(customerData);
    await this.page.fill('[data-testid="customer-name"]', contextualData.name);
    await this.page.fill('[data-testid="customer-email"]', contextualData.email);
    await this.page.click('[data-testid="save-button"]');
  }
}
```

### Step 5: Update World/Context Setup

#### 5.1 Modify World Class

**Before:**
```typescript
// support/world.ts
export class CustomWorld extends World {
  public page!: Page;
  public customerPage!: CustomerPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}
```

**After:**
```typescript
// support/world.ts
export class CustomWorld extends World {
  public page!: Page;
  public customerPage!: CustomerPage;
  public dataContext!: DataContext;
  public testMode!: TestMode;

  constructor(options: IWorldOptions) {
    super(options);
    this.testMode = options.parameters.testMode || TestMode.ISOLATED;
  }
}
```

#### 5.2 Update Hooks

**Before:**
```typescript
// support/hooks.ts
Before(async function(this: CustomWorld) {
  this.page = await browser.newPage();
  this.customerPage = new CustomerPage(this.page);
});
```

**After:**
```typescript
// support/hooks.ts
Before(async function(this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Detect test mode
  const modeDetector = new TestModeDetector();
  this.testMode = modeDetector.detectMode(scenario);

  // Setup data context
  const contextManager = new DataContextManager();
  this.dataContext = await contextManager.setupContext(this.testMode, testConfig);

  // Initialize page objects with context
  this.page = await browser.newPage();
  this.customerPage = new CustomerPage(this.page, this.dataContext);
});

After(async function(this: CustomWorld) {
  if (this.dataContext) {
    await this.dataContext.cleanup();
  }
  if (this.page) {
    await this.page.close();
  }
});
```

## Migration Examples

### Example 1: Simple Navigation Test

**Original Test:**
```gherkin
Feature: Navigation

Scenario: Navigate to customers page
  Given I am on the dashboard
  When I click on "Customers"
  Then I should be on the customers page
```

**Migrated Test:**
```gherkin
Feature: Navigation

@dual
Scenario: Navigate to customers page
  Given I am on the dashboard
  When I click on "Customers"
  Then I should be on the customers page
```

**Changes Made:**
- Added `@dual` tag to indicate test works in both modes
- No step definition changes needed (navigation is mode-independent)

### Example 2: Data-Dependent Test

**Original Test:**
```gherkin
Scenario: View customer details
  Given I am on the customers page
  When I click on customer "John Doe"
  Then I should see customer details for "John Doe"
```

**Migrated Test:**
```gherkin
@isolated
Scenario: View customer details in isolated mode
  Given I am on the customers page
  When I click on customer "John Doe"
  Then I should see customer details for "John Doe"

@production
Scenario: View customer details in production mode
  Given I am on the customers page
  When I click on customer "Bugs Bunny - looneyTunesTest"
  Then I should see customer details for "Bugs Bunny - looneyTunesTest"
```

**Changes Made:**
- Split into two scenarios for different modes
- Updated customer names for production mode
- Added appropriate tags

### Example 3: API Test Migration

**Original Test:**
```gherkin
Scenario: Create customer via API
  When I send a POST request to "/api/customers" with:
    | name  | John Doe           |
    | email | john@example.com   |
  Then the response status should be 201
  And the customer should be created
```

**Migrated Test:**
```gherkin
@dual
Scenario: Create customer via API
  When I send a POST request to "/api/customers" with context-appropriate data
  Then the response status should be 201
  And the customer should be created with the correct data
```

**Updated Step Definition:**
```typescript
When('I send a POST request to {string} with context-appropriate data', 
  async function(endpoint: string) {
    const customerData = this.dataContext.generateCustomerData();
    const response = await this.apiClient.post(endpoint, customerData);
    this.lastResponse = response;
  }
);
```

## Common Migration Patterns

### Pattern 1: Conditional Data Selection

```typescript
// In step definitions or page objects
const getCustomerName = (baseName: string, mode: TestMode): string => {
  if (mode === TestMode.PRODUCTION) {
    return `${baseName} - looneyTunesTest`;
  }
  return baseName;
};
```

### Pattern 2: Mode-Specific Assertions

```typescript
Then('the customer should be created with the correct data', async function() {
  if (this.testMode === TestMode.PRODUCTION) {
    // More flexible assertions for production
    expect(this.lastResponse.data.name).toContain('looneyTunesTest');
  } else {
    // Exact assertions for isolated mode
    expect(this.lastResponse.data.name).toBe('John Doe');
  }
});
```

### Pattern 3: Context-Aware Data Generation

```typescript
class DataContext {
  generateCustomerData(): CustomerData {
    if (this.mode === TestMode.PRODUCTION) {
      return {
        name: `${this.getRandomCharacter()} - looneyTunesTest`,
        email: `test.${Date.now()}@looneytunestest.com`,
        phone: '555-TEST-001'
      };
    } else {
      return {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-123-4567'
      };
    }
  }
}
```

## Validation and Testing

### Validate Migration Success

After migrating each test, validate that it works correctly:

1. **Run in Isolated Mode:**
   ```bash
   npm run test:isolated -- features/your-feature.feature
   ```

2. **Run in Production Mode:**
   ```bash
   npm run test:production -- features/your-feature.feature
   ```

3. **Run Dual Mode Tests:**
   ```bash
   npm run test:dual -- --tags "@dual"
   ```

### Common Validation Checks

- [ ] Test passes in both modes (for dual-tagged tests)
- [ ] Test uses appropriate data for each mode
- [ ] Assertions are flexible enough for production variability
- [ ] Cleanup occurs properly after test execution
- [ ] Error handling works correctly in both modes

## Rollback Plan

If issues arise during migration, you can rollback using these steps:

1. **Revert Feature Files**: Restore original feature files from backup
2. **Restore Step Definitions**: Revert step definition changes
3. **Update Configuration**: Remove dual-mode configuration
4. **Run Original Tests**: Verify original functionality works

## Performance Considerations

### Database Loading Optimization

- Use incremental database loading when possible
- Cache database states between test runs
- Optimize backup/restore operations
- Monitor database loading times

### Test Execution Optimization

- Run isolated tests in parallel when possible
- Batch production tests to minimize setup/teardown
- Use test data pooling for production mode
- Monitor overall test execution time

## Troubleshooting Migration Issues

### Common Issues and Solutions

1. **Test Fails in Production Mode**
   - Check that production test data exists
   - Verify naming conventions are followed
   - Ensure assertions are flexible enough

2. **Database Loading Errors**
   - Verify database connection strings
   - Check backup file integrity
   - Ensure proper permissions

3. **Mode Detection Issues**
   - Verify environment variables are set correctly
   - Check test tags are properly formatted
   - Validate configuration files

4. **Data Context Errors**
   - Ensure data context is properly initialized
   - Check cleanup methods are called
   - Verify error handling is implemented

### Getting Help

- Check the [Troubleshooting Guide](./dual-testing-troubleshooting.md)
- Review test execution logs for detailed error information
- Contact the testing team for migration assistance
- Refer to the [Team Training Guide](./dual-testing-training.md) for additional resources

## Best Practices for Migration

1. **Start Small**: Begin with simple, non-data-dependent tests
2. **Test Thoroughly**: Validate each migrated test in both modes
3. **Document Changes**: Keep track of migration decisions and patterns
4. **Collaborate**: Work with team members to establish consistent patterns
5. **Monitor Performance**: Track test execution times and optimize as needed
6. **Maintain Backward Compatibility**: Ensure existing functionality continues to work during transition