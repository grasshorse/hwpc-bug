/**
 * Test Data Management System Tests
 * Verifies the GeographicTestDataGenerator, ProductionDataValidator, and ProductionTestDataManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeographicTestDataGenerator } from '../GeographicTestDataGenerator';
import { ProductionDataValidator } from '../ProductionDataValidator';
import { ProductionTestDataManager } from '../ProductionTestDataManager';
import { ProductionSafetyGuard } from '../ProductionSafetyGuard';
import { Priority, ServiceType } from '../location-assignment-types';
import { TestMode } from '../types';

describe('Test Data Management System', () => {
  describe('GeographicTestDataGenerator', () => {
    it('should generate controlled test locations for isolated mode', () => {
      const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.ISOLATED, 5);
      
      expect(locations).toHaveLength(5);
      expect(locations[0].name).toBe('Test Location A');
      expect(locations[0].isTestLocation).toBe(true);
      expect(locations[0].lat).toBe(42.5000);
      expect(locations[0].lng).toBe(-92.5000);
    });

    it('should generate production test locations with looneyTunesTest naming', () => {
      const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.PRODUCTION, 3);
      
      expect(locations).toHaveLength(3);
      locations.forEach(location => {
        expect(location.name).toContain('looneyTunesTest');
        expect(location.address).toContain('looneyTunesTest');
        expect(location.isTestLocation).toBe(true);
      });
    });

    it('should generate test tickets for optimal assignment scenario', () => {
      const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.ISOLATED, 5);
      const tickets = GeographicTestDataGenerator.generateTestTickets('optimal-assignment', locations, TestMode.ISOLATED);
      
      expect(tickets).toHaveLength(5);
      tickets.forEach(ticket => {
        expect(ticket.isTestData).toBe(true);
        expect(Object.values(Priority)).toContain(ticket.priority);
        expect(Object.values(ServiceType)).toContain(ticket.serviceType);
      });
    });

    it('should generate test routes for different scenarios', () => {
      const routes = GeographicTestDataGenerator.generateTestRoutes('optimal-assignment', TestMode.ISOLATED);
      
      expect(routes.length).toBeGreaterThan(0);
      routes.forEach(route => {
        expect(route.isTestRoute).toBe(true);
        expect(route.capacity).toBeGreaterThan(0);
        expect(route.currentLoad).toBeGreaterThanOrEqual(0);
        expect(route.currentLoad).toBeLessThanOrEqual(route.capacity);
      });
    });

    it('should generate complete test scenario', () => {
      const scenario = GeographicTestDataGenerator.generateTestScenario('capacity-constraints', TestMode.ISOLATED);
      
      expect(scenario.name).toBe('capacity-constraints');
      expect(scenario.mode).toBe(TestMode.ISOLATED);
      expect(scenario.tickets.length).toBeGreaterThan(0);
      expect(scenario.routes.length).toBeGreaterThan(0);
      expect(scenario.expectedBehavior).toBe('warning');
      expect(scenario.validationRules.length).toBeGreaterThan(0);
    });
  });

  describe('ProductionDataValidator', () => {
    it('should validate test tickets correctly', () => {
      const validTicket = {
        id: 'test-ticket-1',
        customerId: 'test-customer-1',
        customerName: 'Bugs Bunny Customer - looneyTunesTest',
        location: { lat: 42.4619, lng: -92.3426 },
        address: '123 Test Street - looneyTunesTest',
        priority: Priority.MEDIUM,
        serviceType: ServiceType.REPAIR,
        createdAt: new Date(),
        isTestData: true
      };

      const validation = ProductionDataValidator.validateTestTicket(validTicket);
      expect(validation.isValid).toBe(true);
    });

    it('should reject tickets without looneyTunesTest identifier', () => {
      const invalidTicket = {
        id: 'test-ticket-1',
        customerId: 'test-customer-1',
        customerName: 'Regular Customer Name',
        location: { lat: 42.4619, lng: -92.3426 },
        address: '123 Regular Street',
        priority: Priority.MEDIUM,
        serviceType: ServiceType.REPAIR,
        createdAt: new Date(),
        isTestData: true
      };

      const validation = ProductionDataValidator.validateTestTicket(invalidTicket);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain(expect.stringContaining('looneyTunesTest'));
    });

    it('should validate test routes correctly', () => {
      const validRoute = {
        id: 'test-route-1',
        name: 'Bugs Bunny Route - looneyTunesTest',
        serviceArea: {
          coordinates: [
            { lat: 42.4500, lng: -92.4000 },
            { lat: 42.4500, lng: -92.3000 },
            { lat: 42.5000, lng: -92.3000 },
            { lat: 42.5000, lng: -92.4000 },
            { lat: 42.4500, lng: -92.4000 }
          ]
        },
        capacity: 10,
        currentLoad: 3,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'test-tech-1',
        technicianName: 'Bugs Bunny Tech - looneyTunesTest'
      };

      const validation = ProductionDataValidator.validateTestRoute(validRoute);
      expect(validation.isValid).toBe(true);
    });

    it('should validate test locations correctly', () => {
      const validLocation = {
        name: 'Bugs Bunny Location - looneyTunesTest',
        lat: 42.4619,
        lng: -92.3426,
        address: '123 Carrot Lane - looneyTunesTest',
        isTestLocation: true
      };

      const validation = ProductionDataValidator.validateTestLocation(validLocation);
      expect(validation.isValid).toBe(true);
    });

    it('should validate batch data correctly', () => {
      const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.PRODUCTION, 3);
      const tickets = GeographicTestDataGenerator.generateTestTickets('optimal-assignment', locations, TestMode.PRODUCTION);
      const routes = GeographicTestDataGenerator.generateTestRoutes('optimal-assignment', TestMode.PRODUCTION);

      const validation = ProductionDataValidator.validateTestDataBatch({
        tickets,
        routes,
        locations
      });

      expect(validation.isValid).toBe(true);
    });
  });

  describe('ProductionTestDataManager', () => {
    let manager: ProductionTestDataManager;

    beforeEach(() => {
      manager = new ProductionTestDataManager({
        validateBeforeUse: true,
        requireLooneyTunesNaming: true,
        enforceTestServiceAreas: true,
        maxTestDataAge: 24,
        autoCleanup: false
      });
    });

    it('should initialize with correct configuration', () => {
      const config = manager.getConfig();
      expect(config.validateBeforeUse).toBe(true);
      expect(config.requireLooneyTunesNaming).toBe(true);
      expect(config.enforceTestServiceAreas).toBe(true);
    });

    it('should update configuration correctly', () => {
      manager.updateConfig({ autoCleanup: true, maxTestDataAge: 48 });
      const config = manager.getConfig();
      expect(config.autoCleanup).toBe(true);
      expect(config.maxTestDataAge).toBe(48);
    });

    it('should check test data existence', async () => {
      const existence = await manager.checkTestDataExistence();
      expect(existence).toHaveProperty('tickets');
      expect(existence).toHaveProperty('routes');
      expect(existence).toHaveProperty('locations');
      expect(existence).toHaveProperty('assignments');
    });
  });

  describe('ProductionSafetyGuard', () => {
    let safetyGuard: ProductionSafetyGuard;

    beforeEach(() => {
      safetyGuard = new ProductionSafetyGuard({
        allowProductionWrites: false,
        requireTestIdentifiers: true,
        enforceServiceAreaBounds: true,
        maxBatchSize: 10,
        requireApprovalForHighRisk: true,
        logAllOperations: true
      });
    });

    it('should validate assignment safety', () => {
      const safeAssignment = {
        id: 'test-assignment-1',
        ticketId: 'test-ticket-1',
        routeId: 'test-route-1',
        assignedBy: 'test-user',
        assignedAt: new Date(),
        overrideReason: undefined,
        estimatedDistance: 5.2,
        sequenceOrder: 1
      };

      const result = safetyGuard.validateAssignmentSafety(safeAssignment);
      expect(result.riskLevel).toBe('critical'); // Because production writes are disabled
      expect(result.isSafe).toBe(false);
    });

    it('should validate batch assignment safety', () => {
      const assignments = Array.from({ length: 15 }, (_, i) => ({
        id: `test-assignment-${i + 1}`,
        ticketId: `test-ticket-${i + 1}`,
        routeId: `test-route-${i + 1}`,
        assignedBy: 'test-user',
        assignedAt: new Date(),
        overrideReason: undefined,
        estimatedDistance: 5.2,
        sequenceOrder: i + 1
      }));

      const result = safetyGuard.validateBatchAssignmentSafety(assignments);
      expect(result.riskLevel).not.toBe('low'); // Should flag large batch size
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate ticket creation safety', () => {
      const safeTicket = {
        id: 'test-ticket-1',
        customerId: 'test-customer-1',
        customerName: 'Bugs Bunny Customer - looneyTunesTest',
        location: { lat: 42.4619, lng: -92.3426 },
        address: '123 Test Street - looneyTunesTest',
        priority: Priority.MEDIUM,
        serviceType: ServiceType.REPAIR,
        createdAt: new Date(),
        isTestData: true
      };

      const result = safetyGuard.validateTicketCreationSafety(safeTicket);
      expect(result.isSafe).toBe(true);
      expect(result.riskLevel).toBe('low');
    });

    it('should log operations when configured', () => {
      const assignment = {
        id: 'test-assignment-1',
        ticketId: 'test-ticket-1',
        routeId: 'test-route-1',
        assignedBy: 'test-user',
        assignedAt: new Date(),
        overrideReason: undefined,
        estimatedDistance: 5.2,
        sequenceOrder: 1
      };

      safetyGuard.validateAssignmentSafety(assignment);
      const log = safetyGuard.getOperationLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].operation).toBe('assignment_validation');
    });
  });
});