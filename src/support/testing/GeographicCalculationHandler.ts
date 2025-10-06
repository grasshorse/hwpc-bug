/**
 * Geographic Calculation Handler with Dual-Mode Support
 * Handles distance calculations for both isolated and production testing modes
 */

import { 
  GeoCoordinate, 
  LocationAssignmentTestContext,
  GeographicCalculationMode,
  ValidationResult 
} from './location-assignment-types';
import { TestMode } from './types';
import { GeographicUtilities } from './geographic-utilities';

export interface DistanceCalculationResult {
  distance: number;
  calculationMode: GeographicCalculationMode;
  fallbackUsed: boolean;
  error?: string;
}

export interface RouteCalculationOptions {
  mode?: GeographicCalculationMode;
  timeout?: number;
  retryCount?: number;
  fallbackToEuclidean?: boolean;
}

export class GeographicCalculationHandler {
  private readonly defaultTimeout = 5000; // 5 seconds
  private readonly defaultRetryCount = 3;
  private readonly cache = new Map<string, DistanceCalculationResult>();
  private readonly maxCacheSize = 1000;

  constructor(
    private readonly context: LocationAssignmentTestContext
  ) {}

  /**
   * Calculates distance between two coordinates with dual-mode support
   */
  public async calculateDistance(
    from: GeoCoordinate, 
    to: GeoCoordinate,
    options: RouteCalculationOptions = {}
  ): Promise<DistanceCalculationResult> {
    
    // Validate input coordinates
    const fromValidation = GeographicUtilities.validateCoordinate(from);
    const toValidation = GeographicUtilities.validateCoordinate(to);
    
    if (!fromValidation.isValid || !toValidation.isValid) {
      throw new Error(`Invalid coordinates: ${fromValidation.issues?.join(', ')} ${toValidation.issues?.join(', ')}`);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(from, to, options);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let result: DistanceCalculationResult;

    try {
      if (this.context.mode === TestMode.ISOLATED || options.mode === GeographicCalculationMode.EUCLIDEAN) {
        result = await this.calculateEuclideanDistance(from, to);
      } else {
        result = await this.calculateRealDistance(from, to, options);
      }
    } catch (error) {
      // Handle calculation failures with fallback
      result = await this.handleCalculationFailure(from, to, error as Error, options);
    }

    // Cache the result
    this.cacheResult(cacheKey, result);
    
    return result;
  }

  /**
   * Calculates Euclidean distance for isolated mode testing
   */
  private async calculateEuclideanDistance(
    from: GeoCoordinate, 
    to: GeoCoordinate
  ): Promise<DistanceCalculationResult> {
    
    try {
      const distance = GeographicUtilities.calculateEuclideanDistance(from, to);
      
      return {
        distance,
        calculationMode: GeographicCalculationMode.EUCLIDEAN,
        fallbackUsed: false
      };
    } catch (error) {
      throw new Error(`Euclidean distance calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Calculates real routing distance for production mode testing
   */
  private async calculateRealDistance(
    from: GeoCoordinate, 
    to: GeoCoordinate,
    options: RouteCalculationOptions
  ): Promise<DistanceCalculationResult> {
    
    const timeout = options.timeout || this.defaultTimeout;
    const retryCount = options.retryCount || this.defaultRetryCount;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const distance = await this.callRealRoutingService(from, to, timeout);
        
        return {
          distance,
          calculationMode: GeographicCalculationMode.REAL_ROUTING,
          fallbackUsed: false
        };
      } catch (error) {
        lastError = error as Error;
        
        // Log retry attempt
        console.warn(`Real routing calculation attempt ${attempt}/${retryCount} failed:`, error);
        
        // Wait before retry (exponential backoff)
        if (attempt < retryCount) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }
    
    // All retries failed, throw the last error
    throw lastError || new Error('Real routing calculation failed after all retries');
  }

  /**
   * Calls the real routing service (mock implementation for now)
   */
  private async callRealRoutingService(
    from: GeoCoordinate, 
    to: GeoCoordinate, 
    timeout: number
  ): Promise<number> {
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Routing service timeout')), timeout);
    });

    // Mock routing service call - in real implementation, this would call actual routing API
    const routingPromise = this.mockRoutingServiceCall(from, to);
    
    try {
      return await Promise.race([routingPromise, timeoutPromise]);
    } catch (error) {
      throw new Error(`Routing service call failed: ${(error as Error).message}`);
    }
  }

  /**
   * Mock routing service call for testing purposes
   * In production, this would be replaced with actual routing service integration
   */
  private async mockRoutingServiceCall(from: GeoCoordinate, to: GeoCoordinate): Promise<number> {
    // Simulate network delay
    await this.delay(100 + Math.random() * 200);
    
    // Simulate occasional failures for testing error handling
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Routing service temporarily unavailable');
    }
    
    // Calculate routing distance (typically 1.2-1.5x Euclidean distance for roads)
    const euclideanDistance = GeographicUtilities.calculateEuclideanDistance(from, to);
    const routingMultiplier = 1.2 + Math.random() * 0.3; // 1.2 to 1.5
    
    return euclideanDistance * routingMultiplier;
  }

  /**
   * Handles calculation failures with fallback mechanisms
   */
  private async handleCalculationFailure(
    from: GeoCoordinate, 
    to: GeoCoordinate, 
    error: Error,
    options: RouteCalculationOptions
  ): Promise<DistanceCalculationResult> {
    
    const shouldFallback = options.fallbackToEuclidean !== false && 
                          this.context.config.fallbackToEuclidean;
    
    if (shouldFallback) {
      console.warn('Distance calculation failed, using Euclidean fallback:', error.message);
      
      try {
        const distance = GeographicUtilities.calculateEuclideanDistance(from, to);
        
        return {
          distance,
          calculationMode: GeographicCalculationMode.EUCLIDEAN,
          fallbackUsed: true,
          error: error.message
        };
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback calculations failed: ${error.message}, ${(fallbackError as Error).message}`);
      }
    } else {
      throw error;
    }
  }

