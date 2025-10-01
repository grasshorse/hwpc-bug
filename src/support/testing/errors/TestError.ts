/**
 * TestError class with mode and context information
 * 
 * Provides comprehensive error information for dual-mode testing scenarios
 * with recovery suggestions and context preservation.
 */

import { TestMode, DataContext } from '../types';

export enum ErrorCategory {
  MODE_DETECTION = 'mode_detection',
  DATA_CONTEXT = 'data_context',
  DATABASE_CONNECTION = 'database_connection',
  TEST_EXECUTION = 'test_execution',
  CLEANUP = 'cleanup',
  VALIDATION = 'validation',
  NETWORK = 'network',
  CONFIGURATION = 'configuration'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RecoveryAction {
  action: string;
  description: string;
  automated: boolean;
  estimatedTime?: string;
  prerequisites?: string[];
}

export interface ErrorContext {
  testId: string;
  testName: string;
  mode: TestMode;
  dataContext?: DataContext;
  timestamp: Date;
  environment: Record<string, any>;
  stackTrace?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Enhanced error class for dual-mode testing with comprehensive context and recovery information
 */
export class TestError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoveryActions: RecoveryAction[];
  public readonly cleanupRequired: boolean;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: ErrorContext,
    options: {
      recoveryActions?: RecoveryAction[];
      cleanupRequired?: boolean;
      retryable?: boolean;
      originalError?: Error;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'TestError';
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.recoveryActions = options.recoveryActions || [];
    this.cleanupRequired = options.cleanupRequired || false;
    this.retryable = options.retryable || false;
    this.originalError = options.originalError;

    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TestError);
    }

    // Include original error stack if available
    if (options.originalError) {
      this.context.stackTrace = options.originalError.stack;
    }

    // Set cause for error chaining (Node.js 16.9.0+)
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Creates a TestError for mode detection failures
   */
  static modeDetectionError(
    message: string,
    testId: string,
    testName: string,
    environment: Record<string, any>,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode: TestMode.ISOLATED, // Default fallback
      timestamp: new Date(),
      environment,
      additionalInfo: {
        availableModes: Object.values(TestMode),
        environmentVariables: {
          TEST_MODE: process.env.TEST_MODE,
          NODE_ENV: process.env.NODE_ENV
        }
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'set_explicit_mode',
        description: 'Set TEST_MODE environment variable explicitly',
        automated: false,
        estimatedTime: '1 minute',
        prerequisites: ['Access to environment configuration']
      },
      {
        action: 'use_test_tags',
        description: 'Add @isolated, @production, or @dual tags to test',
        automated: false,
        estimatedTime: '2 minutes'
      },
      {
        action: 'fallback_to_isolated',
        description: 'Automatically fallback to isolated mode',
        automated: true,
        estimatedTime: 'immediate'
      }
    ];

    return new TestError(
      message,
      ErrorCategory.MODE_DETECTION,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryActions,
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Creates a TestError for data context setup failures
   */
  static dataContextError(
    message: string,
    testId: string,
    testName: string,
    mode: TestMode,
    dataContext?: DataContext,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode,
      dataContext,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TEST_MODE: process.env.TEST_MODE
      },
      additionalInfo: {
        contextMode: dataContext?.mode,
        hasTestData: !!dataContext?.testData,
        connectionInfo: dataContext?.connectionInfo
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'retry_context_setup',
        description: 'Retry data context setup with exponential backoff',
        automated: true,
        estimatedTime: '30 seconds'
      },
      {
        action: 'fallback_to_alternative_mode',
        description: 'Switch to alternative testing mode',
        automated: true,
        estimatedTime: '1 minute'
      },
      {
        action: 'check_database_connectivity',
        description: 'Verify database connection and permissions',
        automated: false,
        estimatedTime: '5 minutes',
        prerequisites: ['Database access credentials', 'Network connectivity']
      }
    ];

