# Dual Testing Architecture Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the dual testing architecture. Issues are organized by category with detailed diagnostic steps and solutions.

## Quick Diagnostic Checklist

When encountering issues, start with this quick checklist:

- [ ] Environment variables are set correctly (`TEST_MODE`, `NODE_ENV`)
- [ ] Test tags are properly formatted (`@isolated`, `@production`, `@dual`)
- [ ] Database connections are working
- [ ] Test data exists and follows naming conventions
- [ ] Dependencies are installed and up to date
- [ ] Configuration files are valid

## Mode Detection Issues

### Issue: Test runs in wrong mode

**Symptoms:**
- Test executes in isolated mode when production expected
- Test executes in production mode when isolated expected
- Mode detection logs show unexpected mode selection

**Diagnostic Steps:**
1. Check environment variables:
   ```bash
   echo $TEST_MODE
   echo $NODE_ENV
   ```

2. Verify test tags in feature file:
   ```gherkin
   @isolated  # Should force isolated mode
   @production # Should force production mode
   @dual      # Should use environment default
   ```

3. Check configuration loading:
   ```bash
   DEBUG=dual-testing npm run test -- --dry-run
   ```

**Solutions:**

1. **Set explicit environment variable:**
   ```bash
   TEST_MODE=isolated npm run test
   TEST_MODE=production npm run test
   ```

2. **Fix test tags:**
   ```gherkin
   # Correct format
   @isolated
   Scenario: My test scenario
   
   # Incorrect format (will be ignored)
   # @isolated
   Scenario: My test scenario
   ```

3. **Update configuration:**
   ```typescript
   // Ensure mode detector is properly configured
   const modeDetector = new TestModeDetector({
     defaultMode: TestMode.ISOLATED,
     environmentVariable: 'TEST_MODE',
     fallbackMode: TestMode.ISOLATED
   });
   ```

### Issue: Mode detection fails with error

**Symptoms:**
- Error: "Unable to determine test mode"
- Tests fail to start
- Mode detector throws exceptions

**Diagnostic Steps:**
1. Check for conflicting tags:
   ```gherkin
   @isolated @production  # This is invalid
   Scenario: Conflicting tags
   ```

2. Verify configuration syntax:
   ```typescript
   // Check for syntax errors in config files
   node -c test-config.js
   ```

**Solutions:**

1. **Remove conflicting tags:**
   ```gherkin
   # Use only one mode tag per scenario
   @isolated
   Scenario: Isolated test
   
   @production  
   Scenario: Production test
   ```

2. **Add fallback configuration:**
   ```typescript
   const config = {
     defaultMode: TestMode.ISOLATED,
     strictMode: false, // Allow fallback on detection failure
     validateTags: true
   };
   ```

## Database Connection Issues

### Issue: Cannot connect to test database

**Symptoms:**
- Error: "Connection refused" or "Database not found"
- Tests timeout during database setup
- Database loading fails

**Diagnostic Steps:**
1. Test database connection manually:
   ```bash
   # For PostgreSQL
   psql -h localhost -U testuser -d testdb
   
   # For MySQL
   mysql -h localhost -u testuser -p testdb
   ```

2. Check connection string format:
   ```bash
   echo $TEST_DB_CONNECTION
   # Should be: postgresql://user:pass@host:port/dbname
   ```

3. Verify database exists:
   ```sql
   SHOW DATABASES; -- MySQL
   \l              -- PostgreSQL
   ```

**Solutions:**

1. **Fix connection string:**
   ```bash
   # Correct format examples
   export TEST_DB_CONNECTION="postgresql://testuser:testpass@localhost:5432/testdb"
   export TEST_DB_CONNECTION="mysql://testuser:testpass@localhost:3306/testdb"
   ```

2. **Create missing database:**
   ```sql
   CREATE DATABASE testdb;
   GRANT ALL PRIVILEGES ON testdb.* TO 'testuser'@'localhost';
   ```

