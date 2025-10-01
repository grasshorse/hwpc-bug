import { TestMode, TestDefinition, ModeDetectionResult } from './types';

/**
 * ModeValidator provides validation logic and fallback mechanisms
 * for test mode compatibility and error handling
 */
export class ModeValidator {
  
  /**
   * Validates if a mode is compatible with test requirements and environment
   */
  public static validateMode(
    mode: TestMode, 
    test: TestDefinition, 
    environmentChecks: boolean = true
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check test compatibility
    if (!this.isTestCompatible(mode, test)) {
      errors.push(`Test "${test.name}" does not support ${mode} mode`);
    }

    // Environment-specific validations
    if (environmentChecks) {
      const envValidation = this.validateEnvironment(mode);
      errors.push(...envValidation.errors);
      warnings.push(...envValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendedFallback: this.getRecommendedFallback(mode, test, errors)
    };
  }

  /**
   * Determines the best fallback mode when the primary mode fails
   */
  public static getFallbackMode(
    primaryMode: TestMode, 
    test: TestDefinition, 
    reason: string
  ): FallbackResult {
    const supportedModes = test.supportedModes;

    // If test supports dual mode, try that first
    if (supportedModes.includes(TestMode.DUAL) && primaryMode !== TestMode.DUAL) {
      return {
        mode: TestMode.DUAL,
        reason: `Falling back to dual mode due to: ${reason}`,
        confidence: 0.8
      };
    }

    // Try isolated mode as it's most reliable
    if (supportedModes.includes(TestMode.ISOLATED) && primaryMode !== TestMode.ISOLATED) {
      return {
        mode: TestMode.ISOLATED,
        reason: `Falling back to isolated mode due to: ${reason}`,
        confidence: 0.9
      };
    }

    // Try production mode if available
    if (supportedModes.includes(TestMode.PRODUCTION) && primaryMode !== TestMode.PRODUCTION) {
      return {
        mode: TestMode.PRODUCTION,
        reason: `Falling back to production mode due to: ${reason}`,
        confidence: 0.6
      };
    }

    // No fallback available
    return {
      mode: primaryMode,
      reason: `No suitable fallback mode available for test "${test.name}"`,
      confidence: 0.0
    };
  }

  /**
   * Checks if a test is compatible with a specific mode
   */
  private static isTestCompatible(mode: TestMode, test: TestDefinition): boolean {
    // Dual mode tests are compatible with any mode
    if (test.supportedModes.includes(TestMode.DUAL)) {
      return true;
    }

    // Check explicit mode support
    return test.supportedModes.includes(mode);
  }

  /**
   * Validates environment-specific requirements for a mode
   */
  private static validateEnvironment(mode: TestMode): EnvironmentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (mode) {
      case TestMode.ISOLATED:
        // Check for database backup availability (simulated check)
        if (!process.env.DATABASE_BACKUP_PATH && !process.env.TEST_DATABASE_URL) {
          warnings.push('No database backup path or test database URL configured for isolated mode');
        }
        break;

      case TestMode.PRODUCTION:
        // Check for production environment indicators
        if (process.env.NODE_ENV === 'development') {
          warnings.push('Running production tests in development environment');
        }
        
        if (!process.env.PRODUCTION_TEST_DATA_PREFIX) {
          warnings.push('No production test data prefix configured');
        }
        break;

      case TestMode.DUAL:
        // Dual mode needs both isolated and production capabilities
        const isolatedValidation = this.validateEnvironment(TestMode.ISOLATED);
        const productionValidation = this.validateEnvironment(TestMode.PRODUCTION);
        
        warnings.push(...isolatedValidation.warnings);
        warnings.push(...productionValidation.warnings);
        break;
    }

    return { errors, warnings };
  }

  /**
   * Gets recommended fallback mode based on validation errors
   */
  private static getRecommendedFallback(
    mode: TestMode, 
    test: TestDefinition, 
    errors: string[]
  ): TestMode | null {
    if (errors.length === 0) {
      return null; // No fallback needed
    }

    // If current mode has compatibility issues, try fallback
    const fallbackResult = this.getFallbackMode(mode, test, 'Validation errors detected');
    
    return fallbackResult.confidence > 0 ? fallbackResult.mode : null;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendedFallback: TestMode | null;
}

export interface FallbackResult {
  mode: TestMode;
  reason: string;
  confidence: number;
}

export interface EnvironmentValidation {
  errors: string[];
  warnings: string[];
}