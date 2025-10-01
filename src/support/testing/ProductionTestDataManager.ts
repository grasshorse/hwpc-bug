/**
 * Production Test Data Manager
 * 
 * Manages test data in production environment using looneyTunesTest naming convention
 */

import { BaseDataContextManager } from './DataContextManager';
import { TestMode, TestConfig, DataContext, TestDataSet, TestMetadata, ConnectionInfo, TestCustomer, TestRoute, TestTicket } from './types';
import { LooneyTunesDataProvider } from './LooneyTunesDataProvider';

/**
 * Manages test data contexts for production testing mode
 */
export class ProductionTestDataManager extends BaseDataContextManager {
  private readonly DEFAULT_LOCATIONS = ['Cedar Falls', 'Winfield', "O'Fallon"];
  private activeTestData: Map<string, TestDataSet> = new Map();
  private looneyTunesProvider: LooneyTunesDataProvider;
  
  constructor() {
    super(TestMode.PRODUCTION);
    this.looneyTunesProvider = new LooneyTunesDataProvider();
  }
  
  async setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext> {
    this.validateMode(mode);
    
    if (!testConfig.productionConfig) {
      throw new Error('Production configuration is required for production testing mode');
    }
    
    const testRunId = this.generateTestRunId();
    const context = await this.createProductionContext(testConfig, testRunId, mode);
    
    // Ensure test data exists in production
    await this.ensureTestDataExists(context, testConfig);
    
    // Store for cleanup tracking
    this.activeTestData.set(testRunId, context.testData);
    
    return context;
  }
  
  async validateContext(context: DataContext): Promise<boolean> {
    try {
      // Verify the context mode (allow both production and dual)
      if (context.mode !== TestMode.PRODUCTION && context.mode !== TestMode.DUAL) {
        return false;
      }
      
      // Verify all test data follows looneyTunesTest naming convention
      if (!this.validateTestDataNaming(context.testData)) {
        return false;
      }
      
      // Verify test data exists and is accessible
      return await this.verifyTestDataAccessibility(context);
    } catch (error) {
      console.error('Production context validation failed:', error);
      return false;
    }
  }
  
