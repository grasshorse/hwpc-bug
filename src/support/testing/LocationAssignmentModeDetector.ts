/**
 * Location Assignment Mode Detector
 * Extends the base TestModeDetector with location-specific mode detection logic
 */

import { TestModeDetector } from './TestModeDetector';
import { TestMode, TestContext, ModeDetectionResult } from './types';
import { LocationAssignmentTestContext, LocationTestConfig } from './location-assignment-types';

export class LocationAssignmentModeDetector extends TestModeDetector {
  private static readonly LOCATION_TAG_PATTERNS = {
    GEOGRAPHIC: '@geographic',
    ROUTING: '@routing',
    ASSIGNMENT: '@assignment',
    BULK_ASSIGNMENT: '@bulk-assignment',
    CAPACITY: '@capacity',
    DISTANCE: '@distance'
  };

  /**
   * Detects mode specifically for location assignment tests
   */
  public detectLocationAssignmentMode(testContext: TestContext): ModeDetectionResult {
    // First get the base mode detection
    const baseResult = this.detectMode(testContext);
    
    // Then apply location-specific logic
    const locationResult = this.detectModeFromLocationTags(testContext.tags);
    
    // Combine results with location-specific weighting
    if (locationResult.confidence > baseResult.confidence) {
      return locationResult;
    }
    
    // If base result has high confidence, use it but add location context
    if (baseResult.confidence >= 0.8) {
      return {
        ...baseResult,
        fallbackReason: baseResult.fallbackReason 
          ? `${baseResult.fallbackReason} (location assignment context)`
          : 'High confidence base detection for location assignment'
      };
    }
    
    return baseResult;
  }

