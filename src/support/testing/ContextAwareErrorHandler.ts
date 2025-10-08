/**
 * Context-Aware Error Handler
 * 
 * Provides comprehensive error handling for context-aware data operations
 * with actionable suggestions and recovery strategies.
 */

import { TestMode, DataContext } from './types';
import { ValidationResult, EntityType } from './interfaces/DataContextManager';
import { DataValidationService } from './DataValidationService';
import Log from '../logger/Log';

/**
 * Error types specific to context-aware data operations
 */
export enum ContextAwareErrorType {
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  INVALID_CONTEXT = 'INVALID_CONTEXT',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  MODE_MISMATCH = 'MODE_MISMATCH',
  REFERENCE_INTEGRITY_ERROR = 'REFERENCE_INTEGRITY_ERROR',
  NAMING_CONVENTION_ERROR = 'NAMING_CONVENTION_ERROR',
  API_REQUEST_ERROR = 'API_REQUEST_ERROR'
}

/**
 * Context-aware error with additional metadata
 */
export class ContextAwareError extends Error {
  public readonly errorType: ContextAwareErrorType;
  public readonly mode: TestMode;
  public readonly entityType?: EntityType;
  public readonly entityId?: string;
  public readonly suggestions: string[];
  public readonly validationResult?: ValidationResult;
  public readonly recoverable: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    errorType: ContextAwareErrorType,
    mode: TestMode,
    options: {
      entityType?: EntityType;
      entityId?: string;
      suggestions?: string[];
      validationResult?: ValidationResult;
      recoverable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ContextAwareError';
    this.errorType = errorType;
    this.mode = mode;
    this.entityType = options.entityType;
    this.entityId = options.entityId;
    this.suggestions = options.suggestions || [];
    this.validationResult = options.validationResult;
    this.recoverable = options.recoverable ?? false;
    
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Gets a formatted error message with context and suggestions
   */
  getFormattedMessage(): string {
    let message = `[${this.mode.toUpperCase()}] ${this.message}`;
    
    if (this.entityType && this.entityId) {
      message += `\n  Entity: ${this.entityType} (${this.entityId})`;
    }
    
    if (this.suggestions.length > 0) {
      message += '\n  Suggestions:';
      this.suggestions.forEach(suggestion => {
        message += `\n    - ${suggestion}`;
      });
    }
    
    if (this.validationResult && !this.validationResult.isValid) {
      message += '\n  Validation Errors:';
      this.validationResult.errors.forEach(error => {
        message += `\n    - ${error.message} (${error.code})`;
      });
    }
    
    return message;
  }
}

/**
 * Context-aware error handler with recovery strategies
 */
export class ContextAwareErrorHandler {
  private validationService: DataValidationService;
  private mode: TestMode;
  private context: DataContext | null = null;

  constructor(mode: TestMode, context?: DataContext) {
    this.mode = mode;
    this.context = context || null;
    this.validationService = new DataValidationService(mode, context);
  }

  /**
   * Handles entity not found errors with suggestions
   */
  async handleEntityNotFound(
    entityType: EntityType, 
    entityId: string, 
    operation: string
  ): Promise<ContextAwareError> {
    Log.error(`Entity not found: ${entityType} ${entityId} for operation ${operation}`);
    
    // Get validation result with suggestions
    const validationResult = await this.validationService.validateTestDataExists(entityType, entityId);
    
    const error = new ContextAwareError(
      `${entityType} with ID '${entityId}' not found for ${operation} in ${this.mode} mode`,
      ContextAwareErrorType.ENTITY_NOT_FOUND,
      this.mode,
      {
        entityType,
        entityId,
        suggestions: validationResult.suggestions,
        validationResult,
        recoverable: true
      }
    );

    return error;
  }

