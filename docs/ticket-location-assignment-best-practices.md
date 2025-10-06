# Best Practices for Ticket Location Route Assignment Testing

## Overview

This guide provides specific best practices for testing ticket location route assignment functionality using the dual testing architecture. These practices ensure reliable testing of complex geographic calculations, route optimization logic, and real-time assignment workflows across both isolated and production environments.

## Feature-Specific Test Design Patterns

### 1. Geographic Data Testing Patterns

**Use Controlled Coordinates in Isolated Mode:**
```gherkin
@isolated
Scenario: Assign ticket to nearest route
  Given I have a ticket at coordinates (42.5000, -92.5000)
  And I have routes with service areas:
    | Route Name | Center Lat | Center Lng | Radius |
    | Route A    | 42.5010    | -92.5010   | 5km    |
    | Route B    | 42.5050    | -92.5050   | 5km    |
  When I request route assignment for the ticket
  Then the system should suggest "Route A"
  And the calculated distance should be approximately 1.4km
```

**Use Real Test Locations in Production Mode:**
```gherkin
@production
Scenario: Assign ticket using real geographic data
  Given I have a ticket for "Bugs Bunny - looneyTunesTest" at "123 Carrot Lane - looneyTunesTest"
  And I have test routes available in the Cedar Falls area
  When I request route assignment for the ticket
  Then the system should suggest a route within the service area
  And the route name should contain "looneyTunesTest"
```

### 2. Capacity Management Testing

**Test Edge Cases in Isolated Mode:**
```typescript
// Step definition for capacity testing
Given('route {string} is at {int}% capacity', async function(routeName: string, percentage: number) {
  if (this.testMode === TestMode.ISOLATED) {
    // Set exact capacity for predictable testing
    await this.routeService.setRouteCapacity(routeName, {
      total: 10,
      current: Math.floor(10 * percentage / 100)
    });
  } else {
    // Verify production test route has expected capacity range
    const route = await this.routeService.getRoute(routeName);
    expect(route.name).toContain('looneyTunesTest');
    const actualPercentage = (route.currentLoad / route.capacity) * 100;
    expect(actualPercentage).toBeCloseTo(percentage, 10); // Within 10% tolerance
  }
});
```

### 3. Bulk Assignment Testing Patterns

**Design for Scalability Testing:**
```gherkin
@isolated
Scenario: Process bulk assignment efficiently
  Given I have 50 unassigned tickets in the downtown area
  And I have 5 routes with varying capacities
  When I perform bulk assignment
  Then all tickets should be assigned within 30 seconds
  And the assignment should be optimally distributed
  And no route should exceed 80% capacity

@production
Scenario: Bulk assign test tickets safely
  Given I have multiple unassigned tickets for looneyTunesTest customers
  And I have test routes available
  When I perform bulk assignment
  Then only test tickets should be affected
  And no real customer tickets should be modified
```

## Data Management Best Practices

### 1. Geographic Test Data Organization

**Isolated Test Data Structure:**
```
.kiro/test-data/isolated/location-assignment/
├── baseline/
│   ├── coordinates.sql          # Standard test coordinates
│   ├── service-areas.sql        # Route service boundaries
│   └── distance-matrix.sql      # Precalculated distances
├── scenarios/
│   ├── optimal-assignment/      # Best-case scenarios
│   ├── capacity-constraints/    # Full route scenarios
│   ├── bulk-processing/         # Large batch scenarios
│   └── edge-cases/             # Boundary conditions
└── verification/
    ├── assignment-queries.sql   # Validation queries
    └── expected-results.json    # Expected outcomes
```

**Production Test Data Standards:**
```typescript
interface ProductionLocationTestData {
  testCustomers: {
    name: string; // "Character Name - looneyTunesTest"
    address: string; // "Address - looneyTunesTest"
    coordinates: {
      lat: number; // Real coordinates in test service areas
      lng: number;
    };
    serviceArea: string; // Must be test service area
  }[];
  
  testRoutes: {
    name: string; // "Location Test Route - looneyTunesTest"
    serviceArea: GeoPolygon; // Non-overlapping with real routes
    schedule: RouteSchedule;
    capacity: number;
    isActive: boolean;
  }[];
}
```

