/**
 * Location Assignment Testing Framework - Main Export
 * Provides a centralized export for all location assignment testing components
 */

// Core types and interfaces
export * from './location-assignment-types';
import { 
  LocationTestConfig, 
  LocationAssignmentTestContext, 
  TestDataGenerationOptions 
} from './location-assignment-types';

// Utilities
import { GeographicUtilities } from './geographic-utilities';

// Mode detection and configuration
import { LocationAssignmentModeDetector } from './LocationAssignmentModeDetector';
import { LocationAssignmentConfigManager } from './LocationAssignmentConfigManager';

// Data management
export * from './GeographicTestDataGenerator';
export * from './ProductionDataValidator';
export * from './ProductionTestDataManager';
export * from './ProductionSafetyGuard';

// Services and handlers
export * from './LocationServiceImplementations';
export * from './GeographicCalculationHandler';

// Assignment algorithm and validation
export * from './AssignmentAlgorithmValidator';
export * from './AssignmentConflictHandler';

// Export utilities
export { GeographicUtilities, LocationAssignmentModeDetector, LocationAssignmentConfigManager };

// Re-export base testing framework components that are commonly used
export { TestMode, TestContext, TestDefinition, ModeDetectionResult } from './types';
export { TestModeDetector } from './TestModeDetector';

// Import TestMode for internal use
import { TestMode } from './types';

/**
 * Main factory class for creating location assignment test contexts
 */
export class LocationAssignmentTestFactory {
  private static modeDetector = new LocationAssignmentModeDetector();

  /**
   * Creates a complete location assignment test context
   */
  public static async createTestContext(
    testName: string,
    tags: string[] = [],
    configOverrides?: Partial<LocationTestConfig>
  ): Promise<LocationAssignmentTestContext> {
    
    // Detect appropriate test mode
    const testContext = {
      testName,
      tags,
      testId: this.generateTestId(),
      scenario: undefined,
      feature: undefined
    };

    const modeResult = this.modeDetector.detectLocationAssignmentMode(testContext);
    
    // Create configuration
    const baseConfig = LocationAssignmentConfigManager.createDefaultConfig(modeResult.mode);
    const envConfig = LocationAssignmentConfigManager.mergeWithEnvironment(baseConfig);
    const finalConfig = { ...envConfig, ...configOverrides };

    // Validate configuration
    const configValidation = LocationAssignmentConfigManager.validateConfig(finalConfig);
    if (!configValidation.isValid) {
      throw new Error(`Invalid location test configuration: ${configValidation.issues.join(', ')}`);
    }

    // Log warnings if any
    if (configValidation.warnings.length > 0) {
      console.warn('Location test configuration warnings:', configValidation.warnings);
    }

    // Create the context (services will be injected by the actual test framework)
    const locationContext: LocationAssignmentTestContext = {
      ...testContext,
      mode: modeResult.mode,
      testData: {
        customers: [],
        routes: [],
        tickets: [],
        locations: [],
        assignments: [],
        metadata: {
          createdAt: new Date(),
          mode: modeResult.mode,
          version: '1.0.0',
          testRunId: this.generateTestId()
        }
      },
      services: {
        locationService: null as any, // Will be injected
        routeService: null as any,    // Will be injected
        assignmentService: null as any // Will be injected
      },
      config: finalConfig
    };

    return locationContext;
  }

  /**
   * Validates a location assignment test context
   */
  public static validateTestContext(
    context: LocationAssignmentTestContext
  ): { isValid: boolean; issues: string[]; recommendations: string[] } {
    return this.modeDetector.validateLocationAssignmentContext(context);
  }

  /**
   * Gets recommended tags for a test based on its characteristics
   */
  public static getRecommendedTags(
    testType: 'assignment' | 'bulk-assignment' | 'capacity' | 'routing' | 'geographic',
    mode?: TestMode
  ): string[] {
    const baseTags = ['@location-assignment'];
    
    // Add type-specific tags
    switch (testType) {
      case 'assignment':
        baseTags.push('@assignment', '@optimization');
        break;
      case 'bulk-assignment':
        baseTags.push('@bulk-assignment', '@batch', '@performance');
        break;
      case 'capacity':
        baseTags.push('@capacity', '@constraints', '@validation');
        break;
      case 'routing':
        baseTags.push('@routing', '@distance', '@navigation');
        break;
      case 'geographic':
        baseTags.push('@geographic', '@coordinates', '@validation');
        break;
    }

    // Add mode-specific tags if provided
    if (mode) {
      baseTags.push(...this.modeDetector.getRecommendedTags(mode));
    }

    return baseTags;
  }

  /**
   * Creates test data generation options for common scenarios
   */
  public static createScenarioDataOptions(
    scenario: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment' | 'edge-cases',
    mode: TestMode
  ): TestDataGenerationOptions {
    const config = LocationAssignmentConfigManager.createScenarioConfig(scenario, mode);
    return LocationAssignmentConfigManager.createDataGenerationOptions(config);
  }

  /**
   * Generates a unique test ID
   */
  private static generateTestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `loc-test-${timestamp}-${random}`;
  }
}

/**
 * Convenience functions for common operations
 */
export const LocationAssignmentTestUtils = {
  /**
   * Quick setup for isolated mode testing
   */
  createIsolatedTest: async (testName: string, tags: string[] = []) => {
    return LocationAssignmentTestFactory.createTestContext(
      testName, 
      [...tags, '@isolated'], 
      { mode: TestMode.ISOLATED }
    );
  },

  /**
   * Quick setup for production mode testing
   */
  createProductionTest: async (testName: string, tags: string[] = []) => {
    return LocationAssignmentTestFactory.createTestContext(
      testName, 
      [...tags, '@production'], 
      { mode: TestMode.PRODUCTION }
    );
  },

  /**
   * Quick setup for dual mode testing
   */
  createDualTest: async (testName: string, tags: string[] = []) => {
    return LocationAssignmentTestFactory.createTestContext(
      testName, 
      [...tags, '@dual'], 
      { mode: TestMode.DUAL }
    );
  },

  /**
   * Validates geographic data in test context
   */
  validateGeographicData: (context: LocationAssignmentTestContext) => {
    const issues: string[] = [];
    
    // Validate ticket locations
    context.testData.tickets.forEach((ticket, index) => {
      const validation = GeographicUtilities.validateCoordinate(ticket.location);
      if (!validation.isValid) {
        issues.push(`Ticket ${index} location: ${validation.issues?.join(', ')}`);
      }
    });

    // Validate route service areas
    context.testData.routes.forEach((route, index) => {
      const validation = GeographicUtilities.validatePolygon(route.serviceArea);
      if (!validation.isValid) {
        issues.push(`Route ${index} service area: ${validation.issues?.join(', ')}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};