# Assignment Algorithm Validation

This module provides comprehensive validation for route assignment algorithms and conflict resolution in the location assignment testing framework.

## Components

### AssignmentAlgorithmValidator

Validates optimal route selection, distance comparisons, and override reasons for ticket assignments.

**Key Features:**
- Optimal assignment validation with configurable tolerance
- Override reason validation and logging
- Assignment constraint validation (capacity, service area, schedule)
- Test data safety validation for production mode

**Usage:**
```typescript
import { AssignmentAlgorithmValidator } from './AssignmentAlgorithmValidator';

const validator = new AssignmentAlgorithmValidator(testContext);

// Validate optimal assignment
const result = await validator.validateOptimalAssignment(
  ticket,
  suggestedRoute,
  availableRoutes,
  { tolerancePercent: 10, maxDistanceDifferenceKm: 5 }
);

// Validate override reasons
const overrideResult = await validator.validateOverrideReason(assignment);

// Validate assignment constraints
const constraintResult = await validator.validateAssignmentConstraints(ticket, route);
```

### AssignmentConflictHandler

Handles capacity constraints, conflicts, and alternative route suggestions.

**Key Features:**
- Capacity conflict analysis and resolution
- Alternative route suggestions with distance and capacity filtering
- Route capacity validation with configurable warning thresholds
- Multi-route conflict analysis for bulk operations

**Usage:**
```typescript
import { AssignmentConflictHandler } from './AssignmentConflictHandler';

const conflictHandler = new AssignmentConflictHandler(testContext);

// Handle capacity conflicts
const resolution = await conflictHandler.handleCapacityConflict(
  ticket,
  route,
  { nearCapacityPercent: 85, criticalCapacityPercent: 95 }
);

// Suggest alternative routes
const alternatives = await conflictHandler.suggestAlternativeRoutes(
  ticket,
  originalRoute,
  availableRoutes,
  { maxDistancePercent: 25, includeNearCapacity: false }
);

// Validate route capacity
const capacityResult = conflictHandler.validateRouteCapacity(route);
```

## Validation Types

### OptimalAssignmentResult
```typescript
interface OptimalAssignmentResult {
  isOptimal: boolean;
  suggestedRoute: LocationTestRoute;
  optimalRoute: LocationTestRoute;
  distanceComparison: {
    suggestedDistance: number;
    optimalDistance: number;
    differenceKm: number;
    differencePercent: number;
  };
  overrideReason?: string;
  validationDetails: string[];
}
```

### ConflictResolution
```typescript
interface ConflictResolution {
  strategy: 'suggest-alternative-route' | 'override-capacity' | 'reschedule' | 'reject';
  alternativeRoutes?: LocationTestRoute[];
  estimatedDelay?: number;
  reason: string;
}
```

### CapacityConflict
```typescript
interface CapacityConflict {
  type: 'at_capacity' | 'over_capacity' | 'near_capacity';
  route: LocationTestRoute;
  currentLoad: number;
  capacity: number;
  utilizationPercent: number;
  conflictingTickets?: string[];
}
```

## Configuration Options

### DistanceValidationOptions
- `tolerancePercent`: Acceptable percentage deviation from optimal (default: 10%)
- `maxDistanceDifferenceKm`: Maximum acceptable distance difference (default: 5km)
- `requireOverrideForSuboptimal`: Whether suboptimal assignments require override reasons

### CapacityWarningThresholds
- `nearCapacityPercent`: Warning threshold percentage (default: 85%)
- `criticalCapacityPercent`: Critical warning threshold (default: 95%)
- `overCapacityAction`: Action for over-capacity scenarios ('warn' | 'block' | 'suggest_alternative')

### AlternativeRouteOptions
- `maxDistance`: Maximum acceptable distance from optimal
- `maxDistancePercent`: Maximum percentage increase from optimal
- `includeNearCapacity`: Include routes near capacity in suggestions
- `prioritizeByDistance`: Prioritize by distance vs capacity
- `requireSameServiceType`: Must support same service type

## Testing

The module includes comprehensive tests covering:
- Optimal assignment validation
- Override reason validation
- Capacity conflict detection and resolution
- Alternative route suggestions
- Integration workflows

Run tests with:
```bash
npx vitest --run src/support/testing/__tests__/assignment-algorithm-validation.test.ts
```

## Integration

Both components integrate with the dual testing architecture:

**Isolated Mode:**
- Uses controlled geographic data and deterministic calculations
- Simulates various conflict scenarios for edge case testing
- Provides predictable results for algorithm validation

**Production Mode:**
- Uses real geographic coordinates and routing services
- Validates against live route schedules and capacity data
- Ensures test data safety with looneyTunesTest naming conventions

## Error Handling

The components include comprehensive error handling for:
- Invalid coordinates or service areas
- Routing service failures with fallback mechanisms
- Database operation errors
- Configuration validation errors
- Test data safety violations

## Logging and Monitoring

Both components provide detailed logging for:
- Assignment validation results
- Conflict resolution decisions
- Alternative route suggestions
- Performance metrics
- Error conditions

Use the `logValidationResult()` and `logConflictResolution()` methods for structured logging output.