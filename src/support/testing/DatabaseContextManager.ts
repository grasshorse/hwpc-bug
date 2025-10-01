/**
 * Database Context Manager for Isolated Testing Mode
 * 
 * Manages database state loading, verification, and cleanup for isolated tests
 */

import { BaseDataContextManager } from './DataContextManager';
import { IsolatedDataProvider } from './IsolatedDataProvider';
import { TestMode, TestConfig, DataContext, TestDataSet, TestMetadata, ConnectionInfo } from './types';

/**
 * Manages database contexts for isolated testing mode
 */
export class DatabaseContextManager extends BaseDataContextManager {
  private activeContexts: Map<string, DataContext> = new Map();
  private dataProvider: IsolatedDataProvider;
  
  constructor(backupDirectory?: string) {
    super(TestMode.ISOLATED);
    this.dataProvider = new IsolatedDataProvider(backupDirectory);
  }
  
  async setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext> {
    this.validateMode(mode);
    
    if (!testConfig.databaseConfig) {
      throw new Error('Database configuration is required for isolated testing mode');
    }
    
    const testRunId = this.generateTestRunId();
    const context = await this.createDatabaseContext(testConfig, testRunId, mode);
    
    // Store the context for cleanup tracking
    this.activeContexts.set(testRunId, context);
    
    // Load the database state
    await this.loadDatabaseState(context, testConfig);
    
    return context;
  }
  
  async validateContext(context: DataContext): Promise<boolean> {
    try {
      // Verify the context mode (allow both isolated and dual)
      if (context.mode !== TestMode.ISOLATED && context.mode !== TestMode.DUAL) {
        return false;
      }
      
      // Verify connection info
      if (!context.connectionInfo || !context.connectionInfo.isTestConnection) {
        return false;
      }
      
      // Verify test data exists
      if (!context.testData || !this.isValidTestDataSet(context.testData)) {
        return false;
      }
      
      // Run verification queries if available
      return await this.runVerificationQueries(context);
    } catch (error) {
      console.error('Context validation failed:', error);
      return false;
    }
  }
  
