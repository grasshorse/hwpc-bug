# Location Assignment Step Definitions

This document provides an overview of the step definitions implemented for the ticket location route assignment feature.

## Overview

The step definitions are organized into two main files:

1. **location-assignment.steps.ts** - Core location assignment functionality
2. **bulk-assignment-capacity.steps.ts** - Bulk assignment and capacity management

## Requirements Coverage

### Task 6.1: Location Assignment Step Definitions

**Requirements: 1.1, 1.2, 1.4, 5.1**

#### Geographic Location Setup and Validation Steps

- `Given I have a test location at coordinates (lat, lng)` - Sets up individual test locations
- `Given I have test locations defined as:` - Sets up multiple test locations from data table
- `Given there are service areas defined for testing` - Configures service areas for testing
- `Then the system should validate the ticket location coordinates` - Validates coordinate accuracy
- `Then the location should be within valid geographic bounds` - Checks geographic bounds
- `Then the system should display the ticket location on a map` - Verifies map display

#### Ticket Creation and Route Assignment Steps

- `Given I create a test ticket at location (lat, lng) with priority "priority"` - Creates individual tickets
- `Given I create multiple test tickets:` - Creates multiple tickets from data table
- `When I navigate to the assignment interface` - Navigation to assignment UI
- `When I select the ticket for assignment` - Ticket selection for assignment
- `When I select ticket "id" for assignment` - Specific ticket selection
- `When I select multiple tickets for assignment:` - Multi-ticket selection
- `When I request route suggestions` - Requests available routes
- `When I assign the ticket to the optimal route` - Executes optimal assignment
- `When I assign the ticket to route "routeId"` - Assigns to specific route

#### Assignment Verification and Result Checking Steps

- `Then the system should display available routes within the search radius` - Verifies route display
- `Then each route should display distance information` - Checks distance calculations
- `Then the system should highlight the optimal route suggestion` - Verifies optimization
- `Then the optimal route should be the one with the shortest distance` - Validates optimality
- `Then the assignment should be created successfully` - Confirms assignment success
- `Then the ticket status should change to "status"` - Verifies status updates
- `Then the route schedule should be updated with the new assignment` - Checks schedule updates
- `Then the assignment should include accurate distance calculation` - Validates distance accuracy
- `Then I should be able to view the assignment details` - Verifies detail access
- `Then the assignment result should be optimal based on distance` - Confirms optimization
- `Then the assignment should pass validation checks` - Validates assignment rules

### Task 6.2: Bulk Assignment and Capacity Management Steps

**Requirements: 2.1, 2.2, 3.1, 3.4, 4.1**

#### Bulk Ticket Selection Step Definitions

- `Given I have {int} unassigned tickets in the system` - Sets up bulk ticket scenarios
- `Given I have tickets distributed across different geographic areas:` - Geographic distribution setup
- `Given I have tickets with different priority levels:` - Priority-based ticket setup
- `When I select all unassigned tickets` - Bulk selection operations
- `When I select tickets by geographic area "area"` - Area-based selection
- `When I select tickets with priority "priority"` - Priority-based selection
- `When I select {int} tickets randomly` - Random selection for testing

#### Capacity Validation and Warning Verification Steps

- `Given I have routes with the following capacities:` - Route capacity setup
- `Given route "routeId" is at full capacity` - Full capacity scenario setup
- `Given route "routeId" has {int} available slots` - Partial capacity setup
- `Then I should see capacity warnings for routes approaching limits` - Warning verification
- `Then I should see capacity indicators for each route` - Capacity display checks
- `Then routes at full capacity should be highlighted` - Visual indication verification
- `Then I should not be able to assign to full capacity routes without override` - Constraint enforcement

#### Conflict Resolution and Override Handling Steps

- `When I encounter a capacity conflict during assignment` - Conflict scenario handling
- `When I choose to override the capacity constraint` - Override execution
- `When I choose to find alternative routes` - Alternative route handling
- `When I choose to reschedule the assignment` - Rescheduling operations
- `Given I have supervisor override permissions` - Permission setup
- `When I provide override reason "reason"` - Override reason handling
- `Then I should see an override reason validation error` - Validation error checking
- `Then the override should be logged with timestamp and user information` - Audit logging verification

#### Bulk Assignment Processing Steps

- `When I initiate bulk assignment mode` - Bulk mode activation
- `When I request optimal route distribution` - Distribution optimization
- `When I confirm the bulk assignment` - Assignment confirmation
- `When I execute the bulk assignment` - Assignment execution
- `Then all selected tickets should be processed` - Processing verification
- `Then tickets should be distributed optimally across available routes` - Distribution validation
- `Then no route should exceed its capacity` - Capacity constraint verification
- `Then I should see a summary of the bulk assignment results` - Results summary verification
- `Then high priority tickets should be assigned before lower priority ones` - Priority handling
- `Then I should see conflict resolution options for capacity constraints` - Conflict resolution UI
- `Then alternative routes should be suggested for conflicted assignments` - Alternative suggestions

## Technical Implementation Details

### Error Handling

The step definitions include comprehensive error handling for:
- Invalid coordinates
- Missing tickets or routes
- Capacity violations
- Network failures
- Validation errors

### Performance Considerations

- Bulk operations are optimized for large datasets
- Timeout handling for long-running operations
- Progress indicators for user feedback
- Efficient data loading and cleanup

### Data Management

- Test data isolation between scenarios
- Proper cleanup after each test
- Support for both controlled and production test data
- Geographic data validation and bounds checking

### Integration Points

- UI element interactions through Playwright
- Database operations for ticket and route management
- External service integration for distance calculations
- Real-time notification handling

## Usage Examples

### Basic Assignment Test
```gherkin
Given I create a test ticket at location (42.5, -92.5) with priority "high"
When I navigate to the assignment interface
And I select the ticket for assignment
And I request route suggestions
Then the system should display available routes within the search radius
And the system should highlight the optimal route suggestion
When I assign the ticket to the optimal route
Then the assignment should be created successfully
And the ticket status should change to "Assigned"
```

### Bulk Assignment Test
```gherkin
Given I have 10 unassigned tickets in the system
And I have routes with the following capacities:
  | route_id | route_name | capacity | current_load |
  | R001     | Route A    | 5        | 2           |
  | R002     | Route B    | 5        | 1           |
When I select all unassigned tickets
And I initiate bulk assignment mode
And I request optimal route distribution
And I execute the bulk assignment
Then all selected tickets should be processed
And tickets should be distributed optimally across available routes
And no route should exceed its capacity
```

### Capacity Constraint Test
```gherkin
Given route "R001" is at full capacity
And I create a test ticket at location (42.5, -92.5) with priority "medium"
When I select the ticket for assignment
And I request route suggestions
Then I should see capacity warnings for routes approaching limits
And I should not be able to assign to full capacity routes without override
When I choose to override the capacity constraint
And I provide override reason "Emergency service required"
Then the override should be logged with timestamp and user information
```

## Maintenance and Extension

The step definitions are designed to be:
- **Modular**: Each step focuses on a specific functionality
- **Reusable**: Steps can be combined in different scenarios
- **Extensible**: New steps can be added without affecting existing ones
- **Maintainable**: Clear separation of concerns and comprehensive documentation

For adding new step definitions:
1. Follow the existing naming conventions
2. Include proper error handling
3. Add appropriate validation checks
4. Update this documentation
5. Ensure compatibility with all test modes (isolated, production, dual)