  /**
   * Creates location assignment test configuration based on detected mode
   */
  public createLocationTestConfig(mode: TestMode, testContext?: TestContext): LocationTestConfig {
    const baseConfig: LocationTestConfig = {
      mode,
      searchRadius: 50, // Default 50km radius
      maxRouteCapacity: 20, // Default max 20 tickets per route
      enableGeographicValidation: true,
      useRealDistanceCalculation: false,
      testServiceAreas: [],
      fallbackToEuclidean: true
    };

    // Customize config based on mode
    switch (mode) {
      case TestMode.ISOLATED:
        return {
          ...baseConfig,
          searchRadius: 25, // Smaller radius for controlled testing
          useRealDistanceCalculation: false, // Always use Euclidean for predictability
          enableGeographicValidation: true,
          fallbackToEuclidean: true
        };

      case TestMode.PRODUCTION:
        return {
          ...baseConfig,
          searchRadius: 100, // Larger radius for real-world scenarios
          useRealDistanceCalculation: true, // Use real routing services
          enableGeographicValidation: true,
          fallbackToEuclidean: true // Fallback if routing service fails
        };

      case TestMode.DUAL:
        return {
          ...baseConfig,
          searchRadius: 50, // Balanced radius
          useRealDistanceCalculation: this.shouldUseRealDistanceForDual(testContext),
          enableGeographicValidation: true,
          fallbackToEuclidean: true
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Validates that the test context is suitable for location assignment testing
   */
  public validateLocationAssignmentContext(context: LocationAssignmentTestContext): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate test data structure
    if (!context.testData) {
      issues.push('Test data is missing from context');
    } else {
      if (!context.testData.tickets || context.testData.tickets.length === 0) {
        issues.push('No test tickets available');
        recommendations.push('Ensure test data includes location-enabled tickets');
      }

      if (!context.testData.routes || context.testData.routes.length === 0) {
        issues.push('No test routes available');
        recommendations.push('Ensure test data includes routes with service areas');
      }

      if (!context.testData.locations || context.testData.locations.length === 0) {
        recommendations.push('Consider adding test locations for better coverage');
      }
    }

    // Validate services
    if (!context.services) {
      issues.push('Services are missing from context');
    } else {
      if (!context.services.locationService) {
        issues.push('LocationService is required for location assignment tests');
      }
      if (!context.services.routeService) {
        issues.push('RouteService is required for location assignment tests');
      }
      if (!context.services.assignmentService) {
        issues.push('AssignmentService is required for location assignment tests');
      }
    }

    // Validate configuration
    if (!context.config) {
      issues.push('Location test configuration is missing');
    } else {
      if (context.config.searchRadius <= 0) {
        issues.push('Search radius must be positive');
      }
      if (context.config.maxRouteCapacity <= 0) {
        issues.push('Max route capacity must be positive');
      }
    }

    // Mode-specific validations
    if (context.mode === TestMode.PRODUCTION) {
      if (!this.hasProductionSafetyMeasures(context)) {
        issues.push('Production mode requires safety measures for test data isolation');
        recommendations.push('Ensure all test data uses looneyTunesTest naming convention');
      }
    }

    if (context.mode === TestMode.ISOLATED) {
      if (context.config?.useRealDistanceCalculation) {
        recommendations.push('Consider using Euclidean distance calculation for more predictable isolated testing');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Detects mode from location-specific tags
   */
  private detectModeFromLocationTags(tags: string[]): ModeDetectionResult {
    const normalizedTags = tags.map(tag => tag.toLowerCase());
    
    // Check for location-specific patterns that suggest certain modes
    const hasGeographicTag = normalizedTags.some(tag => 
      tag.includes('geographic') || tag.includes('location') || tag.includes('coordinate')
    );
    
    const hasRoutingTag = normalizedTags.some(tag => 
      tag.includes('routing') || tag.includes('distance') || tag.includes('navigation')
    );
    
    const hasAssignmentTag = normalizedTags.some(tag => 
      tag.includes('assignment') || tag.includes('optimize') || tag.includes('allocation')
    );
    
    const hasBulkTag = normalizedTags.some(tag => 
      tag.includes('bulk') || tag.includes('batch') || tag.includes('mass')
    );
    
    const hasCapacityTag = normalizedTags.some(tag => 
      tag.includes('capacity') || tag.includes('limit') || tag.includes('constraint')
    );

    // Isolated mode indicators
    if (hasGeographicTag && hasCapacityTag && !hasRoutingTag) {
      return {
        mode: TestMode.ISOLATED,
        confidence: 0.8,
        source: 'tags',
        fallbackReason: 'Geographic and capacity tests work well with controlled data'
      };
    }

    // Production mode indicators
    if (hasRoutingTag && hasAssignmentTag) {
      return {
        mode: TestMode.PRODUCTION,
        confidence: 0.7,
        source: 'tags',
        fallbackReason: 'Routing and assignment tests benefit from real-world data'
      };
    }

    // Dual mode indicators
    if (hasBulkTag || (hasAssignmentTag && hasGeographicTag)) {
      return {
        mode: TestMode.DUAL,
        confidence: 0.6,
        source: 'tags',
        fallbackReason: 'Bulk assignment tests benefit from dual mode validation'
      };
    }

    // Default to dual mode for location assignment tests
    if (hasAssignmentTag || hasGeographicTag) {
      return {
        mode: TestMode.DUAL,
        confidence: 0.4,
        source: 'tags',
        fallbackReason: 'Location assignment tests typically benefit from dual mode'
      };
    }

    return {
      mode: TestMode.ISOLATED,
      confidence: 0.1,
      source: 'tags',
      fallbackReason: 'No location-specific tags found, defaulting to isolated mode'
    };
  }

  /**
   * Determines if dual mode should use real distance calculation
   */
  private shouldUseRealDistanceForDual(testContext?: TestContext): boolean {
    if (!testContext) {
      return false;
    }

    const tags = testContext.tags.map(tag => tag.toLowerCase());
    
    // Use real distance if test involves routing or integration
    return tags.some(tag => 
      tag.includes('routing') || 
      tag.includes('integration') || 
      tag.includes('end-to-end') ||
      tag.includes('e2e')
    );
  }

  /**
   * Checks if production mode has necessary safety measures
   */
  private hasProductionSafetyMeasures(context: LocationAssignmentTestContext): boolean {
    // Check if test data follows naming conventions
    const hasTestNaming = context.testData.tickets.every(ticket => 
      ticket.customerName.includes('looneyTunesTest') || ticket.isTestData
    );

    const hasTestRoutes = context.testData.routes.every(route => 
      route.name.includes('looneyTunesTest') || route.isTestRoute
    );

    return hasTestNaming && hasTestRoutes;
  }

  /**
   * Gets recommended tags for location assignment tests based on mode
   */
  public getRecommendedTags(mode: TestMode): string[] {
    const baseTags = ['@location-assignment'];
    
    switch (mode) {
      case TestMode.ISOLATED:
        return [...baseTags, '@isolated', '@geographic', '@controlled-data'];
      
      case TestMode.PRODUCTION:
        return [...baseTags, '@production', '@routing', '@real-data'];
      
      case TestMode.DUAL:
        return [...baseTags, '@dual', '@assignment', '@validation'];
      
      default:
        return baseTags;
    }
  }
}