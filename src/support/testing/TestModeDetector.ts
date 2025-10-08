import { TestMode, TestContext, TestDefinition, ModeDetectionResult, TestConfig } from './types';
import Log from '../logger/Log';

/**
 * Enhanced TestModeDetector with robust mode detection, validation, and fallback mechanisms
 */
export class TestModeDetector {
  private static readonly ENV_VAR_TEST_MODE = 'TEST_MODE';
  private static readonly ENV_VAR_NODE_ENV = 'NODE_ENV';
  private static readonly ENV_VAR_DB_CONFIG = 'DB_CONFIG';
  private static readonly ENV_VAR_HWPC_API_BASE_URL = 'HWPC_API_BASE_URL';
  private static readonly DEFAULT_MODE = TestMode.ISOLATED;
  
  private static readonly TAG_ISOLATED = '@isolated';
  private static readonly TAG_PRODUCTION = '@production';
  private static readonly TAG_DUAL = '@dual';

  /**
   * Enhanced mode detection with validation and fallback mechanisms
   */
  public detectMode(testContext: TestContext): ModeDetectionResult {
    Log.info(`[TestModeDetector] Starting mode detection for test: ${testContext.testName}`);
    
    try {
      // First, check environment variables with validation
      const envMode = this.detectModeFromEnvironment();
      Log.info(`[TestModeDetector] Environment mode detection: ${envMode.mode} (confidence: ${envMode.confidence})`);
      
      // Then check test tags
      const tagMode = this.detectModeFromTags(testContext.tags);
      Log.info(`[TestModeDetector] Tag mode detection: ${tagMode.mode} (confidence: ${tagMode.confidence})`);

      // Validate environment configuration for detected modes
      const validationResult = this.validateEnvironmentConfiguration(envMode.mode);
      if (!validationResult.isValid && envMode.confidence > 0.5) {
        Log.info(`[TestModeDetector] WARNING: Environment mode ${envMode.mode} failed validation: ${validationResult.issues?.join(', ')}`);
        // Reduce confidence for invalid environment configuration
        envMode.confidence = Math.max(0.1, envMode.confidence - 0.5);
        envMode.fallbackReason = `Environment validation failed: ${validationResult.issues?.join(', ')}`;
      }

      // Choose the result with higher confidence, with validation consideration
      let selectedMode: ModeDetectionResult;
      if (tagMode.confidence > envMode.confidence) {
        selectedMode = tagMode;
        Log.info(`[TestModeDetector] Selected tag-based mode: ${tagMode.mode}`);
      } else if (envMode.confidence > tagMode.confidence) {
        selectedMode = envMode;
        Log.info(`[TestModeDetector] Selected environment-based mode: ${envMode.mode}`);
      } else {
        // If confidence is equal, prioritize tags over environment
        if (tagMode.confidence >= 0.5) {
          selectedMode = tagMode;
          Log.info(`[TestModeDetector] Selected tag-based mode (equal confidence): ${tagMode.mode}`);
        } else if (envMode.confidence >= 0.5) {
          selectedMode = envMode;
          Log.info(`[TestModeDetector] Selected environment-based mode (equal confidence): ${envMode.mode}`);
        } else {
          // Both have low confidence, use default with comprehensive fallback reason
          selectedMode = {
            mode: TestModeDetector.DEFAULT_MODE,
            confidence: 1.0,
            source: 'default',
            fallbackReason: `Low confidence in both environment (${envMode.confidence}) and tag (${tagMode.confidence}) detection. Using default isolated mode.`
          };
          Log.info(`[TestModeDetector] Using default mode due to low confidence in all detection methods`);
        }
      }

      // Final validation of selected mode
      const finalValidation = this.validateModeConfiguration(selectedMode.mode, testContext);
      if (!finalValidation.isValid) {
        Log.info(`[TestModeDetector] WARNING: Selected mode ${selectedMode.mode} failed final validation, falling back to isolated mode`);
        selectedMode = {
          mode: TestModeDetector.DEFAULT_MODE,
          confidence: 1.0,
          source: 'fallback',
          fallbackReason: `Selected mode validation failed: ${finalValidation.issues?.join(', ')}. Falling back to isolated mode.`
        };
      }

      Log.info(`[TestModeDetector] Final mode selection: ${selectedMode.mode} (source: ${selectedMode.source})`);
      return selectedMode;

    } catch (error) {
      Log.error(`[TestModeDetector] Error during mode detection: ${error.message}`);
      return {
        mode: TestModeDetector.DEFAULT_MODE,
        confidence: 1.0,
        source: 'error-fallback',
        fallbackReason: `Mode detection failed with error: ${error.message}. Using default isolated mode.`
      };
    }
  }

