/**
 * Data Context Management Framework
 * 
 * Provides interfaces and base implementation for managing test data contexts
 * across isolated and production testing modes.
 */

import { TestMode, TestConfig, DataContext } from './types';

/**
 * Interface for managing test data contexts
 */
export interface DataContextManager {
  /**
   * Sets up the data context for a test based on the specified mode and configuration
   */
  setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext>;
  
  /**
   * Validates that the data context is properly configured and accessible
   */
  validateContext(context: DataContext): Promise<boolean>;
  
  /**
   * Cleans up the data context after test execution
   */
  cleanupContext(context: DataContext): Promise<void>;
  
  /**
   * Gets the supported test mode for this context manager
   */
  getSupportedMode(): TestMode;
}

/**
 * Base implementation of DataContextManager with common functionality
 */
export abstract class BaseDataContextManager implements DataContextManager {
  protected readonly mode: TestMode;
  
  constructor(mode: TestMode) {
    this.mode = mode;
  }
  
  abstract setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext>;
  abstract validateContext(context: DataContext): Promise<boolean>;
  
  /**
   * Default cleanup implementation that calls the context's cleanup method
   */
  async cleanupContext(context: DataContext): Promise<void> {
    try {
      await context.cleanup();
    } catch (error) {
      console.error(`Failed to cleanup context for mode ${context.mode}:`, error);
      throw error;
    }
  }
  
  getSupportedMode(): TestMode {
    return this.mode;
  }
  
  /**
   * Validates that the provided mode matches the supported mode
   */
  protected validateMode(requestedMode: TestMode): void {
    if (requestedMode !== this.mode && requestedMode !== TestMode.DUAL) {
      throw new Error(`Context manager for ${this.mode} cannot handle ${requestedMode} mode`);
    }
  }
  
  /**
   * Creates a unique test run ID for tracking
   */
  protected generateTestRunId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}