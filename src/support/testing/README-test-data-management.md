# Test Data Management System

This document describes the test data management system implemented for location assignment testing.

## Overview

The test data management system provides controlled test data generation for isolated testing and safe production test data management with comprehensive validation and safety guards.

## Components

### 1. GeographicTestDataGenerator

**Purpose**: Generates controlled test data for different testing scenarios.

**Key Features**:
- Generates test locations with controlled coordinates for isolated mode
- Creates production test locations with looneyTunesTest naming convention
- Supports multiple test scenarios: optimal-assignment, capacity-constraints, bulk-assignment
- Generates test tickets, routes, and complete scenarios

**Usage**:
```typescript
// Generate controlled locations for isolated testing
const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.ISOLATED, 5);

// Generate production test locations
const prodLocations = GeographicTestDataGenerator.generateTestLocations(TestMode.PRODUCTION, 3);

// Generate complete test scenario
const scenario = GeographicTestDataGenerator.generateTestScenario('optimal-assignment', TestMode.ISOLATED);
```

### 2. ProductionDataValidator

**Purpose**: Validates test data in production mode to ensure safety and compliance.

**Key Features**:
- Validates looneyTunesTest naming convention
- Checks geographic boundaries for test service areas
- Validates data structure and format
- Batch validation support
- Safety checks to prevent impact on real customers

**Usage**:
```typescript
// Validate a test ticket
const validation = ProductionDataValidator.validateTestTicket(ticket);
if (!validation.isValid) {
  console.error('Validation issues:', validation.issues);
}

// Validate batch data
const batchValidation = ProductionDataValidator.validateTestDataBatch({
  tickets, routes, locations
});
```

### 3. ProductionTestDataManager

**Purpose**: Manages test data lifecycle in production environment.

**Key Features**:
- Ensures test data exists and is valid
- Creates missing test data automatically
- Validates existing test data
- Configurable cleanup policies
- Data consistency checks

**Usage**:
```typescript
const manager = new ProductionTestDataManager({
  validateBeforeUse: true,
  requireLooneyTunesNaming: true,
  enforceTestServiceAreas: true,
  maxTestDataAge: 24,
  autoCleanup: false
});

// Ensure test data exists
await manager.ensureTestDataExists('optimal-assignment');

// Get validated test data
const testData = await manager.getProductionTestData('optimal-assignment');
```

### 4. ProductionSafetyGuard

**Purpose**: Provides safety mechanisms to prevent impact on real customers and routes.

**Key Features**:
- Assignment safety validation
- Batch operation safety checks
- Risk level assessment (low, medium, high, critical)
- Operation logging
- Configurable safety policies

**Usage**:
```typescript
const safetyGuard = new ProductionSafetyGuard({
  allowProductionWrites: false,
  requireTestIdentifiers: true,
  enforceServiceAreaBounds: true,
  maxBatchSize: 50
});

// Validate assignment safety
const safetyCheck = safetyGuard.validateAssignmentSafety(assignment);
if (!safetyCheck.isSafe) {
  console.warn('Safety issues:', safetyCheck.issues);
}
```

## SQL Scripts

### Baseline Data Scripts

- **baseline-location-data.sql**: Creates database schema and baseline test data
- **scenario-optimal-assignment.sql**: Test data for optimal assignment testing
- **scenario-capacity-constraints.sql**: Test data for capacity constraint testing  
- **scenario-bulk-assignment.sql**: Test data for bulk assignment testing
- **cleanup-test-data.sql**: Removes all test data safely

### Database Schema

The system creates the following tables:
- `test_locations`: Geographic test locations
- `test_customers`: Test customer records
- `test_routes`: Test route definitions
- `test_route_service_areas`: Route service area polygons
- `test_tickets`: Test service tickets
- `test_assignments`: Ticket-to-route assignments

## Safety Features

### Production Safety

1. **Naming Convention Enforcement**: All test data must include 'looneyTunesTest' identifier
2. **Geographic Boundaries**: Test locations must be within designated test service areas
3. **Data Isolation**: Test data is clearly marked and separated from production data
4. **Impact Prevention**: Safety guards prevent operations that could affect real customers

### Test Service Areas

The system defines specific geographic boundaries for testing:
- Cedar Falls Test Area: 42.4000-42.5500 lat, -92.6000--92.2000 lng
- Waterloo Test Area: 42.4500-42.5500 lat, -92.5000--92.3000 lng

### Validation Rules

1. Customer names must include looneyTunesTest and valid Looney Tunes character names
2. Addresses must include looneyTunesTest identifier
3. All coordinates must be within designated test boundaries
4. Route capacities must be reasonable for testing (1-50)
5. Test data flags must be properly set

## Configuration

### ProductionTestDataConfig

```typescript
interface ProductionTestDataConfig {
  validateBeforeUse: boolean;        // Validate data before use
  requireLooneyTunesNaming: boolean; // Enforce naming convention
  enforceTestServiceAreas: boolean;  // Check geographic boundaries
  maxTestDataAge: number;            // Maximum age in hours
  autoCleanup: boolean;              // Automatic cleanup of old data
}
```

### SafetyConfiguration

```typescript
interface SafetyConfiguration {
  allowProductionWrites: boolean;      // Allow writes to production
  requireTestIdentifiers: boolean;     // Require test identifiers
  enforceServiceAreaBounds: boolean;   // Enforce geographic bounds
  maxBatchSize: number;                // Maximum batch operation size
  requireApprovalForHighRisk: boolean; // Require approval for high-risk ops
  logAllOperations: boolean;           // Log all safety operations
}
```

## Testing

The system includes comprehensive tests covering:
- Test data generation for all scenarios
- Production data validation
- Safety guard functionality
- Configuration management
- Error handling

Run tests with:
```bash
npx vitest --run src/support/testing/__tests__/simple-test-data-test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

**Requirement 1.1**: Dispatcher can view unassigned tickets grouped by geographic proximity
- ✅ GeographicTestDataGenerator creates tickets with controlled geographic distribution

**Requirement 1.3**: System prioritizes routes with shortest travel distance
- ✅ Test data includes distance calculations and optimal assignment scenarios

**Requirement 3.1**: System enables bulk assignment mode
- ✅ Bulk assignment test scenarios and safety validation

**Requirement 3.2**: System suggests optimal route distribution
- ✅ Bulk assignment scenarios test route distribution optimization

**Requirement 4.2**: System requires reason code for overrides
- ✅ ProductionDataValidator validates override reasons in assignments

**Requirement 4.3**: System logs override actions
- ✅ ProductionSafetyGuard logs all operations with detailed context

**Requirement 6.2**: System validates configuration changes
- ✅ Configuration validation in ProductionTestDataManager

**Requirement 6.4**: System provides migration options for configuration changes
- ✅ ProductionTestDataManager handles data migration and validation

## Next Steps

This test data management system provides the foundation for implementing the remaining tasks in the location assignment testing framework:

1. Location and distance calculation services (Task 3)
2. Route assignment algorithm validation (Task 4)
3. Cucumber feature files and step definitions (Tasks 5-6)
4. Test data lifecycle management (Task 7)
5. Safety and validation systems (Task 8)
6. Integration and end-to-end testing (Task 9)