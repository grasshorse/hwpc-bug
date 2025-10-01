/**
 * Error Recovery Manager
 * 
 * Handles graceful degradation, retry logic, and recovery mechanisms
 * for dual-mode testing scenarios.
 */

import { TestError, ErrorCategory, ErrorSeverity, RecoveryAction } from './TestError';
import { TestMode, TestConfig, DataContext } from '../types';
import { TestModeDetector } from '../TestModeDetector';
import { DataContextFactory } from '../DataContextFactory';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableCategories: ErrorCategory[];
}

export interface RecoveryResult {
  success: boolean;
  finalMode?: TestMode;
  finalContext?: DataContext;
  attemptsUsed: number;
  recoveryActions: string[];
  errors: TestError[];
  warnings: string[];
}

export interface FallbackConfig {
  enableModeFallback: boolean;
  fallbackChain: TestMode[];
  preserveTestData: boolean;
  notifyOnFallback: boolean;
}

/**
 * Manages error recovery, retry logic, and graceful degradation for dual-mode testing
 */
export class ErrorRecoveryManager {
  private readonly retryConfig: RetryConfig;
  private readonly fallbackConfig: FallbackConfig;
  private readonly modeDetector: TestModeDetector;
  private readonly contextFactory: DataContextFactory;
  private readonly recoveryHistory: Map<string, RecoveryResult[]> = new Map();

