/**
 * SmartTimeoutManager Tests
 * 
 * Tests for the SmartTimeoutManager class to ensure proper functionality
 * of progressive timeout strategies and environment detection.
 */

import { describe, test, expect, vi } from 'vitest';
import { 
  SmartTimeoutManager, 
  createReadinessIndicator, 
  createProgressiveTimeoutConfig,
  createIntelligentRetryConfig,
  Environment,
  TimeoutEscalationStrategy,
  IntelligentRetryConfig
} from './SmartTimeoutManager';

// Mock Page interface for testing
interface MockPage {
  evaluate: (fn: () => any) => Promise<any>;
  waitForSelector: (selector: string) => Promise<any>;
}

describe('SmartTimeoutManager', () => {
  
  test('should detect environment correctly', () => {
    // Test with clean environment
    const originalEnv = { ...process.env };
    
    try {
      // Test local environment detection
      process.env.BASE_URL = 'http://localhost:3000';
      process.env.NODE_ENV = 'development';
      delete process.env.CI;
      
      const localManager = new SmartTimeoutManager();
      expect(localManager.getCurrentEnvironment()).toBe('local');
      
      // Test CI environment detection
      process.env.CI = 'true';
      delete process.env.BASE_URL;
      delete process.env.NODE_ENV;
      
      const ciManager = new SmartTimeoutManager();
      expect(ciManager.getCurrentEnvironment()).toBe('ci');
      
      // Test remote environment detection
      delete process.env.CI;
      process.env.BASE_URL = 'https://production.example.com';
      
      const remoteManager = new SmartTimeoutManager();
      expect(remoteManager.getCurrentEnvironment()).toBe('remote');
      
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  });

  test('should create environment-specific configurations', () => {
    const profiles = SmartTimeoutManager.createEnvironmentProfiles();
    
    expect(profiles.local.environment).toBe('local');
    expect(profiles.ci.environment).toBe('ci');
    expect(profiles.remote.environment).toBe('remote');
    
    // Local should have fastest timeouts
    expect(profiles.local.baseTimeouts.fast).toBeLessThan(profiles.ci.baseTimeouts.fast);
    expect(profiles.ci.baseTimeouts.fast).toBeLessThan(profiles.remote.baseTimeouts.fast);
    
    // Local should have highest target reduction
    expect(profiles.local.performance.targetReduction).toBeGreaterThan(profiles.ci.performance.targetReduction);
    expect(profiles.ci.performance.targetReduction).toBeGreaterThan(profiles.remote.performance.targetReduction);
  });

  test('should get timeout values based on environment', () => {
    const manager = new SmartTimeoutManager({ 
      environment: 'local',
      baseTimeouts: { fast: 1000, normal: 3000, slow: 6000 }
    });
    
    expect(manager.getTimeoutForEnvironment('fast')).toBe(1000);
    expect(manager.getTimeoutForEnvironment('normal')).toBe(3000);
    expect(manager.getTimeoutForEnvironment('slow')).toBe(6000);
  });

  test('should update configuration correctly', () => {
    const manager = new SmartTimeoutManager();
    const originalConfig = manager.getConfig();
    
    manager.updateConfig({
      baseTimeouts: { fast: 500, normal: 2000, slow: 5000 }
    });
    
    const updatedConfig = manager.getConfig();
    expect(updatedConfig.baseTimeouts.fast).toBe(500);
    expect(updatedConfig.baseTimeouts.normal).toBe(2000);
    expect(updatedConfig.baseTimeouts.slow).toBe(5000);
    
    // Other config should remain unchanged
    expect(updatedConfig.environment).toBe(originalConfig.environment);
    expect(updatedConfig.progressiveStrategy.maxWait).toBe(originalConfig.progressiveStrategy.maxWait);
  });

  test('should handle progressive timeout with success', async () => {
    const manager = new SmartTimeoutManager();
    let attemptCount = 0;
    
    const operation = async () => {
      attemptCount++;
      if (attemptCount >= 2) {
        return 'success';
      }
      throw new Error('Not ready yet');
    };
    
    const result = await manager.waitWithProgressiveTimeout(operation, {
      operation: 'test-operation',
      initialTimeout: 100,
      maxTimeout: 1000,
      backoffFactor: 2,
      retryCondition: (error) => error.message === 'Not ready yet'
    });
    
    expect(result).toBe('success');
    expect(attemptCount).toBe(2);
    
    // Should have recorded metrics
    const metrics = manager.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[metrics.length - 1].success).toBe(true);
  });

  test('should handle progressive timeout with failure', async () => {
    const manager = new SmartTimeoutManager();
    
    const operation = async () => {
      throw new Error('Always fails');
    };
    
    await expect(manager.waitWithProgressiveTimeout(operation, {
      operation: 'failing-operation',
      initialTimeout: 50,
      maxTimeout: 200,
      backoffFactor: 2
    })).rejects.toThrow('Always fails');
    
    // Should have recorded failure metrics
    const metrics = manager.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[metrics.length - 1].success).toBe(false);
  });

  test('should create readiness indicators correctly', () => {
    const indicator = createReadinessIndicator(
      'test-indicator',
      'Test readiness indicator',
      async () => true,
      {
        timeout: 2000,
        required: true,
        weight: 0.8,
        viewport: 'mobile'
      }
    );
    
    expect(indicator.name).toBe('test-indicator');
    expect(indicator.description).toBe('Test readiness indicator');
    expect(indicator.timeout).toBe(2000);
    expect(indicator.required).toBe(true);
    expect(indicator.weight).toBe(0.8);
    expect(indicator.viewport).toBe('mobile');
  });

  test('should create readiness indicators with defaults', () => {
    const indicator = createReadinessIndicator(
      'simple-indicator',
      'Simple test indicator',
      async () => true
    );
    
    expect(indicator.name).toBe('simple-indicator');
    expect(indicator.timeout).toBe(2000);
    expect(indicator.required).toBe(false);
    expect(indicator.weight).toBe(0.5);
    expect(indicator.viewport).toBe('all');
  });

  test('should handle readiness detection with weighted scoring', async () => {
    const manager = new SmartTimeoutManager();
    
    // Mock page object
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 1200, height: 800 })
    } as any;

    const indicators = [
      createReadinessIndicator('critical', 'Critical indicator', async () => true, {
        required: true,
        weight: 0.6
      }),
      createReadinessIndicator('important', 'Important indicator', async () => true, {
        required: false,
        weight: 0.3
      }),
      createReadinessIndicator('optional', 'Optional indicator', async () => false, {
        required: false,
        weight: 0.1
      })
    ];

    const result = await manager.waitForReadiness(mockPage, indicators);
    
    expect(result.ready).toBe(true);
    expect(result.score).toBeGreaterThan(80); // Should pass with critical + important
    expect(result.scoreBreakdown.requiredPassed).toBe(true);
    expect(result.indicators.critical.passed).toBe(true);
    expect(result.indicators.important.passed).toBe(true);
    expect(result.indicators.optional.passed).toBe(false);
  });

  test('should handle readiness detection with failing required indicators', async () => {
    const manager = new SmartTimeoutManager({
      progressiveStrategy: {
        initialWait: 10,
        maxWait: 200,
        backoffFactor: 1.5,
        checkInterval: 25,
        maxChecks: 3
      }
    });
    
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 1200, height: 800 })
    } as any;

    const indicators = [
      createReadinessIndicator('critical', 'Critical indicator', async () => false, {
        required: true,
        weight: 0.6,
        timeout: 50
      }),
      createReadinessIndicator('optional', 'Optional indicator', async () => true, {
        required: false,
        weight: 0.4,
        timeout: 50
      })
    ];

    const result = await manager.waitForReadiness(mockPage, indicators);
    
    expect(result.ready).toBe(false);
    expect(result.scoreBreakdown.requiredPassed).toBe(false);
    expect(result.fallbackUsed).toBe(true);
    expect(result.fallbackReason).toBeDefined();
  }, 1000);

  test('should apply fallback strategies correctly', async () => {
    const manager = new SmartTimeoutManager({
      environment: 'local',
      progressiveStrategy: {
        initialWait: 10,
        maxWait: 200,
        backoffFactor: 1.5,
        checkInterval: 25,
        maxChecks: 3
      },
      readinessScoring: {
        scoreThresholds: { local: 90, ci: 70, remote: 60 }, // High threshold to trigger fallback
        requiredIndicatorWeight: 0.1,
        fallbackOnLowScore: true,
        adaptiveScoring: false // Disable adaptive scoring for predictable results
      }
    });
    
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 1200, height: 800 })
    } as any;

    const indicators = [
      createReadinessIndicator('moderate', 'Moderate indicator', async () => true, {
        required: false,
        weight: 0.6,
        timeout: 50
      }),
      createReadinessIndicator('failing', 'Failing indicator', async () => false, {
        required: false,
        weight: 0.4,
        timeout: 50
      })
    ];

    const result = await manager.waitForReadiness(mockPage, indicators);
    
    // Should get moderate score (60%) but not meet threshold (90%), triggering fallback
    expect(result.score).toBe(60);
    expect(result.fallbackUsed).toBe(true);
    expect(result.fallbackReason).toContain('low readiness scores');
  }, 1000);

  test('should validate readiness indicators', async () => {
    const manager = new SmartTimeoutManager();
    const mockPage = {} as any;

    // Test empty indicators
    await expect(manager.waitForReadiness(mockPage, [])).rejects.toThrow('At least one readiness indicator must be provided');

    // Test invalid weights
    const invalidIndicators = [
      createReadinessIndicator('invalid', 'Invalid weight', async () => true, { weight: 1.5 })
    ];
    await expect(manager.waitForReadiness(mockPage, invalidIndicators)).rejects.toThrow('Invalid indicator weights');

    // Test duplicate names
    const duplicateIndicators = [
      createReadinessIndicator('duplicate', 'First', async () => true),
      createReadinessIndicator('duplicate', 'Second', async () => true)
    ];
    await expect(manager.waitForReadiness(mockPage, duplicateIndicators)).rejects.toThrow('Duplicate indicator names');
  });

  test('should handle viewport-specific indicators', async () => {
    const manager = new SmartTimeoutManager();
    
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 600, height: 800 }) // Mobile viewport
    } as any;

    const indicators = [
      createReadinessIndicator('mobile-only', 'Mobile indicator', async () => true, {
        viewport: 'mobile',
        weight: 0.5
      }),
      createReadinessIndicator('desktop-only', 'Desktop indicator', async () => true, {
        viewport: 'desktop',
        weight: 0.5
      })
    ];

    const result = await manager.waitForReadiness(mockPage, indicators);
    
    // Mobile indicator should pass, desktop should be skipped
    expect(result.indicators['mobile-only'].passed).toBe(true);
    expect(result.indicators['desktop-only'].passed).toBe(true); // Skipped indicators are considered passed
    expect(result.indicators['desktop-only'].error).toContain('Skipped for viewport');
  });

  test('should apply adaptive scoring correctly', async () => {
    const localManager = new SmartTimeoutManager({ 
      environment: 'local',
      progressiveStrategy: {
        initialWait: 10,
        maxWait: 200,
        backoffFactor: 1.5,
        checkInterval: 25,
        maxChecks: 3
      },
      readinessScoring: {
        scoreThresholds: { local: 70, ci: 80, remote: 90 }, // Local has lower threshold
        requiredIndicatorWeight: 0.1,
        fallbackOnLowScore: true,
        adaptiveScoring: true
      }
    });
    const remoteManager = new SmartTimeoutManager({ 
      environment: 'remote',
      progressiveStrategy: {
        initialWait: 10,
        maxWait: 200,
        backoffFactor: 1.5,
        checkInterval: 25,
        maxChecks: 3
      },
      readinessScoring: {
        scoreThresholds: { local: 70, ci: 80, remote: 90 }, // Remote has higher threshold
        requiredIndicatorWeight: 0.1,
        fallbackOnLowScore: true,
        adaptiveScoring: true
      }
    });
    
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 1200, height: 800 })
    } as any;

    const indicators = [
      createReadinessIndicator('required', 'Required indicator', async () => true, {
        required: true,
        weight: 0.4,
        timeout: 50
      }),
      createReadinessIndicator('optional1', 'Optional 1', async () => true, {
        required: false,
        weight: 0.3,
        timeout: 50
      }),
      createReadinessIndicator('optional2', 'Optional 2', async () => false, {
        required: false,
        weight: 0.3,
        timeout: 50
      })
    ];

    const localResult = await localManager.waitForReadiness(mockPage, indicators);
    const remoteResult = await remoteManager.waitForReadiness(mockPage, indicators);
    
    // Both should have same base score (70%) but different thresholds
    expect(localResult.score).toBeGreaterThanOrEqual(70);
    expect(remoteResult.score).toBeGreaterThanOrEqual(70);
    
    // Local should be ready (threshold 70%), remote should not be ready (threshold 90%)
    expect(localResult.ready).toBe(true);
    expect(remoteResult.ready).toBe(false);
    
    // Verify different environments have different thresholds
    expect(localResult.scoreBreakdown.scoreThreshold).toBe(70);
    expect(remoteResult.scoreBreakdown.scoreThreshold).toBe(90);
  }, 1000);

  test('should handle readiness indicator timeouts', async () => {
    const manager = new SmartTimeoutManager({
      progressiveStrategy: {
        initialWait: 10,
        maxWait: 300,
        backoffFactor: 1.5,
        checkInterval: 25,
        maxChecks: 5
      }
    });
    
    const mockPage = {
      evaluate: vi.fn(),
      waitForSelector: vi.fn(),
      viewportSize: vi.fn().mockResolvedValue({ width: 1200, height: 800 })
    } as any;

    const indicators = [
      createReadinessIndicator('slow', 'Slow indicator', async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Longer than timeout
        return true;
      }, {
        timeout: 50, // Short timeout
        weight: 0.5
      }),
      createReadinessIndicator('fast', 'Fast indicator', async () => true, {
        timeout: 100,
        weight: 0.5
      })
    ];

    const result = await manager.waitForReadiness(mockPage, indicators);
    
    expect(result.indicators.slow.passed).toBe(false); // Should timeout
    expect(result.indicators.fast.passed).toBe(true);
    expect(result.score).toBe(50); // Only fast indicator passed
  }, 1000);

  test('should handle metrics collection', () => {
    const manager = new SmartTimeoutManager();
    
    // Initially no metrics
    expect(manager.getMetrics()).toHaveLength(0);
    
    // Simulate recording metrics
    const testMetrics = {
      operation: 'test',
      environment: 'local' as Environment,
      configuredTimeout: 5000,
      actualDuration: 2000,
      timeSaved: 3000,
      readinessScore: 85,
      success: true,
      timestamp: Date.now()
    };
    
    // Access private method through type assertion for testing
    (manager as any).recordMetrics(testMetrics);
    
    const metrics = manager.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].operation).toBe('test');
    expect(metrics[0].timeSaved).toBe(3000);
    
    // Clear metrics
    manager.clearMetrics();
    expect(manager.getMetrics()).toHaveLength(0);
  });

  test('should merge configurations correctly', () => {
    const manager = new SmartTimeoutManager({
      baseTimeouts: { fast: 500, normal: 1500, slow: 3000 },
      performance: { targetReduction: 80, enableMetrics: false, logDiagnostics: true }
    });
    
    const config = manager.getConfig();
    expect(config.baseTimeouts.fast).toBe(500);
    expect(config.baseTimeouts.normal).toBe(1500);
    expect(config.baseTimeouts.slow).toBe(3000);
    expect(config.performance.targetReduction).toBe(80);
    expect(config.performance.enableMetrics).toBe(false);
    expect(config.performance.logDiagnostics).toBe(true);
    
    // Should still have default values for non-overridden properties
    expect(config.progressiveStrategy.backoffFactor).toBeDefined();
    expect(config.environment).toBeDefined();
  });

  test('should handle progressive timeout with escalation strategy', async () => {
    const manager = new SmartTimeoutManager();
    let attemptCount = 0;
    
    const operation = async () => {
      attemptCount++;
      if (attemptCount >= 3) {
        return 'success';
      }
      throw new Error('timeout error - not ready yet');
    };

    const escalationStrategy: TimeoutEscalationStrategy = {
      name: 'test-escalation',
      description: 'Test escalation strategy',
      shouldEscalate: (error, attempt) => attempt <= 5,
      getNextTimeout: (currentTimeout) => currentTimeout * 1.5,
      getMaxRetries: () => 5,
      onEscalation: vi.fn()
    };
    
    const result = await manager.waitWithProgressiveTimeout(operation, {
      operation: 'test-escalation-operation',
      initialTimeout: 100,
      maxTimeout: 2000,
      backoffFactor: 2,
      maxRetries: 5,
      escalationStrategy,
      retryCondition: (error) => error.message.includes('timeout error')
    });
    
    expect(result).toBe('success');
    expect(attemptCount).toBe(3);
    expect(escalationStrategy.onEscalation).toHaveBeenCalled();
  });

  test('should handle intelligent retry with different error types', async () => {
    const manager = new SmartTimeoutManager();
    let attemptCount = 0;
    
    const operation = async () => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('network connection failed');
      } else if (attemptCount === 2) {
        throw new Error('element not found');
      }
      return 'success';
    };

    const retryConfigs: IntelligentRetryConfig[] = [
      {
        conditionType: 'network_error',
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelay: 50,
        maxDelay: 500,
        jitter: false
      },
      {
        conditionType: 'element_not_found',
        maxRetries: 3,
        backoffStrategy: 'linear',
        baseDelay: 25,
        maxDelay: 200,
        jitter: false
      }
    ];
    
    const result = await manager.waitWithIntelligentRetry(operation, retryConfigs, 'test-intelligent-retry');
    
    expect(result).toBe('success');
    expect(attemptCount).toBe(3);
  });

  test('should create escalation strategies correctly', () => {
    const strategies = SmartTimeoutManager.createEscalationStrategies();
    
    expect(strategies.networkError).toBeDefined();
    expect(strategies.elementError).toBeDefined();
    expect(strategies.browserError).toBeDefined();
    expect(strategies.timeoutError).toBeDefined();
    expect(strategies.adaptive).toBeDefined();
    
    // Test network error strategy
    const networkStrategy = strategies.networkError;
    expect(networkStrategy.name).toBe('network-error');
    expect(networkStrategy.shouldEscalate(new Error('network connection failed'), 1, 1000)).toBe(true);
    expect(networkStrategy.shouldEscalate(new Error('some other error'), 1, 1000)).toBe(false);
    
    const newTimeout = networkStrategy.getNextTimeout(1000, 1, new Error('network error'));
    expect(newTimeout).toBe(2500); // 1000 * 2.5
  });

  test('should create intelligent retry configurations correctly', () => {
    const configs = SmartTimeoutManager.createIntelligentRetryConfigs();
    
    expect(configs.webAutomation).toBeDefined();
    expect(configs.critical).toBeDefined();
    expect(configs.fast).toBeDefined();
    
    // Test web automation configs
    const webConfigs = configs.webAutomation;
    expect(webConfigs.length).toBeGreaterThan(0);
    
    const networkConfig = webConfigs.find(c => c.conditionType === 'network_error');
    expect(networkConfig).toBeDefined();
    expect(networkConfig?.maxRetries).toBe(5);
    expect(networkConfig?.backoffStrategy).toBe('exponential');
  });

  test('should create progressive timeout config with utility function', () => {
    const config = createProgressiveTimeoutConfig('test-operation', {
      initialTimeout: 500,
      maxTimeout: 5000,
      backoffFactor: 1.8,
      maxRetries: 8,
      escalationStrategy: 'networkError'
    });
    
    expect(config.operation).toBe('test-operation');
    expect(config.initialTimeout).toBe(500);
    expect(config.maxTimeout).toBe(5000);
    expect(config.backoffFactor).toBe(1.8);
    expect(config.maxRetries).toBe(8);
    expect(config.escalationStrategy).toBeDefined();
    expect(config.escalationStrategy?.name).toBe('network-error');
  });

  test('should create intelligent retry config with utility function', () => {
    const config = createIntelligentRetryConfig('timeout_error', {
      maxRetries: 4,
      backoffStrategy: 'fibonacci',
      baseDelay: 300,
      maxDelay: 3000,
      jitter: false
    });
    
    expect(config.conditionType).toBe('timeout_error');
    expect(config.maxRetries).toBe(4);
    expect(config.backoffStrategy).toBe('fibonacci');
    expect(config.baseDelay).toBe(300);
    expect(config.maxDelay).toBe(3000);
    expect(config.jitter).toBe(false);
  });

  test('should calculate fibonacci backoff correctly', async () => {
    const manager = new SmartTimeoutManager();
    
    // Test fibonacci calculation through retry delay
    const config = createIntelligentRetryConfig('custom', {
      backoffStrategy: 'fibonacci',
      baseDelay: 100,
      maxDelay: 2000,
      jitter: false
    });
    
    // Access private method for testing
    const calculateDelay = (manager as any).calculateRetryDelay.bind(manager);
    
    expect(calculateDelay(config, 1)).toBe(100); // 100 * 1
    expect(calculateDelay(config, 2)).toBe(100); // 100 * 1  
    expect(calculateDelay(config, 3)).toBe(200); // 100 * 2
    expect(calculateDelay(config, 4)).toBe(300); // 100 * 3
    expect(calculateDelay(config, 5)).toBe(500); // 100 * 5
  });

  test('should apply jitter to retry delays', async () => {
    const manager = new SmartTimeoutManager();
    
    const config = createIntelligentRetryConfig('custom', {
      backoffStrategy: 'linear',
      baseDelay: 1000,
      maxDelay: 5000,
      jitter: true
    });
    
    // Access private method for testing
    const calculateDelay = (manager as any).calculateRetryDelay.bind(manager);
    
    const delay1 = calculateDelay(config, 2);
    const delay2 = calculateDelay(config, 2);
    
    // With jitter, delays should be different (though this could occasionally fail due to randomness)
    // We'll just check that they're in a reasonable range
    expect(delay1).toBeGreaterThan(1500); // Base 2000 - 25% = 1500
    expect(delay1).toBeLessThan(2500);    // Base 2000 + 25% = 2500
    expect(delay2).toBeGreaterThan(1500);
    expect(delay2).toBeLessThan(2500);
  });
});