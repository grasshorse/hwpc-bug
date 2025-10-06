/**
 * Tests for GeographicCalculationHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeographicCalculationHandler } from '../GeographicCalculationHandler';
import { LocationServiceFactory } from '../LocationServiceImplementations';
import { 
  LocationAssignmentTestContext, 
  GeoCoordinate, 
  GeographicCalculationMode,
  LocationTestConfig 
} from '../location-assignment-types';
import { TestMode } from '../types';

describe('GeographicCalculationHandler', () => {
  let context: LocationAssignmentTestContext;
  let handler: GeographicCalculationHandler;

  const testCoordinate1: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };
  const testCoordinate2: GeoCoordinate = { lat: 42.5100, lng: -92.5100 };

  beforeEach(() => {
    const config: LocationTestConfig = {
      mode: TestMode.ISOLATED,
      searchRadius: 50,
      maxRouteCapacity: 10,
      enableGeographicValidation: true,
      useRealDistanceCalculation: false,
      testServiceAreas: [],
      fallbackToEuclidean: true
    };

    context = {
      testName: 'test-geographic-calculation',
      tags: ['@isolated'],
      testId: 'test-001',
      mode: TestMode.ISOLATED,
      testData: {
        customers: [],
        tickets: [],
        routes: [],
        locations: [],
        assignments: [],
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-run-001'
        }
      },
      services: {
        locationService: LocationServiceFactory.createLocationService({} as any),
        routeService: {} as any,
        assignmentService: {} as any
      },
      config
    };

    handler = new GeographicCalculationHandler(context);
  });

  describe('calculateDistance', () => {
    it('should calculate Euclidean distance in isolated mode', async () => {
      const result = await handler.calculateDistance(testCoordinate1, testCoordinate2);
      
      expect(result.distance).toBeGreaterThan(0);
      expect(result.calculationMode).toBe(GeographicCalculationMode.EUCLIDEAN);
      expect(result.fallbackUsed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid coordinates', async () => {
      const invalidCoordinate: GeoCoordinate = { lat: 200, lng: -300 };
      
      await expect(
        handler.calculateDistance(testCoordinate1, invalidCoordinate)
      ).rejects.toThrow('Invalid coordinates');
    });

    it('should use fallback when calculation fails', async () => {
      // Set context to production mode to trigger real routing, then expect fallback
      context.mode = TestMode.PRODUCTION;
      context.config.fallbackToEuclidean = true;
      
      const result = await handler.calculateDistance(testCoordinate1, testCoordinate2);
      
      expect(result.distance).toBeGreaterThan(0);
      // Should either succeed with real routing or fallback to Euclidean
      expect([GeographicCalculationMode.REAL_ROUTING, GeographicCalculationMode.EUCLIDEAN])
        .toContain(result.calculationMode);
    });
  });

  describe('calculateDistances', () => {
    it('should calculate multiple distances', async () => {
      const coordinatePairs = [
        { from: testCoordinate1, to: testCoordinate2 },
        { from: testCoordinate2, to: { lat: 42.5200, lng: -92.5000 } }
      ];

      const results = await handler.calculateDistances(coordinatePairs);
      
      expect(results).toHaveLength(2);
      expect(results[0].distance).toBeGreaterThan(0);
      expect(results[1].distance).toBeGreaterThan(0);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate valid configuration', () => {
      const result = handler.validateConfiguration();
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid configuration', () => {
      // Create handler with invalid context
      const invalidHandler = new GeographicCalculationHandler({} as any);
      const result = invalidHandler.validateConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should cache calculation results', async () => {
      // First calculation
      const result1 = await handler.calculateDistance(testCoordinate1, testCoordinate2);
      
      // Second calculation (should use cache)
      const result2 = await handler.calculateDistance(testCoordinate1, testCoordinate2);
      
      expect(result1.distance).toBe(result2.distance);
      
      const stats = handler.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await handler.calculateDistance(testCoordinate1, testCoordinate2);
      
      let stats = handler.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      
      handler.clearCache();
      
      stats = handler.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});