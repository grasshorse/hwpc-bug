/**
 * Location Service Implementations
 * Provides both mock and real service implementations for dual-mode testing
 */

import { 
  LocationService,
  GeoCoordinate, 
  GeoPolygon, 
  LocationTestRoute,
  ValidationResult,
  LocationAssignmentTestContext,
  GeographicCalculationMode
} from './location-assignment-types';
import { TestMode } from './types';
import { GeographicUtilities } from './geographic-utilities';
import { GeographicCalculationHandler, DistanceCalculationResult } from './GeographicCalculationHandler';

export interface LocationServiceCache {
  nearbyRoutes: Map<string, { routes: LocationTestRoute[]; timestamp: number }>;
  serviceAreaChecks: Map<string, { result: boolean; timestamp: number }>;
}

export interface LocationServiceConfig {
  cacheTimeout: number; // milliseconds
  maxCacheSize: number;
  enableCaching: boolean;
  defaultSearchRadius: number; // kilometers
}

/**
 * Abstract base class for location services
 */
export abstract class BaseLocationService implements LocationService {
  protected cache: LocationServiceCache;
  protected config: LocationServiceConfig;
  protected calculationHandler: GeographicCalculationHandler;

  constructor(
    protected context: LocationAssignmentTestContext,
    config?: Partial<LocationServiceConfig>
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 500,
      enableCaching: true,
      defaultSearchRadius: 50, // 50km default
      ...config
    };

    this.cache = {
      nearbyRoutes: new Map(),
      serviceAreaChecks: new Map()
    };

    this.calculationHandler = new GeographicCalculationHandler(context);
  }

  abstract calculateDistance(from: GeoCoordinate, to: GeoCoordinate): Promise<number>;
  abstract findNearbyRoutes(location: GeoCoordinate, radius: number): Promise<LocationTestRoute[]>;

  /**
   * Checks if a location is within a service area polygon
   */
  public isInServiceArea(location: GeoCoordinate, serviceArea: GeoPolygon): boolean {
    const cacheKey = this.generateServiceAreaCacheKey(location, serviceArea);
    
    if (this.config.enableCaching) {
      const cached = this.cache.serviceAreaChecks.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.result;
      }
    }

    const result = GeographicUtilities.isPointInPolygon(location, serviceArea);
    
    if (this.config.enableCaching) {
      this.cacheServiceAreaCheck(cacheKey, result);
    }

    return result;
  }

  /**
   * Validates a location coordinate
   */
  public validateLocation(location: GeoCoordinate): ValidationResult {
    return GeographicUtilities.validateCoordinate(location);
  }

  /**
   * Clears all caches
   */
  public clearCache(): void {
    this.cache.nearbyRoutes.clear();
    this.cache.serviceAreaChecks.clear();
  }

  /**
   * Gets cache statistics
   */
  public getCacheStats(): { 
    nearbyRoutesSize: number; 
    serviceAreaChecksSize: number; 
    maxSize: number 
  } {
    return {
      nearbyRoutesSize: this.cache.nearbyRoutes.size,
      serviceAreaChecksSize: this.cache.serviceAreaChecks.size,
      maxSize: this.config.maxCacheSize
    };
  }

  protected generateNearbyRoutesCacheKey(location: GeoCoordinate, radius: number): string {
    return `nearby-${location.lat.toFixed(6)},${location.lng.toFixed(6)}-${radius}`;
  }

  protected generateServiceAreaCacheKey(location: GeoCoordinate, serviceArea: GeoPolygon): string {
    const areaId = serviceArea.name || `area-${serviceArea.coordinates.length}`;
    return `service-${location.lat.toFixed(6)},${location.lng.toFixed(6)}-${areaId}`;
  }

  protected isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.cacheTimeout;
  }

  protected cacheNearbyRoutes(key: string, routes: LocationTestRoute[]): void {
    this.manageCacheSize(this.cache.nearbyRoutes);
    this.cache.nearbyRoutes.set(key, { routes, timestamp: Date.now() });
  }

  protected cacheServiceAreaCheck(key: string, result: boolean): void {
    this.manageCacheSize(this.cache.serviceAreaChecks);
    this.cache.serviceAreaChecks.set(key, { result, timestamp: Date.now() });
  }

  protected manageCacheSize<T>(cache: Map<string, T>): void {
    if (cache.size >= this.config.maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }
}

