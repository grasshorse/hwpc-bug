/**
 * Error Reporter
 * 
 * Provides comprehensive error reporting with recovery suggestions,
 * context information, and integration with various reporting systems.
 */

import { TestError, ErrorCategory, ErrorSeverity } from './TestError';
import { RecoveryResult } from './ErrorRecoveryManager';
import { TestMode } from '../types';

export interface ReportingConfig {
  enableConsoleReporting: boolean;
  enableFileReporting: boolean;
  enableJsonReporting: boolean;
  reportingLevel: ErrorSeverity;
  includeStackTrace: boolean;
  includeEnvironment: boolean;
  includeRecoveryActions: boolean;
  outputDirectory?: string;
  maxReportSize: number;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: TestError;
  recoveryResult?: RecoveryResult;
  reportLevel: ErrorSeverity;
  formattedMessage: string;
  recommendations: string[];
  relatedErrors: TestError[];
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByMode: Record<TestMode, number>;
  recoverySuccessRate: number;
  mostCommonErrors: Array<{ error: string; count: number }>;
  timeRange: { start: Date; end: Date };
}

/**
 * Comprehensive error reporting system for dual-mode testing
 */
export class ErrorReporter {
  private readonly config: ReportingConfig;
  private readonly reports: Map<string, ErrorReport> = new Map();
  private readonly errorPatterns: Map<string, TestError[]> = new Map();

  constructor(config?: Partial<ReportingConfig>) {
    this.config = {
      enableConsoleReporting: true,
      enableFileReporting: false,
      enableJsonReporting: true,
      reportingLevel: ErrorSeverity.LOW,
      includeStackTrace: true,
      includeEnvironment: true,
      includeRecoveryActions: true,
      maxReportSize: 1000,
      ...config
    };
  }

  /**
   * Reports an error with comprehensive context and recovery information
   */
  async reportError(
    error: TestError,
    recoveryResult?: RecoveryResult
  ): Promise<string> {
    const reportId = this.generateReportId();
    
    const report: ErrorReport = {
      id: reportId,
      timestamp: new Date(),
      error,
      recoveryResult,
      reportLevel: error.severity,
      formattedMessage: this.formatErrorMessage(error),
      recommendations: this.generateRecommendations(error, recoveryResult),
      relatedErrors: this.findRelatedErrors(error)
    };

    // Store the report
    this.reports.set(reportId, report);
    this.trackErrorPattern(error);

    // Report through configured channels
    if (this.shouldReport(error.severity)) {
      await this.outputReport(report);
    }

    return reportId;
  }

