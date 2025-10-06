/**
 * Location Assignment Test Framework Types
 * Extends the core testing framework with location-specific interfaces
 */

import { TestMode, TestContext, TestDataSet, TestMetadata, TestCustomer } from './types';

// Geographic coordinate interface
export interface GeoCoordinate {
  lat: number;
  lng: number;
}

// Geographic polygon for service areas
export interface GeoPolygon {
  coordinates: GeoCoordinate[];
  name?: string;
}

// Priority levels for tickets
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Service types for tickets
export enum ServiceType {
  INSTALLATION = 'installation',
  REPAIR = 'repair',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection'
}

// Test location interface
export interface TestLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
  isTestLocation?: boolean;
}

// Enhanced test ticket interface for location assignment
export interface LocationTestTicket {
  id: string;
  customerId: string;
  customerName: string;
  location: GeoCoordinate;
  address: string;
  priority: Priority;
  serviceType: ServiceType;
  createdAt: Date;
  assignedRouteId?: string;
  isTestData: boolean;
}

// Route schedule interface
export interface RouteSchedule {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  days: string[];    // ['monday', 'tuesday', etc.]
  timeZone: string;
}

// Enhanced test route interface for location assignment
export interface LocationTestRoute {
  id: string;
  name: string;
  serviceArea: GeoPolygon;
  capacity: number;
  currentLoad: number;
  schedule: RouteSchedule;
  isTestRoute: boolean;
  technicianId?: string;
  technicianName?: string;
}

// Assignment interface
export interface Assignment {
  id: string;
  ticketId: string;
  routeId: string;
  assignedAt: Date;
  assignedBy: string;
  overrideReason?: string;
  estimatedDistance?: number;
  sequenceOrder?: number;
}

// Route distribution for bulk assignments
export interface RouteDistribution {
  routeId: string;
  ticketIds: string[];
  totalDistance: number;
  capacityUtilization: number;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  issues?: string[];
  details?: {
    suggestedDistance?: number;
    optimalDistance?: number;
    overrideReason?: string;
    [key: string]: any;
  };
}

// Conflict resolution interface
export interface ConflictResolution {
  strategy: 'suggest-alternative-route' | 'override-capacity' | 'reschedule' | 'reject';
  alternativeRoutes?: LocationTestRoute[];
  estimatedDelay?: number;
  reason: string;
}

// Location assignment test context
export interface LocationAssignmentTestContext extends TestContext {
  mode: TestMode;
  testData: LocationTestDataSet;
  services: {
    locationService: LocationService;
    routeService: RouteService;
    assignmentService: AssignmentService;
  };
  config: LocationTestConfig;
}

// Enhanced test data set for location assignment
export interface LocationTestDataSet {
  customers: TestCustomer[];
  tickets: LocationTestTicket[];
  routes: LocationTestRoute[];
  locations: TestLocation[];
  assignments: Assignment[];
  metadata: TestMetadata;
}

// Location-specific test configuration
export interface LocationTestConfig {
  mode: TestMode;
  searchRadius: number; // in kilometers
  maxRouteCapacity: number;
  enableGeographicValidation: boolean;
  useRealDistanceCalculation: boolean;
  testServiceAreas: GeoPolygon[];
  fallbackToEuclidean: boolean;
}

// Service interfaces
export interface LocationService {
  calculateDistance(from: GeoCoordinate, to: GeoCoordinate): Promise<number>;
  isInServiceArea(location: GeoCoordinate, serviceArea: GeoPolygon): boolean;
  findNearbyRoutes(location: GeoCoordinate, radius: number): Promise<LocationTestRoute[]>;
  validateLocation(location: GeoCoordinate): ValidationResult;
}

export interface RouteService {
  getAvailableRoutes(location: GeoCoordinate): Promise<LocationTestRoute[]>;
  getRouteCapacity(routeId: string): Promise<{ current: number; maximum: number }>;
  updateRouteAssignment(routeId: string, ticketId: string): Promise<void>;
  getRouteSchedule(routeId: string): Promise<RouteSchedule>;
}

export interface AssignmentService {
  suggestOptimalRoute(ticket: LocationTestTicket, availableRoutes: LocationTestRoute[]): Promise<LocationTestRoute>;
  assignTicketToRoute(ticketId: string, routeId: string, overrideReason?: string): Promise<Assignment>;
  bulkAssignTickets(assignments: { ticketId: string; routeId: string }[]): Promise<Assignment[]>;
  validateAssignment(ticketId: string, routeId: string): Promise<ValidationResult>;
}

// Test scenario definitions
export interface LocationTestScenario {
  name: string;
  description: string;
  mode: TestMode;
  tickets: LocationTestTicket[];
  routes: LocationTestRoute[];
  expectedAssignments?: Assignment[];
  expectedBehavior?: 'success' | 'warning' | 'error';
  validationRules?: string[];
}

// Geographic calculation modes
export enum GeographicCalculationMode {
  EUCLIDEAN = 'euclidean',     // Straight-line distance for testing
  REAL_ROUTING = 'real_routing' // Actual routing service
}

// Test data generation options
export interface TestDataGenerationOptions {
  mode: TestMode;
  locationCount: number;
  routeCount: number;
  ticketCount: number;
  serviceArea: GeoPolygon;
  useControlledCoordinates: boolean;
}

// Test data context for scenario management
export interface TestDataContext {
  mode: TestMode;
  scenario: string;
  tickets: LocationTestTicket[];
  routes: LocationTestRoute[];
  expectedResults?: {
    behavior?: 'success' | 'warning' | 'error';
    validationRules?: string[];
  } | null;
  metadata: {
    setupAt: Date;
    dataSource: 'generated' | 'production';
    resetRequired: boolean;
    testDataVersion?: string;
  };
}

// Database reset options
export interface DatabaseResetOptions {
  dropTables?: boolean;
  recreateSchema?: boolean;
  preserveBaseline?: boolean;
  resetTransactionLog?: boolean;
}

// Test data cleanup options
export interface TestDataCleanupOptions {
  removeAssignments?: boolean;
  removeTickets?: boolean;
  preserveRoutes?: boolean;
  preserveLocations?: boolean;
  cleanupTimeThreshold?: Date;
}

// Safety check result
export interface SafetyCheckResult {
  isSafe: boolean;
  issues?: string[];
  warnings?: string[];
}