### 2. Test Data Lifecycle Management

**Automated Test Data Validation:**
```typescript
class LocationTestDataValidator {
  async validateProductionTestData(): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    
    // Validate customer locations
    const testCustomers = await this.getTestCustomers();
    for (const customer of testCustomers) {
      if (!customer.name.includes('looneyTunesTest')) {
        issues.push({
          type: 'naming-convention',
          entity: 'customer',
          id: customer.id,
          message: `Customer name missing looneyTunesTest: ${customer.name}`
        });
      }
      
      if (!this.isInTestServiceArea(customer.coordinates)) {
        issues.push({
          type: 'location-safety',
          entity: 'customer',
          id: customer.id,
          message: `Customer location outside test service areas`
        });
      }
    }
    
    // Validate route isolation
    const testRoutes = await this.getTestRoutes();
    for (const route of testRoutes) {
      const overlapsReal = await this.checkRealRouteOverlap(route.serviceArea);
      if (overlapsReal) {
        issues.push({
          type: 'route-isolation',
          entity: 'route',
          id: route.id,
          message: `Test route overlaps with real service areas`
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      timestamp: new Date()
    };
  }
}
```

## Algorithm Testing Strategies

### 1. Distance Calculation Validation

**Deterministic Testing in Isolated Mode:**
```typescript
class DistanceCalculationTester {
  async testDistanceAccuracy(): Promise<void> {
    const testCases = [
      {
        from: { lat: 42.5000, lng: -92.5000 },
        to: { lat: 42.5010, lng: -92.5010 },
        expectedDistance: 1.57, // km, calculated offline
        tolerance: 0.1
      },
      // More test cases...
    ];
    
    for (const testCase of testCases) {
      const calculated = await this.geographicCalculator.calculateDistance(
        testCase.from, 
        testCase.to
      );
      
      expect(calculated).toBeCloseTo(testCase.expectedDistance, testCase.tolerance);
    }
  }
}
```

**Real-World Validation in Production Mode:**
```typescript
class ProductionDistanceValidator {
  async validateRealDistanceCalculation(): Promise<void> {
    const testLocations = await this.getTestLocations();
    
    for (const location of testLocations) {
      // Use real routing service
      const distance = await this.routingService.calculateDistance(
        location.from,
        location.to
      );
      
      // Validate reasonable distance (not zero, not impossibly large)
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1000); // Reasonable max for service area
      
      // Validate against straight-line distance as sanity check
      const straightLine = this.calculateStraightLineDistance(
        location.from,
        location.to
      );
      expect(distance).toBeGreaterThanOrEqual(straightLine);
    }
  }
}
```

### 2. Assignment Optimization Testing

**Algorithm Correctness Validation:**
```gherkin
@isolated
Scenario: Validate optimal assignment algorithm
  Given I have tickets at known coordinates:
    | Ticket | Latitude | Longitude |
    | T1     | 42.5000  | -92.5000  |
    | T2     | 42.5020  | -92.5020  |
    | T3     | 42.5040  | -92.5040  |
  And I have routes with service areas:
    | Route | Center Lat | Center Lng | Capacity |
    | R1    | 42.5010    | -92.5010   | 10       |
    | R2    | 42.5030    | -92.5030   | 10       |
  When I run the assignment algorithm
  Then ticket T1 should be assigned to route R1
  And ticket T2 should be assigned to route R1
  And ticket T3 should be assigned to route R2
  And the total travel distance should be minimized
```

## Performance Testing Patterns

### 1. Bulk Assignment Performance