3. **Update connection configuration:**
   ```typescript
   const dbConfig = {
     connectionString: process.env.TEST_DB_CONNECTION,
     retries: 3,
     timeout: 30000,
     pool: {
       min: 1,
       max: 5
     }
   };
   ```

### Issue: Database loading/restoration fails

**Symptoms:**
- Error: "Failed to load database backup"
- Tests start but data is missing
- Database restore timeout

**Diagnostic Steps:**
1. Check backup file exists and is readable:
   ```bash
   ls -la .kiro/test-data/isolated/
   file .kiro/test-data/isolated/backup.sql
   ```

2. Verify backup file format:
   ```bash
   head -n 20 .kiro/test-data/isolated/backup.sql
   ```

3. Test manual restore:
   ```bash
   psql -d testdb < .kiro/test-data/isolated/backup.sql
   ```

**Solutions:**

1. **Fix backup file permissions:**
   ```bash
   chmod 644 .kiro/test-data/isolated/*.sql
   ```

2. **Regenerate backup files:**
   ```bash
   # Create new backup
   pg_dump testdb > .kiro/test-data/isolated/backup.sql
   ```

3. **Increase timeout values:**
   ```typescript
   const config = {
     restoreTimeout: 60000, // Increase from 30s to 60s
     retries: 3,
     validateAfterRestore: true
   };
   ```

## Production Test Data Issues

### Issue: Production test data not found

**Symptoms:**
- Error: "Test customer not found"
- Production tests fail with missing data
- Cannot find looneyTunesTest entities

**Diagnostic Steps:**
1. Check if test data exists:
   ```sql
   SELECT * FROM customers WHERE name LIKE '%looneyTunesTest%';
   SELECT * FROM routes WHERE name LIKE '%looneyTunesTest%';
   ```

2. Verify naming conventions:
   ```sql
   -- Correct format
   SELECT * FROM customers WHERE name = 'Bugs Bunny - looneyTunesTest';
   
   -- Check for variations
   SELECT * FROM customers WHERE name LIKE '%Bugs Bunny%';
   ```

**Solutions:**

1. **Create missing test data:**
   ```bash
   npm run test:create-production-data
   ```

2. **Manual data creation:**
   ```sql
   INSERT INTO customers (name, email, phone) VALUES 
   ('Bugs Bunny - looneyTunesTest', 'bugs.bunny@looneytunestest.com', '555-BUGS-001'),
   ('Daffy Duck - looneyTunesTest', 'daffy.duck@looneytunestest.com', '555-DAFFY-001');
   ```

3. **Update test to create data if missing:**
   ```typescript
   Before(async function() {
     if (this.testMode === TestMode.PRODUCTION) {
       await this.dataContext.ensureTestDataExists();
     }
   });
   ```

### Issue: Production test data validation fails

**Symptoms:**
- Error: "Test data integrity check failed"
- Tests pass but data is inconsistent
- Warning: "Test data may be corrupted"

**Diagnostic Steps:**
1. Run data validation:
   ```bash
   npm run test:validate-production-data
   ```

2. Check data relationships:
   ```sql
   -- Verify test customers have valid routes
   SELECT c.name, r.name 
   FROM customers c 
   LEFT JOIN routes r ON c.route_id = r.id 
   WHERE c.name LIKE '%looneyTunesTest%';
   ```

**Solutions:**

1. **Fix data relationships:**
   ```sql
   -- Update orphaned customers
   UPDATE customers 
   SET route_id = (SELECT id FROM routes WHERE name LIKE '%Cedar Falls%looneyTunesTest%' LIMIT 1)
   WHERE name LIKE '%looneyTunesTest%' AND route_id IS NULL;
   ```

2. **Recreate test data:**
   ```bash
   npm run test:cleanup-production-data
   npm run test:create-production-data
   ```

## Test Execution Issues

### Issue: Tests fail inconsistently