  /**
   * Handles data validation failures
   */
  async handleValidationFailure(
    requestData: any, 
    requestType: 'create' | 'update' | 'delete',
    validationResult: ValidationResult
  ): Promise<ContextAwareError> {
    Log.error(`Data validation failed for ${requestType} operation`);
    
    const errorMessage = this.validationService.generateActionableErrorMessage(validationResult);
    
    const error = new ContextAwareError(
      `Data validation failed for ${requestType} operation: ${errorMessage}`,
      ContextAwareErrorType.DATA_VALIDATION_FAILED,
      this.mode,
      {
        suggestions: validationResult.suggestions,
        validationResult,
        recoverable: true
      }
    );

    return error;
  }

  /**
   * Handles API request errors with context
   */
  async handleApiRequestError(
    operation: string,
    requestData: any,
    originalError: Error
  ): Promise<ContextAwareError> {
    Log.error(`API request failed for ${operation}: ${originalError.message}`);
    
    const suggestions: string[] = [];
    
    // Analyze the error and provide specific suggestions
    if (originalError.message.includes('404')) {
      suggestions.push('Check if the entity exists in the current test mode');
      suggestions.push('Verify entity IDs are correct for the test context');
    } else if (originalError.message.includes('400')) {
      suggestions.push('Validate request data format and required fields');
      suggestions.push('Check for missing or invalid field values');
    } else if (originalError.message.includes('500')) {
      suggestions.push('Check server logs for detailed error information');
      suggestions.push('Verify database connectivity and data integrity');
    }
    
    // Add mode-specific suggestions
    if (this.mode === TestMode.PRODUCTION) {
      suggestions.push('Ensure test data follows looneyTunesTest naming conventions');
      suggestions.push('Verify production test data exists and is accessible');
    } else {
      suggestions.push('Check isolated test data setup and configuration');
      suggestions.push('Verify test database is properly initialized');
    }

    const error = new ContextAwareError(
      `API request failed for ${operation}: ${originalError.message}`,
      ContextAwareErrorType.API_REQUEST_ERROR,
      this.mode,
      {
        suggestions,
        recoverable: true,
        cause: originalError
      }
    );

    return error;
  }

  /**
   * Handles mode mismatch errors
   */
  handleModeMismatch(expectedMode: TestMode, actualMode: TestMode): ContextAwareError {
    Log.error(`Mode mismatch: expected ${expectedMode}, got ${actualMode}`);
    
    const suggestions = [
      `Ensure test is configured for ${expectedMode} mode`,
      'Check test tags and mode detection logic',
      'Verify environment variables and configuration'
    ];

    const error = new ContextAwareError(
      `Test mode mismatch: expected ${expectedMode} but running in ${actualMode} mode`,
      ContextAwareErrorType.MODE_MISMATCH,
      this.mode,
      {
        suggestions,
        recoverable: false
      }
    );

    return error;
  }

  /**
   * Handles naming convention errors for production mode
   */
  handleNamingConventionError(entityType: EntityType, entityName: string): ContextAwareError {
    Log.error(`Naming convention error: ${entityType} ${entityName} does not follow looneyTunesTest convention`);
    
    const suggestions = [
      'Include "looneyTunesTest" in entity names for production test data',
      'Use Looney Tunes character names for customers (e.g., "Bugs Bunny - looneyTunesTest")',
      'Ensure all production test entities are clearly identifiable'
    ];

    const error = new ContextAwareError(
      `${entityType} name '${entityName}' does not follow looneyTunesTest naming convention`,
      ContextAwareErrorType.NAMING_CONVENTION_ERROR,
      this.mode,
      {
        entityType,
        suggestions,
        recoverable: true
      }
    );

    return error;
  }

