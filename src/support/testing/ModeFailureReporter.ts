/**
 * Mode Failure Reporter
 * 
 * Provides comprehensive error reporting and troubleshooting guidance for test mode failures
 */

import { TestMode, TestContext, ModeDetectionResult } from './types';
import Log from '../logger/Log';

export interface ModeFailureReport {
  testId: string;
  testName: string;
  originalMode: TestMode;
  failedMode: TestMode;
  errorMessage: string;
  errorType: ModeFailureType;
  troubleshootingSteps: string[];
  environmentInfo: EnvironmentInfo;
  timestamp: Date;
  stackTrace?: string;
}

export enum ModeFailureType {
  ENVIRONMENT_CONFIGURATION = 'environment_configuration',
  DATABASE_CONNECTION = 'database_connection',
  PRODUCTION_DATA_MISSING = 'production_data_missing',
  CONTEXT_VALIDATION = 'context_validation',
  FALLBACK_FAILURE = 'fallback_failure',
  UNKNOWN = 'unknown'
}

export interface EnvironmentInfo {
  nodeEnv?: string;
  testMode?: string;
  dbConfig?: string;
  apiBaseUrl?: string;
  hasRequiredEnvVars: boolean;
  missingEnvVars: string[];
}

export class ModeFailureReporter {
  private static readonly REQUIRED_ENV_VARS = [
    'HWPC_API_BASE_URL',
    'DB_CONFIG'
  ];

  /**
   * Creates a comprehensive failure report for mode initialization issues
   */
  public static createFailureReport(
    testContext: TestContext,
    originalMode: TestMode,
    failedMode: TestMode,
    error: Error,
    modeResult?: ModeDetectionResult
  ): ModeFailureReport {
    const errorType = this.classifyError(error, failedMode);
    const environmentInfo = this.collectEnvironmentInfo();
    const troubleshootingSteps = this.generateTroubleshootingSteps(errorType, failedMode, environmentInfo);

    const report: ModeFailureReport = {
      testId: testContext.testId,
      testName: testContext.testName,
      originalMode,
      failedMode,
      errorMessage: error.message,
      errorType,
      troubleshootingSteps,
      environmentInfo,
      timestamp: new Date(),
      stackTrace: error.stack
    };

    // Log the comprehensive report
    this.logFailureReport(report, modeResult);

    return report;
  }

  /**
   * Classifies the error type based on error message and context
   */
  private static classifyError(error: Error, mode: TestMode): ModeFailureType {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('environment') || errorMessage.includes('env') || errorMessage.includes('configuration')) {
      return ModeFailureType.ENVIRONMENT_CONFIGURATION;
    }

    if (errorMessage.includes('database') || errorMessage.includes('connection') || errorMessage.includes('db_config')) {
      return ModeFailureType.DATABASE_CONNECTION;
    }

    if (errorMessage.includes('production') && (errorMessage.includes('data') || errorMessage.includes('looney'))) {
      return ModeFailureType.PRODUCTION_DATA_MISSING;
    }

    if (errorMessage.includes('validation') || errorMessage.includes('context')) {
      return ModeFailureType.CONTEXT_VALIDATION;
    }

    if (errorMessage.includes('fallback') || errorMessage.includes('both') || errorMessage.includes('primary')) {
      return ModeFailureType.FALLBACK_FAILURE;
    }

