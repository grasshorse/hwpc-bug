/**
 * SmartTimeoutManager - Intelligent timeout management for WebDriver/Chrome automation
 * 
 * Addresses WebDriver/Chrome timeout issues by implementing:
 * - Progressive timeout strategies with exponential backoff
 * - Environment-aware timeout configuration (local, CI, remote)
 * - Readiness detection instead of fixed timeouts
 * - Performance monitoring and optimization
 */

import { Page } from '@playwright/test';

/**
 * Environment types for timeout optimization
 */
export type Environment = 'local' | 'ci' | 'remote';

/**
 * Timeout configuration for different environments
 */
export interface SmartTimeoutConfig {
  environment: Environment;
  baseTimeouts: {
    fast: number;      // For local development (quick feedback)
    normal: number;    // For CI environments (balanced)
    slow: number;      // For remote/unstable environments (conservative)
  };
  progressiveStrategy: {
    initialWait: number;      // Initial wait time before first check
    maxWait: number;          // Maximum total wait time
    backoffFactor: number;    // Multiplier for progressive delays
    checkInterval: number;    // Base interval between readiness checks
    maxChecks: number;        // Maximum number of readiness checks
  };
  performance: {
    targetReduction: number;  // Target timeout reduction percentage
    enableMetrics: boolean;   // Whether to collect performance metrics
    logDiagnostics: boolean;  // Whether to log diagnostic information
  };
  readinessScoring: ReadinessScoring;  // Readiness scoring configuration
}

/**
 * Progressive timeout configuration for specific operations
 */
export interface ProgressiveTimeoutConfig {
  operation: string;
  initialTimeout: number;
  maxTimeout: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  escalationStrategy?: TimeoutEscalationStrategy;
  maxRetries?: number;
}

/**
 * Timeout escalation strategies for different failure scenarios
 */
export interface TimeoutEscalationStrategy {
  name: string;
  description: string;
  shouldEscalate: (error: Error, attempt: number, duration: number) => boolean;
  getNextTimeout: (currentTimeout: number, attempt: number, error: Error) => number;
  getMaxRetries: (error: Error) => number;
  onEscalation?: (error: Error, attempt: number, newTimeout: number) => void;
}

/**
 * Retry condition types for intelligent retry logic
 */
export type RetryConditionType = 
  | 'network_error'
  | 'timeout_error' 
  | 'element_not_found'
  | 'stale_element'
  | 'page_crash'
  | 'custom';

/**
 * Intelligent retry condition configuration
 */
export interface IntelligentRetryConfig {
  conditionType: RetryConditionType;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fibonacci';
  baseDelay: number;
  maxDelay: number;
  jitter?: boolean; // Add randomness to prevent thundering herd
}

/**
 * Readiness indicator for application state checking
 */
export interface ReadinessIndicator {
  name: string;
  description: string;
  check: (page: Page) => Promise<boolean>;
  timeout: number;
  required: boolean;
  weight: number;           // Weight for scoring (0-1)
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'all';
}

/**
 * Result of readiness detection
 */
export interface ReadinessResult {
  ready: boolean;
  score: number;            // Overall readiness score (0-100)
  duration: number;         // Time taken to determine readiness
  indicators: {
    [key: string]: {
      passed: boolean;
      duration: number;
      error?: string;
      weight: number;         // Weight used in scoring
      required: boolean;      // Whether this indicator was required
    };
  };
  fallbackUsed: boolean;    // Whether fallback timeout was used
  fallbackReason?: string;  // Reason why fallback was used
  scoreBreakdown: {
    totalWeight: number;
    passedWeight: number;
    requiredPassed: boolean;
    scoreThreshold: number;
  };
}

/**
 * Performance metrics for timeout operations
 */
export interface TimeoutMetrics {
  operation: string;
  environment: Environment;
  configuredTimeout: number;
  actualDuration: number;
  timeSaved: number;
  readinessScore: number;
  success: boolean;
  timestamp: number;
}

/**
 * Fallback strategy configuration for readiness detection
 */
export interface ReadinessFallbackStrategy {
  name: string;
  description: string;
  shouldUseFallback: (result: ReadinessResult, config: SmartTimeoutConfig) => boolean;
  getFallbackTimeout: (originalTimeout: number, environment: Environment) => number;
  onFallbackUsed?: (reason: string, fallbackTimeout: number) => void;
}

/**
 * Readiness scoring configuration
 */
export interface ReadinessScoring {
  scoreThresholds: {
    local: number;    // Score threshold for local environment
    ci: number;       // Score threshold for CI environment  
    remote: number;   // Score threshold for remote environment
  };
  requiredIndicatorWeight: number;  // Minimum weight for required indicators
  fallbackOnLowScore: boolean;      // Whether to use fallback if score is too low
  adaptiveScoring: boolean;         // Whether to adapt scoring based on environment
}