  /**
   * Handles reference integrity errors
   */
  async handleReferenceIntegrityError(
    parentEntityType: EntityType,
    parentEntityId: string,
    childEntityType: EntityType,
    childEntityId: string
  ): Promise<ContextAwareError> {
    Log.error(`Reference integrity error: ${childEntityType} ${childEntityId} references non-existent ${parentEntityType} ${parentEntityId}`);
    
    // Get suggestions for the missing parent entity
    const validationResult = await this.validationService.validateTestDataExists(parentEntityType, parentEntityId);
    
    const error = new ContextAwareError(
      `Reference integrity error: ${childEntityType} '${childEntityId}' references non-existent ${parentEntityType} '${parentEntityId}'`,
      ContextAwareErrorType.REFERENCE_INTEGRITY_ERROR,
      this.mode,
      {
        entityType: parentEntityType,
        entityId: parentEntityId,
        suggestions: validationResult.suggestions,
        validationResult,
        recoverable: true
      }
    );

    return error;
  }

  /**
   * Attempts to recover from recoverable errors
   */
  async attemptRecovery(error: ContextAwareError): Promise<boolean> {
    if (!error.recoverable) {
      Log.info(`Error is not recoverable: ${error.errorType}`);
      return false;
    }

    Log.info(`Attempting recovery for error: ${error.errorType}`);

    try {
      switch (error.errorType) {
        case ContextAwareErrorType.ENTITY_NOT_FOUND:
          return await this.recoverFromEntityNotFound(error);
        case ContextAwareErrorType.DATA_VALIDATION_FAILED:
          return await this.recoverFromValidationFailure(error);
        case ContextAwareErrorType.NAMING_CONVENTION_ERROR:
          return await this.recoverFromNamingConvention(error);
        default:
          Log.info(`No recovery strategy available for error type: ${error.errorType}`);
          return false;
      }
    } catch (recoveryError) {
      Log.error(`Recovery attempt failed: ${recoveryError.message}`);
      return false;
    }
  }

  /**
   * Logs error with full context information
   */
  logError(error: ContextAwareError): void {
    Log.error('Context-Aware Error Details:');
    Log.error(`  Type: ${error.errorType}`);
    Log.error(`  Mode: ${error.mode}`);
    Log.error(`  Message: ${error.message}`);
    
    if (error.entityType && error.entityId) {
      Log.error(`  Entity: ${error.entityType} (${error.entityId})`);
    }
    
    if (error.suggestions.length > 0) {
      Log.error('  Suggestions:');
      error.suggestions.forEach(suggestion => {
        Log.error(`    - ${suggestion}`);
      });
    }
    
    if (error.cause) {
      Log.error(`  Caused by: ${error.cause.message}`);
    }
  }

  // Private recovery methods

  private async recoverFromEntityNotFound(error: ContextAwareError): Promise<boolean> {
    // For entity not found errors, we can suggest using available entities
    if (error.validationResult && error.validationResult.suggestions.length > 0) {
      Log.info('Recovery suggestion: Use one of the available entities listed in the error');
      return true; // Indicate that recovery guidance is available
    }
    return false;
  }

  private async recoverFromValidationFailure(error: ContextAwareError): Promise<boolean> {
    // For validation failures, we can provide guidance on fixing the data
    if (error.validationResult && error.validationResult.suggestions.length > 0) {
      Log.info('Recovery suggestion: Fix validation errors based on provided suggestions');
      return true; // Indicate that recovery guidance is available
    }
    return false;
  }

  private async recoverFromNamingConvention(error: ContextAwareError): Promise<boolean> {
    // For naming convention errors, we can suggest proper naming
    Log.info('Recovery suggestion: Update entity names to include looneyTunesTest identifier');
    return true; // Indicate that recovery guidance is available
  }
}

/**
 * Factory for creating context-aware error handlers
 */
export class ContextAwareErrorHandlerFactory {
  private static handlers: Map<string, ContextAwareErrorHandler> = new Map();

  /**
   * Gets or creates an error handler for the specified mode and context
   */
  static getHandler(mode: TestMode, context?: DataContext): ContextAwareErrorHandler {
    const key = `${mode}-${context?.testData.metadata.testRunId || 'no-context'}`;
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new ContextAwareErrorHandler(mode, context));
    }

    return this.handlers.get(key)!;
  }

  /**
   * Clears all cached handlers
   */
  static clearHandlers(): void {
    this.handlers.clear();
  }
}