  /**
   * Validates if the detected mode is compatible with the test requirements
   */
  public validateModeCompatibility(mode: TestMode, test: TestDefinition): boolean {
    // If test supports dual mode, it's compatible with any mode
    if (test.supportedModes.includes(TestMode.DUAL)) {
      return true;
    }

    // Check if the detected mode is explicitly supported
    return test.supportedModes.includes(mode);
  }

  /**
   * Returns the default testing mode
   */
  public getDefaultMode(): TestMode {
    return TestModeDetector.DEFAULT_MODE;
  }

  /**
   * Detects mode from environment variables
   */
  private detectModeFromEnvironment(): ModeDetectionResult {
    const testModeEnv = process.env[TestModeDetector.ENV_VAR_TEST_MODE];
    const nodeEnv = process.env[TestModeDetector.ENV_VAR_NODE_ENV];

    // Check explicit TEST_MODE environment variable
    if (testModeEnv) {
      const normalizedMode = testModeEnv.toLowerCase();
      
      switch (normalizedMode) {
        case 'isolated':
          return {
            mode: TestMode.ISOLATED,
            confidence: 1.0,
            source: 'environment'
          };
        case 'production':
          return {
            mode: TestMode.PRODUCTION,
            confidence: 1.0,
            source: 'environment'
          };
        case 'dual':
          return {
            mode: TestMode.DUAL,
            confidence: 1.0,
            source: 'environment'
          };
        default:
          return {
            mode: TestModeDetector.DEFAULT_MODE,
            confidence: 0.3,
            source: 'environment',
            fallbackReason: `Invalid TEST_MODE value: ${testModeEnv}, falling back to default`
          };
      }
    }

    // Infer from NODE_ENV
    if (nodeEnv) {
      const normalizedNodeEnv = nodeEnv.toLowerCase();
      
      if (normalizedNodeEnv === 'production' || normalizedNodeEnv === 'prod') {
        return {
          mode: TestMode.PRODUCTION,
          confidence: 0.7,
          source: 'environment'
        };
      }
      
      if (normalizedNodeEnv === 'test' || normalizedNodeEnv === 'testing') {
        return {
          mode: TestMode.ISOLATED,
          confidence: 0.6,
          source: 'environment'
        };
      }
    }

    // No clear environment indication
    return {
      mode: TestModeDetector.DEFAULT_MODE,
      confidence: 0.1,
      source: 'environment',
      fallbackReason: 'No relevant environment variables found'
    };
  }