/**
 * SmartTimeoutManager - Core class for intelligent timeout handling
 */
export class SmartTimeoutManager {
  private config: SmartTimeoutConfig;
  private metrics: TimeoutMetrics[] = [];

  constructor(config?: Partial<SmartTimeoutConfig>) {
    this.config = this.createDefaultConfig(config);
  }

  /**
   * Create default configuration with environment detection
   */
  private createDefaultConfig(overrides?: Partial<SmartTimeoutConfig>): SmartTimeoutConfig {
    const environment = this.detectEnvironment();
    
    const defaultConfig: SmartTimeoutConfig = {
      environment,
      baseTimeouts: {
        fast: 2000,      // Local development - fast feedback
        normal: 5000,    // CI environments - balanced
        slow: 10000      // Remote/unstable - conservative
      },
      progressiveStrategy: {
        initialWait: 100,        // Start checking quickly
        maxWait: this.getMaxWaitForEnvironment(environment),
        backoffFactor: 1.5,      // Moderate exponential backoff
        checkInterval: 250,      // Check every 250ms initially
        maxChecks: 40            // Maximum 40 checks (10 seconds at 250ms)
      },
      performance: {
        targetReduction: environment === 'local' ? 70 : environment === 'ci' ? 50 : 30,
        enableMetrics: true,
        logDiagnostics: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true'
      },
      readinessScoring: {
        scoreThresholds: {
          local: 80,     // High threshold for local (fast feedback)
          ci: 70,        // Moderate threshold for CI (balanced)
          remote: 60     // Lower threshold for remote (conservative)
        },
        requiredIndicatorWeight: 0.1,  // Required indicators need at least 10% weight
        fallbackOnLowScore: true,      // Use fallback if score too low
        adaptiveScoring: true          // Adapt scoring based on environment
      }
    };

    return this.mergeConfig(defaultConfig, overrides);
  }

  /**
   * Detect current environment based on various indicators
   */
  private detectEnvironment(): Environment {
    // Check for CI environment variables
    if (process.env.CI === 'true' || 
        process.env.GITHUB_ACTIONS === 'true' || 
        process.env.JENKINS_URL || 
        process.env.BUILDKITE || 
        process.env.CIRCLECI) {
      return 'ci';
    }

    // Check for local development indicators
    const baseUrl = process.env.BASE_URL || '';
    if (baseUrl.includes('localhost') || 
        baseUrl.includes('127.0.0.1') || 
        baseUrl.includes('0.0.0.0') ||
        process.env.NODE_ENV === 'development') {
      return 'local';
    }

    // Default to remote for production/staging environments
    return 'remote';
  }

  /**
   * Get maximum wait time based on environment
   */
  private getMaxWaitForEnvironment(environment: Environment): number {
    switch (environment) {
      case 'local': return 8000;   // 8 seconds for local
      case 'ci': return 15000;     // 15 seconds for CI
      case 'remote': return 25000; // 25 seconds for remote
      default: return 15000;
    }
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: SmartTimeoutConfig, overrides?: Partial<SmartTimeoutConfig>): SmartTimeoutConfig {
    if (!overrides) return base;

    return {
      ...base,
      ...overrides,
      baseTimeouts: { ...base.baseTimeouts, ...overrides.baseTimeouts },
      progressiveStrategy: { ...base.progressiveStrategy, ...overrides.progressiveStrategy },
      performance: { ...base.performance, ...overrides.performance },
      readinessScoring: { ...base.readinessScoring, ...overrides.readinessScoring }
    };
  }

