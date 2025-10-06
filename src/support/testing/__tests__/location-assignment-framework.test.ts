/**
 * Tests for Location Assignment Test Framework Foundation
 * Validates the basic functionality of the framework components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  LocationAssignmentTestFactory,
  LocationAssignmentTestUtils,
  GeographicUtilities,
  LocationAssignmentModeDetector,
  LocationAssignmentConfigManager,
  TestMode,
  GeoCoordinate,
  GeoPolygon,
  Priority,
  ServiceType
} from '../location-assignment-index';

describe('Location Assignment Test Framework Foundation', () => {
  describe('GeographicUtilities', () => {
    it('should validate valid coordinates', () => {
      const validCoord: GeoCoordinate = { lat: 42.5276, lng: -92.4453 };
      const result = GeographicUtilities.validateCoordinate(validCoord);
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should reject invalid coordinates', () => {
      const invalidCoord: GeoCoordinate = { lat: 200, lng: -300 };
      const result = GeographicUtilities.validateCoordinate(invalidCoord);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });

    it('should calculate Euclidean distance correctly', () => {
      const coord1: GeoCoordinate = { lat: 42.5000, lng: -92.5000 };
      const coord2: GeoCoordinate = { lat: 42.5100, lng: -92.5100 };
      
      const distance = GeographicUtilities.calculateEuclideanDistance(coord1, coord2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2); // Should be around 1.57km
    });

    it('should detect point in polygon correctly', () => {
      const polygon: GeoPolygon = {
        name: 'Test Polygon',
        coordinates: [
          { lat: 42.5000, lng: -92.5000 },
          { lat: 42.5000, lng: -92.4000 },
          { lat: 42.6000, lng: -92.4000 },
          { lat: 42.6000, lng: -92.5000 },
          { lat: 42.5000, lng: -92.5000 }
        ]
      };

      const insidePoint: GeoCoordinate = { lat: 42.5500, lng: -92.4500 };
      const outsidePoint: GeoCoordinate = { lat: 42.7000, lng: -92.3000 };

      expect(GeographicUtilities.isPointInPolygon(insidePoint, polygon)).toBe(true);
      expect(GeographicUtilities.isPointInPolygon(outsidePoint, polygon)).toBe(false);
    });

    it('should generate controlled test coordinates', () => {
      const coordinates = GeographicUtilities.createControlledTestCoordinates();
      
      expect(coordinates).toBeDefined();
      expect(coordinates.length).toBeGreaterThan(0);
      
      // Validate each coordinate
      coordinates.forEach(coord => {
        const validation = GeographicUtilities.validateCoordinate(coord);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('LocationAssignmentModeDetector', () => {
    let modeDetector: LocationAssignmentModeDetector;

    beforeEach(() => {
      modeDetector = new LocationAssignmentModeDetector();
    });

    it('should detect isolated mode from tags', () => {
      const testContext = {
        testName: 'Test Assignment',
        tags: ['@isolated', '@geographic'],
        testId: 'test-123'
      };

      const result = modeDetector.detectLocationAssignmentMode(testContext);
      
      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect production mode from tags', () => {
      const testContext = {
        testName: 'Test Assignment',
        tags: ['@production', '@routing'],
        testId: 'test-123'
      };

      const result = modeDetector.detectLocationAssignmentMode(testContext);
      
      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should create appropriate config for each mode', () => {
      const isolatedConfig = modeDetector.createLocationTestConfig(TestMode.ISOLATED);
      const productionConfig = modeDetector.createLocationTestConfig(TestMode.PRODUCTION);
      const dualConfig = modeDetector.createLocationTestConfig(TestMode.DUAL);

      expect(isolatedConfig.mode).toBe(TestMode.ISOLATED);
      expect(isolatedConfig.useRealDistanceCalculation).toBe(false);
      
      expect(productionConfig.mode).toBe(TestMode.PRODUCTION);
      expect(productionConfig.useRealDistanceCalculation).toBe(true);
      
      expect(dualConfig.mode).toBe(TestMode.DUAL);
    });
  });

  describe('LocationAssignmentConfigManager', () => {
    it('should create valid default configurations', () => {
      const isolatedConfig = LocationAssignmentConfigManager.createDefaultConfig(TestMode.ISOLATED);
      const productionConfig = LocationAssignmentConfigManager.createDefaultConfig(TestMode.PRODUCTION);
      const dualConfig = LocationAssignmentConfigManager.createDefaultConfig(TestMode.DUAL);

      // Validate configurations
      const isolatedValidation = LocationAssignmentConfigManager.validateConfig(isolatedConfig);
      const productionValidation = LocationAssignmentConfigManager.validateConfig(productionConfig);
      const dualValidation = LocationAssignmentConfigManager.validateConfig(dualConfig);

      expect(isolatedValidation.isValid).toBe(true);
      expect(productionValidation.isValid).toBe(true);
      expect(dualValidation.isValid).toBe(true);
    });

    it('should create scenario-specific configurations', () => {
      const optimalConfig = LocationAssignmentConfigManager.createScenarioConfig('optimal-assignment', TestMode.ISOLATED);
      const capacityConfig = LocationAssignmentConfigManager.createScenarioConfig('capacity-constraints', TestMode.ISOLATED);
      const bulkConfig = LocationAssignmentConfigManager.createScenarioConfig('bulk-assignment', TestMode.DUAL);

      expect(optimalConfig.searchRadius).toBe(30);
      expect(capacityConfig.maxRouteCapacity).toBe(5);
      expect(bulkConfig.maxRouteCapacity).toBe(30);
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = LocationAssignmentConfigManager.createDefaultConfig(TestMode.ISOLATED);
      invalidConfig.searchRadius = -10; // Invalid
      invalidConfig.maxRouteCapacity = 0; // Invalid

      const validation = LocationAssignmentConfigManager.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('LocationAssignmentTestFactory', () => {
    it('should create test context with proper structure', async () => {
      const context = await LocationAssignmentTestFactory.createTestContext(
        'Test Location Assignment',
        ['@isolated', '@assignment']
      );

      expect(context).toBeDefined();
      expect(context.testName).toBe('Test Location Assignment');
      expect(context.mode).toBe(TestMode.ISOLATED);
      expect(context.config).toBeDefined();
      expect(context.testData).toBeDefined();
      expect(context.services).toBeDefined();
    });

    it('should validate test context structure', async () => {
      const context = await LocationAssignmentTestFactory.createTestContext(
        'Test Validation',
        ['@dual']
      );

      const validation = LocationAssignmentTestFactory.validateTestContext(context);
      
      // Should have issues because services are not injected yet
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should generate appropriate tags for test types', () => {
      const assignmentTags = LocationAssignmentTestFactory.getRecommendedTags('assignment', TestMode.ISOLATED);
      const bulkTags = LocationAssignmentTestFactory.getRecommendedTags('bulk-assignment', TestMode.PRODUCTION);
      const routingTags = LocationAssignmentTestFactory.getRecommendedTags('routing', TestMode.DUAL);

      expect(assignmentTags).toContain('@location-assignment');
      expect(assignmentTags).toContain('@assignment');
      expect(assignmentTags).toContain('@isolated');

      expect(bulkTags).toContain('@bulk-assignment');
      expect(bulkTags).toContain('@production');

      expect(routingTags).toContain('@routing');
      expect(routingTags).toContain('@dual');
    });
  });

  describe('LocationAssignmentTestUtils', () => {
    it('should create mode-specific test contexts', async () => {
      const isolatedTest = await LocationAssignmentTestUtils.createIsolatedTest('Isolated Test');
      const productionTest = await LocationAssignmentTestUtils.createProductionTest('Production Test');
      const dualTest = await LocationAssignmentTestUtils.createDualTest('Dual Test');

      expect(isolatedTest.mode).toBe(TestMode.ISOLATED);
      expect(productionTest.mode).toBe(TestMode.PRODUCTION);
      expect(dualTest.mode).toBe(TestMode.DUAL);
    });

    it('should validate geographic data in context', async () => {
      const context = await LocationAssignmentTestUtils.createIsolatedTest('Geographic Validation Test');
      
      // Add some test data with valid coordinates
      context.testData.tickets = [{
        id: 'ticket-1',
        customerId: 'customer-1',
        customerName: 'Test Customer - looneyTunesTest',
        location: { lat: 42.5276, lng: -92.4453 },
        address: '123 Test St',
        priority: Priority.MEDIUM,
        serviceType: ServiceType.INSTALLATION,
        createdAt: new Date(),
        isTestData: true
      }];

      context.testData.routes = [{
        id: 'route-1',
        name: 'Test Route - looneyTunesTest',
        serviceArea: {
          name: 'Test Area',
          coordinates: [
            { lat: 42.5000, lng: -92.5000 },
            { lat: 42.5000, lng: -92.4000 },
            { lat: 42.6000, lng: -92.4000 },
            { lat: 42.6000, lng: -92.5000 },
            { lat: 42.5000, lng: -92.5000 }
          ]
        },
        capacity: 20,
        currentLoad: 5,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true
      }];

      const validation = LocationAssignmentTestUtils.validateGeographicData(context);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });
  });
});