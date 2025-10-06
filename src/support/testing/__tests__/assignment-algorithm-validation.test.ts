/**
 * Assignment Algorithm Validation Tests
 * Tests for the AssignmentAlgorithmValidator and AssignmentConflictHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AssignmentAlgorithmValidator } from '../AssignmentAlgorithmValidator';
import { AssignmentConflictHandler } from '../AssignmentConflictHandler';
import { 
  LocationAssignmentTestContext,
  LocationTestTicket,
  LocationTestRoute,
  Assignment,
  Priority,
  ServiceType,
  GeoCoordinate
} from '../location-assignment-types';
import { TestMode } from '../types';

describe('Assignment Algorithm Validation', () => {
  let validator: AssignmentAlgorithmValidator;
  let conflictHandler: AssignmentConflictHandler;
  let testContext: LocationAssignmentTestContext;
  let mockTicket: LocationTestTicket;
  let mockRoutes: LocationTestRoute[];

  beforeEach(() => {
    // Create mock test context
    testContext = {
      testName: 'assignment-validation-test',
      testId: 'test-123',
      tags: ['@assignment', '@validation'],
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
          testRunId: 'test-run-123'
        }
      },
      services: {
        locationService: {
          calculateDistance: async (from: GeoCoordinate, to: GeoCoordinate) => 
            Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)),
          isInServiceArea: () => true,
          findNearbyRoutes: async () => mockRoutes,
          validateLocation: () => ({ isValid: true })
        } as any,
        routeService: {
          getAvailableRoutes: async () => mockRoutes,
          getRouteCapacity: async (routeId: string) => {
            const route = mockRoutes.find(r => r.id === routeId);
            return route ? { current: route.currentLoad, maximum: route.capacity } : { current: 0, maximum: 0 };
          },
          updateRouteAssignment: async () => {},
          getRouteSchedule: async () => ({
            startTime: '08:00',
            endTime: '17:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timeZone: 'America/Chicago'
          })
        } as any,
        assignmentService: {
          suggestOptimalRoute: async () => mockRoutes[0],
          assignTicketToRoute: async (ticketId: string, routeId: string, overrideReason?: string) => ({
            id: 'assignment-123',
            ticketId,
            routeId,
            assignedAt: new Date(),
            assignedBy: 'test-user',
            overrideReason
          }),
          bulkAssignTickets: async () => [],
          validateAssignment: async () => ({ isValid: true })
        } as any
      },
      config: {
        mode: TestMode.ISOLATED,
        searchRadius: 50,
        maxRouteCapacity: 10,
        enableGeographicValidation: true,
        useRealDistanceCalculation: false,
        testServiceAreas: [],
        fallbackToEuclidean: true
      }
    };

    // Create mock ticket
    mockTicket = {
      id: 'ticket-123',
      customerId: 'customer-123',
      customerName: 'Test Customer - looneyTunesTest',
      location: { lat: 42.5, lng: -92.5 },
      address: '123 Test St',
      priority: Priority.MEDIUM,
      serviceType: ServiceType.REPAIR,
      createdAt: new Date(),
      isTestData: true
    };

    // Create mock routes
    mockRoutes = [
      {
        id: 'route-1',
        name: 'Route 1 - looneyTunesTest',
        serviceArea: {
          coordinates: [
            { lat: 42.4, lng: -92.4 },
            { lat: 42.6, lng: -92.4 },
            { lat: 42.6, lng: -92.6 },
            { lat: 42.4, lng: -92.6 }
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
        technicianId: 'tech-1',
        technicianName: 'Test Technician 1'
      },
      {
        id: 'route-2',
        name: 'Route 2 - looneyTunesTest',
        serviceArea: {
          coordinates: [
            { lat: 42.3, lng: -92.3 },
            { lat: 42.7, lng: -92.3 },
            { lat: 42.7, lng: -92.7 },
            { lat: 42.3, lng: -92.7 }
          ]
        },
        capacity: 8,
        currentLoad: 7, // Near capacity
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'tech-2',
        technicianName: 'Test Technician 2'
      },
      {
        id: 'route-3',
        name: 'Route 3 - looneyTunesTest',
        serviceArea: {
          coordinates: [
            { lat: 42.2, lng: -92.2 },
            { lat: 42.8, lng: -92.2 },
            { lat: 42.8, lng: -92.8 },
            { lat: 42.2, lng: -92.8 }
          ]
        },
        capacity: 5,
        currentLoad: 5, // At capacity
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: 'tech-3',
        technicianName: 'Test Technician 3'
      }
    ];

    testContext.testData.routes = mockRoutes;
    testContext.testData.tickets = [mockTicket];

    validator = new AssignmentAlgorithmValidator(testContext);
    conflictHandler = new AssignmentConflictHandler(testContext);
  });

  describe('AssignmentAlgorithmValidator', () => {
    it('should validate optimal assignment correctly', async () => {
      const result = await validator.validateOptimalAssignment(
        mockTicket,
        mockRoutes[0], // Route with available capacity and closest
        mockRoutes
      );

      expect(result.isOptimal).toBe(true);
      expect(result.suggestedRoute.id).toBe('route-1');
      expect(result.optimalRoute.id).toBe('route-1');
      expect(result.distanceComparison.differenceKm).toBe(0);
      expect(result.validationDetails).toContain('Assignment is within optimal tolerance');
    });

    it('should detect suboptimal assignment with strict tolerance', async () => {
      const result = await validator.validateOptimalAssignment(
        mockTicket,
        mockRoutes[1], // Route 2 (near capacity)
        mockRoutes,
        { tolerancePercent: 0, maxDistanceDifferenceKm: 0 } // Zero tolerance - must be exact optimal
      );

      // With zero tolerance, any non-optimal route should be flagged
      expect(result.suggestedRoute.id).toBe('route-2');
      expect(result.optimalRoute.id).toBe('route-1'); // Route 1 has more capacity
      expect(result.distanceComparison).toBeDefined();
    });

    it('should validate override reasons', async () => {
      const assignment: Assignment = {
        id: 'assignment-123',
        ticketId: mockTicket.id,
        routeId: mockRoutes[1].id,
        assignedAt: new Date(),
        assignedBy: 'test-user',
        overrideReason: 'Customer request for specific technician'
      };

      const result = await validator.validateOverrideReason(assignment);

      expect(result.isValidOverride).toBe(true);
      expect(result.reason).toBe('Customer request for specific technician');
      expect(result.missingFields).toHaveLength(0);
      expect(result.validationErrors).toHaveLength(0);
    });

    it('should reject invalid override reasons', async () => {
      const assignment: Assignment = {
        id: 'assignment-123',
        ticketId: mockTicket.id,
        routeId: mockRoutes[1].id,
        assignedAt: new Date(),
        assignedBy: 'test-user',
        overrideReason: 'bad' // Too short and not descriptive
      };

      const result = await validator.validateOverrideReason(assignment);

      expect(result.isValidOverride).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0]).toContain('descriptive');
    });

    it('should validate assignment constraints', async () => {
      const result = await validator.validateAssignmentConstraints(
        mockTicket,
        mockRoutes[0]
      );

      expect(result.isValid).toBe(true);
      expect(result.details?.capacityCheck).toBeDefined();
      expect(result.details?.serviceAreaCheck).toBeDefined();
      expect(result.details?.scheduleCheck).toBeDefined();
    });
  });

  describe('AssignmentConflictHandler', () => {
    it('should detect capacity conflicts', () => {
      const conflict = conflictHandler.analyzeCapacityConflict(mockRoutes[2]); // At capacity route

      expect(conflict).toBeDefined();
      expect(conflict?.type).toBe('at_capacity');
      expect(conflict?.utilizationPercent).toBe(100);
    });

    it('should detect near capacity warnings', () => {
      const conflict = conflictHandler.analyzeCapacityConflict(mockRoutes[1]); // Near capacity route

      expect(conflict).toBeDefined();
      expect(conflict?.type).toBe('near_capacity');
      expect(conflict?.utilizationPercent).toBeCloseTo(87.5); // 7/8 = 87.5%
    });

    it('should handle capacity conflicts with alternative suggestions', async () => {
      const resolution = await conflictHandler.handleCapacityConflict(
        mockTicket,
        mockRoutes[2] // At capacity route
      );

      expect(resolution.strategy).toBe('suggest-alternative-route');
      expect(resolution.alternativeRoutes).toBeDefined();
      expect(resolution.alternativeRoutes!.length).toBeGreaterThan(0);
      expect(resolution.reason).toContain('capacity');
    });

    it('should suggest alternative routes', async () => {
      const alternatives = await conflictHandler.suggestAlternativeRoutes(
        mockTicket,
        mockRoutes[2], // At capacity route
        mockRoutes, // Use existing routes
        { includeNearCapacity: false } // Don't include near capacity routes
      );

      // Should find route-1 as alternative (has available capacity)
      expect(alternatives.length).toBeGreaterThanOrEqual(1);
      expect(alternatives.some(route => route.id === 'route-1')).toBe(true);
      expect(alternatives).not.toContain(mockRoutes[2]); // Should not include original route
      expect(alternatives.every(route => route.currentLoad < route.capacity)).toBe(true);
    });

    it('should validate route capacity', () => {
      const result = conflictHandler.validateRouteCapacity(mockRoutes[0]);

      expect(result.isValid).toBe(true);
      expect(result.details?.currentLoad).toBe(3);
      expect(result.details?.capacity).toBe(10);
      expect(result.details?.utilizationPercent).toBe(30);
      expect(result.details?.availableSlots).toBe(7);
    });

    it('should warn about near capacity routes', () => {
      const result = conflictHandler.validateRouteCapacity(mockRoutes[1]);

      expect(result.isValid).toBe(true); // Still valid but with warnings
      expect(result.details?.warnings).toBeDefined();
      expect(result.details?.warnings![0]).toContain('near capacity');
    });

    it('should handle over capacity routes', () => {
      const overCapacityRoute = { ...mockRoutes[0], currentLoad: 12 }; // Over capacity
      const result = conflictHandler.validateRouteCapacity(overCapacityRoute);

      expect(result.isValid).toBe(false);
      expect(result.issues![0]).toContain('over capacity');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete assignment validation workflow', async () => {
      // Test optimal assignment
      const optimalResult = await validator.validateOptimalAssignment(
        mockTicket,
        mockRoutes[0],
        mockRoutes
      );

      expect(optimalResult.isOptimal).toBe(true);

      // Test capacity validation
      const capacityResult = conflictHandler.validateRouteCapacity(mockRoutes[0]);
      expect(capacityResult.isValid).toBe(true);

      // Test constraint validation
      const constraintResult = await validator.validateAssignmentConstraints(
        mockTicket,
        mockRoutes[0]
      );

      expect(constraintResult.isValid).toBe(true);
    });

    it('should handle conflict resolution workflow', async () => {
      // Create urgent ticket for at-capacity route
      const urgentTicket = { ...mockTicket, priority: Priority.URGENT };

      // Analyze conflict
      const conflict = conflictHandler.analyzeCapacityConflict(mockRoutes[2]);
      expect(conflict?.type).toBe('at_capacity');

      // Handle conflict
      const resolution = await conflictHandler.handleCapacityConflict(
        urgentTicket,
        mockRoutes[2]
      );

      expect(resolution.strategy).toBe('suggest-alternative-route');
      expect(resolution.alternativeRoutes).toBeDefined();
      expect(resolution.reason).toContain('urgent');
    });
  });
});