  /**
   * Wait for readiness using multiple indicators with progressive timeout and enhanced scoring
   */
  async waitForReadiness(
    page: Page,
    indicators: ReadinessIndicator[],
    customConfig?: Partial<SmartTimeoutConfig>
  ): Promise<ReadinessResult> {
    const startTime = performance.now();
    const config = customConfig ? this.mergeConfig(this.config, customConfig) : this.config;
    
    // Validate indicators
    this.validateReadinessIndicators(indicators, config);
    
    const result: ReadinessResult = {
      ready: false,
      score: 0,
      duration: 0,
      indicators: {},
      fallbackUsed: false,
      scoreBreakdown: {
        totalWeight: 0,
        passedWeight: 0,
        requiredPassed: false,
        scoreThreshold: config.readinessScoring.scoreThresholds[config.environment]
      }
    };

    // Initialize indicator results
    indicators.forEach(indicator => {
      result.indicators[indicator.name] = {
        passed: false,
        duration: 0,
        weight: indicator.weight,
        required: indicator.required
      };
    });

    let attempt = 0;
    let currentInterval = config.progressiveStrategy.checkInterval;
    const maxAttempts = config.progressiveStrategy.maxChecks;
    
    if (config.performance.logDiagnostics) {
      console.log(`[SmartTimeoutManager] Starting readiness check with ${indicators.length} indicators`);
      console.log(`[SmartTimeoutManager] Environment: ${config.environment}, Score threshold: ${result.scoreBreakdown.scoreThreshold}%`);
      console.log(`[SmartTimeoutManager] Max wait: ${config.progressiveStrategy.maxWait}ms`);
    }

    // Initial wait before first check
    if (config.progressiveStrategy.initialWait > 0) {
      await this.sleep(config.progressiveStrategy.initialWait);
    }

    while (attempt < maxAttempts && (performance.now() - startTime) < config.progressiveStrategy.maxWait) {
      attempt++;

      // Check all indicators with enhanced error handling
      const indicatorResults = await this.checkReadinessIndicators(page, indicators, config);

      // Process results with enhanced scoring
      const scoringResult = this.calculateReadinessScore(indicatorResults, indicators, config);
      
      // Update result with scoring information
      result.score = scoringResult.score;
      result.scoreBreakdown = scoringResult.breakdown;
      
      // Update individual indicator results
      indicatorResults.forEach((indicatorResult, index) => {
        const indicator = indicators[index];
        result.indicators[indicator.name] = {
          passed: indicatorResult.passed,
          duration: indicatorResult.duration,
          error: indicatorResult.error,
          weight: indicator.weight,
          required: indicator.required
        };
      });

      // Check if we're ready using enhanced criteria
      if (this.isReadinessAchieved(scoringResult, config)) {
        result.ready = true;
        break;
      }

      // Progressive backoff for next check
      if (attempt < maxAttempts) {
        await this.sleep(currentInterval);
        currentInterval = Math.min(
          currentInterval * config.progressiveStrategy.backoffFactor,
          2000 // Cap at 2 seconds between checks
        );
      }

      if (config.performance.logDiagnostics && attempt % 5 === 0) {
        console.log(`[SmartTimeoutManager] Attempt ${attempt}: Score ${result.score}%/${result.scoreBreakdown.scoreThreshold}%, Required passed: ${scoringResult.breakdown.requiredPassed}`);
      }
    }

    result.duration = performance.now() - startTime;

    // Apply fallback strategies if not ready
    if (!result.ready) {
      const fallbackResult = await this.applyFallbackStrategies(result, config, page, indicators);
      Object.assign(result, fallbackResult);
    }

    // Record metrics
    if (config.performance.enableMetrics) {
      this.recordMetrics({
        operation: 'readiness_check',
        environment: config.environment,
        configuredTimeout: config.progressiveStrategy.maxWait,
        actualDuration: result.duration,
        timeSaved: Math.max(0, config.progressiveStrategy.maxWait - result.duration),
        readinessScore: result.score,
        success: result.ready,
        timestamp: Date.now()
      });
    }

    return result;
  }

  /**
   * Wait with progressive timeout and intelligent retry logic
   */
  async waitWithProgressiveTimeout<T>(
    operation: () => Promise<T>,
    config: ProgressiveTimeoutConfig
  ): Promise<T> {
    const startTime = performance.now();
    let currentTimeout = config.initialTimeout;
    let attempt = 0;
    let lastError: Error | null = null;
    const maxRetries = config.maxRetries || 10;

    if (this.config.performance.logDiagnostics) {
      console.log(`[SmartTimeoutManager] Starting progressive timeout for ${config.operation}`);
      console.log(`[SmartTimeoutManager] Initial timeout: ${currentTimeout}ms, Max timeout: ${config.maxTimeout}ms, Max retries: ${maxRetries}`);
    }

    while (attempt < maxRetries && currentTimeout <= config.maxTimeout) {
      attempt++;
      const attemptStartTime = performance.now();
      
      try {
        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise<T>(currentTimeout, `Operation timeout after ${currentTimeout}ms (attempt ${attempt})`)
        ]);
        
        // Success - record metrics
        const duration = performance.now() - startTime;
        if (this.config.performance.enableMetrics) {
          this.recordMetrics({
            operation: config.operation,
            environment: this.config.environment,
            configuredTimeout: config.maxTimeout,
            actualDuration: duration,
            timeSaved: Math.max(0, config.maxTimeout - duration),
            readinessScore: 100, // Success = 100% ready
            success: true,
            timestamp: Date.now()
          });
        }
        
        if (this.config.performance.logDiagnostics) {
          console.log(`[SmartTimeoutManager] ${config.operation} succeeded on attempt ${attempt} after ${duration.toFixed(2)}ms`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const attemptDuration = performance.now() - attemptStartTime;
        
        // Check if we should retry based on retry condition
        if (config.retryCondition && !config.retryCondition(lastError)) {
          if (this.config.performance.logDiagnostics) {
            console.log(`[SmartTimeoutManager] ${config.operation} retry condition failed, stopping retries`);
          }
          break;
        }

        // Check escalation strategy
        if (config.escalationStrategy) {
          const shouldEscalate = config.escalationStrategy.shouldEscalate(lastError, attempt, attemptDuration);
          if (shouldEscalate) {
            const newTimeout = config.escalationStrategy.getNextTimeout(currentTimeout, attempt, lastError);
            const escalationMaxRetries = config.escalationStrategy.getMaxRetries(lastError);
            
            if (config.escalationStrategy.onEscalation) {
              config.escalationStrategy.onEscalation(lastError, attempt, newTimeout);
            }
            
            currentTimeout = Math.min(newTimeout, config.maxTimeout);
            
            // Update max retries based on escalation strategy
            if (escalationMaxRetries > maxRetries && attempt < escalationMaxRetries) {
              // Allow more retries for escalated scenarios
            }
            
            if (this.config.performance.logDiagnostics) {
              console.log(`[SmartTimeoutManager] ${config.operation} escalated timeout to ${currentTimeout}ms (strategy: ${config.escalationStrategy.name})`);
            }
          }
        } else {
          // Standard exponential backoff
          currentTimeout = Math.min(
            currentTimeout * config.backoffFactor,
            config.maxTimeout
          );
        }
        
        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }
        
        if (this.config.performance.logDiagnostics) {
          console.log(`[SmartTimeoutManager] ${config.operation} attempt ${attempt} failed after ${attemptDuration.toFixed(2)}ms: ${lastError.message}`);
          if (attempt < maxRetries && currentTimeout <= config.maxTimeout) {
            console.log(`[SmartTimeoutManager] Retrying with ${currentTimeout}ms timeout`);
          }
        }
      }
    }

