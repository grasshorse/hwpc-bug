/**
 * Tests for LocationService implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocationServiceFactory, MockLocationService, RealLocationService } from '../LocationServiceImplementations';
import { 
  LocationAssignmentTestContext, 
  GeoCoordinate, 
  LocationTestRoute,
  LocationTestConfig 
} from '../location-assignment-types';
import { TestMode } from '../types';

describe('LocationService Implementations', () => {
  let context: LocationAssignmentTestContext;
  const testLocation: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };

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
      testName: 'test-location-service',
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
        locationService: {} as any,
        routeService: {} as any,
        assignmentService: {} as any
      },
      config
    };
  });

  describe('LocationServiceFactory', () => {
    it('should create MockLocationService for isolated mode', () => {
      context.mode = TestMode.ISOLATED;
      const service = LocationServiceFactory.createLocationService(context);
      expect(service).toBeInstanceOf(MockLocationService);
    });

    it('should create RealLocationService for production mode', () => {
      context.mode = TestMode.PRODUCTION;
      const service = LocationServiceFactory.createLocationService(context);
      expect(service).toBeInstanceOf(RealLocationService);
    });
  });

  describe('MockLocationService', () => {
    let mockService: MockLocationService;

    beforeEach(() => {
      mockService = new MockLocationService(context);
    });

    it('should calculate distance using Euclidean method', async () => {
      const from: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };
      const to: GeoCoordinate = { lat: 42.5100, lng: -92.5100 };
      
      const distance = await mockService.calculateDistance(from, to);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(50); // Should be reasonable distance
    });

    it('should find nearby routes', async () => {
      const routes = await mockService.findNearbyRoutes(testLocation, 50);
      
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
      
      // All routes should be test routes
      routes.forEach(route => {
        expect(route.isTestRoute).toBe(true);
        expect(route.name).toContain('looneyTunesTest');
      });
    });

    it('should validate locations correctly', () => {
      const validLocation: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };
      const invalidLocation: GeoCoordinate = { lat: 200, lng: -300 };
      
      const validResult = mockService.validateLocation(validLocation);
      const invalidResult = mockService.validateLocation(invalidLocation);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should check service area boundaries', () => {
      const testRoutes = mockService.getTestRoutes();
      expect(testRoutes.length).toBeGreaterThan(0);
      
      const route = testRoutes[0];
      const serviceAreaCenter = {
        lat: route.serviceArea.coordinates[0].lat + 0.001,
        lng: route.serviceArea.coordinates[0].lng + 0.001
      };
      
      const isInArea = mockService.isInServiceArea(serviceAreaCenter, route.serviceArea);
      // This might be true or false depending on the exact coordinates, but should not throw
      expect(typeof isInArea).toBe('boolean');
    });

    it('should manage test routes', () => {
      const initialRoutes = mockService.getTestRoutes();
      const initialCount = initialRoutes.length;
      
      const newRoute: LocationTestRoute = {
        id: 'test-new-route',
        name: 'New Test Route - looneyTunesTest',
        serviceArea: {
          name: 'New Test Area',
          coordinates: [
            { lat: 42.6000, lng: -92.6000 },
            { lat: 42.6000, lng: -92.5900 },
            { lat: 42.6100, lng: -92.5900 },
            { lat: 42.6100, lng: -92.6000 },
            { lat: 42.6000, lng: -92.6000 }
          ]
        },
        capacity: 5,
        currentLoad: 2,
        schedule: {
          startTime: '09:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true
      };
      
      mockService.addTestRoute(newRoute);
      
      const updatedRoutes = mockService.getTestRoutes();
      expect(updatedRoutes.length).toBe(initialCount + 1);
      expect(updatedRoutes).toContain(newRoute);
    });
  });

  describe('RealLocationService', () => {
    let realService: RealLocationService;

    beforeEach(() => {
      context.mode = TestMode.PRODUCTION;
      realService = new RealLocationService(context);
    });

    it('should calculate distance using real routing', async () => {
      const from: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };
      const to: GeoCoordinate = { lat: 42.5100, lng: -92.5100 };
      
      const distance = await realService.calculateDistance(from, to);
      expect(distance).toBeGreaterThan(0);
    });

    it('should find nearby routes from production data', async () => {
      const routes = await realService.findNearbyRoutes(testLocation, 50);
      
      expect(Array.isArray(routes)).toBe(true);
      
      // All routes should be test routes for safety
      routes.forEach(route => {
        expect(route.isTestRoute).toBe(true);
        expect(route.name).toContain('looneyTunesTest');
      });
    });
  });

  describe('Cache functionality', () => {
    let service: MockLocationService;

    beforeEach(() => {
      service = new MockLocationService(context, { enableCaching: true });
    });

    it('should cache nearby routes', async () => {
      // First call
      const routes1 = await service.findNearbyRoutes(testLocation, 25);
      
      // Second call (should use cache)
      const routes2 = await service.findNearbyRoutes(testLocation, 25);
      
      expect(routes1).toEqual(routes2);
      
      const stats = service.getCacheStats();
      expect(stats.nearbyRoutesSize).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await service.findNearbyRoutes(testLocation, 25);
      
      let stats = service.getCacheStats();
      expect(stats.nearbyRoutesSize).toBeGreaterThan(0);
      
      service.clearCache();
      
      stats = service.getCacheStats();
      expect(stats.nearbyRoutesSize).toBe(0);
      expect(stats.serviceAreaChecksSize).toBe(0);
    });
  });
});