  /**
   * Detects mode from test tags
   */
  private detectModeFromTags(tags: string[]): ModeDetectionResult {
    const normalizedTags = tags.map(tag => tag.toLowerCase());

    // Check for explicit mode tags
    if (normalizedTags.includes(TestModeDetector.TAG_ISOLATED.toLowerCase())) {
      return {
        mode: TestMode.ISOLATED,
        confidence: 1.1,
        source: 'tags'
      };
    }

    if (normalizedTags.includes(TestModeDetector.TAG_PRODUCTION.toLowerCase())) {
      return {
        mode: TestMode.PRODUCTION,
        confidence: 1.1,
        source: 'tags'
      };
    }

    if (normalizedTags.includes(TestModeDetector.TAG_DUAL.toLowerCase())) {
      return {
        mode: TestMode.DUAL,
        confidence: 1.1,
        source: 'tags'
      };
    }

    // Check for implicit indicators
    const hasApiTag = normalizedTags.some(tag => tag.includes('api'));
    const hasNavigationTag = normalizedTags.some(tag => tag.includes('navigation'));
    const hasIntegrationTag = normalizedTags.some(tag => tag.includes('integration'));

    if (hasApiTag || hasIntegrationTag) {
      return {
        mode: TestMode.DUAL,
        confidence: 0.4,
        source: 'tags',
        fallbackReason: 'API/Integration tests typically benefit from dual mode'
      };
    }

    if (hasNavigationTag) {
      return {
        mode: TestMode.ISOLATED,
        confidence: 0.3,
        source: 'tags',
        fallbackReason: 'Navigation tests often work well with isolated data'
      };
    }

    // No clear tag indication
    return {
      mode: TestModeDetector.DEFAULT_MODE,
      confidence: 0.1,
      source: 'tags',
      fallbackReason: 'No mode-specific tags found'
    };
  }

  /**
   * Validates environment configuration for a specific test mode
   */
  public validateEnvironmentConfiguration(mode: TestMode): { isValid: boolean; issues?: string[] } {
    const issues: string[] = [];

    try {
      switch (mode) {
        case TestMode.PRODUCTION:
          // Validate production-specific environment variables
          if (!process.env[TestModeDetector.ENV_VAR_HWPC_API_BASE_URL]) {
            issues.push('HWPC_API_BASE_URL environment variable is required for production mode');
          }
          
          if (!process.env[TestModeDetector.ENV_VAR_DB_CONFIG]) {
            issues.push('DB_CONFIG environment variable is required for production mode');
          } else {
            // Validate DB_CONFIG format
            const dbConfig = process.env[TestModeDetector.ENV_VAR_DB_CONFIG];
            if (!this.isValidDatabaseConnectionString(dbConfig)) {
              issues.push('DB_CONFIG environment variable has invalid format');
            }
          }
          break;

        case TestMode.ISOLATED:
          // Validate isolated mode requirements (less strict)
          if (!process.env[TestModeDetector.ENV_VAR_HWPC_API_BASE_URL]) {
            // For isolated mode, we can use localhost as fallback
            Log.info('[TestModeDetector] HWPC_API_BASE_URL not set, will use localhost fallback for isolated mode');
          }
          break;

        case TestMode.DUAL:
          // Dual mode needs both production and isolated capabilities
          const prodValidation = this.validateEnvironmentConfiguration(TestMode.PRODUCTION);
          const isolatedValidation = this.validateEnvironmentConfiguration(TestMode.ISOLATED);
          
          if (!prodValidation.isValid) {
            issues.push(`Dual mode production validation failed: ${prodValidation.issues?.join(', ')}`);
          }
          if (!isolatedValidation.isValid) {
            issues.push(`Dual mode isolated validation failed: ${isolatedValidation.issues?.join(', ')}`);
          }
          break;
      }

      return {
        isValid: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
      };

    } catch (error) {
      issues.push(`Environment validation error: ${error.message}`);
      return { isValid: false, issues };
    }
  }

  /**
   * Validates mode configuration against test context requirements
   */
  public validateModeConfiguration(mode: TestMode, testContext: TestContext): { isValid: boolean; issues?: string[] } {
    const issues: string[] = [];

    try {
      // Check if test context supports the selected mode
      const testDefinition = this.createTestDefinition(testContext.testName, testContext.tags);
      
      if (!this.validateModeCompatibility(mode, testDefinition)) {
        issues.push(`Test ${testContext.testName} does not support ${mode} mode. Supported modes: ${testDefinition.supportedModes.join(', ')}`);
      }

      // Additional validation based on test tags
      const hasApiTag = testContext.tags.some(tag => tag.toLowerCase().includes('api'));
      const hasNavigationTag = testContext.tags.some(tag => tag.toLowerCase().includes('navigation'));
      
      if (hasApiTag && mode === TestMode.ISOLATED) {
        // API tests might need production data, warn but don't fail
        Log.info(`[TestModeDetector] WARNING: API test ${testContext.testName} running in isolated mode may have limited data`);
      }

      if (hasNavigationTag && mode === TestMode.PRODUCTION) {
        // Navigation tests in production mode should be carefully validated
        Log.info(`[TestModeDetector] Navigation test ${testContext.testName} running in production mode`);
      }

      return {
        isValid: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
      };

    } catch (error) {
      issues.push(`Mode configuration validation error: ${error.message}`);
      return { isValid: false, issues };
    }
  }