/**
 * Mock Location Service for isolated testing
 */
export class MockLocationService extends BaseLocationService {
  private testRoutes: LocationTestRoute[] = [];

  constructor(
    context: LocationAssignmentTestContext,
    config?: Partial<LocationServiceConfig>
  ) {
    super(context, config);
    this.initializeTestRoutes();
  }

  /**
   * Calculates distance using Euclidean calculation
   */
  public async calculateDistance(from: GeoCoordinate, to: GeoCoordinate): Promise<number> {
    const result = await this.calculationHandler.calculateDistance(from, to, {
      mode: GeographicCalculationMode.EUCLIDEAN,
      fallbackToEuclidean: true
    });
    return result.distance;
  }

  /**
   * Finds nearby routes using controlled test data
   */
  public async findNearbyRoutes(location: GeoCoordinate, radius: number): Promise<LocationTestRoute[]> {
    const cacheKey = this.generateNearbyRoutesCacheKey(location, radius);
    
    if (this.config.enableCaching) {
      const cached = this.cache.nearbyRoutes.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.routes;
      }
    }

    const nearbyRoutes: LocationTestRoute[] = [];

    for (const route of this.testRoutes) {
      // Check if location is within service area
      if (this.isInServiceArea(location, route.serviceArea)) {
        nearbyRoutes.push(route);
        continue;
      }

      // Check if location is within radius of service area center
      const serviceAreaCenter = GeographicUtilities.calculateCenterPoint(route.serviceArea.coordinates);
      const distance = await this.calculateDistance(location, serviceAreaCenter);
      
      if (distance <= radius) {
        nearbyRoutes.push(route);
      }
    }

    // Sort by distance from location
    const routesWithDistance = await Promise.all(
      nearbyRoutes.map(async route => {
        const center = GeographicUtilities.calculateCenterPoint(route.serviceArea.coordinates);
        const distance = await this.calculateDistance(location, center);
        return { route, distance };
      })
    );

    routesWithDistance.sort((a, b) => a.distance - b.distance);
    const sortedRoutes = routesWithDistance.map(item => item.route);

    if (this.config.enableCaching) {
      this.cacheNearbyRoutes(cacheKey, sortedRoutes);
    }