**Load Testing with Controlled Data:**
```typescript
class BulkAssignmentPerformanceTester {
  async testBulkAssignmentPerformance(): Promise<PerformanceMetrics> {
    const ticketCounts = [10, 50, 100, 500];
    const results: PerformanceResult[] = [];
    
    for (const count of ticketCounts) {
      const tickets = await this.generateTestTickets(count);
      const routes = await this.getTestRoutes();
      
      const startTime = Date.now();
      const assignments = await this.assignmentService.bulkAssign(tickets, routes);
      const endTime = Date.now();
      
      results.push({
        ticketCount: count,
        executionTime: endTime - startTime,
        assignmentsCreated: assignments.length,
        averageTimePerTicket: (endTime - startTime) / count
      });
    }
    
    return this.analyzePerformanceResults(results);
  }
}
```

### 2. Geographic Calculation Caching

**Cache Effectiveness Testing:**
```typescript
class CachePerformanceTester {
  async testDistanceCalculationCaching(): Promise<void> {
    const location1 = { lat: 42.5000, lng: -92.5000 };
    const location2 = { lat: 42.5010, lng: -92.5010 };
    
    // First calculation (cache miss)
    const start1 = Date.now();
    const distance1 = await this.calculator.calculateDistance(location1, location2);
    const time1 = Date.now() - start1;
    
    // Second calculation (cache hit)
    const start2 = Date.now();
    const distance2 = await this.calculator.calculateDistance(location1, location2);
    const time2 = Date.now() - start2;
    
    // Validate cache effectiveness
    expect(distance1).toBe(distance2);
    expect(time2).toBeLessThan(time1 * 0.1); // Cache should be 10x faster
  }
}
```

## Error Handling and Edge Cases

### 1. Geographic Edge Cases

**Boundary Condition Testing:**
```gherkin
@isolated
Scenario: Handle tickets at service area boundaries
  Given I have a ticket exactly at the boundary of two service areas
  When I request route assignment
  Then the system should assign to the route with higher priority
  Or the system should assign to the route with more capacity
  And the assignment should be logged with boundary condition flag

@isolated  
Scenario: Handle tickets outside all service areas
  Given I have a ticket outside all defined service areas
  When I request route assignment
  Then the system should return "no routes available" error
  And suggest expanding service area or manual assignment
```

### 2. Capacity and Conflict Handling

**Conflict Resolution Testing:**
```typescript
class ConflictResolutionTester {
  async testCapacityConflictHandling(): Promise<void> {
    // Set up route at full capacity
    const route = await this.createTestRoute({ capacity: 5, currentLoad: 5 });
    const ticket = await this.createTestTicket({ location: route.centerPoint });
    
    // Attempt assignment
    const result = await this.assignmentService.assignTicket(ticket, route);
    
    // Validate conflict handling
    expect(result.success).toBe(false);
    expect(result.reason).toBe('capacity-exceeded');
    expect(result.alternatives).toBeDefined();
    expect(result.alternatives.length).toBeGreaterThan(0);
  }
}
```

## Safety and Security Patterns

### 1. Production Data Protection

**Safety Guard Implementation:**
```typescript
class LocationAssignmentSafetyGuard {
  validateAssignmentSafety(assignment: TicketAssignment): void {
    // Validate customer is test customer
    if (!assignment.customerName.includes('looneyTunesTest')) {
      throw new SafetyViolationError(
        `Assignment targets non-test customer: ${assignment.customerName}`
      );
    }
    
    // Validate route is test route
    if (!assignment.routeName.includes('looneyTunesTest')) {
      throw new SafetyViolationError(
        `Assignment targets non-test route: ${assignment.routeName}`
      );
    }
    
    // Validate location is in test service area
    if (!this.isInTestServiceArea(assignment.location)) {
      throw new SafetyViolationError(
        `Assignment location outside test service areas`
      );
    }
    
    // Validate no impact on real routes
    const realRouteImpact = this.checkRealRouteImpact(assignment);
    if (realRouteImpact.hasImpact) {
      throw new SafetyViolationError(
        `Assignment could impact real routes: ${realRouteImpact.affectedRoutes}`
      );
    }
  }
}
```

### 2. Test Data Isolation Verification

