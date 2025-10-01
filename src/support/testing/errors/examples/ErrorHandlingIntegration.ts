/**
 * Error Handling Integration Examples
 * 
 * Demonstrates how to integrate the error handling and recovery system
 * into dual-mode testing scenarios.
 */

import { 
  DualModeErrorHandler, 
  TestError, 
  ErrorUtils,
  ErrorHandlingFactory 
} from '../index';
import { TestMode, TestConfig, TestContext } from '../../types';
import { DataContextFactory } from '../../DataContextFactory';

/**
 * Example: Basic error handling integration
 */
export class BasicErrorHandlingExample {
  private errorHandler: DualModeErrorHandler;
  private contextFactory: DataContextFactory;

  constructor() {
    // Create error handler with development configuration
    this.errorHandler = ErrorHandlingFactory.createDevelopmentHandler();
    this.contextFactory = new DataContextFactory();
  }

  /**
   * Example: Handling database connection errors with automatic recovery
   */
  async handleDatabaseConnectionError(): Promise<void> {
    const testContext: TestContext = {
      testId: 'db-connection-test',
      testName: 'Database Connection Test',
      tags: ['@isolated', '@database'],
      scenario: null,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.ISOLATED,
      tags: ['@isolated'],
      retries: 3,
      timeout: 30000,
      databaseConfig: {
        backupPath: '.kiro/test-data/isolated/sample-backup.sql',
        connectionString: 'postgresql://localhost:5432/test_db',
        restoreTimeout: 60000,
        verificationQueries: ['SELECT COUNT(*) FROM customers']
      }
    };

    // Simulate a database operation that might fail
    const databaseOperation = async () => {
      // This would be your actual database operation
      throw new Error('ECONNREFUSED: Connection refused');
    };

    try {
      // Use error handler to wrap the operation
      const result = await this.errorHandler.withErrorHandling(
        databaseOperation,
        testContext,
        testConfig
      );

      console.log('Database operation succeeded:', result);
    } catch (error) {
      console.error('Database operation failed after recovery attempts:', error);
    }
  }

  /**
   * Example: Handling mode fallback from production to isolated
   */
  async handleModeFallback(): Promise<void> {
    const testContext: TestContext = {
      testId: 'mode-fallback-test',
      testName: 'Mode Fallback Test',
      tags: ['@production', '@fallback'],
      scenario: null,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.PRODUCTION,
      tags: ['@production'],
      retries: 2,
      timeout: 30000,
      productionConfig: {
        testDataPrefix: 'looneyTunesTest',
        locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
        customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
        cleanupPolicy: 'preserve'
      }
    };

    // Simulate a production data context setup that fails
    const productionOperation = async () => {
      // This would be your actual production data setup
      throw TestError.dataContextError(
        'Production test data not available',
        testContext.testId,
        testContext.testName,
        TestMode.PRODUCTION
      );
    };

    try {
      const result = await this.errorHandler.withErrorHandling(
        productionOperation,
        testContext,
        testConfig
      );

      console.log('Operation succeeded (possibly with fallback):', result);
    } catch (error) {
      console.error('Operation failed even after fallback:', error);
    }
  }

  /**
   * Example: Creating and handling custom test errors
   */
  async handleCustomTestError(): Promise<void> {
    const testContext: TestContext = {
      testId: 'custom-error-test',
      testName: 'Custom Error Test',
      tags: ['@custom'],
      scenario: null,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.DUAL,
      tags: ['@dual'],
      retries: 3,
      timeout: 30000
    };

    // Create a custom test error
    const customError = ErrorUtils.createTestExecutionError(
      'Custom test execution failed due to data validation',
      testContext.testId,
      testContext.testName,
      TestMode.DUAL,
      undefined,
      new Error('Validation failed: Invalid customer data')
    );

    // Handle the custom error
    const result = await this.errorHandler.handleError(
      customError,
      testContext,
      testConfig
    );

    console.log('Custom error handling result:', {
      success: result.success,
      reportId: result.errorReportId,
      warnings: result.warnings,
      executionTime: result.executionTime
    });
  }
}

/**
 * Example: Advanced error handling with custom recovery actions
 */
export class AdvancedErrorHandlingExample {
  private errorHandler: DualModeErrorHandler;