    return sortedRoutes;
  }

  /**
   * Adds a test route to the mock service
   */
  public addTestRoute(route: LocationTestRoute): void {
    this.testRoutes.push(route);
  }

  /**
   * Sets all test routes
   */
  public setTestRoutes(routes: LocationTestRoute[]): void {
    this.testRoutes = routes;
  }

  /**
   * Gets all test routes
   */
  public getTestRoutes(): LocationTestRoute[] {
    return [...this.testRoutes];
  }

  /**
   * Initializes predefined test routes for controlled testing
   */
  private initializeTestRoutes(): void {
    const testServiceAreas = GeographicUtilities.createTestServiceAreas();
    
    this.testRoutes = [
      {
        id: 'test-route-north-001',
        name: 'Test Route North - looneyTunesTest',
        serviceArea: testServiceAreas[0],
        capacity: 10,
        currentLoad: 3,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'tech-001',
        technicianName: 'Bugs Bunny - looneyTunesTest'
      },
      {
        id: 'test-route-south-001',
        name: 'Test Route South - looneyTunesTest',
        serviceArea: testServiceAreas[1],
        capacity: 8,
        currentLoad: 5,
        schedule: {
          startTime: '09:00',
          endTime: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'tech-002',
        technicianName: 'Daffy Duck - looneyTunesTest'
      },
      {
        id: 'test-route-full-capacity',
        name: 'Test Route Full - looneyTunesTest',
        serviceArea: {
          name: 'Test Service Area Full',
          coordinates: [
            { lat: 42.5100, lng: -92.5100 },
            { lat: 42.5100, lng: -92.4900 },
            { lat: 42.5300, lng: -92.4900 },
            { lat: 42.5300, lng: -92.5100 },
            { lat: 42.5100, lng: -92.5100 }
          ]
        },
        capacity: 5,
        currentLoad: 5, // At full capacity
        schedule: {
          startTime: '07:00',
          endTime: '16:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'tech-003',
        technicianName: 'Porky Pig - looneyTunesTest'
      }
    ];
  }
}

/**
 * Real Location Service for production testing
 */
export class RealLocationService extends BaseLocationService {
  
  constructor(
    context: LocationAssignmentTestContext,
    config?: Partial<LocationServiceConfig>
  ) {
    super(context, config);
  }

  /**
   * Calculates distance using real routing service
   */
  public async calculateDistance(from: GeoCoordinate, to: GeoCoordinate): Promise<number> {
    const result = await this.calculationHandler.calculateDistance(from, to, {
      mode: GeographicCalculationMode.REAL_ROUTING,
      fallbackToEuclidean: this.context.config.fallbackToEuclidean
    });
    return result.distance;
  }

  /**
   * Finds nearby routes using real route data
   */
  public async findNearbyRoutes(location: GeoCoordinate, radius: number): Promise<LocationTestRoute[]> {
    const cacheKey = this.generateNearbyRoutesCacheKey(location, radius);
    
    if (this.config.enableCaching) {
      const cached = this.cache.nearbyRoutes.get(cacheKey);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        return cached.routes;
      }
    }

    try {
      // In real implementation, this would query the actual route database
      const routes = await this.queryRealRouteDatabase(location, radius);
      
      // Filter to only test routes for safety
      const testRoutes = routes.filter(route => 
        route.isTestRoute && 
        route.name.includes('looneyTunesTest')
      );

      if (this.config.enableCaching) {
        this.cacheNearbyRoutes(cacheKey, testRoutes);
      }

      return testRoutes;
    } catch (error) {
      console.error('Failed to query real route database:', error);
      throw new Error(`Real route query failed: ${(error as Error).message}`);
    }
  }

  /**
   * Queries the real route database (mock implementation)
   */
  private async queryRealRouteDatabase(location: GeoCoordinate, radius: number): Promise<LocationTestRoute[]> {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Mock implementation - in production, this would be actual database queries
    // For now, return test routes that would exist in production
    return [
      {
        id: 'prod-test-route-001',
        name: 'Production Test Route Alpha - looneyTunesTest',
        serviceArea: {
          name: 'Production Test Area Alpha',
          coordinates: [
            { lat: location.lat - 0.01, lng: location.lng - 0.01 },
            { lat: location.lat - 0.01, lng: location.lng + 0.01 },
            { lat: location.lat + 0.01, lng: location.lng + 0.01 },
            { lat: location.lat + 0.01, lng: location.lng - 0.01 },
            { lat: location.lat - 0.01, lng: location.lng - 0.01 }
          ]
        },
        capacity: 12,
        currentLoad: 4,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'prod-tech-001',
        technicianName: 'Tweety Bird - looneyTunesTest'
      },
      {
        id: 'prod-test-route-002',
        name: 'Production Test Route Beta - looneyTunesTest',
        serviceArea: {
          name: 'Production Test Area Beta',
          coordinates: [
            { lat: location.lat - 0.02, lng: location.lng - 0.02 },
            { lat: location.lat - 0.02, lng: location.lng + 0.02 },
            { lat: location.lat + 0.02, lng: location.lng + 0.02 },
            { lat: location.lat + 0.02, lng: location.lng - 0.02 },
            { lat: location.lat - 0.02, lng: location.lng - 0.02 }
          ]
        },
        capacity: 15,
        currentLoad: 8,
        schedule: {
          startTime: '07:30',
          endTime: '16:30',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'prod-tech-002',
        technicianName: 'Sylvester Cat - looneyTunesTest'
      }
    ];
  }
}

/**
 * Location Service Factory
 */
export class LocationServiceFactory {
  
  /**
   * Creates appropriate location service based on test mode
   */
  public static createLocationService(
    context: LocationAssignmentTestContext,
    config?: Partial<LocationServiceConfig>
  ): LocationService {
    
    if (context.mode === TestMode.ISOLATED) {
      return new MockLocationService(context, config);
    } else {
      return new RealLocationService(context, config);
    }
  }

  /**
   * Creates a mock location service with custom test data
   */
  public static createMockLocationService(
    context: LocationAssignmentTestContext,
    testRoutes?: LocationTestRoute[],
    config?: Partial<LocationServiceConfig>
  ): MockLocationService {
    
    const service = new MockLocationService(context, config);
    
    if (testRoutes) {
      service.setTestRoutes(testRoutes);
    }
    
    return service;
  }
}