  /**
   * Formats error message with context and recovery information
   */
  private formatErrorMessage(error: TestError): string {
    const lines: string[] = [];
    
    // Header
    lines.push('='.repeat(80));
    lines.push(`DUAL-MODE TEST ERROR REPORT`);
    lines.push('='.repeat(80));
    
    // Basic error information
    lines.push(`Error: ${error.message}`);
    lines.push(`Category: ${error.category.replace('_', ' ').toUpperCase()}`);
    lines.push(`Severity: ${error.severity.toUpperCase()}`);
    lines.push(`Mode: ${error.context.mode.toUpperCase()}`);
    lines.push(`Test: ${error.context.testName} (${error.context.testId})`);
    lines.push(`Timestamp: ${error.context.timestamp.toISOString()}`);
    lines.push('');

    // Context information
    if (this.config.includeEnvironment && error.context.environment) {
      lines.push('Environment:');
      Object.entries(error.context.environment).forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`);
      });
      lines.push('');
    }

    // Additional context
    if (error.context.additionalInfo) {
      lines.push('Additional Context:');
      Object.entries(error.context.additionalInfo).forEach(([key, value]) => {
        lines.push(`  ${key}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`);
      });
      lines.push('');
    }

    // Data context information
    if (error.context.dataContext) {
      lines.push('Data Context:');
      lines.push(`  Mode: ${error.context.dataContext.mode}`);
      lines.push(`  Customers: ${error.context.dataContext.testData?.customers?.length || 0}`);
      lines.push(`  Routes: ${error.context.dataContext.testData?.routes?.length || 0}`);
      lines.push(`  Tickets: ${error.context.dataContext.testData?.tickets?.length || 0}`);
      lines.push(`  Connection: ${error.context.dataContext.connectionInfo?.host || 'unknown'}`);
      lines.push('');
    }

    // Recovery actions
    if (this.config.includeRecoveryActions && error.recoveryActions.length > 0) {
      lines.push('Available Recovery Actions:');
      error.recoveryActions.forEach((action, index) => {
        lines.push(`  ${index + 1}. ${action.description}`);
        lines.push(`     Action: ${action.action}`);
        lines.push(`     Automated: ${action.automated ? 'Yes' : 'No'}`);
        if (action.estimatedTime) {
          lines.push(`     Estimated Time: ${action.estimatedTime}`);
        }
        if (action.prerequisites && action.prerequisites.length > 0) {
          lines.push(`     Prerequisites: ${action.prerequisites.join(', ')}`);
        }
        lines.push('');
      });
    }

    // Stack trace
    if (this.config.includeStackTrace && (error.stack || error.context.stackTrace)) {
      lines.push('Stack Trace:');
      lines.push(error.stack || error.context.stackTrace || 'No stack trace available');
      lines.push('');
    }

    // Original error
    if (error.originalError) {
      lines.push('Original Error:');
      lines.push(`  Name: ${error.originalError.name}`);
      lines.push(`  Message: ${error.originalError.message}`);
      if (error.originalError.stack) {
        lines.push('  Stack:');
        lines.push(error.originalError.stack.split('\n').map(line => `    ${line}`).join('\n'));
      }
      lines.push('');
    }

    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }

  /**
   * Generates recommendations based on error and recovery result
   */
  private generateRecommendations(
    error: TestError,
    recoveryResult?: RecoveryResult
  ): string[] {
    const recommendations: string[] = [];

    // Recovery-specific recommendations
    if (recoveryResult) {
      if (recoveryResult.success) {
        recommendations.push(`✅ Error was successfully recovered using: ${recoveryResult.recoveryActions.join(', ')}`);
        if (recoveryResult.finalMode && recoveryResult.finalMode !== error.context.mode) {
          recommendations.push(`ℹ️  Test continued in ${recoveryResult.finalMode} mode instead of ${error.context.mode}`);
        }
      } else {
        recommendations.push(`❌ Recovery failed after ${recoveryResult.attemptsUsed} attempts`);
        if (recoveryResult.warnings.length > 0) {
          recommendations.push(`⚠️  Recovery warnings: ${recoveryResult.warnings.join('; ')}`);
        }
      }
    }

    // Category-specific recommendations
    switch (error.category) {
      case ErrorCategory.MODE_DETECTION:
        recommendations.push('🔧 Set TEST_MODE environment variable explicitly (isolated, production, or dual)');
        recommendations.push('🏷️  Add mode tags (@isolated, @production, @dual) to your test scenarios');
        break;

      case ErrorCategory.DATA_CONTEXT:
        recommendations.push('🔍 Verify database connectivity and permissions');
        recommendations.push('📊 Check if test data exists and is accessible');
        if (error.context.mode === TestMode.PRODUCTION) {
          recommendations.push('🔄 Consider falling back to isolated mode for this test');
        }
        break;

      case ErrorCategory.DATABASE_CONNECTION:
        recommendations.push('🌐 Check network connectivity to database host');
        recommendations.push('🔑 Verify database credentials and connection string');
        recommendations.push('🔧 Ensure database service is running and accessible');
        break;

      case ErrorCategory.NETWORK:
        recommendations.push('🌐 Check network connectivity and DNS resolution');
        recommendations.push('⏱️  Consider increasing network timeout values');
        recommendations.push('🔄 Retry the operation after a brief delay');
        break;

      case ErrorCategory.TEST_EXECUTION:
        recommendations.push('🔍 Review test data setup and validation');
        recommendations.push('🔄 Try refreshing test data and retrying');
        if (error.context.mode === TestMode.PRODUCTION) {
          recommendations.push('🧪 Consider running in isolated mode to isolate the issue');
        }
        break;

      case ErrorCategory.CLEANUP:
        recommendations.push('🧹 Manually verify and clean up test resources');
        recommendations.push('📝 Check cleanup logs for additional details');
        recommendations.push('⚠️  Monitor for resource leaks in subsequent tests');
        break;
    }

    // Severity-specific recommendations
    if (error.severity === ErrorSeverity.CRITICAL) {
      recommendations.push('🚨 This is a critical error - consider stopping test execution');
      recommendations.push('👥 Notify the development team immediately');
    } else if (error.severity === ErrorSeverity.HIGH) {
      recommendations.push('⚠️  This error may affect test reliability - investigate promptly');
    }

    // Mode-specific recommendations
    if (error.context.mode === TestMode.PRODUCTION && error.retryable) {
      recommendations.push('🔄 Consider automatic fallback to isolated mode');
    }

    // Pattern-based recommendations
    const similarErrors = this.findRelatedErrors(error);
    if (similarErrors.length > 2) {
      recommendations.push(`🔍 This error has occurred ${similarErrors.length} times - investigate root cause`);
    }

    return recommendations;
  }

  /**
   * Finds related errors based on patterns
   */
  private findRelatedErrors(error: TestError): TestError[] {
    const pattern = `${error.category}:${error.context.mode}`;
    return this.errorPatterns.get(pattern) || [];
  }

  /**
   * Tracks error patterns for analysis
   */
  private trackErrorPattern(error: TestError): void {
    const pattern = `${error.category}:${error.context.mode}`;
    
    if (!this.errorPatterns.has(pattern)) {
      this.errorPatterns.set(pattern, []);
    }
    
    const errors = this.errorPatterns.get(pattern)!;
    errors.push(error);
    
    // Keep only recent errors (last 50)
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
  }

  /**
   * Outputs report through configured channels
   */
  private async outputReport(report: ErrorReport): Promise<void> {
    if (this.config.enableConsoleReporting) {
      await this.outputToConsole(report);
    }

    if (this.config.enableJsonReporting) {
      await this.outputToJson(report);
    }

    if (this.config.enableFileReporting && this.config.outputDirectory) {
      await this.outputToFile(report);
    }
  }

  /**
   * Outputs report to console
   */
  private async outputToConsole(report: ErrorReport): Promise<void> {
    const severity = report.error.severity;
    
    // Use appropriate console method based on severity
    const logMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH 
      ? console.error 
      : severity === ErrorSeverity.MEDIUM 
        ? console.warn 
        : console.log;

    logMethod('\n' + report.formattedMessage);

    // Output recommendations
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    // Output recovery information
    if (report.recoveryResult) {
      console.log('\nRecovery Information:');
      console.log(`  Success: ${report.recoveryResult.success ? '✅' : '❌'}`);
      console.log(`  Attempts: ${report.recoveryResult.attemptsUsed}`);
      if (report.recoveryResult.recoveryActions.length > 0) {
        console.log(`  Actions: ${report.recoveryResult.recoveryActions.join(', ')}`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Outputs report to JSON format
   */
  private async outputToJson(report: ErrorReport): Promise<void> {
    const jsonReport = {
      id: report.id,
      timestamp: report.timestamp.toISOString(),
      error: {
        message: report.error.message,
        category: report.error.category,
        severity: report.error.severity,
        retryable: report.error.retryable,
        cleanupRequired: report.error.cleanupRequired,
        context: report.error.context,
        recoveryActions: report.error.recoveryActions
      },
      recoveryResult: report.recoveryResult,
      recommendations: report.recommendations,
      relatedErrorsCount: report.relatedErrors.length
    };

    // In real implementation, would write to file or send to logging service
    console.log('JSON Report:', JSON.stringify(jsonReport, null, 2));
  }

  /**
   * Outputs report to file
   */
  private async outputToFile(report: ErrorReport): Promise<void> {
    // In real implementation, would write to file system
    const filename = `error-report-${report.id}-${report.timestamp.toISOString().replace(/[:.]/g, '-')}.txt`;
    console.log(`Would write error report to: ${this.config.outputDirectory}/${filename}`);
  }

  /**
   * Checks if error should be reported based on severity level
   */
  private shouldReport(severity: ErrorSeverity): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3
    };

    return severityLevels[severity] >= severityLevels[this.config.reportingLevel];
  }

  /**
   * Generates unique report ID
   */
  private generateReportId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets error summary statistics
   */
  getErrorSummary(timeRange?: { start: Date; end: Date }): ErrorSummary {
    const reports = Array.from(this.reports.values());
    const filteredReports = timeRange 
      ? reports.filter(r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end)
      : reports;

    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    const errorsByMode: Record<TestMode, number> = {} as any;
    const errorCounts = new Map<string, number>();

    let successfulRecoveries = 0;
    let totalRecoveries = 0;

    filteredReports.forEach(report => {
      const error = report.error;
      
      // Count by category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Count by mode
      errorsByMode[error.context.mode] = (errorsByMode[error.context.mode] || 0) + 1;
      
      // Count error messages
      const errorKey = `${error.category}: ${error.message}`;
      errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
      
      // Recovery statistics
      if (report.recoveryResult) {
        totalRecoveries++;
        if (report.recoveryResult.success) {
          successfulRecoveries++;
        }
      }
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    const recoverySuccessRate = totalRecoveries > 0 ? successfulRecoveries / totalRecoveries : 0;

    const actualTimeRange = filteredReports.length > 0 
      ? {
          start: new Date(Math.min(...filteredReports.map(r => r.timestamp.getTime()))),
          end: new Date(Math.max(...filteredReports.map(r => r.timestamp.getTime())))
        }
      : { start: new Date(), end: new Date() };

    return {
      totalErrors: filteredReports.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByMode,
      recoverySuccessRate,
      mostCommonErrors,
      timeRange: actualTimeRange
    };
  }

  /**
   * Gets all error reports
   */
  getAllReports(): ErrorReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Gets a specific error report
   */
  getReport(reportId: string): ErrorReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Clears all error reports
   */
  clearReports(): void {
    this.reports.clear();
    this.errorPatterns.clear();
  }

  /**
   * Exports error reports to JSON
   */
  exportReports(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalReports: this.reports.size,
      reports: Array.from(this.reports.values()),
      summary: this.getErrorSummary()
    };

    return JSON.stringify(exportData, null, 2);
  }
}