  constructor() {
    // Create error handler with custom configuration
    this.errorHandler = new DualModeErrorHandler({
      enableGracefulDegradation: true,
      enableAutomaticRecovery: true,
      enableErrorReporting: true,
      maxConcurrentRecoveries: 5,
      retryConfig: {
        maxAttempts: 4,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        backoffMultiplier: 1.5
      },
      fallbackConfig: {
        enableModeFallback: true,
        fallbackChain: [TestMode.PRODUCTION, TestMode.ISOLATED],
        preserveTestData: true,
        notifyOnFallback: true
      },
      reportingConfig: {
        enableConsoleReporting: true,
        enableJsonReporting: true,
        reportingLevel: 'low' as any,
        includeStackTrace: true,
        includeEnvironment: true,
        includeRecoveryActions: true
      }
    });
  }

  /**
   * Example: Handling multiple concurrent errors
   */
  async handleMultipleErrors(): Promise<void> {
    const errors = [
      {
        error: ErrorUtils.createNetworkError(
          'API endpoint timeout',
          'test-1',
          'Network Test 1',
          TestMode.PRODUCTION,
          'https://api.example.com/customers'
        ),
        testContext: {
          testId: 'test-1',
          testName: 'Network Test 1',
          tags: ['@api', '@network'],
          scenario: null,
          feature: null
        },
        testConfig: {
          mode: TestMode.PRODUCTION,
          tags: ['@production'],
          retries: 3,
          timeout: 30000
        } as TestConfig
      },
      {
        error: ErrorUtils.createDatabaseError(
          'Database connection timeout',
          'test-2',
          'Database Test 2',
          TestMode.ISOLATED,
          { host: 'localhost', database: 'test_db' }
        ),
        testContext: {
          testId: 'test-2',
          testName: 'Database Test 2',
          tags: ['@database', '@isolated'],
          scenario: null,
          feature: null
        },
        testConfig: {
          mode: TestMode.ISOLATED,
          tags: ['@isolated'],
          retries: 3,
          timeout: 30000
        } as TestConfig
      },
      {
        error: ErrorUtils.createDataContextError(
          'Test data setup failed',
          'test-3',
          'Context Test 3',
          TestMode.DUAL
        ),
        testContext: {
          testId: 'test-3',
          testName: 'Context Test 3',
          tags: ['@context', '@dual'],
          scenario: null,
          feature: null
        },
        testConfig: {
          mode: TestMode.DUAL,
          tags: ['@dual'],
          retries: 3,
          timeout: 30000
        } as TestConfig
      }
    ];

    const results = await this.errorHandler.handleMultipleErrors(errors);

    console.log('Multiple error handling results:');
    results.forEach((result, index) => {
      console.log(`Error ${index + 1}:`, {
        success: result.success,
        reportId: result.errorReportId,
        recoveryAttempts: result.recoveryResult?.attemptsUsed || 0,
        finalMode: result.finalMode,
        executionTime: result.executionTime
      });
    });
  }

  /**
   * Example: Creating safe wrappers for test operations
   */
  createSafeTestOperations(): {
    safeApiCall: (endpoint: string) => Promise<any>;
    safeDatabaseQuery: (query: string) => Promise<any>;
    safeDataSetup: (mode: TestMode) => Promise<any>;
  } {
    const testContext: TestContext = {
      testId: 'safe-wrapper-test',
      testName: 'Safe Wrapper Test',
      tags: ['@safe', '@wrapper'],
      scenario: null,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.DUAL,
      tags: ['@dual'],
      retries: 3,
      timeout: 30000
    };

    // Create safe API call wrapper
    const safeApiCall = this.errorHandler.createSafeWrapper(
      async (endpoint: string) => {
        // Simulate API call that might fail
        if (Math.random() < 0.3) {
          throw new Error(`API call to ${endpoint} failed`);
        }
        return { data: 'API response', endpoint };
      },
      testContext,
      testConfig
    );

    // Create safe database query wrapper
    const safeDatabaseQuery = this.errorHandler.createSafeWrapper(
      async (query: string) => {
        // Simulate database query that might fail
        if (Math.random() < 0.2) {
          throw new Error(`Database query failed: ${query}`);
        }
        return { rows: [], query };
      },
      testContext,
      testConfig
    );

    // Create safe data setup wrapper
    const safeDataSetup = this.errorHandler.createSafeWrapper(
      async (mode: TestMode) => {
        // Simulate data setup that might fail
        if (mode === TestMode.PRODUCTION && Math.random() < 0.4) {
          throw ErrorUtils.createDataContextError(
            'Production data setup failed',
            testContext.testId,
            testContext.testName,
            mode
          );
        }
        return { mode, setupComplete: true };
      },
      testContext,
      testConfig
    );

    return {
      safeApiCall,
      safeDatabaseQuery,
      safeDataSetup
    };
  }