    return new TestError(
      message,
      ErrorCategory.DATA_CONTEXT,
      ErrorSeverity.HIGH,
      context,
      {
        recoveryActions,
        cleanupRequired: true,
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Creates a TestError for database connection failures
   */
  static databaseConnectionError(
    message: string,
    testId: string,
    testName: string,
    mode: TestMode,
    connectionInfo: any,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'not set'
      },
      additionalInfo: {
        connectionInfo: {
          host: connectionInfo?.host || 'unknown',
          database: connectionInfo?.database || 'unknown',
          isTestConnection: connectionInfo?.isTestConnection || false
        },
        networkStatus: 'unknown'
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'retry_connection',
        description: 'Retry database connection with exponential backoff',
        automated: true,
        estimatedTime: '1 minute'
      },
      {
        action: 'check_network_connectivity',
        description: 'Verify network connectivity to database host',
        automated: false,
        estimatedTime: '2 minutes'
      },
      {
        action: 'validate_credentials',
        description: 'Verify database credentials and permissions',
        automated: false,
        estimatedTime: '5 minutes',
        prerequisites: ['Database administrator access']
      },
      {
        action: 'fallback_to_mock_data',
        description: 'Use mock data for testing if database unavailable',
        automated: true,
        estimatedTime: '30 seconds'
      }
    ];

    return new TestError(
      message,
      ErrorCategory.DATABASE_CONNECTION,
      ErrorSeverity.HIGH,
      context,
      {
        recoveryActions,
        cleanupRequired: false,
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Creates a TestError for test execution failures
   */
  static testExecutionError(
    message: string,
    testId: string,
    testName: string,
    mode: TestMode,
    dataContext?: DataContext,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode,
      dataContext,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TEST_MODE: process.env.TEST_MODE
      },
      additionalInfo: {
        testDataAvailable: !!dataContext?.testData,
        customersCount: dataContext?.testData?.customers?.length || 0,
        routesCount: dataContext?.testData?.routes?.length || 0,
        ticketsCount: dataContext?.testData?.tickets?.length || 0
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'retry_test_execution',
        description: 'Retry test execution with same context',
        automated: true,
        estimatedTime: '30 seconds'
      },
      {
        action: 'refresh_test_data',
        description: 'Refresh test data and retry execution',
        automated: true,
        estimatedTime: '1 minute'
      },
      {
        action: 'switch_testing_mode',
        description: 'Switch to alternative testing mode and retry',
        automated: true,
        estimatedTime: '2 minutes'
      }
    ];

    return new TestError(
      message,
      ErrorCategory.TEST_EXECUTION,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryActions,
        cleanupRequired: true,
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Creates a TestError for cleanup failures
   */
  static cleanupError(
    message: string,
    testId: string,
    testName: string,
    mode: TestMode,
    dataContext?: DataContext,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode,
      dataContext,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV
      },
      additionalInfo: {
        cleanupAttempted: true,
        contextStillActive: !!dataContext
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'force_cleanup',
        description: 'Force cleanup with elevated permissions',
        automated: true,
        estimatedTime: '1 minute'
      },
      {
        action: 'manual_cleanup',
        description: 'Perform manual cleanup of test resources',
        automated: false,
        estimatedTime: '10 minutes',
        prerequisites: ['Database administrator access', 'System administrator access']
      },
      {
        action: 'log_for_later_cleanup',
        description: 'Log resources for scheduled cleanup',
        automated: true,
        estimatedTime: 'immediate'
      }
    ];

    return new TestError(
      message,
      ErrorCategory.CLEANUP,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryActions,
        cleanupRequired: false, // Already attempting cleanup
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Creates a TestError for network-related failures
   */
  static networkError(
    message: string,
    testId: string,
    testName: string,
    mode: TestMode,
    endpoint?: string,
    originalError?: Error
  ): TestError {
    const context: ErrorContext = {
      testId,
      testName,
      mode,
      timestamp: new Date(),
      environment: {
        NODE_ENV: process.env.NODE_ENV
      },
      additionalInfo: {
        endpoint,
        networkTimeout: process.env.NETWORK_TIMEOUT || 'default',
        userAgent: 'dual-mode-test-framework'
      }
    };

    const recoveryActions: RecoveryAction[] = [
      {
        action: 'retry_with_backoff',
        description: 'Retry network request with exponential backoff',
        automated: true,
        estimatedTime: '2 minutes'
      },
      {
        action: 'check_network_connectivity',
        description: 'Verify network connectivity and DNS resolution',
        automated: false,
        estimatedTime: '3 minutes'
      },
      {
        action: 'use_alternative_endpoint',
        description: 'Switch to alternative API endpoint if available',
        automated: true,
        estimatedTime: '30 seconds'
      }
    ];

    return new TestError(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryActions,
        retryable: true,
        originalError
      }
    );
  }

  /**
   * Formats the error for logging with all context information
   */
  toLogFormat(): string {
    const logData = {
      error: {
        name: this.name,
        message: this.message,
        category: this.category,
        severity: this.severity,
        retryable: this.retryable,
        cleanupRequired: this.cleanupRequired
      },
      context: {
        testId: this.context.testId,
        testName: this.context.testName,
        mode: this.context.mode,
        timestamp: this.context.timestamp.toISOString(),
        environment: this.context.environment,
        additionalInfo: this.context.additionalInfo
      },
      recoveryActions: this.recoveryActions,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };

    return JSON.stringify(logData, null, 2);
  }

  /**
   * Gets a human-readable summary of the error
   */
  getSummary(): string {
    const modeText = this.context.mode.toUpperCase();
    const severityText = this.severity.toUpperCase();
    
    return `[${severityText}] ${this.category.replace('_', ' ').toUpperCase()} in ${modeText} mode: ${this.message}`;
  }

  /**
   * Gets the most appropriate recovery action
   */
  getPrimaryRecoveryAction(): RecoveryAction | null {
    // Prioritize automated actions first, then by estimated time
    const automatedActions = this.recoveryActions.filter(action => action.automated);
    
    if (automatedActions.length > 0) {
      return automatedActions[0];
    }
    
    return this.recoveryActions.length > 0 ? this.recoveryActions[0] : null;
  }

  /**
   * Checks if this error should trigger a mode fallback
   */
  shouldTriggerModeFallback(): boolean {
    return (
      this.retryable &&
      (this.category === ErrorCategory.DATA_CONTEXT ||
       this.category === ErrorCategory.DATABASE_CONNECTION ||
       this.category === ErrorCategory.MODE_DETECTION) &&
      this.context.mode === TestMode.PRODUCTION
    );
  }

  /**
   * Gets the fallback mode for this error
   */
  getFallbackMode(): TestMode {
    if (this.context.mode === TestMode.PRODUCTION) {
      return TestMode.ISOLATED;
    }
    
    // If already in isolated mode, no fallback available
    return this.context.mode;
  }
}