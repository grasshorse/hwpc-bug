# Location and Distance Calculation Services

This document describes the implementation of Task 3: "Build location and distance calculation services" for the ticket location route assignment testing framework.

## Overview

The implementation provides dual-mode support for geographic calculations and location services, enabling both controlled testing with predictable data and integration testing with real-world systems.

## Components Implemented

### 1. GeographicCalculationHandler

**File:** `src/support/testing/GeographicCalculationHandler.ts`

**Purpose:** Handles distance calculations with dual-mode support and robust error handling.

**Key Features:**
- **Dual-Mode Support:** Euclidean distance for isolated mode, real routing service for production mode
- **Error Handling:** Retry logic with exponential backoff and fallback mechanisms
- **Caching:** LRU cache for performance optimization
- **Batch Processing:** Efficient handling of multiple distance calculations
- **Validation:** Configuration and coordinate validation

**Usage Example:**
```typescript
const handler = new GeographicCalculationHandler(context);
const result = await handler.calculateDistance(from, to);
console.log(`Distance: ${result.distance}km, Mode: ${result.calculationMode}`);
```

### 2. LocationService Implementations

**File:** `src/support/testing/LocationServiceImplementations.ts`

**Purpose:** Provides both mock and real implementations of location services.

#### MockLocationService
- Uses controlled test data with predefined routes
- Euclidean distance calculations for predictable results
- Includes test routes with looneyTunesTest naming convention
- Service area boundary checking with polygon validation

#### RealLocationService
- Integrates with real routing services (mocked for safety)
- Filters results to only test data for production safety
- Caching for performance optimization
- Real-world coordinate validation

#### LocationServiceFactory
- Creates appropriate service based on test mode
- Supports custom configuration options
- Provides factory methods for both service types

## Key Features

### Dual-Mode Architecture
- **Isolated Mode:** Uses controlled data and Euclidean calculations for predictable testing
- **Production Mode:** Integrates with real services while maintaining safety through test data filtering

### Error Handling and Resilience
- Retry logic with exponential backoff for transient failures
- Fallback to Euclidean distance when real routing fails
- Comprehensive error messages and logging
- Timeout handling for external service calls

### Performance Optimization
- LRU caching for distance calculations and route lookups
- Batch processing for multiple operations
- Configurable cache sizes and timeouts
- Cache statistics and management

### Safety and Validation
- Coordinate validation with proper bounds checking
- Test data filtering in production mode
- Service area boundary validation
- Configuration validation

## Configuration Options

### LocationServiceConfig
```typescript
interface LocationServiceConfig {
  cacheTimeout: number;        // Cache expiration time (ms)
  maxCacheSize: number;        // Maximum cache entries
  enableCaching: boolean;      // Enable/disable caching
  defaultSearchRadius: number; // Default search radius (km)
}
```

### RouteCalculationOptions
```typescript
interface RouteCalculationOptions {
  mode?: GeographicCalculationMode;    // Force calculation mode
  timeout?: number;                    // Service call timeout
  retryCount?: number;                 // Number of retries
  fallbackToEuclidean?: boolean;       // Enable fallback
}
```

## Test Coverage

### GeographicCalculationHandler Tests
- Distance calculation in both modes
- Error handling and fallback mechanisms
- Batch processing functionality
- Cache management and statistics
- Configuration validation

### LocationService Tests
- Factory pattern functionality
- Mock service with controlled data
- Real service with production integration
- Service area boundary checking
- Cache functionality and management

## Requirements Satisfied

- **Requirement 1.2:** Geographic location handling and validation
- **Requirement 1.3:** Distance calculation and route optimization
- **Requirement 6.1:** Configurable location matching parameters

## Integration Points

The services integrate with:
- `GeographicUtilities` for coordinate validation and calculations
- `LocationAssignmentTestContext` for mode detection and configuration
- Test data generators for controlled scenarios
- Production data validators for safety checks

## Usage in Testing Framework

```typescript
// Create location service based on test mode
const locationService = LocationServiceFactory.createLocationService(context);

// Find nearby routes
const routes = await locationService.findNearbyRoutes(ticketLocation, 25);

// Calculate distances
const distance = await locationService.calculateDistance(from, to);

// Validate service area
const inArea = locationService.isInServiceArea(location, serviceArea);
```

## Future Enhancements

- Integration with real mapping APIs (Google Maps, MapBox, etc.)
- Advanced caching strategies (Redis, database-backed)
- Geospatial indexing for improved performance
- Real-time traffic data integration
- Route optimization algorithms