    return ModeFailureType.UNKNOWN;
  }

  /**
   * Collects comprehensive environment information for debugging
   */
  private static collectEnvironmentInfo(): EnvironmentInfo {
    const missingEnvVars: string[] = [];
    
    this.REQUIRED_ENV_VARS.forEach(envVar => {
      if (!process.env[envVar]) {
        missingEnvVars.push(envVar);
      }
    });

    return {
      nodeEnv: process.env.NODE_ENV,
      testMode: process.env.TEST_MODE,
      dbConfig: process.env.DB_CONFIG ? '[CONFIGURED]' : '[MISSING]',
      apiBaseUrl: process.env.HWPC_API_BASE_URL ? '[CONFIGURED]' : '[MISSING]',
      hasRequiredEnvVars: missingEnvVars.length === 0,
      missingEnvVars
    };
  }

  /**
   * Generates specific troubleshooting steps based on error type and context
   */
  private static generateTroubleshootingSteps(
    errorType: ModeFailureType,
    mode: TestMode,
    envInfo: EnvironmentInfo
  ): string[] {
    const steps: string[] = [];

    switch (errorType) {
      case ModeFailureType.ENVIRONMENT_CONFIGURATION:
        steps.push('🔧 Environment Configuration Issues:');
        if (envInfo.missingEnvVars.length > 0) {
          steps.push(`   • Missing environment variables: ${envInfo.missingEnvVars.join(', ')}`);
          steps.push('   • Add these variables to your .env file or environment');
        }
        break;

      case ModeFailureType.DATABASE_CONNECTION:
        steps.push('🗄️ Database Connection Issues:');
        steps.push('   • Verify database server is running and accessible');
        steps.push('   • Check DB_CONFIG connection string format and credentials');
        break;

      case ModeFailureType.PRODUCTION_DATA_MISSING:
        steps.push('🏭 Production Test Data Issues:');
        steps.push('   • Run data setup script to create looneyTunesTest entities');
        steps.push('   • Verify looneyTunesTest customers exist in production database');
        break;

      case ModeFailureType.CONTEXT_VALIDATION:
        steps.push('✅ Context Validation Issues:');
        steps.push('   • Check that test data was loaded correctly');
        steps.push('   • Verify database schema matches expected structure');
        break;

      case ModeFailureType.FALLBACK_FAILURE:
        steps.push('🔄 Fallback Mechanism Issues:');
        steps.push('   • Both primary and fallback modes failed to initialize');
        steps.push('   • Check isolated mode database backup files exist');
        break;

      default:
        steps.push('❓ General Troubleshooting:');
        steps.push('   • Check application logs for additional error details');
        steps.push('   • Verify all required services are running');
        break;
    }

    return steps;
  }

  /**
   * Logs the comprehensive failure report
   */
  private static logFailureReport(report: ModeFailureReport, modeResult?: ModeDetectionResult): void {
    Log.error('');
    Log.error('═══════════════════════════════════════════════════════════════');
    Log.error('🚨 TEST MODE INITIALIZATION FAILURE REPORT');
    Log.error('═══════════════════════════════════════════════════════════════');
    Log.error(`Test: ${report.testName} (ID: ${report.testId})`);
    Log.error(`Timestamp: ${report.timestamp.toISOString()}`);
    Log.error(`Original Mode: ${report.originalMode}`);
    Log.error(`Failed Mode: ${report.failedMode}`);
    Log.error(`Error Type: ${report.errorType}`);
    Log.error(`Error Message: ${report.errorMessage}`);
    
    if (modeResult) {
      Log.error('');
      Log.error('📊 Mode Detection Details:');
      Log.error(`   Detected Mode: ${modeResult.mode}`);
      Log.error(`   Confidence: ${modeResult.confidence}`);
      Log.error(`   Source: ${modeResult.source}`);
      if (modeResult.fallbackReason) {
        Log.error(`   Fallback Reason: ${modeResult.fallbackReason}`);
      }
    }

    Log.error('');
    Log.error('🌍 Environment Information:');
    Log.error(`   NODE_ENV: ${report.environmentInfo.nodeEnv || '[NOT SET]'}`);
    Log.error(`   TEST_MODE: ${report.environmentInfo.testMode || '[NOT SET]'}`);
    Log.error(`   DB_CONFIG: ${report.environmentInfo.dbConfig}`);
    Log.error(`   HWPC_API_BASE_URL: ${report.environmentInfo.apiBaseUrl}`);
    
    Log.error('');
    Log.error('🔧 TROUBLESHOOTING STEPS:');
    report.troubleshootingSteps.forEach(step => {
      Log.error(step);
    });

    if (report.stackTrace) {
      Log.error('');
      Log.error('📚 Stack Trace:');
      Log.error(report.stackTrace);
    }

    Log.error('═══════════════════════════════════════════════════════════════');
    Log.error('');
  }
}