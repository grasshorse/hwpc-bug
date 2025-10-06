/**
 * Location Assignment Configuration Manager
 * Manages configuration for location-based testing scenarios
 */

import { TestMode } from './types';
import { 
  LocationTestConfig, 
  GeoPolygon, 
  GeoCoordinate, 
  TestDataGenerationOptions 
} from './location-assignment-types';
import { GeographicUtilities } from './geographic-utilities';

export class LocationAssignmentConfigManager {
  private static readonly DEFAULT_SEARCH_RADIUS = 50; // km
  private static readonly DEFAULT_MAX_CAPACITY = 20;
  private static readonly DEFAULT_TEST_LOCATIONS = {
    CEDAR_FALLS: { lat: 42.5276, lng: -92.4453 },
    WINFIELD: { lat: 41.1236, lng: -91.4346 },
    O_FALLON: { lat: 38.8106, lng: -90.6999 }
  };

  /**
   * Creates a default configuration for the specified test mode
   */
  public static createDefaultConfig(mode: TestMode): LocationTestConfig {
    const baseConfig: LocationTestConfig = {
      mode,
      searchRadius: this.DEFAULT_SEARCH_RADIUS,
      maxRouteCapacity: this.DEFAULT_MAX_CAPACITY,
      enableGeographicValidation: true,
      useRealDistanceCalculation: false,
      testServiceAreas: [],
      fallbackToEuclidean: true
    };

    switch (mode) {
      case TestMode.ISOLATED:
        return {
          ...baseConfig,
          searchRadius: 25,
          useRealDistanceCalculation: false,
          testServiceAreas: this.createIsolatedTestServiceAreas(),
          fallbackToEuclidean: true
        };

      case TestMode.PRODUCTION:
        return {
          ...baseConfig,
          searchRadius: 100,
          useRealDistanceCalculation: true,
          testServiceAreas: this.createProductionTestServiceAreas(),
          fallbackToEuclidean: true
        };

      case TestMode.DUAL:
        return {
          ...baseConfig,
          searchRadius: 50,
          useRealDistanceCalculation: false, // Start with Euclidean for consistency
          testServiceAreas: this.createDualModeTestServiceAreas(),
          fallbackToEuclidean: true
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Validates a location test configuration
   */
  public static validateConfig(config: LocationTestConfig): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validate basic parameters
    if (config.searchRadius <= 0) {
      issues.push('Search radius must be positive');
    } else if (config.searchRadius > 500) {
      warnings.push('Search radius over 500km may impact performance');
    }

    if (config.maxRouteCapacity <= 0) {
      issues.push('Max route capacity must be positive');
    } else if (config.maxRouteCapacity > 100) {
      warnings.push('Route capacity over 100 may be unrealistic');
    }

    // Validate service areas
    if (config.testServiceAreas && config.testServiceAreas.length > 0) {
      for (let i = 0; i < config.testServiceAreas.length; i++) {
        const areaValidation = GeographicUtilities.validatePolygon(config.testServiceAreas[i]);
        if (!areaValidation.isValid) {
          issues.push(`Service area ${i}: ${areaValidation.issues?.join(', ')}`);
        }
      }
    }

    // Mode-specific validations
    if (config.mode === TestMode.ISOLATED && config.useRealDistanceCalculation) {
      warnings.push('Isolated mode typically uses Euclidean distance for predictability');
    }

    if (config.mode === TestMode.PRODUCTION && !config.useRealDistanceCalculation) {
      warnings.push('Production mode typically benefits from real distance calculations');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Creates test data generation options based on configuration
   */
  public static createDataGenerationOptions(
    config: LocationTestConfig,
    overrides?: Partial<TestDataGenerationOptions>
  ): TestDataGenerationOptions {
    const defaultOptions: TestDataGenerationOptions = {
      mode: config.mode,
      locationCount: this.getDefaultLocationCount(config.mode),
      routeCount: this.getDefaultRouteCount(config.mode),
      ticketCount: this.getDefaultTicketCount(config.mode),
      serviceArea: this.getDefaultServiceArea(config.mode),
      useControlledCoordinates: config.mode === TestMode.ISOLATED
    };

    return { ...defaultOptions, ...overrides };
  }

  /**
   * Gets environment-specific configuration overrides
   */
  public static getEnvironmentOverrides(): Partial<LocationTestConfig> {
    const overrides: Partial<LocationTestConfig> = {};

    // Check for environment variable overrides
    const envSearchRadius = process.env.TEST_SEARCH_RADIUS;
    if (envSearchRadius && !isNaN(Number(envSearchRadius))) {
      overrides.searchRadius = Number(envSearchRadius);
    }

    const envMaxCapacity = process.env.TEST_MAX_ROUTE_CAPACITY;
    if (envMaxCapacity && !isNaN(Number(envMaxCapacity))) {
      overrides.maxRouteCapacity = Number(envMaxCapacity);
    }

    const envUseRealDistance = process.env.TEST_USE_REAL_DISTANCE;
    if (envUseRealDistance) {
      overrides.useRealDistanceCalculation = envUseRealDistance.toLowerCase() === 'true';
    }

    const envDisableValidation = process.env.TEST_DISABLE_GEO_VALIDATION;
    if (envDisableValidation) {
      overrides.enableGeographicValidation = envDisableValidation.toLowerCase() !== 'true';
    }

    return overrides;
  }

  /**
   * Merges configuration with environment overrides
   */
  public static mergeWithEnvironment(config: LocationTestConfig): LocationTestConfig {
    const envOverrides = this.getEnvironmentOverrides();
    return { ...config, ...envOverrides };
  }

  /**
   * Creates service areas for isolated testing
   */
  private static createIsolatedTestServiceAreas(): GeoPolygon[] {
    return [
      {
        name: 'Isolated Test Area North',
        coordinates: [
          { lat: 42.5200, lng: -92.5200 },
          { lat: 42.5200, lng: -92.4800 },
          { lat: 42.5400, lng: -92.4800 },
          { lat: 42.5400, lng: -92.5200 },
          { lat: 42.5200, lng: -92.5200 }
        ]
      },
      {
        name: 'Isolated Test Area South',
        coordinates: [
          { lat: 42.4800, lng: -92.5200 },
          { lat: 42.4800, lng: -92.4800 },
          { lat: 42.5000, lng: -92.4800 },
          { lat: 42.5000, lng: -92.5200 },
          { lat: 42.4800, lng: -92.5200 }
        ]
      }
    ];
  }

  /**
   * Creates service areas for production testing
   */
  private static createProductionTestServiceAreas(): GeoPolygon[] {
    return [
      {
        name: 'Cedar Falls Test Area - looneyTunesTest',
        coordinates: [
          { lat: 42.5500, lng: -92.4700 },
          { lat: 42.5500, lng: -92.4200 },
          { lat: 42.5000, lng: -92.4200 },
          { lat: 42.5000, lng: -92.4700 },
          { lat: 42.5500, lng: -92.4700 }
        ]
      },
      {
        name: 'Winfield Test Area - looneyTunesTest',
        coordinates: [
          { lat: 41.1500, lng: -91.4600 },
          { lat: 41.1500, lng: -91.4100 },
          { lat: 41.1000, lng: -91.4100 },
          { lat: 41.1000, lng: -91.4600 },
          { lat: 41.1500, lng: -91.4600 }
        ]
      }
    ];
  }

  /**
   * Creates service areas for dual mode testing
   */
  private static createDualModeTestServiceAreas(): GeoPolygon[] {
    // Combine both isolated and production areas for comprehensive testing
    return [
      ...this.createIsolatedTestServiceAreas(),
      ...this.createProductionTestServiceAreas()
    ];
  }

  /**
   * Gets default location count based on test mode
   */
  private static getDefaultLocationCount(mode: TestMode): number {
    switch (mode) {
      case TestMode.ISOLATED:
        return 10; // Small, controlled set
      case TestMode.PRODUCTION:
        return 25; // Realistic production volume
      case TestMode.DUAL:
        return 15; // Balanced for both modes
      default:
        return 10;
    }
  }

  /**
   * Gets default route count based on test mode
   */
  private static getDefaultRouteCount(mode: TestMode): number {
    switch (mode) {
      case TestMode.ISOLATED:
        return 3; // Minimal for controlled testing
      case TestMode.PRODUCTION:
        return 8; // Realistic route coverage
      case TestMode.DUAL:
        return 5; // Balanced coverage
      default:
        return 3;
    }
  }

  /**
   * Gets default ticket count based on test mode
   */
  private static getDefaultTicketCount(mode: TestMode): number {
    switch (mode) {
      case TestMode.ISOLATED:
        return 15; // Small batch for controlled scenarios
      case TestMode.PRODUCTION:
        return 50; // Realistic daily volume
      case TestMode.DUAL:
        return 30; // Balanced volume
      default:
        return 15;
    }
  }

  /**
   * Gets default service area based on test mode
   */
  private static getDefaultServiceArea(mode: TestMode): GeoPolygon {
    const center = this.DEFAULT_TEST_LOCATIONS.CEDAR_FALLS;
    const radius = mode === TestMode.ISOLATED ? 10 : 25; // km

    // Create a simple rectangular service area
    const latOffset = radius / 111.32; // Approximate degrees per km
    const lngOffset = radius / (111.32 * Math.cos(center.lat * Math.PI / 180));

    return {
      name: `Default ${mode} Service Area`,
      coordinates: [
        { lat: center.lat - latOffset, lng: center.lng - lngOffset },
        { lat: center.lat - latOffset, lng: center.lng + lngOffset },
        { lat: center.lat + latOffset, lng: center.lng + lngOffset },
        { lat: center.lat + latOffset, lng: center.lng - lngOffset },
        { lat: center.lat - latOffset, lng: center.lng - lngOffset }
      ]
    };
  }

  /**
   * Creates a configuration for specific test scenarios
   */
  public static createScenarioConfig(
    scenario: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment' | 'edge-cases',
    baseMode: TestMode
  ): LocationTestConfig {
    const baseConfig = this.createDefaultConfig(baseMode);

    switch (scenario) {
      case 'optimal-assignment':
        return {
          ...baseConfig,
          searchRadius: 30,
          maxRouteCapacity: 15,
          useRealDistanceCalculation: baseMode === TestMode.PRODUCTION
        };

      case 'capacity-constraints':
        return {
          ...baseConfig,
          searchRadius: 20,
          maxRouteCapacity: 5, // Low capacity to trigger constraints
          useRealDistanceCalculation: false // Use Euclidean for predictable results
        };

      case 'bulk-assignment':
        return {
          ...baseConfig,
          searchRadius: 75,
          maxRouteCapacity: 30, // Higher capacity for bulk operations
          useRealDistanceCalculation: baseMode !== TestMode.ISOLATED
        };

      case 'edge-cases':
        return {
          ...baseConfig,
          searchRadius: 10, // Small radius to create edge cases
          maxRouteCapacity: 1, // Very low capacity
          useRealDistanceCalculation: false,
          fallbackToEuclidean: true
        };

      default:
        return baseConfig;
    }
  }
}