  /**
   * Example: Monitoring and statistics
   */
  async monitorErrorHandling(): Promise<void> {
    // Simulate some error handling operations
    await this.handleMultipleErrors();

    // Get statistics
    const stats = this.errorHandler.getStatistics();

    console.log('Error Handling Statistics:');
    console.log('Recovery Stats:', stats.recoveryStats);
    console.log('Error Summary:', stats.errorSummary);
    console.log('Active Recoveries:', stats.activeRecoveries);

    // Get detailed error reports
    const errorReporter = this.errorHandler.getErrorReporter();
    const allReports = errorReporter.getAllReports();

    console.log(`Total Error Reports: ${allReports.length}`);
    
    if (allReports.length > 0) {
      console.log('Recent Error Report:', {
        id: allReports[0].id,
        timestamp: allReports[0].timestamp,
        category: allReports[0].error.category,
        severity: allReports[0].error.severity,
        recommendations: allReports[0].recommendations.slice(0, 3) // First 3 recommendations
      });
    }
  }
}

/**
 * Example: Integration with Cucumber hooks
 */
export class CucumberIntegrationExample {
  private errorHandler: DualModeErrorHandler;

  constructor() {
    this.errorHandler = ErrorHandlingFactory.createCIHandler();
  }

  /**
   * Example: Before hook with error handling
   */
  async beforeScenario(scenario: any): Promise<void> {
    const testContext: TestContext = {
      testId: scenario.pickle?.id || 'unknown',
      testName: scenario.pickle?.name || 'Unknown Scenario',
      tags: scenario.pickle?.tags?.map((tag: any) => tag.name) || [],
      scenario,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.DUAL, // Will be detected based on tags
      tags: testContext.tags,
      retries: 3,
      timeout: 60000
    };

    // Setup operation that might fail
    const setupOperation = async () => {
      // This would be your actual scenario setup
      console.log(`Setting up scenario: ${testContext.testName}`);
      
      // Simulate potential setup failure
      if (testContext.tags.includes('@flaky-setup')) {
        throw new Error('Setup failed due to external dependency');
      }
      
      return 'Setup complete';
    };

    try {
      await this.errorHandler.withErrorHandling(
        setupOperation,
        testContext,
        testConfig
      );
    } catch (error) {
      console.error(`Scenario setup failed: ${testContext.testName}`, error);
      throw error; // Re-throw to fail the scenario
    }
  }

  /**
   * Example: After hook with cleanup error handling
   */
  async afterScenario(scenario: any): Promise<void> {
    const testContext: TestContext = {
      testId: scenario.pickle?.id || 'unknown',
      testName: scenario.pickle?.name || 'Unknown Scenario',
      tags: scenario.pickle?.tags?.map((tag: any) => tag.name) || [],
      scenario,
      feature: null
    };

    const testConfig: TestConfig = {
      mode: TestMode.DUAL,
      tags: testContext.tags,
      retries: 2, // Fewer retries for cleanup
      timeout: 30000
    };

    // Cleanup operation that might fail
    const cleanupOperation = async () => {
      console.log(`Cleaning up scenario: ${testContext.testName}`);
      
      // Simulate potential cleanup failure
      if (testContext.tags.includes('@complex-cleanup')) {
        throw ErrorUtils.createCleanupError(
          'Complex cleanup failed',
          testContext.testId,
          testContext.testName,
          TestMode.DUAL
        );
      }
      
      return 'Cleanup complete';
    };

    try {
      await this.errorHandler.withErrorHandling(
        cleanupOperation,
        testContext,
        testConfig
      );
    } catch (error) {
      // Log cleanup errors but don't fail the test
      console.warn(`Scenario cleanup failed: ${testContext.testName}`, error);
      
      // Report the error for monitoring
      await this.errorHandler.handleError(error, testContext, testConfig);
    }
  }
}

// Export examples for use in tests and documentation
export const ErrorHandlingExamples = {
  BasicErrorHandlingExample,
  AdvancedErrorHandlingExample,
  CucumberIntegrationExample
};