    // All attempts failed - record metrics and throw
    const duration = performance.now() - startTime;
    if (this.config.performance.enableMetrics) {
      this.recordMetrics({
        operation: config.operation,
        environment: this.config.environment,
        configuredTimeout: config.maxTimeout,
        actualDuration: duration,
        timeSaved: 0,
        readinessScore: 0,
        success: false,
        timestamp: Date.now()
      });
    }

    const finalError = new Error(
      `Progressive timeout failed for operation: ${config.operation} after ${attempt} attempts and ${duration.toFixed(2)}ms. Last error: ${lastError?.message || 'Unknown error'}`
    );
    
    // Preserve original error stack if available
    if (lastError && lastError.stack) {
      finalError.stack = lastError.stack;
    }

    throw finalError;
  }

  /**
   * Wait with intelligent retry logic based on error type and conditions
   */
  async waitWithIntelligentRetry<T>(
    operation: () => Promise<T>,
    retryConfigs: IntelligentRetryConfig[],
    operationName: string = 'unknown'
  ): Promise<T> {
    const startTime = performance.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // Find the most appropriate retry config based on error type
    const getRetryConfig = (error: Error): IntelligentRetryConfig | null => {
      for (const config of retryConfigs) {
        if (this.matchesRetryCondition(error, config.conditionType)) {
          return config;
        }
      }
      return null;
    };

    while (true) {
      attempt++;
      
      try {
        const result = await operation();
        
        // Success - record metrics
        const duration = performance.now() - startTime;
        if (this.config.performance.enableMetrics) {
          this.recordMetrics({
            operation: operationName,
            environment: this.config.environment,
            configuredTimeout: 0, // Not applicable for retry logic
            actualDuration: duration,
            timeSaved: 0, // Not applicable for retry logic
            readinessScore: 100,
            success: true,
            timestamp: Date.now()
          });
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const retryConfig = getRetryConfig(lastError);
        if (!retryConfig || attempt >= retryConfig.maxRetries) {
          break;
        }

        // Calculate delay based on backoff strategy
        const delay = this.calculateRetryDelay(retryConfig, attempt);
        
        if (this.config.performance.logDiagnostics) {
          console.log(`[SmartTimeoutManager] ${operationName} attempt ${attempt} failed (${retryConfig.conditionType}), retrying in ${delay}ms`);
        }
        
        await this.sleep(delay);
      }
    }

    // All retries failed
    const duration = performance.now() - startTime;
    if (this.config.performance.enableMetrics) {
      this.recordMetrics({
        operation: operationName,
        environment: this.config.environment,
        configuredTimeout: 0,
        actualDuration: duration,
        timeSaved: 0,
        readinessScore: 0,
        success: false,
        timestamp: Date.now()
      });
    }

    throw lastError || new Error(`Intelligent retry failed for operation: ${operationName}`);
  }

  /**
   * Get timeout value based on environment and operation type
   */
  getTimeoutForEnvironment(operationType: 'fast' | 'normal' | 'slow' = 'normal'): number {
    return this.config.baseTimeouts[operationType];
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): Environment {
    return this.config.environment;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): TimeoutMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get configuration
   */
  getConfig(): SmartTimeoutConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SmartTimeoutConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  /**
   * Validate readiness indicators for proper configuration
   */
  private validateReadinessIndicators(indicators: ReadinessIndicator[], config: SmartTimeoutConfig): void {
    if (indicators.length === 0) {
      throw new Error('At least one readiness indicator must be provided');
    }

    // Check for required indicators with insufficient weight
    const requiredIndicators = indicators.filter(i => i.required);
    const insufficientWeightIndicators = requiredIndicators.filter(
      i => i.weight < config.readinessScoring.requiredIndicatorWeight
    );

    if (insufficientWeightIndicators.length > 0) {
      const names = insufficientWeightIndicators.map(i => i.name).join(', ');
      console.warn(`[SmartTimeoutManager] Required indicators with low weight detected: ${names}`);
    }

    // Validate weight ranges
    const invalidWeights = indicators.filter(i => i.weight < 0 || i.weight > 1);
    if (invalidWeights.length > 0) {
      const names = invalidWeights.map(i => `${i.name}(${i.weight})`).join(', ');
      throw new Error(`Invalid indicator weights (must be 0-1): ${names}`);
    }

    // Check for duplicate names
    const names = indicators.map(i => i.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate indicator names detected: ${duplicates.join(', ')}`);
    }
  }

  /**
   * Check all readiness indicators with enhanced error handling
   */
  private async checkReadinessIndicators(
    page: Page,
    indicators: ReadinessIndicator[],
    config: SmartTimeoutConfig
  ): Promise<Array<{
    name: string;
    passed: boolean;
    duration: number;
    weight: number;
    required: boolean;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      indicators.map(async (indicator) => {
        const indicatorStart = performance.now();
        try {
          // Add viewport filtering if specified
          if (indicator.viewport && indicator.viewport !== 'all') {
            const viewport = await page.viewportSize();
            const currentViewport = this.detectViewportType(viewport);
            if (indicator.viewport !== currentViewport) {
              // Skip this indicator for non-matching viewport
              return {
                name: indicator.name,
                passed: true, // Consider skipped indicators as passed
                duration: performance.now() - indicatorStart,
                weight: indicator.weight,
                required: indicator.required,
                error: `Skipped for viewport: ${currentViewport} (expected: ${indicator.viewport})`
              };
            }
          }

          const passed = await Promise.race([
            indicator.check(page),
            this.timeoutPromise(indicator.timeout, false)
          ]);
          
          const duration = performance.now() - indicatorStart;
          return {
            name: indicator.name,
            passed: passed === true,
            duration,
            weight: indicator.weight,
            required: indicator.required
          };
        } catch (error) {
          const duration = performance.now() - indicatorStart;
          return {
            name: indicator.name,
            passed: false,
            duration,
            weight: indicator.weight,
            required: indicator.required,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    return results.map((settledResult, index) => {
      if (settledResult.status === 'fulfilled') {
        return settledResult.value;
      } else {
        const indicator = indicators[index];
        return {
          name: indicator.name,
          passed: false,
          duration: 0,
          weight: indicator.weight,
          required: indicator.required,
          error: settledResult.reason instanceof Error ? settledResult.reason.message : String(settledResult.reason)
        };
      }
    });
  }

  /**
   * Calculate readiness score with enhanced weighted scoring
   */
  private calculateReadinessScore(
    indicatorResults: Array<{
      name: string;
      passed: boolean;
      duration: number;
      weight: number;
      required: boolean;
      error?: string;
    }>,
    indicators: ReadinessIndicator[],
    config: SmartTimeoutConfig
  ): {
    score: number;
    breakdown: {
      totalWeight: number;
      passedWeight: number;
      requiredPassed: boolean;
      scoreThreshold: number;
    };
  } {
    let totalWeight = 0;
    let passedWeight = 0;
    let allRequiredPassed = true;
    let requiredIndicatorCount = 0;
    let passedRequiredCount = 0;

    indicatorResults.forEach((result) => {
      totalWeight += result.weight;
      
      if (result.passed) {
        passedWeight += result.weight;
        if (result.required) {
          passedRequiredCount++;
        }
      } else if (result.required) {
        allRequiredPassed = false;
      }

      if (result.required) {
        requiredIndicatorCount++;
      }
    });

    // Calculate base score
    let score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

    // Apply adaptive scoring adjustments
    if (config.readinessScoring.adaptiveScoring) {
      score = this.applyAdaptiveScoring(score, config, {
        requiredIndicatorCount,
        passedRequiredCount,
        totalIndicators: indicatorResults.length,
        passedIndicators: indicatorResults.filter(r => r.passed).length
      });
    }

    return {
      score,
      breakdown: {
        totalWeight,
        passedWeight,
        requiredPassed: allRequiredPassed,
        scoreThreshold: config.readinessScoring.scoreThresholds[config.environment]
      }
    };
  }

  /**
   * Apply adaptive scoring based on environment and indicator patterns
   */
  private applyAdaptiveScoring(
    baseScore: number,
    config: SmartTimeoutConfig,
    stats: {
      requiredIndicatorCount: number;
      passedRequiredCount: number;
      totalIndicators: number;
      passedIndicators: number;
    }
  ): number {
    let adjustedScore = baseScore;

    // Only boost score if all required indicators pass (even if optional ones fail)
    if (stats.requiredIndicatorCount > 0 && stats.passedRequiredCount === stats.requiredIndicatorCount) {
      const requiredBonus = Math.min(5, (stats.requiredIndicatorCount / stats.totalIndicators) * 10);
      adjustedScore += requiredBonus;
    }

    // Environment-specific adjustments - more conservative
    switch (config.environment) {
      case 'local':
        // Be more lenient in local environment for faster feedback
        if (stats.passedIndicators / stats.totalIndicators >= 0.8) {
          adjustedScore += 3;
        }
        break;
      case 'ci':
        // Balanced approach for CI
        if (stats.passedIndicators / stats.totalIndicators >= 0.9) {
          adjustedScore += 2;
        }
        break;
      case 'remote':
        // More conservative in remote environment
        if (stats.passedIndicators / stats.totalIndicators >= 0.95) {
          adjustedScore += 1;
        }
        break;
    }

    return Math.min(100, Math.max(0, Math.round(adjustedScore)));
  }

  /**
   * Check if readiness is achieved based on enhanced criteria
   */
  private isReadinessAchieved(
    scoringResult: {
      score: number;
      breakdown: {
        totalWeight: number;
        passedWeight: number;
        requiredPassed: boolean;
        scoreThreshold: number;
      };
    },
    config: SmartTimeoutConfig
  ): boolean {
    // Must pass all required indicators
    if (!scoringResult.breakdown.requiredPassed) {
      return false;
    }

    // Must meet score threshold for environment
    return scoringResult.score >= scoringResult.breakdown.scoreThreshold;
  }

  /**
   * Apply fallback strategies when readiness is not achieved
   */
  private async applyFallbackStrategies(
    result: ReadinessResult,
    config: SmartTimeoutConfig,
    page: Page,
    indicators: ReadinessIndicator[]
  ): Promise<Partial<ReadinessResult>> {
    // Determine fallback reason
    let fallbackReason = '';
    if (!result.scoreBreakdown.requiredPassed) {
      fallbackReason = 'required indicators failed';
    } else if (result.score < result.scoreBreakdown.scoreThreshold) {
      fallbackReason = 'low readiness scores';
    } else {
      fallbackReason = 'timeout exceeded';
    }

    if (config.performance.logDiagnostics) {
      console.log(`[SmartTimeoutManager] Applying fallback strategy: ${fallbackReason}`);
    }

    return {
      fallbackUsed: true,
      fallbackReason,
      ready: false // Fallback doesn't change ready state
    };
  }

  /**
   * Detect viewport type based on dimensions
   */
  private detectViewportType(viewport: { width: number; height: number } | null): 'mobile' | 'tablet' | 'desktop' {
    if (!viewport) return 'desktop';
    
    if (viewport.width <= 768) {
      return 'mobile';
    } else if (viewport.width <= 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Create a timeout promise that resolves with default value after specified time
   */
  private timeoutPromise<T>(timeoutMs: number, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(defaultValue), timeoutMs);
    });
  }

  /**
   * Create a timeout promise that rejects after specified time
   */
  private createTimeoutPromise<T>(timeoutMs: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: TimeoutMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Check if error matches retry condition type
   */
  private matchesRetryCondition(error: Error, conditionType: RetryConditionType): boolean {
    const message = error.message.toLowerCase();
    
    switch (conditionType) {
      case 'network_error':
        return message.includes('network') || 
               message.includes('connection') || 
               message.includes('fetch') ||
               message.includes('timeout');
      case 'timeout_error':
        return message.includes('timeout') || 
               message.includes('timed out');
      case 'element_not_found':
        return message.includes('element') || 
               message.includes('selector') ||
               message.includes('not found');
      case 'stale_element':
        return message.includes('stale') || 
               message.includes('detached');
      case 'page_crash':
        return message.includes('crash') || 
               message.includes('disconnected') ||
               message.includes('target closed');
      case 'custom':
        return true; // Custom conditions handled by caller
      default:
        return false;
    }
  }

  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(config: IntelligentRetryConfig, attempt: number): number {
    let delay: number;
    
    switch (config.backoffStrategy) {
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fibonacci':
        delay = config.baseDelay * this.fibonacci(attempt);
        break;
      default:
        delay = config.baseDelay;
    }

    // Apply jitter if enabled
    if (config.jitter) {
      const jitterRange = delay * 0.25; // ±25% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }

    // Ensure delay is within bounds
    return Math.min(Math.max(delay, 0), config.maxDelay);
  }

  /**
   * Calculate fibonacci number for fibonacci backoff
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 1;
    
    let a = 1, b = 1;
    for (let i = 3; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  /**
   * Create environment-specific configuration profiles
   */
  static createEnvironmentProfiles(): {
    local: SmartTimeoutConfig;
    ci: SmartTimeoutConfig;
    remote: SmartTimeoutConfig;
  } {
    const baseConfig = {
      progressiveStrategy: {
        initialWait: 100,
        backoffFactor: 1.5,
        checkInterval: 250,
        maxChecks: 40
      },
      performance: {
        enableMetrics: true,
        logDiagnostics: false
      },
      readinessScoring: {
        requiredIndicatorWeight: 0.1,
        fallbackOnLowScore: true,
        adaptiveScoring: true
      }
    };

    return {
      local: {
        environment: 'local',
        baseTimeouts: { fast: 1000, normal: 3000, slow: 6000 },
        progressiveStrategy: { ...baseConfig.progressiveStrategy, maxWait: 8000 },
        performance: { 
          ...baseConfig.performance, 
          targetReduction: 70,
          logDiagnostics: true 
        },
        readinessScoring: {
          ...baseConfig.readinessScoring,
          scoreThresholds: { local: 80, ci: 70, remote: 60 }
        }
      },
      ci: {
        environment: 'ci',
        baseTimeouts: { fast: 2000, normal: 5000, slow: 10000 },
        progressiveStrategy: { ...baseConfig.progressiveStrategy, maxWait: 15000 },
        performance: { 
          ...baseConfig.performance, 
          targetReduction: 50 
        },
        readinessScoring: {
          ...baseConfig.readinessScoring,
          scoreThresholds: { local: 80, ci: 70, remote: 60 }
        }
      },
      remote: {
        environment: 'remote',
        baseTimeouts: { fast: 3000, normal: 8000, slow: 15000 },
        progressiveStrategy: { ...baseConfig.progressiveStrategy, maxWait: 25000 },
        performance: { 
          ...baseConfig.performance, 
          targetReduction: 30 
        },
        readinessScoring: {
          ...baseConfig.readinessScoring,
          scoreThresholds: { local: 80, ci: 70, remote: 60 }
        }
      }
    };
  }

  /**
   * Create escalation strategies for different error types
   */
  static createEscalationStrategies(): {
    networkError: TimeoutEscalationStrategy;
    elementError: TimeoutEscalationStrategy;
    browserError: TimeoutEscalationStrategy;
    timeoutError: TimeoutEscalationStrategy;
    adaptive: TimeoutEscalationStrategy;
  } {
    return {
      networkError: {
        name: 'network-error',
        description: 'Escalation for network-related errors',
        shouldEscalate: (error) => error.message.toLowerCase().includes('network') || 
                                   error.message.toLowerCase().includes('connection'),
        getNextTimeout: (currentTimeout) => currentTimeout * 2.5,
        getMaxRetries: () => 8,
        onEscalation: (error, attempt, newTimeout) => {
          console.log(`[SmartTimeoutManager] Network error escalation: attempt ${attempt}, new timeout ${newTimeout}ms`);
        }
      },
      elementError: {
        name: 'element-error',
        description: 'Escalation for element-related errors',
        shouldEscalate: (error) => error.message.toLowerCase().includes('element') ||
                                   error.message.toLowerCase().includes('selector'),
        getNextTimeout: (currentTimeout) => currentTimeout * 1.8,
        getMaxRetries: () => 6,
        onEscalation: (error, attempt, newTimeout) => {
          console.log(`[SmartTimeoutManager] Element error escalation: attempt ${attempt}, new timeout ${newTimeout}ms`);
        }
      },
      browserError: {
        name: 'browser-error',
        description: 'Escalation for browser-related errors',
        shouldEscalate: (error) => error.message.toLowerCase().includes('crash') ||
                                   error.message.toLowerCase().includes('disconnected'),
        getNextTimeout: (currentTimeout) => currentTimeout * 3,
        getMaxRetries: () => 4,
        onEscalation: (error, attempt, newTimeout) => {
          console.log(`[SmartTimeoutManager] Browser error escalation: attempt ${attempt}, new timeout ${newTimeout}ms`);
        }
      },
      timeoutError: {
        name: 'timeout-error',
        description: 'Escalation for timeout-related errors',
        shouldEscalate: (error) => error.message.toLowerCase().includes('timeout'),
        getNextTimeout: (currentTimeout) => currentTimeout * 2,
        getMaxRetries: () => 5,
        onEscalation: (error, attempt, newTimeout) => {
          console.log(`[SmartTimeoutManager] Timeout error escalation: attempt ${attempt}, new timeout ${newTimeout}ms`);
        }
      },
      adaptive: {
        name: 'adaptive',
        description: 'Adaptive escalation based on error patterns',
        shouldEscalate: (error, attempt, duration) => {
          // Escalate if error persists and duration is reasonable
          return attempt <= 6 && duration < 5000;
        },
        getNextTimeout: (currentTimeout, attempt) => {
          // Adaptive timeout based on attempt number
          const multiplier = 1.5 + (attempt * 0.2);
          return currentTimeout * multiplier;
        },
        getMaxRetries: (error) => {
          // More retries for recoverable errors
          const message = error.message.toLowerCase();
          if (message.includes('network') || message.includes('timeout')) {
            return 8;
          }
          return 5;
        },
        onEscalation: (error, attempt, newTimeout) => {
          console.log(`[SmartTimeoutManager] Adaptive escalation: attempt ${attempt}, new timeout ${newTimeout}ms, error: ${error.message}`);
        }
      }
    };
  }

  /**
   * Create intelligent retry configurations for common scenarios
   */
  static createIntelligentRetryConfigs(): {
    webAutomation: IntelligentRetryConfig[];
    critical: IntelligentRetryConfig[];
    fast: IntelligentRetryConfig[];
  } {
    return {
      webAutomation: [
        {
          conditionType: 'network_error',
          maxRetries: 5,
          backoffStrategy: 'exponential',
          baseDelay: 500,
          maxDelay: 5000,
          jitter: true
        },
        {
          conditionType: 'timeout_error',
          maxRetries: 4,
          backoffStrategy: 'linear',
          baseDelay: 1000,
          maxDelay: 4000,
          jitter: false
        },
        {
          conditionType: 'element_not_found',
          maxRetries: 6,
          backoffStrategy: 'fibonacci',
          baseDelay: 250,
          maxDelay: 2000,
          jitter: true
        },
        {
          conditionType: 'stale_element',
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 200,
          maxDelay: 1000,
          jitter: false
        }
      ],
      critical: [
        {
          conditionType: 'network_error',
          maxRetries: 8,
          backoffStrategy: 'exponential',
          baseDelay: 1000,
          maxDelay: 10000,
          jitter: true
        },
        {
          conditionType: 'timeout_error',
          maxRetries: 6,
          backoffStrategy: 'fibonacci',
          baseDelay: 2000,
          maxDelay: 8000,
          jitter: true
        }
      ],
      fast: [
        {
          conditionType: 'network_error',
          maxRetries: 3,
          backoffStrategy: 'linear',
          baseDelay: 200,
          maxDelay: 1000,
          jitter: false
        },
        {
          conditionType: 'element_not_found',
          maxRetries: 2,
          backoffStrategy: 'linear',
          baseDelay: 100,
          maxDelay: 500,
          jitter: false
        }
      ]
    };
  }
}

/**
 * Utility function to create readiness indicators with defaults
 */
export function createReadinessIndicator(
  name: string,
  description: string,
  check: (page: Page) => Promise<boolean>,
  options?: {
    timeout?: number;
    required?: boolean;
    weight?: number;
    viewport?: 'mobile' | 'tablet' | 'desktop' | 'all';
  }
): ReadinessIndicator {
  return {
    name,
    description,
    check,
    timeout: options?.timeout ?? 2000,
    required: options?.required ?? false,
    weight: options?.weight ?? 0.5,
    viewport: options?.viewport ?? 'all'
  };
}

/**
 * Utility function to create progressive timeout configurations
 */
export function createProgressiveTimeoutConfig(
  operation: string,
  options?: {
    initialTimeout?: number;
    maxTimeout?: number;
    backoffFactor?: number;
    maxRetries?: number;
    escalationStrategy?: keyof ReturnType<typeof SmartTimeoutManager.createEscalationStrategies>;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error) => void;
  }
): ProgressiveTimeoutConfig {
  const config: ProgressiveTimeoutConfig = {
    operation,
    initialTimeout: options?.initialTimeout ?? 1000,
    maxTimeout: options?.maxTimeout ?? 10000,
    backoffFactor: options?.backoffFactor ?? 2,
    maxRetries: options?.maxRetries ?? 5,
    retryCondition: options?.retryCondition,
    onRetry: options?.onRetry
  };

  if (options?.escalationStrategy) {
    const strategies = SmartTimeoutManager.createEscalationStrategies();
    config.escalationStrategy = strategies[options.escalationStrategy];
  }

  return config;
}

/**
 * Utility function to create intelligent retry configurations
 */
export function createIntelligentRetryConfig(
  conditionType: RetryConditionType,
  options?: {
    maxRetries?: number;
    backoffStrategy?: 'linear' | 'exponential' | 'fibonacci';
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
  }
): IntelligentRetryConfig {
  return {
    conditionType,
    maxRetries: options?.maxRetries ?? 3,
    backoffStrategy: options?.backoffStrategy ?? 'exponential',
    baseDelay: options?.baseDelay ?? 500,
    maxDelay: options?.maxDelay ?? 5000,
    jitter: options?.jitter ?? true
  };
}