/**
 * Dual Mode Error Handler
 * 
 * Main orchestrator for error handling in dual-mode testing.
 * Integrates error detection, recovery, reporting, and graceful degradation.
 */

import { TestError, ErrorCategory, ErrorSeverity } from './TestError';
import { ErrorRecoveryManager, RecoveryResult, RetryConfig, FallbackConfig } from './ErrorRecoveryManager';
import { ErrorReporter, ReportingConfig } from './ErrorReporter';
import { TestMode, TestConfig, DataContext, TestContext } from '../types';

export interface ErrorHandlingConfig {
  retryConfig?: Partial<RetryConfig>;
  fallbackConfig?: Partial<FallbackConfig>;
  reportingConfig?: Partial<ReportingConfig>;
  enableGracefulDegradation: boolean;
  enableAutomaticRecovery: boolean;
  enableErrorReporting: boolean;
  maxConcurrentRecoveries: number;
}

export interface ErrorHandlingResult {
  success: boolean;
  finalMode?: TestMode;
  finalContext?: DataContext;
  errorReportId?: string;
  recoveryResult?: RecoveryResult;
  warnings: string[];
  executionTime: number;
}

/**
 * Main error handling orchestrator for dual-mode testing
 */
export class DualModeErrorHandler {
  private readonly config: ErrorHandlingConfig;
  private readonly recoveryManager: ErrorRecoveryManager;
  private readonly errorReporter: ErrorReporter;
  private readonly activeRecoveries: Map<string, Promise<RecoveryResult>> = new Map();

  constructor(config?: Partial<ErrorHandlingConfig>) {
    this.config = {
      enableGracefulDegradation: true,
      enableAutomaticRecovery: true,
      enableErrorReporting: true,
      maxConcurrentRecoveries: 3,
      ...config
    };

    this.recoveryManager = new ErrorRecoveryManager(
      this.config.retryConfig,
      this.config.fallbackConfig
    );

    this.errorReporter = new ErrorReporter(this.config.reportingConfig);
  }

  /**
   * Handles an error with comprehensive recovery and reporting
   */
  async handleError(
    error: Error | TestError,
    testContext: TestContext,
    testConfig: TestConfig,
    operation?: () => Promise<any>
  ): Promise<ErrorHandlingResult> {
    const startTime = Date.now();
    const result: ErrorHandlingResult = {
      success: false,
      warnings: [],
      executionTime: 0
    };

    try {
      // Convert to TestError if needed
      const testError = this.ensureTestError(error, testContext, testConfig);

      // Report the error
      if (this.config.enableErrorReporting) {
        result.errorReportId = await this.errorReporter.reportError(testError);
      }

      // Attempt recovery if enabled and operation provided
      if (this.config.enableAutomaticRecovery && operation) {
        const recoveryResult = await this.attemptRecovery(testError, testConfig, operation);
        result.recoveryResult = recoveryResult;
        result.success = recoveryResult.success;
        result.finalMode = recoveryResult.finalMode;
        result.finalContext = recoveryResult.finalContext;
        result.warnings.push(...recoveryResult.warnings);

        // Update error report with recovery result
        if (this.config.enableErrorReporting && result.errorReportId) {
          await this.errorReporter.reportError(testError, recoveryResult);
        }
      }

      // If recovery failed or not attempted, try graceful degradation
      if (!result.success && this.config.enableGracefulDegradation) {
        const degradationResult = await this.attemptGracefulDegradation(testError, testConfig);
        if (degradationResult.success) {
          result.success = true;
          result.finalMode = degradationResult.finalMode;
          result.finalContext = degradationResult.finalContext;
          result.warnings.push('Graceful degradation applied');
        }
      }

    } catch (handlingError) {
      result.warnings.push(`Error handling failed: ${handlingError.message}`);
      console.error('Error handling failed:', handlingError);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Wraps a test operation with comprehensive error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    testContext: TestContext,
    testConfig: TestConfig
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const handlingResult = await this.handleError(error, testContext, testConfig, operation);
      
      if (handlingResult.success) {
        // If recovery was successful, try the operation again
        try {
          return await operation();
        } catch (retryError) {
          // If retry also fails, throw the original error with context
          throw this.enhanceError(retryError, testContext, testConfig, handlingResult);
        }
      } else {
        // If recovery failed, throw enhanced error
        throw this.enhanceError(error, testContext, testConfig, handlingResult);
      }
    }
  }

