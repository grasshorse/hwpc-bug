# Context-Aware Data Management Implementation

This document summarizes the implementation of Task 2: "Implement Context-Aware Data Management" from the dual testing migration fixes specification.

## Overview

The context-aware data management system replaces hardcoded IDs (like `ticket-001`, `cust-001`) with dynamic, context-appropriate data resolution that works correctly in both isolated and production modes.

## Components Implemented

### 1. Enhanced Data Context Manager (`EnhancedDataContextManager.ts`)

**Purpose**: Provides comprehensive data context management with mode-specific data resolution and validation.

**Key Features**:
- Mode-specific data resolution for customers, tickets, and routes
- Entity existence validation before use
- Context-aware entity creation
- Comprehensive cleanup of created entities
- Integration with existing data context factory

**Key Methods**:
- `resolveCustomerId()` - Resolves customer IDs based on test mode
- `resolveTicketId()` - Resolves ticket IDs based on test mode  
- `resolveRouteId()` - Resolves route IDs based on test mode
- `validateEntityExists()` - Validates entity existence with suggestions
- `createTestEntity()` - Creates mode-appropriate test entities

### 2. Context-Aware Request Builder (`ContextAwareRequestBuilder.ts`)

**Purpose**: Builds API requests with context-appropriate data resolution, replacing hardcoded IDs with contextual values.

**Key Features**:
- Automatic hardcoded ID detection and replacement
- Context-aware request data building for tickets, customers, and routes
- Production mode naming convention enforcement
- Recursive ID resolution in nested objects
- Request validation for test mode appropriateness

**Key Methods**:
- `buildTicketRequest()` - Builds ticket requests with resolved customer/route IDs
- `buildCustomerRequest()` - Builds customer requests with production naming
- `buildRouteRequest()` - Builds route requests with valid locations
- `resolveContextualIds()` - Recursively resolves all IDs in request data

### 3. Data Validation Service (`DataValidationService.ts`)

**Purpose**: Provides comprehensive validation for test data existence, integrity, and appropriate error handling.

**Key Features**:
- Pre-API call data existence validation
- Multi-entity validation support
- API request data validation
- Production mode naming convention validation
- Actionable error messages with suggestions
- Foreign key reference validation

**Key Methods**:
- `validateTestDataExists()` - Validates entity existence with suggestions
- `validateMultipleEntities()` - Validates multiple entities at once
- `validateApiRequestData()` - Validates request data before API calls
- `generateActionableErrorMessage()` - Creates user-friendly error messages

### 4. Context-Aware Error Handler (`ContextAwareErrorHandler.ts`)

**Purpose**: Provides comprehensive error handling with actionable suggestions and recovery strategies.

**Key Features**:
- Context-aware error classification
- Actionable error messages with suggestions
- Recovery strategy recommendations
- Mode-specific error handling
- Error logging with full context

**Key Error Types**:
- `ENTITY_NOT_FOUND` - Entity doesn't exist in current context
- `DATA_VALIDATION_FAILED` - Request data validation failed
- `API_REQUEST_ERROR` - API call failed with context
- `NAMING_CONVENTION_ERROR` - Production naming violations
- `REFERENCE_INTEGRITY_ERROR` - Foreign key reference issues

### 5. Updated API Step Definitions (`HWPCAPISteps.ts`)

**Purpose**: Updated existing API step definitions to use context-aware data resolution.

**Key Changes**:
- Replaced hardcoded customer ID `"64fcec34-150a-476f-804a-3e9072a7e6bf"` with context resolution
- Added validation before all ID resolution operations
- Enhanced error handling with actionable suggestions
- Added new validation step definitions
- Integrated with all CRUD operations (create, read, update, delete)

**Updated Steps**:
- Ticket creation, retrieval, update, and deletion
- Customer creation, retrieval, update, and deletion
- Route retrieval
- Tickets by customer retrieval

## Usage Examples

### Basic Context-Aware ID Resolution