**Symptoms:**
- Tests pass sometimes, fail other times
- Different results between isolated and production modes
- Timing-related failures

**Diagnostic Steps:**
1. Check for race conditions:
   ```typescript
   // Look for missing awaits
   await this.page.click('[data-testid="button"]');
   await this.page.waitForSelector('[data-testid="result"]'); // Add this
   ```

2. Verify data cleanup:
   ```typescript
   After(async function() {
     // Ensure cleanup always runs
     await this.dataContext.cleanup();
   });
   ```

**Solutions:**

1. **Add explicit waits:**
   ```typescript
   // Wait for elements to be ready
   await this.page.waitForSelector('[data-testid="element"]', { state: 'visible' });
   
   // Wait for network requests
   await this.page.waitForLoadState('networkidle');
   ```

2. **Implement retry logic:**
   ```typescript
   const retryOperation = async (operation: () => Promise<void>, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         await operation();
         return;
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
     }
   };
   ```

### Issue: Tests timeout

**Symptoms:**
- Error: "Test timeout after 30000ms"
- Tests hang during execution
- Browser operations never complete

**Diagnostic Steps:**
1. Check for infinite loops:
   ```typescript
   // Look for conditions that might never resolve
   await this.page.waitForSelector('[data-testid="never-appears"]');
   ```

2. Monitor network activity:
   ```bash
   DEBUG=pw:api npm run test
   ```

**Solutions:**

1. **Increase timeout values:**
   ```typescript
   // In test configuration
   const config = {
     timeout: 60000, // Increase from 30s
     navigationTimeout: 30000,
     actionTimeout: 10000
   };
   ```

2. **Add timeout to specific operations:**
   ```typescript
   await this.page.waitForSelector('[data-testid="element"]', { 
     timeout: 10000 
   });
   ```

3. **Use more specific selectors:**
   ```typescript
   // Instead of waiting for generic elements
   await this.page.waitForSelector('[data-testid="specific-element"]');
   ```

## Configuration Issues

### Issue: Invalid configuration

**Symptoms:**
- Error: "Configuration validation failed"
- Tests fail to start
- Missing required configuration values

**Diagnostic Steps:**
1. Validate configuration syntax:
   ```bash
   node -e "console.log(JSON.stringify(require('./test-config.js'), null, 2))"
   ```

2. Check required environment variables:
   ```bash
   env | grep TEST_
   env | grep NODE_ENV
   ```

**Solutions:**

1. **Fix configuration syntax:**
   ```typescript
   // Ensure valid JSON/JavaScript syntax
   const config = {
     isolated: {
       databaseConfig: {
         connectionString: process.env.TEST_DB_CONNECTION,
         timeout: 30000
       }
     },
     production: {
       productionConfig: {
         testDataPrefix: 'looneyTunesTest'
       }
     }
   };
   ```

2. **Set missing environment variables:**
   ```bash
   export TEST_DB_CONNECTION="postgresql://user:pass@localhost:5432/testdb"
   export TEST_MODE="isolated"
   ```

### Issue: Environment variable conflicts

**Symptoms:**
- Tests use wrong configuration
- Unexpected behavior in CI/CD
- Configuration overrides not working

**Diagnostic Steps:**
1. Check environment variable precedence:
   ```bash
   # Check all TEST_ variables
   env | grep TEST_ | sort
   
   # Check for conflicts
   echo "TEST_MODE: $TEST_MODE"
   echo "NODE_ENV: $NODE_ENV"
   ```

**Solutions:**

1. **Clear conflicting variables:**
   ```bash
   unset TEST_MODE
   export TEST_MODE=isolated
   ```

2. **Use explicit configuration:**
   ```typescript
   const config = {
     mode: process.env.EXPLICIT_TEST_MODE || 'isolated',
     // Don't rely on NODE_ENV for test mode
   };
   ```

## Performance Issues

### Issue: Slow test execution