  /**
   * Batch calculates distances for multiple coordinate pairs
   */
  public async calculateDistances(
    coordinatePairs: Array<{ from: GeoCoordinate; to: GeoCoordinate }>,
    options: RouteCalculationOptions = {}
  ): Promise<DistanceCalculationResult[]> {
    
    const results: DistanceCalculationResult[] = [];
    const batchSize = 10; // Process in batches to avoid overwhelming the service
    
    for (let i = 0; i < coordinatePairs.length; i += batchSize) {
      const batch = coordinatePairs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(pair => 
        this.calculateDistance(pair.from, pair.to, options)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // Handle batch failures - could implement partial success handling here
        throw new Error(`Batch distance calculation failed at batch starting index ${i}: ${(error as Error).message}`);
      }
    }
    
    return results;
  }

  /**
   * Validates calculation configuration
   */
  public validateConfiguration(): ValidationResult {
    const issues: string[] = [];
    
    if (!this.context) {
      issues.push('LocationAssignmentTestContext is required');
    }
    
    if (!this.context.config) {
      issues.push('LocationTestConfig is required');
    }
    
    if (this.context.mode === TestMode.PRODUCTION && !this.context.config.useRealDistanceCalculation) {
      issues.push('Production mode requires real distance calculation to be enabled');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Clears the distance calculation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Generates a cache key for coordinate pairs
   */
  private generateCacheKey(
    from: GeoCoordinate, 
    to: GeoCoordinate, 
    options: RouteCalculationOptions
  ): string {
    const mode = options.mode || (this.context.mode === TestMode.ISOLATED ? 
      GeographicCalculationMode.EUCLIDEAN : GeographicCalculationMode.REAL_ROUTING);
    
    return `${from.lat.toFixed(6)},${from.lng.toFixed(6)}-${to.lat.toFixed(6)},${to.lng.toFixed(6)}-${mode}`;
  }

  /**
   * Caches a calculation result with size management
   */
  private cacheResult(key: string, result: DistanceCalculationResult): void {
    // Implement LRU cache behavior
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, result);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}