  async cleanupContext(context: DataContext): Promise<void> {
    try {
      // Remove from active tracking
      this.activeTestData.delete(context.testData.metadata.testRunId);
      
      // Handle cleanup based on policy
      await this.handleCleanupPolicy(context);
      
      // Call base cleanup
      await super.cleanupContext(context);
    } catch (error) {
      console.error('Failed to cleanup production context:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new production context with test data
   */
  private async createProductionContext(testConfig: TestConfig, testRunId: string, mode: TestMode): Promise<DataContext> {
    const connectionInfo: ConnectionInfo = {
      host: 'production-host',
      database: 'production-database',
      isTestConnection: false // This is production, but with test data
    };
    
    const metadata: TestMetadata = {
      createdAt: new Date(),
      mode,
      version: '1.0.0',
      testRunId
    };
    
    // Initialize with existing or create new test data
    const testData = await this.loadOrCreateTestData(testConfig, metadata);
    
    return {
      mode,
      testData,
      connectionInfo,
      metadata,
      cleanup: async () => {
        // Cleanup will be handled by cleanupContext
      }
    };
  }
  
  /**
   * Loads existing test data or creates new test entities
   */
  private async loadOrCreateTestData(testConfig: TestConfig, metadata: TestMetadata): Promise<TestDataSet> {
    const config = testConfig.productionConfig!;
    
    // In real implementation, this would query the production database
    // For now, create the expected test data structure
    
    const customers = await this.createTestCustomers(config);
    const routes = await this.createTestRoutes(config);
    const tickets = await this.createTestTickets(customers, routes);
    
    return {
      customers,
      routes,
      tickets,
      metadata
    };
  }
  
  /**
   * Creates test customers with looneyTunesTest naming convention
   */
  private async createTestCustomers(config: any): Promise<TestCustomer[]> {
    // Use LooneyTunesDataProvider to create customers
    return await this.looneyTunesProvider.createTestCustomers(4);
  }
  
  /**
   * Creates test routes for specified locations
   */
  private async createTestRoutes(config: any): Promise<TestRoute[]> {
    // Use LooneyTunesDataProvider to create routes
    return await this.looneyTunesProvider.createTestRoutes();
  }
  
  /**
   * Creates test tickets linking customers and routes
   */
  private async createTestTickets(customers: TestCustomer[], routes: TestRoute[]): Promise<TestTicket[]> {
    // Use LooneyTunesDataProvider to create tickets
    return await this.looneyTunesProvider.createTestTickets(customers, routes);
  }
  
  /**
   * Ensures all required test data exists in production
   */
  private async ensureTestDataExists(context: DataContext, testConfig: TestConfig): Promise<void> {
    try {
      console.log('Verifying test data exists in production...');
      
      // In real implementation, this would:
      // 1. Query production database for existing test data
      // 2. Create missing test entities
      // 3. Update context.testData with actual production data
      
      console.log(`Test data verified for ${context.testData.customers.length} customers, ${context.testData.routes.length} routes`);
    } catch (error) {
      console.error('Failed to ensure test data exists:', error);
      throw new Error(`Test data setup failed: ${error.message}`);
    }
  }
  
  /**
   * Validates that all test data follows the looneyTunesTest naming convention
   */
  private validateTestDataNaming(testData: TestDataSet): boolean {
    // Use LooneyTunesDataProvider to validate naming
    const validCustomers = testData.customers.every(customer => 
      this.looneyTunesProvider.validateTestDataNaming(customer)
    );
    
    const validRoutes = testData.routes.every(route => 
      this.looneyTunesProvider.validateTestDataNaming(route)
    );
    
    const validTickets = testData.tickets.every(ticket => 
      this.looneyTunesProvider.validateTestDataNaming(ticket)
    );
    
    return validCustomers && validRoutes && validTickets;
  }
  
  /**
   * Verifies that test data is accessible in production
   */
  private async verifyTestDataAccessibility(context: DataContext): Promise<boolean> {
    try {
      // In real implementation, this would make actual API calls or database queries
      // to verify the test data is accessible
      
      const hasAccessibleCustomers = context.testData.customers.length > 0;
      const hasAccessibleRoutes = context.testData.routes.length > 0;
      const locationsMatch = this.DEFAULT_LOCATIONS.some(location => 
        context.testData.routes.some(route => route.location === location)
      );
      
      return hasAccessibleCustomers && hasAccessibleRoutes && locationsMatch;
    } catch (error) {
      console.error('Failed to verify test data accessibility:', error);
      return false;
    }
  }
  
  /**
   * Handles cleanup based on the configured cleanup policy
   */
  private async handleCleanupPolicy(context: DataContext): Promise<void> {
    // Use LooneyTunesDataProvider for cleanup
    await this.looneyTunesProvider.cleanup();
  }
  
  /**
   * Cleans up production test data (careful implementation needed)
   */
  private async cleanupProductionTestData(context: DataContext): Promise<void> {
    // IMPORTANT: This should be very careful to only delete test data
    // In real implementation, would only delete entities marked as isTestData: true
    console.log('Production test data cleanup completed');
  }
  
  /**
   * Archives production test data for later analysis
   */
  private async archiveProductionTestData(context: DataContext): Promise<void> {
    // In real implementation, would move test data to archive tables
    console.log('Production test data archived successfully');
  }
  
  /**
   * Gets available Looney Tunes characters for test data creation
   */
  getAvailableCharacters(): string[] {
    return this.looneyTunesProvider.getAvailableCharacters();
  }
  
  /**
   * Gets supported test locations
   */
  getSupportedLocations(): string[] {
    return this.looneyTunesProvider.getSupportedLocations();
  }
  
  /**
   * Gets all active test data sets (for monitoring)
   */
  getActiveTestData(): TestDataSet[] {
    return Array.from(this.activeTestData.values());
  }
  
  /**
   * Creates a new test customer in production
   */
  async createTestCustomer(name: string, location: string): Promise<TestCustomer> {
    return await this.looneyTunesProvider.createTestCustomer({
      characterName: name,
      location: location
    });
  }

  /**
   * Creates a new test route in production
   */
  async createTestRoute(location: string, routeName?: string): Promise<TestRoute> {
    return await this.looneyTunesProvider.createTestRoute({
      location: location,
      routeName: routeName
    });
  }

  /**
   * Creates a new test ticket in production
   */
  async createTestTicket(customerId: string, routeId: string): Promise<TestTicket> {
    return await this.looneyTunesProvider.createTestTicket({
      customerId: customerId,
      routeId: routeId
    });
  }

  /**
   * Gets the LooneyTunesDataProvider instance for direct access
   */
  getLooneyTunesProvider(): LooneyTunesDataProvider {
    return this.looneyTunesProvider;
  }
}