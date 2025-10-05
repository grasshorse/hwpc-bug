# Dual-Mode Testing Configuration Guide

## Overview

The dual-mode testing architecture supports three distinct testing modes:
- **Isolated Mode**: Tests run against controlled database states with predefined data
- **Production Mode**: Tests run against production environment using identifiable test data (looneyTunesTest pattern)
- **Dual Mode**: Tests that can run in both isolated and production environments

## Available npm Scripts

### Core Testing Commands

#### Isolated Mode Testing
```bash
# Run all isolated tests with full reporting
npm run test:isolated

# Run isolated tests without reporting (faster)
npm run test:isolated:fast

# Run isolated navigation tests only
npm run test:isolated:navigation

# Run isolated API tests only
npm run test:isolated:api

# Dry run for isolated tests (validation only)
npm run dry:test:isolated
```

#### Production Mode Testing
```bash
# Run all production tests with full reporting
npm run test:production

# Run production tests without reporting (faster)
npm run test:production:fast

# Run production navigation tests only
npm run test:production:navigation

# Run production API tests only
npm run test:production:api

# Dry run for production tests (validation only)
npm run dry:test:production
```

#### Dual Mode Testing
```bash
# Run all dual-mode tests with full reporting
npm run test:dual

# Run dual-mode tests without reporting (faster)
npm run test:dual:fast
```

### Legacy Commands (Still Available)
All existing npm scripts continue to work as before:
```bash
npm run test              # Default test execution
npm run test:navigation   # Navigation tests
npm run test:api          # API tests
npm run qa:test          # QA environment tests
```

## Environment Configuration Files

### .env.isolated
Configuration for isolated testing mode:
- Uses test database with controlled data states
- Shorter timeouts due to controlled environment
- Reduced parallel execution for stability
- Debug mode enabled
- Video recording disabled for speed

### .env.production
Configuration for production testing mode:
- Uses production database with looneyTunesTest data
- Longer timeouts for real environment conditions
- Single-threaded execution for safety
- Video recording enabled for documentation
- Production safety checks enabled

### .env.dual
Configuration for dual-mode testing:
- Balanced settings for both environments
- Combines settings from both isolated and production modes
- Moderate timeouts and parallel execution

## Test Tags

Tests should be tagged appropriately to work with the dual-mode system:

### Mode-Specific Tags
- `@isolated`: Test runs only in isolated mode
- `@production`: Test runs only in production mode
- `@dual`: Test runs in both isolated and production modes

### Feature Tags (Existing)
- `@navigation`: Navigation-related tests
- `@api`: API-related tests
- `@mobile`: Mobile-specific tests
- `@responsive`: Responsive design tests
- `@performance`: Performance tests

### Example Test Tagging
```gherkin
@navigation @isolated
Feature: Navigation in Isolated Mode
  Tests that require controlled database states

@api @production
Feature: API Testing in Production
  Tests that work with looneyTunesTest data

@navigation @dual
Feature: Cross-Environment Navigation
  Tests that work in both modes
```

## Environment Variables

### Mode Detection
- `TEST_MODE`: Set to `isolated`, `production`, or `dual`
- Automatically loaded by cucumber.js configuration

### Mode-Specific Variables

#### Isolated Mode Variables
- `ISOLATED_DB_BACKUP_PATH`: Path to database backup files
- `ISOLATED_DB_RESTORE_TIMEOUT`: Timeout for database restoration
- `ISOLATED_DATA_VERIFICATION`: Enable data verification checks

#### Production Mode Variables
- `PRODUCTION_TEST_DATA_PREFIX`: Prefix for test data (looneyTunesTest)
- `PRODUCTION_TEST_LOCATIONS`: Comma-separated list of test locations
- `PRODUCTION_TEST_CUSTOMERS`: Comma-separated list of test customer names
- `PRODUCTION_DATA_CLEANUP_POLICY`: How to handle test data after tests
- `PRODUCTION_SAFETY_CHECKS`: Enable production safety validations

#### Dual Mode Variables
Includes all variables from both isolated and production modes.

## Usage Examples

### Running Specific Test Types

```bash
# Run only isolated navigation tests
npm run test:isolated:navigation

# Run only production API tests  
npm run test:production:api

# Run all dual-mode tests
npm run test:dual

# Run tests with custom tags
npm run test:tags -- "@navigation and @isolated"
```

### Environment-Specific Testing

```bash
# Test in QA environment with isolated mode
cross-env TEST_ENV=qa TEST_MODE=isolated npm run test:isolated

# Test in production environment with production mode
cross-env TEST_MODE=production npm run test:production
```

### Debugging and Development

```bash
# Dry run to validate test configuration
npm run dry:test:isolated
npm run dry:test:production

# Run with verbose logging (set in environment files)
npm run test:isolated:fast  # Debug mode enabled in .env.isolated
```

## Configuration Validation

The system automatically validates:
- Test mode compatibility with test tags
- Environment variable presence and validity
- Database connectivity and test data availability
- Tag combinations and test execution paths

## Migration from Legacy Tests

1. **Add appropriate tags** to existing feature files
2. **Use new npm scripts** for mode-specific execution
3. **Update step definitions** to work with DataContext (if needed)
4. **Test in both modes** to ensure compatibility

## Troubleshooting

### Common Issues

1. **Mode Detection Failures**
   - Ensure `TEST_MODE` environment variable is set correctly
   - Check that test tags match the selected mode

2. **Database Connection Issues**
   - Verify database configuration in mode-specific .env files
   - Check network connectivity and credentials

3. **Test Data Issues**
   - For isolated mode: Ensure backup files exist in `ISOLATED_DB_BACKUP_PATH`
   - For production mode: Verify looneyTunesTest data exists

4. **Tag Conflicts**
   - Ensure tests are tagged appropriately for their intended mode
   - Use `@dual` tag for tests that should run in both modes

### Debug Commands

```bash
# Validate configuration without running tests
npm run dry:test:isolated
npm run dry:test:production

# Check test discovery and tagging
npx cucumber-js --dry-run --tags "@isolated"
npx cucumber-js --dry-run --tags "@production"
```

## Best Practices

1. **Tag tests appropriately** based on their data requirements
2. **Use isolated mode** for tests requiring specific database states
3. **Use production mode** for end-to-end validation with real data
4. **Use dual mode** for tests that should work in both environments
5. **Monitor test execution** and adjust timeouts as needed
6. **Keep test data clean** in production mode using looneyTunesTest pattern