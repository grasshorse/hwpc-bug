/**
 * Error Handling and Recovery System for Dual-Mode Testing
 * 
 * Exports all error handling components for comprehensive error management,
 * recovery, and reporting in dual-mode testing scenarios.
 */

// Core error types and classes
export {
  TestError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryAction,
  ErrorContext
} from './TestError';

// Error recovery management
export {
  ErrorRecoveryManager,
  RecoveryResult,
  RetryConfig,
  FallbackConfig
} from './ErrorRecoveryManager';

// Error reporting system
export {
  ErrorReporter,
  ReportingConfig,
  ErrorReport,
  ErrorSummary
} from './ErrorReporter';

// Main error handling orchestrator
export {
  DualModeErrorHandler,
  ErrorHandlingConfig,
  ErrorHandlingResult
} from './DualModeErrorHandler';

// Utility functions for common error scenarios
export const ErrorUtils = {
  /**
   * Creates a database connection error
   */
  createDatabaseError: (
    message: string,
    testId: string,
    testName: string,
    mode: import('../types').TestMode,
    connectionInfo?: any,
    originalError?: Error
  ) => TestError.databaseConnectionError(message, testId, testName, mode, connectionInfo, originalError),

  /**
   * Creates a data context error
   */
  createDataContextError: (
    message: string,
    testId: string,
    testName: string,
    mode: import('../types').TestMode,
    dataContext?: import('../types').DataContext,
    originalError?: Error
  ) => TestError.dataContextError(message, testId, testName, mode, dataContext, originalError),

  /**
   * Creates a mode detection error
   */
  createModeDetectionError: (
    message: string,
    testId: string,
    testName: string,
    environment: Record<string, any>,
    originalError?: Error
  ) => TestError.modeDetectionError(message, testId, testName, environment, originalError),

  /**
   * Creates a test execution error
   */
  createTestExecutionError: (
    message: string,
    testId: string,
    testName: string,
    mode: import('../types').TestMode,
    dataContext?: import('../types').DataContext,
    originalError?: Error
  ) => TestError.testExecutionError(message, testId, testName, mode, dataContext, originalError),

  /**
   * Creates a network error
   */
  createNetworkError: (
    message: string,
    testId: string,
    testName: string,
    mode: import('../types').TestMode,
    endpoint?: string,
    originalError?: Error
  ) => TestError.networkError(message, testId, testName, mode, endpoint, originalError),

  /**
   * Creates a cleanup error
   */
  createCleanupError: (
    message: string,
    testId: string,
    testName: string,
    mode: import('../types').TestMode,
    dataContext?: import('../types').DataContext,
    originalError?: Error
  ) => TestError.cleanupError(message, testId, testName, mode, dataContext, originalError),

  /**
   * Determines if an error is retryable based on common patterns
   */
  isRetryable: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'transient',
      'econnrefused',
      'enotfound',
      'service unavailable',
      'too many requests'
    ];
    return retryablePatterns.some(pattern => message.includes(pattern));
  },

  /**
   * Extracts relevant context from an error
   */
  extractErrorContext: (error: Error): Record<string, any> => {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
  },

  /**
   * Formats error for logging
   */
  formatErrorForLogging: (error: Error | TestError): string => {
    if (error instanceof TestError) {
      return error.toLogFormat();
    }

    return JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
};

// Default configurations
export const DefaultConfigs = {
  /**
   * Default retry configuration
   */
  retryConfig: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableCategories: [
      ErrorCategory.DATABASE_CONNECTION,
      ErrorCategory.NETWORK,
      ErrorCategory.DATA_CONTEXT,
      ErrorCategory.TEST_EXECUTION
    ]
  } as RetryConfig,

  /**
   * Default fallback configuration
   */
  fallbackConfig: {
    enableModeFallback: true,
    fallbackChain: [import('../types').TestMode.PRODUCTION, import('../types').TestMode.ISOLATED],
    preserveTestData: true,
    notifyOnFallback: true
  } as FallbackConfig,

  /**
   * Default reporting configuration
   */
  reportingConfig: {
    enableConsoleReporting: true,
    enableFileReporting: false,
    enableJsonReporting: true,
    reportingLevel: ErrorSeverity.LOW,
    includeStackTrace: true,
    includeEnvironment: true,
    includeRecoveryActions: true,
    maxReportSize: 1000
  } as ReportingConfig,

  /**
   * Default error handling configuration
   */
  errorHandlingConfig: {
    enableGracefulDegradation: true,
    enableAutomaticRecovery: true,
    enableErrorReporting: true,
    maxConcurrentRecoveries: 3
  } as import('./DualModeErrorHandler').ErrorHandlingConfig
};

// Factory functions for creating configured instances
export const ErrorHandlingFactory = {
  /**
   * Creates a configured error handler for development
   */
  createDevelopmentHandler: () => new DualModeErrorHandler({
    ...DefaultConfigs.errorHandlingConfig,
    reportingConfig: {
      ...DefaultConfigs.reportingConfig,
      enableConsoleReporting: true,
      reportingLevel: ErrorSeverity.LOW
    }
  }),

  /**
   * Creates a configured error handler for production
   */
  createProductionHandler: () => new DualModeErrorHandler({
    ...DefaultConfigs.errorHandlingConfig,
    reportingConfig: {
      ...DefaultConfigs.reportingConfig,
      enableConsoleReporting: false,
      enableFileReporting: true,
      reportingLevel: ErrorSeverity.MEDIUM
    }
  }),

  /**
   * Creates a configured error handler for CI/CD
   */
  createCIHandler: () => new DualModeErrorHandler({
    ...DefaultConfigs.errorHandlingConfig,
    retryConfig: {
      ...DefaultConfigs.retryConfig,
      maxAttempts: 2, // Fewer retries in CI
      baseDelayMs: 500
    },
    reportingConfig: {
      ...DefaultConfigs.reportingConfig,
      enableConsoleReporting: true,
      enableJsonReporting: true,
      reportingLevel: ErrorSeverity.MEDIUM
    }
  })
};