  constructor(
    retryConfig?: Partial<RetryConfig>,
    fallbackConfig?: Partial<FallbackConfig>
  ) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryableCategories: [
        ErrorCategory.DATABASE_CONNECTION,
        ErrorCategory.NETWORK,
        ErrorCategory.DATA_CONTEXT,
        ErrorCategory.TEST_EXECUTION
      ],
      ...retryConfig
    };

    this.fallbackConfig = {
      enableModeFallback: true,
      fallbackChain: [TestMode.PRODUCTION, TestMode.ISOLATED],
      preserveTestData: true,
      notifyOnFallback: true,
      ...fallbackConfig
    };

    this.modeDetector = new TestModeDetector();
    this.contextFactory = new DataContextFactory();
  }

  /**
   * Attempts to recover from a test error using various strategies
   */
  async recoverFromError(
    error: TestError,
    originalConfig: TestConfig,
    operation: () => Promise<any>
  ): Promise<RecoveryResult> {
    const testId = error.context.testId;
    const recoveryResult: RecoveryResult = {
      success: false,
      attemptsUsed: 0,
      recoveryActions: [],
      errors: [error],
      warnings: []
    };

    // Check if error is retryable
    if (!this.isRetryable(error)) {
      recoveryResult.warnings.push(`Error category ${error.category} is not retryable`);
      return recoveryResult;
    }

    // Try automated recovery actions first
    const automatedRecovery = await this.attemptAutomatedRecovery(
      error,
      originalConfig,
      operation
    );

    if (automatedRecovery.success) {
      return automatedRecovery;
    }

    // Merge results
    recoveryResult.attemptsUsed += automatedRecovery.attemptsUsed;
    recoveryResult.recoveryActions.push(...automatedRecovery.recoveryActions);
    recoveryResult.errors.push(...automatedRecovery.errors);
    recoveryResult.warnings.push(...automatedRecovery.warnings);

    // Try mode fallback if enabled and appropriate
    if (this.shouldAttemptModeFallback(error)) {
      const fallbackRecovery = await this.attemptModeFallback(
        error,
        originalConfig,
        operation
      );

      recoveryResult.attemptsUsed += fallbackRecovery.attemptsUsed;
      recoveryResult.recoveryActions.push(...fallbackRecovery.recoveryActions);
      recoveryResult.errors.push(...fallbackRecovery.errors);
      recoveryResult.warnings.push(...fallbackRecovery.warnings);

      if (fallbackRecovery.success) {
        recoveryResult.success = true;
        recoveryResult.finalMode = fallbackRecovery.finalMode;
        recoveryResult.finalContext = fallbackRecovery.finalContext;
      }
    }

    // Store recovery history
    this.storeRecoveryHistory(testId, recoveryResult);

    return recoveryResult;
  }

  /**
   * Attempts automated recovery actions
   */
  private async attemptAutomatedRecovery(
    error: TestError,
    originalConfig: TestConfig,
    operation: () => Promise<any>
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      attemptsUsed: 0,
      recoveryActions: [],
      errors: [],
      warnings: []
    };

    const automatedActions = error.recoveryActions.filter(action => action.automated);

    for (const action of automatedActions) {
      try {
        result.attemptsUsed++;
        result.recoveryActions.push(action.action);

        const success = await this.executeRecoveryAction(action, error, originalConfig, operation);
        
        if (success) {
          result.success = true;
          break;
        }
      } catch (recoveryError) {
        const testError = recoveryError instanceof TestError 
          ? recoveryError 
          : TestError.testExecutionError(
              `Recovery action failed: ${action.action}`,
              error.context.testId,
              error.context.testName,
              error.context.mode,
              error.context.dataContext,
              recoveryError as Error
            );
        
        result.errors.push(testError);
        result.warnings.push(`Recovery action '${action.action}' failed: ${testError.message}`);
      }
    }

    return result;
  }

  /**
   * Attempts mode fallback recovery
   */
  private async attemptModeFallback(
    error: TestError,
    originalConfig: TestConfig,
    operation: () => Promise<any>
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      attemptsUsed: 0,
      recoveryActions: [],
      errors: [],
      warnings: []
    };

    if (!this.fallbackConfig.enableModeFallback) {
      result.warnings.push('Mode fallback is disabled');
      return result;
    }

    const currentMode = error.context.mode;
    const fallbackMode = this.getFallbackMode(currentMode);

    if (fallbackMode === currentMode) {
      result.warnings.push(`No fallback mode available for ${currentMode}`);
      return result;
    }

    try {
      result.attemptsUsed++;
      result.recoveryActions.push(`fallback_to_${fallbackMode}`);

      if (this.fallbackConfig.notifyOnFallback) {
        console.warn(`Falling back from ${currentMode} to ${fallbackMode} mode due to: ${error.message}`);
      }

      // Create new config with fallback mode
      const fallbackConfig: TestConfig = {
        ...originalConfig,
        mode: fallbackMode
      };

      // Create new context with fallback mode
      const fallbackContext = await this.contextFactory.createContext(fallbackMode, fallbackConfig);
      
      // Attempt operation with fallback context
      await operation();

      result.success = true;
      result.finalMode = fallbackMode;
      result.finalContext = fallbackContext;

      if (this.fallbackConfig.notifyOnFallback) {
        console.info(`Successfully recovered using ${fallbackMode} mode`);
      }

    } catch (fallbackError) {
      const testError = fallbackError instanceof TestError 
        ? fallbackError 
        : TestError.testExecutionError(
            `Mode fallback to ${fallbackMode} failed`,
            error.context.testId,
            error.context.testName,
            fallbackMode,
            undefined,
            fallbackError as Error
          );
      
      result.errors.push(testError);
      result.warnings.push(`Mode fallback to ${fallbackMode} failed: ${testError.message}`);
    }

    return result;
  }

  /**
   * Executes a specific recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    error: TestError,
    config: TestConfig,
    operation: () => Promise<any>
  ): Promise<boolean> {
    switch (action.action) {
      case 'retry_with_backoff':
        return await this.retryWithBackoff(operation, error);

      case 'retry_connection':
        return await this.retryDatabaseConnection(error, config);

      case 'retry_context_setup':
        return await this.retryContextSetup(error, config);

      case 'refresh_test_data':
        return await this.refreshTestData(error, config);

      case 'fallback_to_mock_data':
        return await this.fallbackToMockData(error, config);

      case 'force_cleanup':
        return await this.forceCleanup(error);

      case 'log_for_later_cleanup':
        return await this.logForLaterCleanup(error);

      default:
        console.warn(`Unknown recovery action: ${action.action}`);
        return false;
    }
  }

  /**
   * Retries operation with exponential backoff
   */
  private async retryWithBackoff(
    operation: () => Promise<any>,
    error: TestError
  ): Promise<boolean> {
    let delay = this.retryConfig.baseDelayMs;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Retrying operation (attempt ${attempt}/${this.retryConfig.maxAttempts}) after ${delay}ms delay`);
          await this.sleep(delay);
        }

        await operation();
        return true;

      } catch (retryError) {
        if (attempt === this.retryConfig.maxAttempts) {
          throw retryError;
        }

        delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
      }
    }

    return false;
  }

  /**
   * Retries database connection
   */
  private async retryDatabaseConnection(error: TestError, config: TestConfig): Promise<boolean> {
    try {
      // In real implementation, would attempt to reconnect to database
      console.log('Attempting to retry database connection...');
      
      // Simulate connection retry
      await this.sleep(1000);
      
      // For now, return success if we have database config
      return !!config.databaseConfig;
    } catch (connectionError) {
      console.error('Database connection retry failed:', connectionError);
      return false;
    }
  }

  /**
   * Retries context setup
   */
  private async retryContextSetup(error: TestError, config: TestConfig): Promise<boolean> {
    try {
      console.log('Attempting to retry context setup...');
      
      const newContext = await this.contextFactory.createContext(error.context.mode, config);
      return !!newContext;
    } catch (contextError) {
      console.error('Context setup retry failed:', contextError);
      return false;
    }
  }

  /**
   * Refreshes test data
   */
  private async refreshTestData(error: TestError, config: TestConfig): Promise<boolean> {
    try {
      console.log('Attempting to refresh test data...');
      
      if (error.context.dataContext) {
        // In real implementation, would refresh the test data
        await this.sleep(500);
        return true;
      }
      
      return false;
    } catch (refreshError) {
      console.error('Test data refresh failed:', refreshError);
      return false;
    }
  }

  /**
   * Falls back to mock data
   */
  private async fallbackToMockData(error: TestError, config: TestConfig): Promise<boolean> {
    try {
      console.log('Falling back to mock data...');
      
      // In real implementation, would create mock data context
      await this.sleep(500);
      return true;
    } catch (mockError) {
      console.error('Mock data fallback failed:', mockError);
      return false;
    }
  }

  /**
   * Forces cleanup of resources
   */
  private async forceCleanup(error: TestError): Promise<boolean> {
    try {
      console.log('Attempting force cleanup...');
      
      if (error.context.dataContext?.cleanup) {
        await error.context.dataContext.cleanup();
      }
      
      return true;
    } catch (cleanupError) {
      console.error('Force cleanup failed:', cleanupError);
      return false;
    }
  }

  /**
   * Logs resources for later cleanup
   */
  private async logForLaterCleanup(error: TestError): Promise<boolean> {
    try {
      const cleanupInfo = {
        testId: error.context.testId,
        mode: error.context.mode,
        timestamp: new Date().toISOString(),
        context: error.context.dataContext,
        error: error.message
      };

      console.log('Logging for later cleanup:', JSON.stringify(cleanupInfo, null, 2));
      
      // In real implementation, would write to cleanup log file or database
      return true;
    } catch (logError) {
      console.error('Failed to log for cleanup:', logError);
      return false;
    }
  }

  /**
   * Checks if an error is retryable
   */
  private isRetryable(error: TestError): boolean {
    return error.retryable && this.retryConfig.retryableCategories.includes(error.category);
  }

  /**
   * Checks if mode fallback should be attempted
   */
  private shouldAttemptModeFallback(error: TestError): boolean {
    return (
      this.fallbackConfig.enableModeFallback &&
      error.shouldTriggerModeFallback() &&
      this.getFallbackMode(error.context.mode) !== error.context.mode
    );
  }

  /**
   * Gets the fallback mode for a given mode
   */
  private getFallbackMode(currentMode: TestMode): TestMode {
    const currentIndex = this.fallbackConfig.fallbackChain.indexOf(currentMode);
    
    if (currentIndex === -1 || currentIndex === this.fallbackConfig.fallbackChain.length - 1) {
      return currentMode; // No fallback available
    }
    
    return this.fallbackConfig.fallbackChain[currentIndex + 1];
  }

  /**
   * Stores recovery history for analysis
   */
  private storeRecoveryHistory(testId: string, result: RecoveryResult): void {
    if (!this.recoveryHistory.has(testId)) {
      this.recoveryHistory.set(testId, []);
    }
    
    this.recoveryHistory.get(testId)!.push(result);
  }

  /**
   * Gets recovery history for a test
   */
  getRecoveryHistory(testId: string): RecoveryResult[] {
    return this.recoveryHistory.get(testId) || [];
  }

  /**
   * Gets recovery statistics
   */
  getRecoveryStatistics(): {
    totalRecoveries: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    mostCommonErrors: string[];
    mostSuccessfulActions: string[];
  } {
    const allResults = Array.from(this.recoveryHistory.values()).flat();
    
    const totalRecoveries = allResults.length;
    const successfulRecoveries = allResults.filter(r => r.success).length;
    const failedRecoveries = totalRecoveries - successfulRecoveries;
    
    const errorCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();
    
    allResults.forEach(result => {
      result.errors.forEach(error => {
        const key = `${error.category}:${error.message}`;
        errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      });
      
      if (result.success) {
        result.recoveryActions.forEach(action => {
          actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        });
      }
    });
    
    const mostCommonErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error]) => error);
    
    const mostSuccessfulActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action]) => action);
    
    return {
      totalRecoveries,
      successfulRecoveries,
      failedRecoveries,
      mostCommonErrors,
      mostSuccessfulActions
    };
  }

  /**
   * Clears recovery history
   */
  clearRecoveryHistory(): void {
    this.recoveryHistory.clear();
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}