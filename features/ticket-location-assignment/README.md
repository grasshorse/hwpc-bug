# Ticket Location Assignment - Cucumber Tests

This directory contains Cucumber feature files and step definitions for testing the ticket location assignment functionality across different testing modes.

## Test Structure

### Feature Files

- **dual-mode-navigation.feature**: Tests for UI navigation and basic functionality that work in both isolated and production modes
- **isolated-mode-scenarios.feature**: Tests for edge cases and algorithm validation using controlled test data
- **production-mode-integration.feature**: Tests for real system integration using looneyTunesTest data

### Step Definitions

- **dual-mode-navigation.steps.ts**: Step implementations for dual-mode tests
- **isolated-mode-scenarios.steps.ts**: Step implementations for isolated-mode tests  
- **production-mode-integration.steps.ts**: Step implementations for production-mode tests

### Support Files

- **hooks.ts**: Test setup, teardown, and mode configuration
- **cucumber.config.js**: Cucumber test runner configuration

## Running Tests

### Prerequisites

1. Ensure the application is running and accessible
2. Test data is properly configured for each mode
3. Required environment variables are set

### Run All Tests

```bash
npm run test:cucumber:assignment
```

### Run Tests by Mode

```bash
# Dual mode tests only
npm run test:cucumber:assignment -- --tags "@dual"

# Isolated mode tests only  
npm run test:cucumber:assignment -- --tags "@isolated"

# Production mode tests only
npm run test:cucumber:assignment -- --tags "@production"
```

### Run Specific Feature

```bash
# Navigation tests
npm run test:cucumber:assignment -- features/ticket-location-assignment/dual-mode-navigation.feature

# Algorithm tests
npm run test:cucumber:assignment -- features/ticket-location-assignment/isolated-mode-scenarios.feature

# Integration tests
npm run test:cucumber:assignment -- features/ticket-location-assignment/production-mode-integration.feature
```

### Run with Custom Configuration

```bash
# Run in headed mode with slow motion
HEADLESS=false SLOW_MO=500 npm run test:cucumber:assignment

# Record videos of test execution
RECORD_VIDEO=true npm run test:cucumber:assignment

# Run with specific base URL
BASE_URL=http://localhost:8080 npm run test:cucumber:assignment
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:3000` |
| `HEADLESS` | Run browser in headless mode | `true` |
| `SLOW_MO` | Slow down operations (ms) | `0` |
| `RECORD_VIDEO` | Record test execution videos | `false` |
| `TEST_TIMEOUT` | Test timeout in milliseconds | `30000` |
| `CUCUMBER_TAGS` | Tag expression for test filtering | `@dual or @isolated or @production` |
| `CUCUMBER_PUBLISH` | Publish results to Cucumber Reports | `false` |

## Test Modes

### Dual Mode (@dual)
- Tests UI navigation and basic functionality
- Works with both isolated and production data
- Focuses on user interface interactions
- Validates basic CRUD operations

### Isolated Mode (@isolated)
- Tests with controlled, predictable test data
- Validates assignment algorithms and edge cases
- Tests bulk assignment scenarios
- Ensures deterministic behavior

### Production Mode (@production)
- Tests with real system integration
- Uses looneyTunesTest data for safety
- Validates external service integration
- Tests real-time system behavior

## Test Data Requirements

### Isolated Mode
- Controlled geographic coordinates
- Predefined routes with known capacities
- Test scenarios with expected outcomes
- Clean database state for each test

### Production Mode
- looneyTunesTest customers and routes
- Real geographic coordinates
- Active external service connections
- Production database with test data isolation

## Safety Measures

### Production Testing Safety
- All production tests use looneyTunesTest naming convention
- Production safety guards prevent impact on real data
- Test data isolation ensures no cross-contamination
- Automatic cleanup of test assignments

### Data Validation
- Customer names must include 'looneyTunesTest'
- Route names must include 'looneyTunesTest'  
- Geographic coordinates are validated
- Assignment operations are logged and auditable

## Troubleshooting

### Common Issues

1. **Test Mode Not Set Correctly**
   - Verify test mode indicator shows correct mode
   - Check test mode configuration endpoint
   - Ensure mode-specific data is loaded

2. **Test Data Missing**
   - Run data setup scripts for the appropriate mode
   - Verify looneyTunesTest data exists for production mode
   - Check database connectivity and permissions

3. **External Service Failures**
   - Verify mapping service API keys are configured
   - Check network connectivity to external services
   - Review service status and rate limits

4. **Assignment Failures**
   - Check route capacity and availability
   - Verify geographic coordinates are valid
   - Review assignment algorithm configuration

### Debug Mode

Enable debug logging for detailed test execution information:

```bash
DEBUG=true npm run test:cucumber:assignment
```

### Test Reports

Test results are generated in multiple formats:

- **JSON Report**: `test-results/cucumber-report.json`
- **HTML Report**: `test-results/cucumber-report.html`
- **Screenshots**: `test-results/screenshots/` (on failure)
- **Videos**: `test-results/videos/` (if enabled)

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use appropriate tags (@dual, @isolated, @production)
3. Include proper test data setup and cleanup
4. Add step definitions with clear, reusable steps
5. Document any new environment variables or configuration
6. Ensure tests are deterministic and can run in parallel

## Related Documentation

- [Dual Testing Architecture](../../../docs/dual-testing-architecture.md)
- [Assignment Algorithm Validation](../../../src/support/testing/README-assignment-algorithm-validation.md)
- [Test Data Management](../../../src/support/testing/README-test-data-management.md)
- [Location Distance Services](../../../src/support/testing/README-location-distance-services.md)