**Isolation Testing:**
```gherkin
@production
Scenario: Verify test data isolation
  Given I have performed ticket assignments using test data
  When I query for real customer tickets
  Then no real customer tickets should be modified
  And no real routes should show test assignments
  And all test assignments should be clearly identifiable

@production
Scenario: Validate test service area isolation
  Given I have test routes with defined service areas
  When I check for overlap with real service areas
  Then there should be no geographic overlap
  And test routes should be clearly marked as test routes
```

## Monitoring and Maintenance

### 1. Assignment Test Health Monitoring

**Automated Health Checks:**
```typescript
class LocationAssignmentHealthMonitor {
  async generateHealthReport(): Promise<HealthReport> {
    const metrics = {
      assignmentAccuracy: await this.measureAssignmentAccuracy(),
      performanceMetrics: await this.measurePerformanceMetrics(),
      dataIntegrity: await this.validateDataIntegrity(),
      safetyCompliance: await this.validateSafetyCompliance()
    };
    
    return {
      timestamp: new Date(),
      overallHealth: this.calculateOverallHealth(metrics),
      metrics,
      recommendations: this.generateRecommendations(metrics),
      alerts: this.identifyAlerts(metrics)
    };
  }
  
  private async measureAssignmentAccuracy(): Promise<AccuracyMetrics> {
    // Run known assignment scenarios and measure accuracy
    const testCases = await this.getAssignmentTestCases();
    let correctAssignments = 0;
    
    for (const testCase of testCases) {
      const result = await this.assignmentService.assignTicket(
        testCase.ticket, 
        testCase.availableRoutes
      );
      
      if (result.assignedRoute === testCase.expectedRoute) {
        correctAssignments++;
      }
    }
    
    return {
      totalTests: testCases.length,
      correctAssignments,
      accuracyPercentage: (correctAssignments / testCases.length) * 100
    };
  }
}
```

### 2. Automated Maintenance Tasks

**Daily Maintenance Script:**
```bash
#!/bin/bash
# location-assignment-maintenance.sh

echo "Starting location assignment test maintenance..."

# Validate production test data integrity
npm run test:validate-location-test-data

# Check for orphaned test assignments
npm run test:check-orphaned-assignments

# Verify service area boundaries
npm run test:verify-service-areas

# Clean up old test results
find test-results/location-assignment -name "*.log" -mtime +7 -delete

# Generate performance report
npm run test:location-assignment-performance-report

# Validate geographic calculation accuracy
npm run test:validate-distance-calculations

echo "Location assignment maintenance completed."
```

## Team Collaboration Guidelines

### 1. Code Review Checklist for Location Assignment Tests

**Review Criteria:**
- [ ] Test uses appropriate mode tags (@isolated, @production, @dual)
- [ ] Geographic coordinates are realistic and in test service areas
- [ ] Production test data follows looneyTunesTest naming conventions
- [ ] Distance calculations include appropriate tolerance for real-world variation
- [ ] Capacity constraints are properly tested and validated
- [ ] Safety guards prevent impact on real customers and routes
- [ ] Error handling covers geographic edge cases and boundary conditions
- [ ] Performance considerations are addressed for bulk operations

### 2. Documentation Standards for Location Tests

**Test Documentation Template:**
```gherkin
Feature: Ticket Location Route Assignment
  # Purpose: Validate geographic assignment algorithms and route optimization
  # Modes: Isolated for algorithm testing, Production for integration validation
  # Dependencies: Geographic test data, route test data, mapping services
  # Maintenance: Update when service areas change or assignment rules modify
  # Performance: Bulk assignment should complete within 30 seconds for 100 tickets

  Background:
    Given the location assignment system is properly configured
    And the appropriate geographic test data exists
    And all test routes are properly isolated from production routes

  @dual
  Scenario: Basic assignment workflow navigation
    # Tests UI navigation and basic assignment functionality
    Given I am logged in as a dispatcher
    When I navigate to the ticket assignment interface
    Then I should see unassigned tickets grouped by location
    And I should see available routes with capacity indicators
```

By following these feature-specific best practices, teams can ensure reliable and comprehensive testing of ticket location route assignment functionality while maintaining the safety and effectiveness of the dual testing architecture.