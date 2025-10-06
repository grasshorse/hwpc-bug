/**
 * Production Test Data Manager
 * Manages test data in production environment with safety guards
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  TestLocation, 
  LocationTestDataSet,
  ValidationResult,
  LocationTestScenario
} from './location-assignment-types';
import { TestMode, TestConfig, DataContext, ConnectionInfo, TestMetadata, TestRoute, TestTicket } from './types';
import { DataContextManager } from './DataContextManager';
import { ProductionDataValidator } from './ProductionDataValidator';
import { GeographicTestDataGenerator } from './GeographicTestDataGenerator';
import Log from '../logger/Log';

export interface ProductionTestDataConfig {
  validateBeforeUse: boolean;
  requireLooneyTunesNaming: boolean;
  enforceTestServiceAreas: boolean;
  maxTestDataAge: number; // in hours
  autoCleanup: boolean;
}

export interface TestDataExistenceCheck {
  tickets: { exists: boolean; count: number; valid: number };
  routes: { exists: boolean; count: number; valid: number };
  locations: { exists: boolean; count: number; valid: number };
  assignments: { exists: boolean; count: number; valid: number };
}

export class ProductionTestDataManager implements DataContextManager {
  private config: ProductionTestDataConfig;
  private validationErrors: string[] = [];
  private activeContexts: Map<string, DataContext> = new Map();

  constructor(config?: Partial<ProductionTestDataConfig>) {
    this.config = {
      validateBeforeUse: true,
      requireLooneyTunesNaming: true,
      enforceTestServiceAreas: true,
      maxTestDataAge: 24, // 24 hours
      autoCleanup: false,
      ...config
    };
  }

  /**
   * Ensures production test data exists and is valid
   */
  public async ensureTestDataExists(scenario?: string): Promise<ValidationResult> {
    this.validationErrors = [];

    try {
      // Check if test data exists
      const existenceCheck = await this.checkTestDataExistence();
      
      // If no test data exists, create it
      if (!this.hasMinimumTestData(existenceCheck)) {
        Log.info('Creating missing production test data...');
        await this.createProductionTestData(scenario);
      }

      // Validate existing test data
      if (this.config.validateBeforeUse) {
        const validationResult = await this.validateExistingTestData();
        if (!validationResult.isValid) {
          this.validationErrors.push(...(validationResult.issues || []));
        }
      }

      // Clean up old test data if configured
      if (this.config.autoCleanup) {
        await this.cleanupOldTestData();
      }

      return {
        isValid: this.validationErrors.length === 0,
        issues: this.validationErrors.length > 0 ? this.validationErrors : undefined
      };

    } catch (error) {
      this.validationErrors.push(`Error ensuring test data: ${error.message}`);
      return {
        isValid: false,
        issues: this.validationErrors
      };
    }
  }

  /**
   * Gets production test data with validation
   */
  public async getProductionTestData(scenario?: string): Promise<LocationTestDataSet> {
    // Ensure data exists first
    const ensureResult = await this.ensureTestDataExists(scenario);
    if (!ensureResult.isValid) {
      throw new Error(`Test data validation failed: ${ensureResult.issues?.join(', ')}`);
    }

    // Load test data from production database
    const testData = await this.loadTestDataFromDatabase();

    // Validate loaded data
    if (this.config.validateBeforeUse) {
      const validation = ProductionDataValidator.validateTestDataBatch(testData);
      if (!validation.isValid) {
        throw new Error(`Loaded test data is invalid: ${validation.issues?.join(', ')}`);
      }
    }

    return {
      customers: [], // Would be loaded from database
      tickets: testData.tickets || [],
      routes: testData.routes || [],
      locations: testData.locations || [],
      assignments: testData.assignments || [],
      metadata: {
        mode: TestMode.PRODUCTION,
        createdAt: new Date(),
        version: '1.0.0',
        testRunId: `production-${scenario || 'default'}-${Date.now()}`
      }
    };
  }

  /**
   * Creates production test data safely
   */
  public async createProductionTestData(scenario?: string): Promise<void> {
    Log.info(`Creating production test data for scenario: ${scenario || 'default'}`);

    // Generate test locations
    const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.PRODUCTION, 10);
    
    // Validate locations before saving
    const locationValidation = this.validateLocations(locations);
    if (!locationValidation.isValid) {
      throw new Error(`Generated locations are invalid: ${locationValidation.issues?.join(', ')}`);
    }

    // Generate test routes
    const routes = GeographicTestDataGenerator.generateTestRoutes(
      scenario as any || 'optimal-assignment', 
      TestMode.PRODUCTION
    );

    // Validate routes before saving
    const routeValidation = this.validateRoutes(routes);
    if (!routeValidation.isValid) {
      throw new Error(`Generated routes are invalid: ${routeValidation.issues?.join(', ')}`);
    }

    // Generate test tickets
    const tickets = GeographicTestDataGenerator.generateTestTickets(
      scenario as any || 'optimal-assignment',
      locations,
      TestMode.PRODUCTION
    );

    // Validate tickets before saving
    const ticketValidation = this.validateTickets(tickets);
    if (!ticketValidation.isValid) {
      throw new Error(`Generated tickets are invalid: ${ticketValidation.issues?.join(', ')}`);
    }

    // Save to database (implementation would depend on actual database)
    await this.saveTestDataToDatabase({ locations, routes, tickets });

    Log.info(`Successfully created production test data:
      - ${locations.length} locations
      - ${routes.length} routes  
      - ${tickets.length} tickets`);
  }

  /**
   * Validates existing test data in production
   */
  public async validateExistingTestData(): Promise<ValidationResult> {
    const issues: string[] = [];

    try {
      const testData = await this.loadTestDataFromDatabase();

      // Validate each type of test data
      const validation = ProductionDataValidator.validateTestDataBatch(testData);
      if (!validation.isValid) {
        issues.push(...(validation.issues || []));
      }

      // Check data age
      if (this.config.maxTestDataAge > 0) {
        const ageValidation = await this.validateTestDataAge();
        if (!ageValidation.isValid) {
          issues.push(...(ageValidation.issues || []));
        }
      }

      // Check for data consistency
      const consistencyValidation = this.validateDataConsistency(testData);
      if (!consistencyValidation.isValid) {
        issues.push(...(consistencyValidation.issues || []));
      }

    } catch (error) {
      issues.push(`Error validating existing test data: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Checks if test data exists in production database
   */
  public async checkTestDataExistence(): Promise<TestDataExistenceCheck> {
    // This would query the actual production database
    // For now, returning mock data structure
    
    try {
      const testData = await this.loadTestDataFromDatabase();
      
      return {
        tickets: {
          exists: (testData.tickets?.length || 0) > 0,
          count: testData.tickets?.length || 0,
          valid: this.countValidItems(testData.tickets || [], 'ticket')
        },
        routes: {
          exists: (testData.routes?.length || 0) > 0,
          count: testData.routes?.length || 0,
          valid: this.countValidItems(testData.routes || [], 'route')
        },
        locations: {
          exists: (testData.locations?.length || 0) > 0,
          count: testData.locations?.length || 0,
          valid: this.countValidItems(testData.locations || [], 'location')
        },
        assignments: {
          exists: (testData.assignments?.length || 0) > 0,
          count: testData.assignments?.length || 0,
          valid: this.countValidItems(testData.assignments || [], 'assignment')
        }
      };
    } catch (error) {
      Log.error(`Error checking test data existence: ${error.message}`);
      return {
        tickets: { exists: false, count: 0, valid: 0 },
        routes: { exists: false, count: 0, valid: 0 },
        locations: { exists: false, count: 0, valid: 0 },
        assignments: { exists: false, count: 0, valid: 0 }
      };
    }
  }

  /**
   * Cleans up old test data
   */
  public async cleanupOldTestData(): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.config.maxTestDataAge);

    Log.info(`Cleaning up test data older than ${cutoffTime.toISOString()}`);

    // Implementation would delete old test data from database
    // This is a placeholder for the actual cleanup logic
    
    try {
      // Delete old assignments
      await this.deleteOldAssignments(cutoffTime);
      
      // Delete old tickets
      await this.deleteOldTickets(cutoffTime);
      
      // Clean up orphaned data
      await this.cleanupOrphanedData();
      
      Log.info('Test data cleanup completed successfully');
    } catch (error) {
      Log.error(`Error during test data cleanup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates locations array
   */
  private validateLocations(locations: TestLocation[]): ValidationResult {
    const issues: string[] = [];
    
    locations.forEach((location, index) => {
      const validation = ProductionDataValidator.validateTestLocation(location);
      if (!validation.isValid) {
        issues.push(`Location ${index + 1}: ${validation.issues?.join(', ')}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validates routes array
   */
  private validateRoutes(routes: LocationTestRoute[]): ValidationResult {
    const issues: string[] = [];
    
    routes.forEach((route, index) => {
      const validation = ProductionDataValidator.validateTestRoute(route);
      if (!validation.isValid) {
        issues.push(`Route ${index + 1}: ${validation.issues?.join(', ')}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validates tickets array
   */
  private validateTickets(tickets: LocationTestTicket[]): ValidationResult {
    const issues: string[] = [];
    
    tickets.forEach((ticket, index) => {
      const validation = ProductionDataValidator.validateTestTicket(ticket);
      if (!validation.isValid) {
        issues.push(`Ticket ${index + 1}: ${validation.issues?.join(', ')}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Checks if minimum test data exists
   */
  private hasMinimumTestData(check: TestDataExistenceCheck): boolean {
    return check.tickets.exists && check.tickets.count >= 3 &&
           check.routes.exists && check.routes.count >= 2 &&
           check.locations.exists && check.locations.count >= 5;
  }

  /**
   * Counts valid items in an array
   */
  private countValidItems(items: any[], type: string): number {
    return items.filter(item => {
      switch (type) {
        case 'ticket':
          return ProductionDataValidator.validateTestTicket(item).isValid;
        case 'route':
          return ProductionDataValidator.validateTestRoute(item).isValid;
        case 'location':
          return ProductionDataValidator.validateTestLocation(item).isValid;
        case 'assignment':
          return ProductionDataValidator.validateAssignmentSafety(item).isValid;
        default:
          return false;
      }
    }).length;
  }

  /**
   * Validates test data age
   */
  private async validateTestDataAge(): Promise<ValidationResult> {
    const issues: string[] = [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.config.maxTestDataAge);

    // This would check actual creation timestamps from database
    // For now, returning success as placeholder
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validates data consistency between related entities
   */
  private validateDataConsistency(testData: any): ValidationResult {
    const issues: string[] = [];

    // Check that assigned tickets reference valid routes
    if (testData.tickets && testData.routes) {
      const routeIds = new Set(testData.routes.map((r: any) => r.id));
      
      testData.tickets.forEach((ticket: any) => {
        if (ticket.assignedRouteId && !routeIds.has(ticket.assignedRouteId)) {
          issues.push(`Ticket ${ticket.id} references non-existent route ${ticket.assignedRouteId}`);
        }
      });
    }

    // Check that assignments reference valid tickets and routes
    if (testData.assignments && testData.tickets && testData.routes) {
      const ticketIds = new Set(testData.tickets.map((t: any) => t.id));
      const routeIds = new Set(testData.routes.map((r: any) => r.id));
      
      testData.assignments.forEach((assignment: any) => {
        if (!ticketIds.has(assignment.ticketId)) {
          issues.push(`Assignment ${assignment.id} references non-existent ticket ${assignment.ticketId}`);
        }
        if (!routeIds.has(assignment.routeId)) {
          issues.push(`Assignment ${assignment.id} references non-existent route ${assignment.routeId}`);
        }
      });
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Loads test data from database (placeholder implementation)
   */
  private async loadTestDataFromDatabase(): Promise<{
    tickets?: LocationTestTicket[];
    routes?: LocationTestRoute[];
    locations?: TestLocation[];
    assignments?: any[];
  }> {
    // This would implement actual database queries
    // For now, returning empty arrays as placeholder
    return {
      tickets: [],
      routes: [],
      locations: [],
      assignments: []
    };
  }

  /**
   * Saves test data to database (placeholder implementation)
   */
  private async saveTestDataToDatabase(data: {
    locations: TestLocation[];
    routes: LocationTestRoute[];
    tickets: LocationTestTicket[];
  }): Promise<void> {
    // This would implement actual database inserts
    Log.info('Saving test data to database (placeholder)');
  }

  /**
   * Deletes old assignments (placeholder implementation)
   */
  private async deleteOldAssignments(cutoffTime: Date): Promise<void> {
    // This would implement actual database deletion
    Log.info(`Deleting assignments older than ${cutoffTime.toISOString()}`);
  }

  /**
   * Deletes old tickets (placeholder implementation)
   */
  private async deleteOldTickets(cutoffTime: Date): Promise<void> {
    // This would implement actual database deletion
    Log.info(`Deleting tickets older than ${cutoffTime.toISOString()}`);
  }

  /**
   * Cleans up orphaned data (placeholder implementation)
   */
  private async cleanupOrphanedData(): Promise<void> {
    // This would implement cleanup of orphaned records
    Log.info('Cleaning up orphaned data');
  }

  /**
   * Gets current configuration
   */
  public getConfig(): ProductionTestDataConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  public updateConfig(newConfig: Partial<ProductionTestDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets validation errors from last operation
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Gets the supported test mode for this context manager
   * @returns TestMode.PRODUCTION - This manager supports production mode testing
   */
  public getSupportedMode(): TestMode {
    return TestMode.PRODUCTION;
  }

  /**
   * Sets up a production test data context
   * @param mode - The test mode (PRODUCTION or DUAL)
   * @param testConfig - Configuration for the test
   * @returns Promise<DataContext> - The created data context
   */
  public async setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext> {
    const scenario = testConfig.tags?.join('-') || 'default';
    
    // Log context creation start
    Log.info(`[ProductionTestDataManager] Starting context setup for mode: ${mode}, scenario: ${scenario}`);

    // Validate mode compatibility (PRODUCTION or DUAL only)
    if (mode !== TestMode.PRODUCTION && mode !== TestMode.DUAL) {
      const errorMsg = `Invalid mode for ProductionTestDataManager: ${mode}. Only PRODUCTION and DUAL modes are supported.`;
      Log.error(`[ProductionTestDataManager] Context setup failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Generate unique test run ID using existing helper methods
    const testRunId = this.generateTestRunId();
    Log.info(`[ProductionTestDataManager] Generated test run ID: ${testRunId}`);

    try {
      // Create ConnectionInfo object with production-specific settings
      const connectionInfo = this.createConnectionInfo();
      Log.info(`[ProductionTestDataManager] Created connection info for host: ${connectionInfo.host}`);

      // Create test metadata for the context
      const metadata = this.createTestMetadata(testRunId, mode);
      Log.info(`[ProductionTestDataManager] Created metadata for context version: ${metadata.version}`);

      // Call existing ensureTestDataExists method
      Log.info(`[ProductionTestDataManager] Ensuring test data exists for scenario: ${scenario}`);
      const ensureResult = await this.ensureTestDataExists(scenario);
      if (!ensureResult.isValid) {
        const errorMsg = `Failed to ensure test data exists for scenario '${scenario}': ${ensureResult.issues?.join(', ')}`;
        Log.error(`[ProductionTestDataManager] Context setup failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      Log.info(`[ProductionTestDataManager] Test data validation successful`);

      // Load production test data using getProductionTestData method
      Log.info(`[ProductionTestDataManager] Loading production test data for scenario: ${scenario}`);
      const productionTestData = await this.getProductionTestData(scenario);
      Log.info(`[ProductionTestDataManager] Loaded test data - customers: ${productionTestData.customers?.length || 0}, routes: ${productionTestData.routes?.length || 0}, tickets: ${productionTestData.tickets?.length || 0}`);

      // Create DataContext with proper metadata and test data
      const dataContext: DataContext = {
        mode,
        testData: {
          customers: productionTestData.customers || [],
          routes: this.mapLocationRoutesToTestRoutes(productionTestData.routes || []),
          tickets: this.mapLocationTicketsToTestTickets(productionTestData.tickets || []),
          metadata: {
            ...metadata,
            testRunId
          }
        },
        connectionInfo,
        metadata: {
          ...metadata,
          testRunId
        },
        cleanup: async () => {
          // Cleanup implementation will be added in task 4.2
          await this.cleanupSingleContext(testRunId, dataContext);
        }
      };

      // Store created context in activeContexts map
      this.activeContexts.set(testRunId, dataContext);
      Log.info(`[ProductionTestDataManager] Context stored in activeContexts map. Total active contexts: ${this.activeContexts.size}`);

      Log.info(`[ProductionTestDataManager] Context setup completed successfully for test run ID: ${testRunId}`);
      return dataContext;

    } catch (error) {
      const errorMsg = `Failed to setup production test data context for mode '${mode}' and scenario '${scenario}': ${error.message}`;
      Log.error(`[ProductionTestDataManager] Context setup failed: ${errorMsg}`);
      
      // Additional error context for debugging
      if (error.stack) {
        Log.error(`[ProductionTestDataManager] Error stack trace: ${error.stack}`);
      }
      
      throw new Error(errorMsg);
    }
  }

  /**
   * Generates a unique test run ID for context tracking
   */
  private generateTestRunId(): string {
    return `production-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Creates connection info for production test environment
   */
  private createConnectionInfo(): ConnectionInfo {
    return {
      host: process.env.PRODUCTION_DB_HOST || 'localhost',
      port: parseInt(process.env.PRODUCTION_DB_PORT || '5432'),
      database: process.env.PRODUCTION_DB_NAME || 'production_db',
      isTestConnection: true
    };
  }

  /**
   * Creates test metadata for production context
   */
  private createTestMetadata(testRunId: string, mode: TestMode): TestMetadata {
    return {
      createdAt: new Date(),
      mode,
      version: '1.0.0',
      testRunId
    };
  }

  /**
   * Gets all active contexts for debugging and monitoring
   */
  public getActiveContexts(): Map<string, DataContext> {
    return new Map(this.activeContexts);
  }

  /**
   * Cleans up all active contexts (emergency cleanup) with comprehensive error handling
   */
  public async cleanupAllContexts(): Promise<void> {
    const cleanupStartTime = Date.now();
    const totalContexts = this.activeContexts.size;
    let successfulCleanups = 0;
    let failedCleanups = 0;
    const cleanupErrors: string[] = [];
    
    Log.info(`[ProductionTestDataManager] Starting emergency cleanup of all ${totalContexts} active contexts at ${new Date().toISOString()}`);
    
    if (totalContexts === 0) {
      Log.info(`[ProductionTestDataManager] No active contexts to clean up`);
      return;
    }
    
    const cleanupPromises: Promise<void>[] = [];
    
    this.activeContexts.forEach((context, contextId) => {
      cleanupPromises.push(
        this.cleanupSingleContext(contextId, context)
          .then(() => {
            successfulCleanups++;
            Log.info(`[ProductionTestDataManager] ✓ Successfully cleaned up context ${contextId} (${successfulCleanups}/${totalContexts})`);
          })
          .catch(error => {
            failedCleanups++;
            const errorMsg = `Failed to cleanup context ${contextId}: ${error.message}`;
            cleanupErrors.push(errorMsg);
            Log.error(`[ProductionTestDataManager] ✗ ${errorMsg} (${failedCleanups} failures so far)`);
          })
      );
    });
    
    try {
      await Promise.all(cleanupPromises);
    } catch (error) {
      // This shouldn't happen since we're catching individual errors, but just in case
      Log.error(`[ProductionTestDataManager] ✗ Unexpected error during Promise.all for context cleanup: ${error.message}`);
    }
    
    // Final cleanup to ensure no contexts remain in map
    try {
      const remainingContexts = this.activeContexts.size;
      if (remainingContexts > 0) {
        Log.error(`[ProductionTestDataManager] ⚠ ${remainingContexts} contexts still remain in activeContexts map, performing emergency clear`);
        this.activeContexts.clear();
        Log.info(`[ProductionTestDataManager] ✓ Emergency cleared activeContexts map`);
      }
    } catch (clearError) {
      Log.error(`[ProductionTestDataManager] ✗ Failed to clear activeContexts map: ${clearError.message}`);
    }
    
    const totalCleanupDuration = Date.now() - cleanupStartTime;
    
    // Comprehensive cleanup summary
    if (failedCleanups === 0) {
      Log.info(`[ProductionTestDataManager] ✓ Emergency cleanup completed successfully for all ${totalContexts} contexts in ${totalCleanupDuration}ms`);
    } else {
      Log.error(`[ProductionTestDataManager] ⚠ Emergency cleanup completed with ${failedCleanups}/${totalContexts} failures in ${totalCleanupDuration}ms`);
      Log.error(`[ProductionTestDataManager] Cleanup errors summary: ${cleanupErrors.join('; ')}`);
    }
    
    Log.info(`[ProductionTestDataManager] Final cleanup statistics - Successful: ${successfulCleanups}, Failed: ${failedCleanups}, Total: ${totalContexts}, Duration: ${totalCleanupDuration}ms`);
  }

  /**
   * Helper method to cleanup a single context with comprehensive error handling
   */
  private async cleanupSingleContext(contextId: string, context: DataContext): Promise<void> {
    const cleanupStartTime = Date.now();
    
    try {
      Log.info(`[ProductionTestDataManager] Starting single context cleanup for ${contextId}`);
      
      // Use the main cleanupContext method for consistent error handling
      await this.cleanupContext(context);
      
      const cleanupDuration = Date.now() - cleanupStartTime;
      Log.info(`[ProductionTestDataManager] ✓ Single context cleanup completed for ${contextId} in ${cleanupDuration}ms`);
      
    } catch (error) {
      const cleanupDuration = Date.now() - cleanupStartTime;
      Log.error(`[ProductionTestDataManager] ✗ Error during single context cleanup for ${contextId} (after ${cleanupDuration}ms): ${error.message}`);
      
      // Ensure context is removed from map even if cleanup fails to prevent memory leaks
      try {
        if (this.activeContexts.has(contextId)) {
          this.activeContexts.delete(contextId);
          Log.info(`[ProductionTestDataManager] ✓ Emergency removal of context ${contextId} from activeContexts map`);
        }
      } catch (emergencyError) {
        Log.error(`[ProductionTestDataManager] ✗ Failed emergency removal of context ${contextId}: ${emergencyError.message}`);
      }
      
      // Don't re-throw to maintain non-throwing behavior for cleanup operations
      Log.error(`[ProductionTestDataManager] Single context cleanup failed for ${contextId}, but not throwing to avoid masking test failures`);
    }
  }

  /**
   * Validates context ID format and existence
   */
  private validateContextId(contextId: string): boolean {
    return contextId && 
           typeof contextId === 'string' && 
           contextId.startsWith('production-test-') &&
           this.activeContexts.has(contextId);
  }

  /**
   * Maps LocationTestRoute[] to TestRoute[] for DataContext compatibility
   */
  private mapLocationRoutesToTestRoutes(locationRoutes: LocationTestRoute[]): TestRoute[] {
    return locationRoutes.map(route => ({
      id: route.id,
      name: route.name,
      location: route.serviceArea?.name || 'Unknown Location',
      isTestData: route.isTestRoute
    }));
  }

  /**
   * Maps LocationTestTicket[] to TestTicket[] for DataContext compatibility
   */
  private mapLocationTicketsToTestTickets(locationTickets: LocationTestTicket[]): TestTicket[] {
    return locationTickets.map(ticket => ({
      id: ticket.id,
      customerId: ticket.customerId,
      routeId: ticket.assignedRouteId || '',
      status: `${ticket.priority}-${ticket.serviceType}`,
      isTestData: ticket.isTestData
    }));
  }

  /**
   * Validates a production test data context
   * @param context - The DataContext to validate
   * @returns Promise<boolean> - True if context is valid, false otherwise
   */
  public async validateContext(context: DataContext): Promise<boolean> {
    try {
      Log.info(`[ProductionTestDataManager] Starting context validation for mode: ${context.mode}`);

      // Verify context mode matches PRODUCTION or DUAL requirements
      if (!this.validateContextMode(context)) {
        Log.error(`[ProductionTestDataManager] Context validation failed: Invalid mode ${context.mode}`);
        return false;
      }

      // Validate DataContext structure and required properties
      if (!this.validateContextStructure(context)) {
        Log.error(`[ProductionTestDataManager] Context validation failed: Invalid structure`);
        return false;
      }

      // Check test data existence and integrity
      if (!await this.validateContextTestData(context)) {
        Log.error(`[ProductionTestDataManager] Context validation failed: Invalid test data`);
        return false;
      }

      // Add production-specific validation checks
      if (!this.validateProductionEnvironment(context)) {
        Log.error(`[ProductionTestDataManager] Context validation failed: Production environment validation failed`);
        return false;
      }

      Log.info(`[ProductionTestDataManager] Context validation successful for test run ID: ${context.metadata.testRunId}`);
      return true;

    } catch (error) {
      Log.error(`[ProductionTestDataManager] Context validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates that the context mode matches PRODUCTION or DUAL requirements
   */
  private validateContextMode(context: DataContext): boolean {
    // Verify context mode is PRODUCTION or DUAL
    if (context.mode !== TestMode.PRODUCTION && context.mode !== TestMode.DUAL) {
      Log.error(`[ProductionTestDataManager] Invalid context mode: ${context.mode}. Expected PRODUCTION or DUAL.`);
      return false;
    }

    // Verify metadata mode matches context mode
    if (context.metadata.mode !== context.mode) {
      Log.error(`[ProductionTestDataManager] Mode mismatch: context.mode=${context.mode}, metadata.mode=${context.metadata.mode}`);
      return false;
    }

    // Verify test data metadata mode matches
    if (context.testData.metadata.mode !== context.mode) {
      Log.error(`[ProductionTestDataManager] Mode mismatch: context.mode=${context.mode}, testData.metadata.mode=${context.testData.metadata.mode}`);
      return false;
    }

    return true;
  }

  /**
   * Validates the DataContext structure and required properties
   */
  private validateContextStructure(context: DataContext): boolean {
    // Check required top-level properties
    if (!context.mode || !context.testData || !context.connectionInfo || !context.metadata || !context.cleanup) {
      Log.error(`[ProductionTestDataManager] Missing required context properties`);
      return false;
    }

    // Validate testData structure
    if (!this.validateTestDataStructure(context.testData)) {
      Log.error(`[ProductionTestDataManager] Invalid testData structure`);
      return false;
    }

    // Validate connectionInfo structure
    if (!this.validateConnectionInfoStructure(context.connectionInfo)) {
      Log.error(`[ProductionTestDataManager] Invalid connectionInfo structure`);
      return false;
    }

    // Validate metadata structure
    if (!this.validateMetadataStructure(context.metadata)) {
      Log.error(`[ProductionTestDataManager] Invalid metadata structure`);
      return false;
    }

    // Verify cleanup function is callable
    if (typeof context.cleanup !== 'function') {
      Log.error(`[ProductionTestDataManager] Cleanup property is not a function`);
      return false;
    }

    return true;
  }

  /**
   * Validates the test data structure
   */
  private validateTestDataStructure(testData: any): boolean {
    // Check required properties
    if (!testData.customers || !testData.routes || !testData.tickets || !testData.metadata) {
      Log.error(`[ProductionTestDataManager] Missing required testData properties`);
      return false;
    }

    // Verify arrays are actually arrays
    if (!Array.isArray(testData.customers) || !Array.isArray(testData.routes) || !Array.isArray(testData.tickets)) {
      Log.error(`[ProductionTestDataManager] TestData properties must be arrays`);
      return false;
    }

    // Validate metadata structure
    if (!this.validateMetadataStructure(testData.metadata)) {
      Log.error(`[ProductionTestDataManager] Invalid testData metadata structure`);
      return false;
    }

    return true;
  }

  /**
   * Validates the connection info structure
   */
  private validateConnectionInfoStructure(connectionInfo: ConnectionInfo): boolean {
    // Check required properties
    if (!connectionInfo.host || !connectionInfo.database) {
      Log.error(`[ProductionTestDataManager] Missing required connectionInfo properties (host, database)`);
      return false;
    }

    // Verify types
    if (typeof connectionInfo.host !== 'string' || typeof connectionInfo.database !== 'string') {
      Log.error(`[ProductionTestDataManager] ConnectionInfo host and database must be strings`);
      return false;
    }

    // Verify port if provided
    if (connectionInfo.port !== undefined && (typeof connectionInfo.port !== 'number' || connectionInfo.port <= 0)) {
      Log.error(`[ProductionTestDataManager] ConnectionInfo port must be a positive number`);
      return false;
    }

    // Verify isTestConnection flag for production safety
    if (connectionInfo.isTestConnection !== true) {
      Log.error(`[ProductionTestDataManager] ConnectionInfo must have isTestConnection=true for production safety`);
      return false;
    }

    return true;
  }

  /**
   * Validates the metadata structure
   */
  private validateMetadataStructure(metadata: TestMetadata): boolean {
    // Check required properties
    if (!metadata.createdAt || !metadata.mode || !metadata.version || !metadata.testRunId) {
      Log.error(`[ProductionTestDataManager] Missing required metadata properties`);
      return false;
    }

    // Verify types
    if (!(metadata.createdAt instanceof Date)) {
      Log.error(`[ProductionTestDataManager] Metadata createdAt must be a Date object`);
      return false;
    }

    if (typeof metadata.mode !== 'string' || typeof metadata.version !== 'string' || typeof metadata.testRunId !== 'string') {
      Log.error(`[ProductionTestDataManager] Metadata mode, version, and testRunId must be strings`);
      return false;
    }

    // Verify testRunId format for production contexts
    if (!metadata.testRunId.startsWith('production-test-')) {
      Log.error(`[ProductionTestDataManager] Invalid testRunId format: ${metadata.testRunId}. Must start with 'production-test-'`);
      return false;
    }

    return true;
  }

  /**
   * Validates the test data existence and integrity
   */
  private async validateContextTestData(context: DataContext): Promise<boolean> {
    try {
      // Check that test data arrays have content
      const { customers, routes, tickets } = context.testData;

      // Verify minimum data requirements
      if (routes.length === 0) {
        Log.error(`[ProductionTestDataManager] Context must have at least one route`);
        return false;
      }

      if (tickets.length === 0) {
        Log.error(`[ProductionTestDataManager] Context must have at least one ticket`);
        return false;
      }

      // Validate individual test data items
      if (!this.validateTestDataItems(context.testData)) {
        Log.error(`[ProductionTestDataManager] Test data items validation failed`);
        return false;
      }

      // Check data consistency between related entities
      if (!this.validateTestDataConsistency(context.testData)) {
        Log.error(`[ProductionTestDataManager] Test data consistency validation failed`);
        return false;
      }

      // Verify test data follows production naming conventions
      if (!this.validateProductionNamingConventions(context.testData)) {
        Log.error(`[ProductionTestDataManager] Production naming conventions validation failed`);
        return false;
      }

      return true;

    } catch (error) {
      Log.error(`[ProductionTestDataManager] Error validating context test data: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates individual test data items
   */
  private validateTestDataItems(testData: any): boolean {
    // Validate routes
    for (const route of testData.routes) {
      if (!route.id || !route.name || typeof route.isTestData !== 'boolean') {
        Log.error(`[ProductionTestDataManager] Invalid route structure: ${JSON.stringify(route)}`);
        return false;
      }
      
      if (!route.isTestData) {
        Log.error(`[ProductionTestDataManager] Route ${route.id} is not marked as test data`);
        return false;
      }
    }

    // Validate tickets
    for (const ticket of testData.tickets) {
      if (!ticket.id || !ticket.customerId || typeof ticket.isTestData !== 'boolean') {
        Log.error(`[ProductionTestDataManager] Invalid ticket structure: ${JSON.stringify(ticket)}`);
        return false;
      }
      
      if (!ticket.isTestData) {
        Log.error(`[ProductionTestDataManager] Ticket ${ticket.id} is not marked as test data`);
        return false;
      }
    }

    // Validate customers
    for (const customer of testData.customers) {
      if (!customer.id || !customer.name || typeof customer.isTestData !== 'boolean') {
        Log.error(`[ProductionTestDataManager] Invalid customer structure: ${JSON.stringify(customer)}`);
        return false;
      }
      
      if (!customer.isTestData) {
        Log.error(`[ProductionTestDataManager] Customer ${customer.id} is not marked as test data`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates data consistency between related entities
   */
  private validateTestDataConsistency(testData: any): boolean {
    const routeIds = new Set(testData.routes.map((r: any) => r.id));
    const customerIds = new Set(testData.customers.map((c: any) => c.id));

    // Check that tickets reference valid routes and customers
    for (const ticket of testData.tickets) {
      if (ticket.routeId && !routeIds.has(ticket.routeId)) {
        Log.error(`[ProductionTestDataManager] Ticket ${ticket.id} references non-existent route ${ticket.routeId}`);
        return false;
      }
      
      if (ticket.customerId && !customerIds.has(ticket.customerId)) {
        Log.error(`[ProductionTestDataManager] Ticket ${ticket.id} references non-existent customer ${ticket.customerId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates production naming conventions
   */
  private validateProductionNamingConventions(testData: any): boolean {
    // Only validate if configuration requires Looney Tunes naming
    if (!this.config.requireLooneyTunesNaming) {
      return true;
    }

    // Check customer names follow Looney Tunes convention
    for (const customer of testData.customers) {
      if (!customer.name.includes('looneyTunesTest')) {
        Log.error(`[ProductionTestDataManager] Customer ${customer.id} name '${customer.name}' does not follow Looney Tunes naming convention`);
        return false;
      }
    }

    // Check route names for test service areas
    if (this.config.enforceTestServiceAreas) {
      const validLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
      for (const route of testData.routes) {
        const hasValidLocation = validLocations.some(location => 
          route.name.includes(location) || route.location?.includes(location)
        );
        
        if (!hasValidLocation) {
          Log.error(`[ProductionTestDataManager] Route ${route.id} '${route.name}' does not reference valid test service areas`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validates production-specific environment and safety requirements
   * This method implements the production-specific validation checks required by task 3.3
   */
  private validateProductionEnvironment(context: DataContext): boolean {
    try {
      Log.info(`[ProductionTestDataManager] Starting production environment validation`);

      // Verify connection info indicates production test environment
      if (!this.validateProductionConnectionInfo(context.connectionInfo)) {
        Log.error(`[ProductionTestDataManager] Production connection info validation failed`);
        return false;
      }

      // Validate test data follows production naming conventions
      if (!this.validateProductionTestDataNaming(context.testData)) {
        Log.error(`[ProductionTestDataManager] Production test data naming validation failed`);
        return false;
      }

      // Check metadata consistency and test run ID validity
      if (!this.validateProductionMetadataConsistency(context)) {
        Log.error(`[ProductionTestDataManager] Production metadata consistency validation failed`);
        return false;
      }

      Log.info(`[ProductionTestDataManager] Production environment validation successful`);
      return true;

    } catch (error) {
      Log.error(`[ProductionTestDataManager] Error during production environment validation: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies connection info indicates production test environment
   */
  private validateProductionConnectionInfo(connectionInfo: ConnectionInfo): boolean {
    // Verify this is marked as a test connection for safety
    if (!connectionInfo.isTestConnection) {
      Log.error(`[ProductionTestDataManager] Connection must be marked as test connection (isTestConnection=true) for production safety`);
      return false;
    }

    // Verify database name indicates test environment
    const dbName = connectionInfo.database.toLowerCase();
    const isTestDatabase = dbName.includes('test') || 
                          dbName.includes('staging') || 
                          dbName.includes('dev') ||
                          dbName.includes('production_test');
    
    if (!isTestDatabase) {
      Log.error(`[ProductionTestDataManager] Database name '${connectionInfo.database}' does not indicate test environment. Expected names containing 'test', 'staging', 'dev', or 'production_test'`);
      return false;
    }

    // Verify host is not a production host (basic safety check)
    const host = connectionInfo.host.toLowerCase();
    const isProdHost = host.includes('prod') && !host.includes('test') && !host.includes('staging');
    
    if (isProdHost) {
      Log.error(`[ProductionTestDataManager] Host '${connectionInfo.host}' appears to be a production host. Production test data should not connect to production hosts`);
      return false;
    }

    // Verify port is within expected range for test environments
    if (connectionInfo.port && (connectionInfo.port < 1024 || connectionInfo.port > 65535)) {
      Log.error(`[ProductionTestDataManager] Port ${connectionInfo.port} is outside valid range (1024-65535)`);
      return false;
    }

    Log.info(`[ProductionTestDataManager] Connection info validation passed for database: ${connectionInfo.database}, host: ${connectionInfo.host}`);
    return true;
  }

  /**
   * Validates test data follows production naming conventions
   */
  private validateProductionTestDataNaming(testData: any): boolean {
    // Validate customer naming conventions
    if (!this.validateCustomerNamingConventions(testData.customers)) {
      return false;
    }

    // Validate route naming conventions
    if (!this.validateRouteNamingConventions(testData.routes)) {
      return false;
    }

    // Validate ticket naming conventions
    if (!this.validateTicketNamingConventions(testData.tickets)) {
      return false;
    }

    Log.info(`[ProductionTestDataManager] Test data naming conventions validation passed`);
    return true;
  }

  /**
   * Validates customer naming follows production test conventions
   */
  private validateCustomerNamingConventions(customers: any[]): boolean {
    for (const customer of customers) {
      // Check for Looney Tunes naming if required
      if (this.config.requireLooneyTunesNaming) {
        if (!customer.name || !customer.name.includes('looneyTunesTest')) {
          Log.error(`[ProductionTestDataManager] Customer ${customer.id} name '${customer.name}' must contain 'looneyTunesTest' for production safety`);
          return false;
        }
      }

      // Ensure customer ID follows test pattern
      if (!customer.id || !customer.id.toString().includes('test')) {
        Log.error(`[ProductionTestDataManager] Customer ID '${customer.id}' must contain 'test' for production safety`);
        return false;
      }

      // Verify isTestData flag is set
      if (!customer.isTestData) {
        Log.error(`[ProductionTestDataManager] Customer ${customer.id} must have isTestData=true for production safety`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates route naming follows production test conventions
   */
  private validateRouteNamingConventions(routes: any[]): boolean {
    const validTestServiceAreas = ['Cedar Falls', 'Winfield', "O'Fallon"];

    for (const route of routes) {
      // Verify route ID follows test pattern
      if (!route.id || !route.id.toString().includes('test')) {
        Log.error(`[ProductionTestDataManager] Route ID '${route.id}' must contain 'test' for production safety`);
        return false;
      }

      // Check service area restrictions if enforced
      if (this.config.enforceTestServiceAreas) {
        const routeLocation = route.location || route.name || '';
        const hasValidServiceArea = validTestServiceAreas.some(area => 
          routeLocation.includes(area)
        );

        if (!hasValidServiceArea) {
          Log.error(`[ProductionTestDataManager] Route ${route.id} location '${routeLocation}' must be in valid test service areas: ${validTestServiceAreas.join(', ')}`);
          return false;
        }
      }

      // Verify isTestData flag is set
      if (!route.isTestData) {
        Log.error(`[ProductionTestDataManager] Route ${route.id} must have isTestData=true for production safety`);
        return false;
      }

      // Ensure route name indicates test data
      if (!route.name || !route.name.toLowerCase().includes('test')) {
        Log.error(`[ProductionTestDataManager] Route name '${route.name}' must contain 'test' for production safety`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates ticket naming follows production test conventions
   */
  private validateTicketNamingConventions(tickets: any[]): boolean {
    for (const ticket of tickets) {
      // Verify ticket ID follows test pattern
      if (!ticket.id || !ticket.id.toString().includes('test')) {
        Log.error(`[ProductionTestDataManager] Ticket ID '${ticket.id}' must contain 'test' for production safety`);
        return false;
      }

      // Verify customer ID follows test pattern
      if (!ticket.customerId || !ticket.customerId.toString().includes('test')) {
        Log.error(`[ProductionTestDataManager] Ticket ${ticket.id} customerId '${ticket.customerId}' must contain 'test' for production safety`);
        return false;
      }

      // Verify isTestData flag is set
      if (!ticket.isTestData) {
        Log.error(`[ProductionTestDataManager] Ticket ${ticket.id} must have isTestData=true for production safety`);
        return false;
      }
    }

    return true;
  }

  /**
   * Checks metadata consistency and test run ID validity
   */
  private validateProductionMetadataConsistency(context: DataContext): boolean {
    const { metadata, testData } = context;

    // Verify test run ID consistency between context and test data metadata
    if (metadata.testRunId !== testData.metadata.testRunId) {
      Log.error(`[ProductionTestDataManager] Test run ID mismatch: context=${metadata.testRunId}, testData=${testData.metadata.testRunId}`);
      return false;
    }

    // Verify test run ID follows production test pattern
    if (!this.validateTestRunIdFormat(metadata.testRunId)) {
      Log.error(`[ProductionTestDataManager] Invalid test run ID format: ${metadata.testRunId}`);
      return false;
    }

    // Verify mode consistency across all metadata
    if (metadata.mode !== testData.metadata.mode) {
      Log.error(`[ProductionTestDataManager] Mode mismatch: context.metadata.mode=${metadata.mode}, testData.metadata.mode=${testData.metadata.mode}`);
      return false;
    }

    // Verify version consistency
    if (metadata.version !== testData.metadata.version) {
      Log.error(`[ProductionTestDataManager] Version mismatch: context.metadata.version=${metadata.version}, testData.metadata.version=${testData.metadata.version}`);
      return false;
    }

    // Verify creation timestamps are reasonable (within last 24 hours)
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (now.getTime() - metadata.createdAt.getTime() > maxAge) {
      Log.error(`[ProductionTestDataManager] Context metadata is too old: created ${metadata.createdAt.toISOString()}`);
      return false;
    }

    if (now.getTime() - testData.metadata.createdAt.getTime() > maxAge) {
      Log.error(`[ProductionTestDataManager] Test data metadata is too old: created ${testData.metadata.createdAt.toISOString()}`);
      return false;
    }

    // Verify the context is tracked in activeContexts
    if (!this.activeContexts.has(metadata.testRunId)) {
      Log.error(`[ProductionTestDataManager] Context with test run ID ${metadata.testRunId} is not tracked in activeContexts`);
      return false;
    }

    Log.info(`[ProductionTestDataManager] Metadata consistency validation passed for test run ID: ${metadata.testRunId}`);
    return true;
  }

  /**
   * Gets context statistics for debugging and monitoring
   */
  public getContextStatistics(): {
    totalActiveContexts: number;
    contextsByMode: Record<string, number>;
    oldestContext: { id: string; age: number } | null;
    newestContext: { id: string; age: number } | null;
  } {
    const stats = {
      totalActiveContexts: this.activeContexts.size,
      contextsByMode: {} as Record<string, number>,
      oldestContext: null as { id: string; age: number } | null,
      newestContext: null as { id: string; age: number } | null
    };

    if (this.activeContexts.size === 0) {
      return stats;
    }

    const now = Date.now();
    let oldestTime = now;
    let newestTime = 0;
    let oldestId = '';
    let newestId = '';

    this.activeContexts.forEach((context, contextId) => {
      // Count by mode
      const mode = context.mode.toString();
      stats.contextsByMode[mode] = (stats.contextsByMode[mode] || 0) + 1;

      // Track oldest and newest
      const contextTime = context.metadata.createdAt.getTime();
      if (contextTime < oldestTime) {
        oldestTime = contextTime;
        oldestId = contextId;
      }
      if (contextTime > newestTime) {
        newestTime = contextTime;
        newestId = contextId;
      }
    });

    if (oldestId) {
      stats.oldestContext = {
        id: oldestId,
        age: Math.round((now - oldestTime) / 1000) // age in seconds
      };
    }

    if (newestId) {
      stats.newestContext = {
        id: newestId,
        age: Math.round((now - newestTime) / 1000) // age in seconds
      };
    }

    return stats;
  }

  /**
   * Validates if a context exists and is active
   */
  public isContextActive(contextId: string): boolean {
    return this.activeContexts.has(contextId);
  }

  /**
   * Gets a specific active context by ID for debugging
   */
  public getActiveContext(contextId: string): DataContext | null {
    return this.activeContexts.get(contextId) || null;
  }

  /**
   * Validates context health (checks for potential issues)
   */
  public validateContextHealth(contextId: string): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const result = {
      isHealthy: true,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    const context = this.activeContexts.get(contextId);
    if (!context) {
      result.isHealthy = false;
      result.issues.push(`Context ${contextId} not found in active contexts`);
      result.recommendations.push('Verify the context ID is correct and the context was properly created');
      return result;
    }

    // Check context age
    const ageInHours = (Date.now() - context.metadata.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageInHours > this.config.maxTestDataAge) {
      result.isHealthy = false;
      result.issues.push(`Context is ${ageInHours.toFixed(1)} hours old, exceeds max age of ${this.config.maxTestDataAge} hours`);
      result.recommendations.push('Consider cleaning up this context or increasing maxTestDataAge configuration');
    }

    // Check if cleanup function exists
    if (!context.cleanup || typeof context.cleanup !== 'function') {
      result.isHealthy = false;
      result.issues.push('Context missing cleanup function');
      result.recommendations.push('Ensure context was created properly with a cleanup function');
    }

    // Check test data integrity
    if (!context.testData || !context.testData.metadata) {
      result.isHealthy = false;
      result.issues.push('Context missing test data or metadata');
      result.recommendations.push('Verify test data was loaded correctly during context creation');
    }

    // Check for test data consistency
    if (context.testData) {
      const hasRoutes = context.testData.routes && context.testData.routes.length > 0;
      const hasTickets = context.testData.tickets && context.testData.tickets.length > 0;
      const hasCustomers = context.testData.customers && context.testData.customers.length > 0;

      if (!hasRoutes && !hasTickets && !hasCustomers) {
        result.isHealthy = false;
        result.issues.push('Context has no test data (empty routes, tickets, and customers)');
        result.recommendations.push('Verify test data generation and loading is working correctly');
      }
    }

    return result;
  }

  /**
   * Validates all active contexts and returns health summary
   */
  public validateAllContextsHealth(): {
    totalContexts: number;
    healthyContexts: number;
    unhealthyContexts: number;
    contextHealth: Record<string, { isHealthy: boolean; issues: string[]; recommendations: string[] }>;
  } {
    const summary = {
      totalContexts: this.activeContexts.size,
      healthyContexts: 0,
      unhealthyContexts: 0,
      contextHealth: {} as Record<string, { isHealthy: boolean; issues: string[]; recommendations: string[] }>
    };

    this.activeContexts.forEach((context, contextId) => {
      const health = this.validateContextHealth(contextId);
      summary.contextHealth[contextId] = health;
      
      if (health.isHealthy) {
        summary.healthyContexts++;
      } else {
        summary.unhealthyContexts++;
      }
    });

    return summary;
  }

  /**
   * Validates test run ID format for production contexts
   */
  private validateTestRunIdFormat(testRunId: string): boolean {
    // Must start with 'production-test-'
    if (!testRunId.startsWith('production-test-')) {
      Log.error(`[ProductionTestDataManager] Test run ID must start with 'production-test-': ${testRunId}`);
      return false;
    }

    // Must contain timestamp and random component
    const parts = testRunId.split('-');
    if (parts.length < 4) {
      Log.error(`[ProductionTestDataManager] Test run ID format invalid, expected 'production-test-{timestamp}-{random}': ${testRunId}`);
      return false;
    }

    // Verify timestamp part is numeric
    const timestampPart = parts[2];
    if (!/^\d+$/.test(timestampPart)) {
      Log.error(`[ProductionTestDataManager] Test run ID timestamp part must be numeric: ${timestampPart}`);
      return false;
    }

    // Verify timestamp is reasonable (not too old or in future)
    const timestamp = parseInt(timestampPart);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (timestamp < now - maxAge || timestamp > now + 60000) { // Allow 1 minute future for clock skew
      Log.error(`[ProductionTestDataManager] Test run ID timestamp is unreasonable: ${new Date(timestamp).toISOString()}`);
      return false;
    }

    // Verify random part exists and has reasonable length
    const randomPart = parts[3];
    if (!randomPart || randomPart.length < 5) {
      Log.error(`[ProductionTestDataManager] Test run ID random part too short: ${randomPart}`);
      return false;
    }

    return true;
  }

  /**
   * Cleans up a production test data context
   * @param context - The DataContext to clean up
   * @returns Promise<void>
   */
  public async cleanupContext(context: DataContext): Promise<void> {
    const testRunId = context.metadata.testRunId;
    const cleanupStartTime = Date.now();
    let cleanupErrors: string[] = [];
    let contextRemovedFromMap = false;
    let autoCleanupCompleted = false;
    let contextSpecificCleanupCompleted = false;
    
    try {
      Log.info(`[ProductionTestDataManager] Starting comprehensive cleanup for context: ${testRunId} at ${new Date().toISOString()}`);
      Log.info(`[ProductionTestDataManager] Cleanup configuration - autoCleanup: ${this.config.autoCleanup}, maxTestDataAge: ${this.config.maxTestDataAge}h`);

      // Step 1: Remove context from activeContexts map to prevent inconsistent state
      try {
        if (this.activeContexts.has(testRunId)) {
          this.activeContexts.delete(testRunId);
          contextRemovedFromMap = true;
          Log.info(`[ProductionTestDataManager] ✓ Removed context ${testRunId} from activeContexts map. Remaining contexts: ${this.activeContexts.size}`);
        } else {
          Log.info(`[ProductionTestDataManager] ⚠ Context ${testRunId} was not found in activeContexts map - may have been already cleaned up`);
        }
      } catch (mapError) {
        const errorMsg = `Failed to remove context ${testRunId} from activeContexts map: ${mapError.message}`;
        cleanupErrors.push(errorMsg);
        Log.error(`[ProductionTestDataManager] ✗ ${errorMsg}`);
      }

      // Step 2: Respect existing cleanup policy configuration
      if (this.config.autoCleanup) {
        Log.info(`[ProductionTestDataManager] Auto-cleanup is enabled, executing cleanup of old test data for context ${testRunId}`);
        
        try {
          const autoCleanupStartTime = Date.now();
          await this.cleanupOldTestData();
          const autoCleanupDuration = Date.now() - autoCleanupStartTime;
          autoCleanupCompleted = true;
          Log.info(`[ProductionTestDataManager] ✓ Successfully completed auto-cleanup for context ${testRunId} in ${autoCleanupDuration}ms`);
        } catch (cleanupError) {
          // Non-throwing error handling for cleanup failures to avoid masking test failures
          const errorMsg = `Auto-cleanup failed for context ${testRunId}: ${cleanupError.message}`;
          cleanupErrors.push(errorMsg);
          Log.error(`[ProductionTestDataManager] ✗ ${errorMsg}`);
          
          // Log additional error context for debugging
          if (cleanupError.stack) {
            Log.error(`[ProductionTestDataManager] Auto-cleanup error stack trace for ${testRunId}: ${cleanupError.stack}`);
          }
        }
      } else {
        Log.info(`[ProductionTestDataManager] Auto-cleanup is disabled, skipping cleanup of old test data for context ${testRunId}`);
      }

      // Step 3: Execute context-specific cleanup function
      if (context.cleanup && typeof context.cleanup === 'function') {
        Log.info(`[ProductionTestDataManager] Executing context-specific cleanup function for ${testRunId}`);
        
        try {
          const contextCleanupStartTime = Date.now();
          await context.cleanup();
          const contextCleanupDuration = Date.now() - contextCleanupStartTime;
          contextSpecificCleanupCompleted = true;
          Log.info(`[ProductionTestDataManager] ✓ Successfully executed context-specific cleanup for ${testRunId} in ${contextCleanupDuration}ms`);
        } catch (contextCleanupError) {
          // Non-throwing error handling for context cleanup failures
          const errorMsg = `Context-specific cleanup failed for ${testRunId}: ${contextCleanupError.message}`;
          cleanupErrors.push(errorMsg);
          Log.error(`[ProductionTestDataManager] ✗ ${errorMsg}`);
          
          // Log additional error context for debugging
          if (contextCleanupError.stack) {
            Log.error(`[ProductionTestDataManager] Context-specific cleanup error stack trace for ${testRunId}: ${contextCleanupError.stack}`);
          }
        }
      } else {
        Log.info(`[ProductionTestDataManager] No context-specific cleanup function available for ${testRunId}`);
      }

      // Step 4: Final state verification and logging
      const totalCleanupDuration = Date.now() - cleanupStartTime;
      
      if (cleanupErrors.length === 0) {
        Log.info(`[ProductionTestDataManager] ✓ Context cleanup completed successfully for ${testRunId} in ${totalCleanupDuration}ms`);
        Log.info(`[ProductionTestDataManager] Cleanup summary - Context removed: ${contextRemovedFromMap}, Auto-cleanup: ${autoCleanupCompleted}, Context-specific cleanup: ${contextSpecificCleanupCompleted}`);
      } else {
        Log.error(`[ProductionTestDataManager] ⚠ Context cleanup completed with ${cleanupErrors.length} error(s) for ${testRunId} in ${totalCleanupDuration}ms`);
        Log.error(`[ProductionTestDataManager] Cleanup errors: ${cleanupErrors.join('; ')}`);
      }

    } catch (error) {
      // Comprehensive error handling to avoid masking test failures
      const totalCleanupDuration = Date.now() - cleanupStartTime;
      const errorMsg = `Unexpected error during context cleanup for ${testRunId}: ${error.message}`;
      cleanupErrors.push(errorMsg);
      
      Log.error(`[ProductionTestDataManager] ✗ ${errorMsg} (after ${totalCleanupDuration}ms)`);
      
      // Log additional error context for debugging
      if (error.stack) {
        Log.error(`[ProductionTestDataManager] Unexpected cleanup error stack trace for ${testRunId}: ${error.stack}`);
      }
      
      // Ensure no inconsistent state remains - emergency cleanup
      try {
        if (!contextRemovedFromMap && this.activeContexts.has(testRunId)) {
          this.activeContexts.delete(testRunId);
          Log.info(`[ProductionTestDataManager] ✓ Emergency removal of context ${testRunId} from activeContexts map to prevent memory leaks`);
        }
      } catch (emergencyError) {
        Log.error(`[ProductionTestDataManager] ✗ Failed emergency removal of context ${testRunId}: ${emergencyError.message}`);
      }
      
      // Log comprehensive error summary but don't throw to avoid masking test failures
      Log.error(`[ProductionTestDataManager] Context cleanup failed for ${testRunId} with ${cleanupErrors.length} total error(s), but not throwing to avoid masking test failures`);
      Log.error(`[ProductionTestDataManager] All cleanup errors for ${testRunId}: ${cleanupErrors.join('; ')}`);
    }
  }
}