  async cleanupContext(context: DataContext): Promise<void> {
    try {
      // Remove from active contexts
      this.activeContexts.delete(context.testData.metadata.testRunId);
      
      // Restore database state
      await this.restoreDatabaseState(context);
      
      // Call base cleanup
      await super.cleanupContext(context);
    } catch (error) {
      console.error('Failed to cleanup database context:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new database context with connection info and metadata
   */
  private async createDatabaseContext(testConfig: TestConfig, testRunId: string, mode: TestMode): Promise<DataContext> {
    const connectionInfo: ConnectionInfo = {
      host: this.extractHostFromConnectionString(testConfig.databaseConfig!.connectionString),
      database: this.extractDatabaseFromConnectionString(testConfig.databaseConfig!.connectionString),
      isTestConnection: true
    };
    
    const metadata: TestMetadata = {
      createdAt: new Date(),
      mode,
      version: '1.0.0',
      testRunId
    };
    
    // Initialize empty test data set - will be populated during loading
    const testData: TestDataSet = {
      customers: [],
      routes: [],
      tickets: [],
      metadata
    };
    
    return {
      mode,
      testData,
      connectionInfo,
      metadata,
      cleanup: async () => {
        // Cleanup implementation will be called by cleanupContext
      }
    };
  }
  
  /**
   * Loads database state from backup file
   */
  private async loadDatabaseState(context: DataContext, testConfig: TestConfig): Promise<void> {
    try {
      const testRunId = context.testData.metadata.testRunId;
      
      // Use IsolatedDataProvider to load database state
      context.testData = await this.dataProvider.loadDatabaseState(
        testConfig.databaseConfig!,
        testRunId
      );
      
      console.log(`Database state loaded successfully for test run: ${testRunId}`);
    } catch (error) {
      console.error('Failed to load database state:', error);
      throw new Error(`Database loading failed: ${error.message}`);
    }
  }
  
  /**
   * Restores database to original state
   */
  private async restoreDatabaseState(context: DataContext): Promise<void> {
    try {
      const testRunId = context.testData.metadata.testRunId;
      
      // Use IsolatedDataProvider to restore database state
      await this.dataProvider.restoreDatabaseState(
        context.connectionInfo.database,
        testRunId
      );
      
      console.log('Database state restored successfully');
    } catch (error) {
      console.error('Failed to restore database state:', error);
      throw error;
    }
  }
  
  /**
   * Runs verification queries to ensure data integrity
   */
  private async runVerificationQueries(context: DataContext): Promise<boolean> {
    try {
      // Get verification queries from active contexts or use default queries
      const verificationQueries = this.getVerificationQueries(context);
      
      if (verificationQueries.length === 0) {
        // If no verification queries, do basic data validation
        const hasCustomers = context.testData.customers.length > 0;
        const hasRoutes = context.testData.routes.length > 0;
        const hasValidMetadata = context.testData.metadata.testRunId === context.testData.metadata.testRunId;
        
        return hasCustomers && hasRoutes && hasValidMetadata;
      }
      
      // Use IsolatedDataProvider to run verification queries
      const result = await this.dataProvider.runVerificationQueries(
        context.connectionInfo.database,
        verificationQueries,
        context.testData.metadata.testRunId
      );
      
      if (!result.isValid) {
        console.error('Verification queries failed:', result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.warn('Verification warnings:', result.warnings);
      }
      
      return result.isValid;
    } catch (error) {
      console.error('Verification queries failed:', error);
      return false;
    }
  }
  
  /**
   * Gets verification queries for the context
   */
  private getVerificationQueries(context: DataContext): string[] {
    // In a real implementation, this would come from the test configuration
    // For now, return default verification queries
    return [
      'SELECT COUNT(*) as customer_count FROM customers WHERE is_test_data = true',
      'SELECT COUNT(*) as route_count FROM routes WHERE is_test_data = true',
      'SELECT COUNT(*) as ticket_count FROM tickets WHERE is_test_data = true'
    ];
  }
  
  /**
   * Validates that the test data set contains required data
   */
  private isValidTestDataSet(testData: TestDataSet): boolean {
    return !!(
      testData &&
      Array.isArray(testData.customers) &&
      Array.isArray(testData.routes) &&
      Array.isArray(testData.tickets) &&
      testData.metadata &&
      testData.metadata.testRunId
    );
  }
  
  /**
   * Creates mock test data for isolated testing
   */
  private async createMockTestData(metadata: TestMetadata): Promise<TestDataSet> {
    return {
      customers: [
        {
          id: 'cust-isolated-001',
          name: 'Test Customer 1',
          email: 'test1@isolated.test',
          phone: '555-0001',
          isTestData: true
        },
        {
          id: 'cust-isolated-002',
          name: 'Test Customer 2',
          email: 'test2@isolated.test',
          phone: '555-0002',
          isTestData: true
        }
      ],
      routes: [
        {
          id: 'route-isolated-001',
          name: 'Test Route 1',
          location: 'Test Location 1',
          isTestData: true
        },
        {
          id: 'route-isolated-002',
          name: 'Test Route 2',
          location: 'Test Location 2',
          isTestData: true
        }
      ],
      tickets: [
        {
          id: 'ticket-isolated-001',
          customerId: 'cust-isolated-001',
          routeId: 'route-isolated-001',
          status: 'active',
          isTestData: true
        }
      ],
      metadata
    };
  }
  
  /**
   * Extracts host from connection string
   */
  private extractHostFromConnectionString(connectionString: string): string {
    // Simple extraction - in real implementation, would parse proper connection string
    return connectionString.includes('localhost') ? 'localhost' : 'test-db-host';
  }
  
  /**
   * Extracts database name from connection string
   */
  private extractDatabaseFromConnectionString(connectionString: string): string {
    // Simple extraction - in real implementation, would parse proper connection string
    return 'test_database';
  }
  
  /**
   * Gets all active contexts (for debugging/monitoring)
   */
  getActiveContexts(): DataContext[] {
    return Array.from(this.activeContexts.values());
  }
  
  /**
   * Cleans up all active contexts (emergency cleanup)
   */
  async cleanupAllContexts(): Promise<void> {
    const contexts = Array.from(this.activeContexts.values());
    const cleanupPromises = contexts.map(context => this.cleanupContext(context));
    
    await Promise.allSettled(cleanupPromises);
    this.activeContexts.clear();
    
    // Also cleanup all data provider connections
    await this.dataProvider.closeAllConnections();
  }
  
  /**
   * Gets the data provider instance (for testing/debugging)
   */
  getDataProvider(): IsolatedDataProvider {
    return this.dataProvider;
  }
}