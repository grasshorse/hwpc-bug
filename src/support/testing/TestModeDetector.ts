import { TestMode, TestContext, TestDefinition, ModeDetectionResult } from './types';

/**
 * TestModeDetector handles automatic detection of testing mode based on
 * environment variables, test tags, and configuration
 */
export class TestModeDetector {
  private static readonly ENV_VAR_TEST_MODE = 'TEST_MODE';
  private static readonly ENV_VAR_NODE_ENV = 'NODE_ENV';
  private static readonly DEFAULT_MODE = TestMode.ISOLATED;
  
  private static readonly TAG_ISOLATED = '@isolated';
  private static readonly TAG_PRODUCTION = '@production';
  private static readonly TAG_DUAL = '@dual';

  /**
   * Detects the appropriate test mode based on environment and test context
   */
  public detectMode(testContext: TestContext): ModeDetectionResult {
    // First, check environment variables
    const envMode = this.detectModeFromEnvironment();
    
    // Then check test tags
    const tagMode = this.detectModeFromTags(testContext.tags);

    // Choose the result with higher confidence
    if (tagMode.confidence > envMode.confidence) {
      return tagMode;
    } else if (envMode.confidence > tagMode.confidence) {
      return envMode;
    }

    // If confidence is equal, prioritize tags over environment
    if (tagMode.confidence >= 0.5) {
      return tagMode;
    } else if (envMode.confidence >= 0.5) {
      return envMode;
    }

    // Return default mode with fallback reason
    return {
      mode: TestModeDetector.DEFAULT_MODE,
      confidence: 1.0,
      source: 'default',
      fallbackReason: 'No explicit mode specified, using default isolated mode'
    };
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