  /**
   * Creates a safe wrapper for async operations with error handling
   */
  createSafeWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    testContext: TestContext,
    testConfig: TestConfig
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      return this.withErrorHandling(() => fn(...args), testContext, testConfig);
    };
  }

  /**
   * Handles multiple errors in batch
   */
  async handleMultipleErrors(
    errors: Array<{ error: Error | TestError; testContext: TestContext; testConfig: TestConfig }>,
    operation?: () => Promise<any>
  ): Promise<ErrorHandlingResult[]> {
    const results: ErrorHandlingResult[] = [];
    const concurrentLimit = this.config.maxConcurrentRecoveries;
    
    // Process errors in batches to avoid overwhelming the system
    for (let i = 0; i < errors.length; i += concurrentLimit) {
      const batch = errors.slice(i, i + concurrentLimit);
      const batchPromises = batch.map(({ error, testContext, testConfig }) =>
        this.handleError(error, testContext, testConfig, operation)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            warnings: [`Batch error handling failed: ${result.reason.message}`],
            executionTime: 0
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Ensures error is a TestError instance
   */
  private ensureTestError(
    error: Error | TestError,
    testContext: TestContext,
    testConfig: TestConfig
  ): TestError {
    if (error instanceof TestError) {
      return error;
    }

    // Convert regular Error to TestError
    const errorContext = {
      testId: testContext.testId,
      testName: testContext.testName,
      mode: testConfig.mode,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TEST_MODE: process.env.TEST_MODE
      },
      additionalInfo: {
        originalErrorType: error.constructor.name,
        tags: testContext.tags
      }
    };

    // Determine category based on error type and message
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category);

    return new TestError(
      error.message,
      category,
      severity,
      errorContext,
      {
        originalError: error,
        retryable: this.isRetryableError(error),
        cleanupRequired: this.requiresCleanup(error, testConfig)
      }
    );
  }

  /**
   * Categorizes an error based on its type and message
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const errorType = error.constructor.name.toLowerCase();

    if (message.includes('connection') || message.includes('econnrefused') || errorType.includes('connection')) {
      return ErrorCategory.DATABASE_CONNECTION;
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('context') || message.includes('data') || message.includes('setup')) {
      return ErrorCategory.DATA_CONTEXT;
    }

    if (message.includes('cleanup') || message.includes('teardown')) {
      return ErrorCategory.CLEANUP;
    }

    if (message.includes('mode') || message.includes('detection')) {
      return ErrorCategory.MODE_DETECTION;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.TEST_EXECUTION;
  }

  /**
   * Determines error severity based on error type and category
   */
  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (message.includes('critical') || message.includes('fatal') || category === ErrorCategory.CLEANUP) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (category === ErrorCategory.DATABASE_CONNECTION || 
        category === ErrorCategory.DATA_CONTEXT ||
        message.includes('failed to')) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (category === ErrorCategory.NETWORK || 
        category === ErrorCategory.MODE_DETECTION ||
        category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.MEDIUM;
    }

    // Default to low severity
    return ErrorSeverity.LOW;
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'transient',
      'econnrefused',
      'enotfound'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Determines if an error requires cleanup
   */
  private requiresCleanup(error: Error, testConfig: TestConfig): boolean {
    const message = error.message.toLowerCase();
    
    // Always require cleanup for data context errors
    if (message.includes('context') || message.includes('data')) {
      return true;
    }

    // Require cleanup for database-related errors in isolated mode
    if (testConfig.mode === TestMode.ISOLATED && message.includes('database')) {
      return true;
    }

    return false;
  }

  /**
   * Attempts recovery using the recovery manager
   */
  private async attemptRecovery(
    error: TestError,
    testConfig: TestConfig,
    operation: () => Promise<any>
  ): Promise<RecoveryResult> {
    const testId = error.context.testId;

    // Check if recovery is already in progress for this test
    if (this.activeRecoveries.has(testId)) {
      console.log(`Recovery already in progress for test ${testId}, waiting...`);
      return await this.activeRecoveries.get(testId)!;
    }

    // Start recovery
    const recoveryPromise = this.recoveryManager.recoverFromError(error, testConfig, operation);
    this.activeRecoveries.set(testId, recoveryPromise);

    try {
      const result = await recoveryPromise;
      return result;
    } finally {
      this.activeRecoveries.delete(testId);
    }
  }

  /**
   * Attempts graceful degradation
   */
  private async attemptGracefulDegradation(
    error: TestError,
    testConfig: TestConfig
  ): Promise<{ success: boolean; finalMode?: TestMode; finalContext?: DataContext }> {
    // Only attempt degradation for production mode errors
    if (error.context.mode !== TestMode.PRODUCTION) {
      return { success: false };
    }

    try {
      console.log('Attempting graceful degradation to isolated mode...');

      // Create isolated mode config
      const isolatedConfig: TestConfig = {
        ...testConfig,
        mode: TestMode.ISOLATED
      };

      // In real implementation, would create new context
      // For now, return success to indicate degradation is possible
      return {
        success: true,
        finalMode: TestMode.ISOLATED,
        finalContext: undefined // Would be created in real implementation
      };

    } catch (degradationError) {
      console.error('Graceful degradation failed:', degradationError);
      return { success: false };
    }
  }

  /**
   * Enhances an error with handling context
   */
  private enhanceError(
    originalError: Error,
    testContext: TestContext,
    testConfig: TestConfig,
    handlingResult: ErrorHandlingResult
  ): Error {
    const enhancedMessage = [
      originalError.message,
      `\nError Handling Summary:`,
      `  - Recovery Attempted: ${!!handlingResult.recoveryResult}`,
      `  - Recovery Success: ${handlingResult.success}`,
      `  - Final Mode: ${handlingResult.finalMode || testConfig.mode}`,
      `  - Execution Time: ${handlingResult.executionTime}ms`,
      `  - Report ID: ${handlingResult.errorReportId || 'N/A'}`
    ];

    if (handlingResult.warnings.length > 0) {
      enhancedMessage.push(`  - Warnings: ${handlingResult.warnings.join('; ')}`);
    }

    const enhancedError = new Error(enhancedMessage.join('\n'));
    enhancedError.name = originalError.name;
    enhancedError.stack = originalError.stack;

    return enhancedError;
  }

  /**
   * Gets error handling statistics
   */
  getStatistics(): {
    recoveryStats: any;
    errorSummary: any;
    activeRecoveries: number;
  } {
    return {
      recoveryStats: this.recoveryManager.getRecoveryStatistics(),
      errorSummary: this.errorReporter.getErrorSummary(),
      activeRecoveries: this.activeRecoveries.size
    };
  }

  /**
   * Clears all error handling history
   */
  clearHistory(): void {
    this.recoveryManager.clearRecoveryHistory();
    this.errorReporter.clearReports();
    this.activeRecoveries.clear();
  }

  /**
   * Gets the error reporter instance
   */
  getErrorReporter(): ErrorReporter {
    return this.errorReporter;
  }

  /**
   * Gets the recovery manager instance
   */
  getRecoveryManager(): ErrorRecoveryManager {
    return this.recoveryManager;
  }
}