  /**
   * Validates database connection string format
   */
  private isValidDatabaseConnectionString(connectionString: string): boolean {
    if (!connectionString || typeof connectionString !== 'string') {
      return false;
    }

    // Check for basic SQL Server connection string format
    const sqlServerPattern = /Server=.+;Database=.+;User Id=.+;Password=.+/i;
    if (sqlServerPattern.test(connectionString)) {
      return true;
    }

    // Check for other common database connection string patterns
    const genericPatterns = [
      /host=.+/i,
      /server=.+/i,
      /data source=.+/i
    ];

    return genericPatterns.some(pattern => pattern.test(connectionString));
  }

  /**
   * Attempts to validate database connectivity (non-blocking)
   */
  public async validateDatabaseConnectivity(mode: TestMode): Promise<{ isValid: boolean; issues?: string[] }> {
    const issues: string[] = [];

    try {
      if (mode === TestMode.ISOLATED) {
        // For isolated mode, we don't need to validate actual database connectivity
        // as it uses mock/test data
        return { isValid: true };
      }

      if (mode === TestMode.PRODUCTION || mode === TestMode.DUAL) {
        const dbConfig = process.env[TestModeDetector.ENV_VAR_DB_CONFIG];
        if (!dbConfig) {
          issues.push('Database configuration not available for connectivity test');
          return { isValid: false, issues };
        }

        // Basic connectivity check (would be implemented with actual database driver)
        // For now, just validate the connection string format
        if (!this.isValidDatabaseConnectionString(dbConfig)) {
          issues.push('Invalid database connection string format');
          return { isValid: false, issues };
        }

        Log.info(`[TestModeDetector] Database connectivity validation passed for ${mode} mode`);
        return { isValid: true };
      }

      return { isValid: true };

    } catch (error) {
      issues.push(`Database connectivity validation error: ${error.message}`);
      return { isValid: false, issues };
    }
  }

  /**
   * Gets fallback mode for a given primary mode
   */
  public getFallbackMode(primaryMode: TestMode): TestMode | null {
    switch (primaryMode) {
      case TestMode.PRODUCTION:
        return TestMode.ISOLATED; // Production can fallback to isolated
      case TestMode.DUAL:
        return TestMode.ISOLATED; // Dual can fallback to isolated
      case TestMode.ISOLATED:
        return null; // Isolated is the ultimate fallback
      default:
        return TestMode.ISOLATED;
    }
  }

  /**
   * Creates a test definition from basic test information
   */
  public createTestDefinition(
    name: string, 
    tags: string[], 
    requirements: string[] = []
  ): TestDefinition {
    // Determine supported modes based on tags
    const supportedModes: TestMode[] = [];
    const normalizedTags = tags.map(tag => tag.toLowerCase());

    if (normalizedTags.includes(TestModeDetector.TAG_ISOLATED.toLowerCase())) {
      supportedModes.push(TestMode.ISOLATED);
    }
    if (normalizedTags.includes(TestModeDetector.TAG_PRODUCTION.toLowerCase())) {
      supportedModes.push(TestMode.PRODUCTION);
    }
    if (normalizedTags.includes(TestModeDetector.TAG_DUAL.toLowerCase())) {
      supportedModes.push(TestMode.DUAL);
    }

    // If no explicit mode tags, assume dual support
    if (supportedModes.length === 0) {
      supportedModes.push(TestMode.DUAL);
    }

    return {
      name,
      tags,
      requirements,
      supportedModes
    };
  }
}