**Symptoms:**
- Tests take much longer than expected
- Database operations are slow
- Browser operations timeout

**Diagnostic Steps:**
1. Profile test execution:
   ```bash
   time npm run test:isolated
   ```

2. Check database performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM customers WHERE name LIKE '%looneyTunesTest%';
   ```

**Solutions:**

1. **Optimize database operations:**
   ```sql
   -- Add indexes for test data queries
   CREATE INDEX idx_customers_test_name ON customers(name) WHERE name LIKE '%looneyTunesTest%';
   ```

2. **Use parallel execution:**
   ```bash
   # Run tests in parallel (if supported)
   npm run test -- --parallel 4
   ```

3. **Optimize data loading:**
   ```typescript
   // Use incremental loading instead of full restore
   const loader = new IncrementalDatabaseLoader({
     cacheEnabled: true,
     loadOnlyRequired: true
   });
   ```

## Error Recovery and Cleanup

### Issue: Tests leave system in bad state

**Symptoms:**
- Subsequent tests fail due to previous test state
- Database contains leftover test data
- Browser sessions not cleaned up

**Diagnostic Steps:**
1. Check cleanup hooks:
   ```typescript
   After(async function() {
     // Verify cleanup code exists and runs
     console.log('Cleanup running...');
     await this.dataContext.cleanup();
   });
   ```

2. Verify database state:
   ```sql
   -- Check for leftover test data
   SELECT COUNT(*) FROM customers WHERE name LIKE '%test%';
   ```

**Solutions:**

1. **Implement robust cleanup:**
   ```typescript
   After(async function() {
     try {
       if (this.dataContext) {
         await this.dataContext.cleanup();
       }
     } catch (error) {
       console.warn('Cleanup failed:', error);
       // Continue with other cleanup
     }
     
     try {
       if (this.page) {
         await this.page.close();
       }
     } catch (error) {
       console.warn('Page cleanup failed:', error);
     }
   });
   ```

2. **Add cleanup verification:**
   ```typescript
   After(async function() {
     await this.dataContext.cleanup();
     
     // Verify cleanup was successful
     const remainingData = await this.dataContext.validateCleanup();
     if (remainingData.length > 0) {
       console.warn('Cleanup incomplete:', remainingData);
     }
   });
   ```

## Debugging Tips

### Enable Debug Logging

```bash
# Enable all dual-testing debug logs
DEBUG=dual-testing* npm run test

# Enable specific component logs
DEBUG=dual-testing:mode-detector npm run test
DEBUG=dual-testing:data-context npm run test
DEBUG=dual-testing:database npm run test
```

### Use Test Isolation

```bash
# Run single test for debugging
npm run test -- --name "specific test name"

# Run with verbose output
npm run test -- --verbose

# Run with browser visible (for UI debugging)
HEADLESS=false npm run test
```

### Check Test Artifacts

```bash
# Review test results
cat test-results/cucumber-report.json | jq '.[]'

# Check screenshots (if enabled)
ls -la test-results/screenshots/

# Review logs
tail -f test-results/logs/test.log
```

## Getting Additional Help

### Log Analysis

When reporting issues, include:
1. Full error messages and stack traces
2. Environment variable values (sanitized)
3. Test configuration files
4. Database schema and test data samples
5. Test execution logs with debug enabled

### Escalation Process

1. **Check Documentation**: Review this guide and main documentation
2. **Search Known Issues**: Check project issue tracker
3. **Team Support**: Contact testing team with detailed information
4. **Create Issue**: If problem persists, create detailed issue report

### Useful Commands for Diagnostics

```bash
# System information
node --version
npm --version
echo $NODE_ENV
echo $TEST_MODE

# Database connectivity
npm run test:validate-production-data
npm run test -- --dry-run

# Configuration validation
node -e "console.log(require('./test-config.js'))"

# Test execution with full logging
DEBUG=* npm run test -- --verbose
```