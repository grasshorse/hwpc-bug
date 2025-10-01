/**
 * Unit tests for TestError class
 */

import { TestError, ErrorCategory, ErrorSeverity, ErrorContext } from '../TestError';
import { TestMode } from '../../types';

describe('TestError', () => {
  const mockErrorContext: ErrorContext = {
    testId: 'test-123',
    testName: 'Sample Test',
    mode: TestMode.ISOLATED,
    timestamp: new Date('2025-01-01T00:00:00Z'),
    environment: {
      NODE_ENV: 'test',
      TEST_MODE: 'isolated'
    }
  };

  describe('constructor', () => {
    it('should create a TestError with all required properties', () => {
      const error = new TestError(
        'Test error message',
        ErrorCategory.TEST_EXECUTION,
        ErrorSeverity.MEDIUM,
        mockErrorContext
      );

      expect(error.name).toBe('TestError');
      expect(error.message).toBe('Test error message');
      expect(error.category).toBe(ErrorCategory.TEST_EXECUTION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context).toEqual(mockErrorContext);
      expect(error.recoveryActions).toEqual([]);
      expect(error.cleanupRequired).toBe(false);
      expect(error.retryable).toBe(false);
    });

    it('should create a TestError with optional properties', () => {
      const recoveryActions = [
        {
          action: 'retry',
          description: 'Retry the operation',
          automated: true
        }
      ];

      const originalError = new Error('Original error');

      const error = new TestError(
        'Test error message',
        ErrorCategory.DATABASE_CONNECTION,
        ErrorSeverity.HIGH,
        mockErrorContext,
        {
          recoveryActions,
          cleanupRequired: true,
          retryable: true,
          originalError
        }
      );

      expect(error.recoveryActions).toEqual(recoveryActions);
      expect(error.cleanupRequired).toBe(true);
      expect(error.retryable).toBe(true);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('static factory methods', () => {
    describe('modeDetectionError', () => {
      it('should create a mode detection error with appropriate properties', () => {
        const environment = { NODE_ENV: 'test' };
        const originalError = new Error('Mode detection failed');

        const error = TestError.modeDetectionError(
          'Failed to detect test mode',
          'test-123',
          'Mode Detection Test',
          environment,
          originalError
        );

        expect(error.category).toBe(ErrorCategory.MODE_DETECTION);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context.testId).toBe('test-123');
        expect(error.context.testName).toBe('Mode Detection Test');
        expect(error.context.mode).toBe(TestMode.ISOLATED);
        expect(error.retryable).toBe(true);
        expect(error.originalError).toBe(originalError);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });

    describe('dataContextError', () => {
      it('should create a data context error with appropriate properties', () => {
        const error = TestError.dataContextError(
          'Failed to setup data context',
          'test-123',
          'Data Context Test',
          TestMode.PRODUCTION
        );

        expect(error.category).toBe(ErrorCategory.DATA_CONTEXT);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.context.mode).toBe(TestMode.PRODUCTION);
        expect(error.cleanupRequired).toBe(true);
        expect(error.retryable).toBe(true);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });

    describe('databaseConnectionError', () => {
      it('should create a database connection error with appropriate properties', () => {
        const connectionInfo = { host: 'localhost', database: 'test_db' };

        const error = TestError.databaseConnectionError(
          'Database connection failed',
          'test-123',
          'Database Test',
          TestMode.ISOLATED,
          connectionInfo
        );

        expect(error.category).toBe(ErrorCategory.DATABASE_CONNECTION);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.context.additionalInfo?.connectionInfo).toEqual({
          host: 'localhost',
          database: 'test_db',
          isTestConnection: false
        });
        expect(error.retryable).toBe(true);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });

    describe('testExecutionError', () => {
      it('should create a test execution error with appropriate properties', () => {
        const error = TestError.testExecutionError(
          'Test execution failed',
          'test-123',
          'Execution Test',
          TestMode.DUAL
        );

        expect(error.category).toBe(ErrorCategory.TEST_EXECUTION);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context.mode).toBe(TestMode.DUAL);
        expect(error.cleanupRequired).toBe(true);
        expect(error.retryable).toBe(true);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });

    describe('networkError', () => {
      it('should create a network error with appropriate properties', () => {
        const endpoint = 'https://api.example.com/test';

        const error = TestError.networkError(
          'Network request failed',
          'test-123',
          'Network Test',
          TestMode.PRODUCTION,
          endpoint
        );

        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context.additionalInfo?.endpoint).toBe(endpoint);
        expect(error.retryable).toBe(true);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });

    describe('cleanupError', () => {
      it('should create a cleanup error with appropriate properties', () => {
        const error = TestError.cleanupError(
          'Cleanup failed',
          'test-123',
          'Cleanup Test',
          TestMode.ISOLATED
        );

        expect(error.category).toBe(ErrorCategory.CLEANUP);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.cleanupRequired).toBe(false); // Already attempting cleanup
        expect(error.retryable).toBe(true);
        expect(error.recoveryActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('instance methods', () => {
    let testError: TestError;

    beforeEach(() => {
      testError = new TestError(
        'Test error message',
        ErrorCategory.TEST_EXECUTION,
        ErrorSeverity.MEDIUM,
        mockErrorContext,
        {
          recoveryActions: [
            {
              action: 'retry',
              description: 'Retry the operation',
              automated: true,
              estimatedTime: '30 seconds'
            },
            {
              action: 'manual_fix',
              description: 'Manually fix the issue',
              automated: false,
              estimatedTime: '5 minutes'
            }
          ],
          retryable: true
        }
      );
    });

    describe('toLogFormat', () => {
      it('should return properly formatted JSON log', () => {
        const logFormat = testError.toLogFormat();
        const parsed = JSON.parse(logFormat);

        expect(parsed.error.name).toBe('TestError');
        expect(parsed.error.message).toBe('Test error message');
        expect(parsed.error.category).toBe(ErrorCategory.TEST_EXECUTION);
        expect(parsed.error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(parsed.context.testId).toBe('test-123');
        expect(parsed.context.testName).toBe('Sample Test');
        expect(parsed.recoveryActions).toHaveLength(2);
      });
    });

    describe('getSummary', () => {
      it('should return a human-readable summary', () => {
        const summary = testError.getSummary();
        
        expect(summary).toContain('MEDIUM');
        expect(summary).toContain('TEST EXECUTION');
        expect(summary).toContain('ISOLATED');
        expect(summary).toContain('Test error message');
      });
    });

    describe('getPrimaryRecoveryAction', () => {
      it('should return the first automated recovery action', () => {
        const primaryAction = testError.getPrimaryRecoveryAction();
        
        expect(primaryAction).not.toBeNull();
        expect(primaryAction?.action).toBe('retry');
        expect(primaryAction?.automated).toBe(true);
      });

      it('should return the first action if no automated actions exist', () => {
        const errorWithoutAutomated = new TestError(
          'Test error',
          ErrorCategory.TEST_EXECUTION,
          ErrorSeverity.MEDIUM,
          mockErrorContext,
          {
            recoveryActions: [
              {
                action: 'manual_fix',
                description: 'Manually fix the issue',
                automated: false
              }
            ]
          }
        );

        const primaryAction = errorWithoutAutomated.getPrimaryRecoveryAction();
        
        expect(primaryAction).not.toBeNull();
        expect(primaryAction?.action).toBe('manual_fix');
        expect(primaryAction?.automated).toBe(false);
      });

      it('should return null if no recovery actions exist', () => {
        const errorWithoutActions = new TestError(
          'Test error',
          ErrorCategory.TEST_EXECUTION,
          ErrorSeverity.MEDIUM,
          mockErrorContext
        );

        const primaryAction = errorWithoutActions.getPrimaryRecoveryAction();
        
        expect(primaryAction).toBeNull();
      });
    });

    describe('shouldTriggerModeFallback', () => {
      it('should return true for retryable production mode errors in appropriate categories', () => {
        const productionError = new TestError(
          'Data context error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.PRODUCTION },
          { retryable: true }
        );

        expect(productionError.shouldTriggerModeFallback()).toBe(true);
      });

      it('should return false for isolated mode errors', () => {
        const isolatedError = new TestError(
          'Data context error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.ISOLATED },
          { retryable: true }
        );

        expect(isolatedError.shouldTriggerModeFallback()).toBe(false);
      });

      it('should return false for non-retryable errors', () => {
        const nonRetryableError = new TestError(
          'Data context error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.PRODUCTION },
          { retryable: false }
        );

        expect(nonRetryableError.shouldTriggerModeFallback()).toBe(false);
      });

      it('should return false for inappropriate error categories', () => {
        const validationError = new TestError(
          'Validation error',
          ErrorCategory.VALIDATION,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.PRODUCTION },
          { retryable: true }
        );

        expect(validationError.shouldTriggerModeFallback()).toBe(false);
      });
    });

    describe('getFallbackMode', () => {
      it('should return isolated mode for production mode errors', () => {
        const productionError = new TestError(
          'Production error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.PRODUCTION }
        );

        expect(productionError.getFallbackMode()).toBe(TestMode.ISOLATED);
      });

      it('should return the same mode for isolated mode errors', () => {
        const isolatedError = new TestError(
          'Isolated error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.ISOLATED }
        );

        expect(isolatedError.getFallbackMode()).toBe(TestMode.ISOLATED);
      });

      it('should return the same mode for dual mode errors', () => {
        const dualError = new TestError(
          'Dual error',
          ErrorCategory.DATA_CONTEXT,
          ErrorSeverity.HIGH,
          { ...mockErrorContext, mode: TestMode.DUAL }
        );

        expect(dualError.getFallbackMode()).toBe(TestMode.DUAL);
      });
    });
  });

  describe('error chaining', () => {
    it('should preserve original error information', () => {
      const originalError = new Error('Original error message');
      originalError.stack = 'Original stack trace';

      const testError = new TestError(
        'Wrapped error message',
        ErrorCategory.TEST_EXECUTION,
        ErrorSeverity.MEDIUM,
        mockErrorContext,
        { originalError }
      );

      expect(testError.originalError).toBe(originalError);
      expect(testError.context.stackTrace).toBe('Original stack trace');
    });

    it('should support error cause chaining', () => {
      const causeError = new Error('Cause error');
      
      const testError = new TestError(
        'Main error',
        ErrorCategory.TEST_EXECUTION,
        ErrorSeverity.MEDIUM,
        mockErrorContext,
        { cause: causeError }
      );

      expect(testError.cause).toBe(causeError);
    });
  });
});