```typescript
// Old hardcoded approach
const customerId = "cust-001";

// New context-aware approach
const customerId = await resolveCustomerId(context, "cust");
```

### API Request Building

```typescript
// Old approach with hardcoded data
const ticketData = {
    title: "Test Ticket",
    customerId: "64fcec34-150a-476f-804a-3e9072a7e6bf"
};

// New context-aware approach
const ticketData = await buildContextAwareRequest(context, {
    title: "Test Ticket",
    customerId: "cust-001" // Will be resolved contextually
}, 'ticket');
```

### Data Validation Before API Calls

```typescript
// Validate that required entities exist
const validationResult = await validationService.validateTestDataExists(
    EntityType.CUSTOMER, 
    customerId
);

if (!validationResult.isValid) {
    // Handle error with actionable suggestions
    const error = await errorHandler.handleEntityNotFound(
        EntityType.CUSTOMER, 
        customerId, 
        'customer retrieval'
    );
    throw error;
}
```

## Integration Points

### 1. Test Mode Detection
- Automatically detects test mode from context
- Falls back to isolated mode if context unavailable
- Provides different behavior for isolated vs production modes

### 2. Existing Data Context Factory
- Integrates with existing `DataContextFactory`
- Enhances base context managers with new capabilities
- Maintains backward compatibility

### 3. Error Handling Integration
- Provides detailed error context for debugging
- Suggests specific actions for resolution
- Integrates with existing logging infrastructure

## Benefits

### 1. Eliminates Hardcoded IDs
- No more `ticket-001`, `cust-001` hardcoded values
- Dynamic resolution based on actual test data
- Proper fallback mechanisms when data unavailable

### 2. Mode-Appropriate Behavior
- **Isolated Mode**: Uses predefined test data patterns
- **Production Mode**: Uses actual looneyTunesTest entities
- **Dual Mode**: Adapts behavior based on current execution context

### 3. Comprehensive Validation
- Validates entity existence before API calls
- Provides actionable error messages when validation fails
- Suggests specific steps for resolution

### 4. Enhanced Error Handling
- Context-aware error messages
- Recovery strategy suggestions
- Detailed logging for debugging

### 5. Production Safety
- Enforces looneyTunesTest naming conventions
- Validates test data markers in production mode
- Prevents accidental use of non-test data

## Configuration

### Environment Variables
- Uses existing test mode detection mechanisms
- No additional configuration required
- Automatic fallback to safe defaults

### Test Data Setup
- **Isolated Mode**: Uses existing test data loading mechanisms
- **Production Mode**: Requires looneyTunesTest entities in database
- **Validation**: Automatically validates data availability

## Error Recovery

### Automatic Recovery
- Suggests available entities when requested entity not found
- Provides naming convention guidance for production mode
- Offers alternative IDs based on similarity matching

### Manual Recovery
- Clear error messages with step-by-step resolution
- Suggestions for data creation when entities missing
- Troubleshooting guidance for common issues

## Testing

### Unit Tests
- All new components include comprehensive unit tests
- Mock-based testing for isolation
- Edge case coverage for error conditions

### Integration Tests
- Tests with actual data contexts
- Cross-mode validation testing
- Error handling scenario testing

## Future Enhancements

### 1. Caching
- Cache resolved IDs for performance
- Invalidate cache on context changes
- Configurable cache TTL

### 2. Metrics
- Track ID resolution performance
- Monitor validation failure rates
- Report on error recovery success

### 3. Advanced Validation
- Schema-based validation
- Cross-entity relationship validation
- Data consistency checks

## Migration Guide

### For Existing Tests
1. Update hardcoded IDs to use context-aware resolution
2. Add validation steps before API operations
3. Update error handling to use new error types
4. Test in both isolated and production modes

### For New Tests
1. Use context-aware step definitions from the start
2. Leverage validation and error handling capabilities
3. Follow production naming conventions
4. Include cleanup in test teardown

This implementation successfully addresses all requirements for Task 2, providing a robust, context-aware data management system that eliminates hardcoded IDs and provides comprehensive validation and error handling.