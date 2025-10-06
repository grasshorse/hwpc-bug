/**
 * Geographic Test Data Generator
 * Generates controlled test data for location assignment testing
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  TestLocation, 
  GeoCoordinate, 
  GeoPolygon, 
  Priority, 
  ServiceType, 
  RouteSchedule,
  LocationTestScenario,
  TestDataGenerationOptions
} from './location-assignment-types';
import { TestMode } from './types';
import { GeographicUtilities } from './geographic-utilities';

export class GeographicTestDataGenerator {
  private static readonly CONTROLLED_COORDINATES = GeographicUtilities.createControlledTestCoordinates();
  private static readonly TEST_SERVICE_AREAS = GeographicUtilities.createTestServiceAreas();

  /**
   * Generates test locations based on mode
   */
  public static generateTestLocations(mode: TestMode, count: number = 10): TestLocation[] {
    if (mode === TestMode.ISOLATED) {
      return this.generateControlledLocations(count);
    } else {
      return this.generateProductionTestLocations(count);
    }
  }

  /**
   * Generates controlled locations for isolated testing with known coordinates
   */
  private static generateControlledLocations(count: number): TestLocation[] {
    const locations: TestLocation[] = [];
    const baseCoordinates = this.CONTROLLED_COORDINATES;

    for (let i = 0; i < Math.min(count, baseCoordinates.length); i++) {
      const coord = baseCoordinates[i];
      locations.push({
        name: `Test Location ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        lat: coord.lat,
        lng: coord.lng,
        address: `${123 + i * 100} Test Street ${String.fromCharCode(65 + i)}`,
        isTestLocation: true
      });
    }

    // If we need more locations than predefined, generate additional ones
    if (count > baseCoordinates.length) {
      const center = GeographicUtilities.calculateCenterPoint(baseCoordinates);
      const additionalCoords = GeographicUtilities.generateTestCoordinates(
        center, 
        5, // 5km radius
        count - baseCoordinates.length,
        12345 // Fixed seed for deterministic results
      );

      additionalCoords.forEach((coord, index) => {
        const locationIndex = baseCoordinates.length + index;
        locations.push({
          name: `Test Location ${locationIndex + 1}`,
          lat: coord.lat,
          lng: coord.lng,
          address: `${123 + locationIndex * 100} Generated Test Street`,
          isTestLocation: true
        });
      });
    }

    return locations;
  }

  /**
   * Generates production test locations with looneyTunesTest naming
   */
  private static generateProductionTestLocations(count: number): TestLocation[] {
    const locations: TestLocation[] = [];
    const looneyTunesCharacters = [
      'Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird', 'Sylvester Cat',
      'Pepe Le Pew', 'Foghorn Leghorn', 'Marvin Martian', 'Yosemite Sam', 'Speedy Gonzales'
    ];

    // Real coordinates in Iowa area for production testing
    const productionBaseCoords: GeoCoordinate[] = [
      { lat: 42.4619, lng: -92.3426 }, // Cedar Falls area
      { lat: 42.5008, lng: -92.4426 }, // Waterloo area
      { lat: 42.4500, lng: -92.2500 }, // Hudson area
      { lat: 42.5200, lng: -92.3800 }, // Evansdale area
      { lat: 42.4300, lng: -92.4100 }  // Elk Run Heights area
    ];

    for (let i = 0; i < count; i++) {
      const characterIndex = i % looneyTunesCharacters.length;
      const coordIndex = i % productionBaseCoords.length;
      const character = looneyTunesCharacters[characterIndex];
      const baseCoord = productionBaseCoords[coordIndex];

      // Add small random offset to avoid exact duplicates
      const offset = 0.001 * (i + 1);
      
      locations.push({
        name: `${character} Location - looneyTunesTest`,
        lat: baseCoord.lat + offset,
        lng: baseCoord.lng + offset,
        address: `${100 + i} ${character} Lane - looneyTunesTest`,
        isTestLocation: true
      });
    }

    return locations;
  }

  /**
   * Generates test tickets for different scenarios
   */
  public static generateTestTickets(
    scenario: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment',
    locations: TestLocation[],
    mode: TestMode
  ): LocationTestTicket[] {
    switch (scenario) {
      case 'optimal-assignment':
        return this.generateOptimalAssignmentTickets(locations, mode);
      case 'capacity-constraints':
        return this.generateCapacityConstraintTickets(locations, mode);
      case 'bulk-assignment':
        return this.generateBulkAssignmentTickets(locations, mode);
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }

  /**
   * Generates tickets for optimal assignment testing
   */
  private static generateOptimalAssignmentTickets(
    locations: TestLocation[],
    mode: TestMode
  ): LocationTestTicket[] {
    const tickets: LocationTestTicket[] = [];
    const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
    const serviceTypes = [ServiceType.INSTALLATION, ServiceType.REPAIR, ServiceType.MAINTENANCE];

    locations.slice(0, 5).forEach((location, index) => {
      const customerName = mode === TestMode.ISOLATED 
        ? `Test Customer ${index + 1}`
        : `Bugs Bunny Customer ${index + 1} - looneyTunesTest`;

      tickets.push({
        id: `ticket-${index + 1}`,
        customerId: `customer-${index + 1}`,
        customerName,
        location: { lat: location.lat, lng: location.lng },
        address: location.address,
        priority: priorities[index % priorities.length],
        serviceType: serviceTypes[index % serviceTypes.length],
        createdAt: new Date(Date.now() - (index * 3600000)), // Stagger creation times
        isTestData: true
      });
    });

    return tickets;
  }

  /**
   * Generates tickets for capacity constraint testing
   */
  private static generateCapacityConstraintTickets(
    locations: TestLocation[],
    mode: TestMode
  ): LocationTestTicket[] {
    const tickets: LocationTestTicket[] = [];
    
    // Generate more tickets than route capacity to test constraints
    locations.forEach((location, index) => {
      const customerName = mode === TestMode.ISOLATED 
        ? `Capacity Test Customer ${index + 1}`
        : `Daffy Duck Customer ${index + 1} - looneyTunesTest`;

      tickets.push({
        id: `capacity-ticket-${index + 1}`,
        customerId: `capacity-customer-${index + 1}`,
        customerName,
        location: { lat: location.lat, lng: location.lng },
        address: location.address,
        priority: Priority.MEDIUM,
        serviceType: ServiceType.REPAIR,
        createdAt: new Date(),
        isTestData: true
      });
    });

    return tickets;
  }

  /**
   * Generates tickets for bulk assignment testing
   */
  private static generateBulkAssignmentTickets(
    locations: TestLocation[],
    mode: TestMode
  ): LocationTestTicket[] {
    const tickets: LocationTestTicket[] = [];
    const batchSize = Math.min(20, locations.length);

    for (let i = 0; i < batchSize; i++) {
      const location = locations[i % locations.length];
      const customerName = mode === TestMode.ISOLATED 
        ? `Bulk Test Customer ${i + 1}`
        : `Porky Pig Customer ${i + 1} - looneyTunesTest`;

      tickets.push({
        id: `bulk-ticket-${i + 1}`,
        customerId: `bulk-customer-${i + 1}`,
        customerName,
        location: { lat: location.lat, lng: location.lng },
        address: location.address,
        priority: i < 5 ? Priority.HIGH : Priority.MEDIUM,
        serviceType: ServiceType.INSTALLATION,
        createdAt: new Date(Date.now() - (i * 60000)), // 1 minute intervals
        isTestData: true
      });
    }

    return tickets;
  }

  /**
   * Generates test routes for different scenarios
   */
  public static generateTestRoutes(
    scenario: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment',
    mode: TestMode
  ): LocationTestRoute[] {
    switch (scenario) {
      case 'optimal-assignment':
        return this.generateOptimalAssignmentRoutes(mode);
      case 'capacity-constraints':
        return this.generateCapacityConstraintRoutes(mode);
      case 'bulk-assignment':
        return this.generateBulkAssignmentRoutes(mode);
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }

  /**
   * Generates routes for optimal assignment testing
   */
  private static generateOptimalAssignmentRoutes(mode: TestMode): LocationTestRoute[] {
    const routes: LocationTestRoute[] = [];
    const serviceAreas = this.TEST_SERVICE_AREAS;

    serviceAreas.forEach((area, index) => {
      const routeName = mode === TestMode.ISOLATED 
        ? `Test Route ${String.fromCharCode(65 + index)}`
        : `${['Bugs', 'Daffy'][index]} Route - looneyTunesTest`;

      routes.push({
        id: `route-${index + 1}`,
        name: routeName,
        serviceArea: area,
        capacity: 10,
        currentLoad: 2 + index, // Some existing load
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: `tech-${index + 1}`,
        technicianName: mode === TestMode.ISOLATED 
          ? `Test Technician ${index + 1}`
          : `${['Bugs Bunny', 'Daffy Duck'][index]} - looneyTunesTest`
      });
    });

    return routes;
  }

  /**
   * Generates routes for capacity constraint testing
   */
  private static generateCapacityConstraintRoutes(mode: TestMode): LocationTestRoute[] {
    const routes: LocationTestRoute[] = [];
    const serviceAreas = this.TEST_SERVICE_AREAS;

    serviceAreas.forEach((area, index) => {
      const routeName = mode === TestMode.ISOLATED 
        ? `Capacity Test Route ${index + 1}`
        : `Capacity Route ${index + 1} - looneyTunesTest`;

      // Create routes with different capacity scenarios
      const capacity = index === 0 ? 5 : 10; // First route has lower capacity
      const currentLoad = index === 0 ? 4 : 2; // First route is nearly full

      routes.push({
        id: `capacity-route-${index + 1}`,
        name: routeName,
        serviceArea: area,
        capacity,
        currentLoad,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: `capacity-tech-${index + 1}`,
        technicianName: mode === TestMode.ISOLATED 
          ? `Capacity Test Tech ${index + 1}`
          : `Capacity Tech ${index + 1} - looneyTunesTest`
      });
    });

    return routes;
  }

  /**
   * Generates routes for bulk assignment testing
   */
  private static generateBulkAssignmentRoutes(mode: TestMode): LocationTestRoute[] {
    const routes: LocationTestRoute[] = [];
    const serviceAreas = this.TEST_SERVICE_AREAS;

    // Create multiple routes to handle bulk assignments
    for (let i = 0; i < 4; i++) {
      const areaIndex = i % serviceAreas.length;
      const area = serviceAreas[areaIndex];
      
      const routeName = mode === TestMode.ISOLATED 
        ? `Bulk Route ${i + 1}`
        : `Bulk Route ${i + 1} - looneyTunesTest`;

      routes.push({
        id: `bulk-route-${i + 1}`,
        name: routeName,
        serviceArea: area,
        capacity: 15,
        currentLoad: Math.floor(Math.random() * 5), // Random existing load
        schedule: {
          startTime: '07:00',
          endTime: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true,
        technicianId: `bulk-tech-${i + 1}`,
        technicianName: mode === TestMode.ISOLATED 
          ? `Bulk Test Tech ${i + 1}`
          : `Bulk Tech ${i + 1} - looneyTunesTest`
      });
    }

    return routes;
  }

  /**
   * Generates complete test scenarios
   */
  public static generateTestScenario(
    scenarioName: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment',
    mode: TestMode,
    options?: Partial<TestDataGenerationOptions>
  ): LocationTestScenario {
    const defaultOptions: TestDataGenerationOptions = {
      mode,
      locationCount: 10,
      routeCount: 2,
      ticketCount: 5,
      serviceArea: this.TEST_SERVICE_AREAS[0],
      useControlledCoordinates: mode === TestMode.ISOLATED
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    const locations = this.generateTestLocations(mode, finalOptions.locationCount);
    const tickets = this.generateTestTickets(scenarioName, locations, mode);
    const routes = this.generateTestRoutes(scenarioName, mode);

    return {
      name: scenarioName,
      description: this.getScenarioDescription(scenarioName),
      mode,
      tickets,
      routes,
      expectedBehavior: this.getExpectedBehavior(scenarioName),
      validationRules: this.getValidationRules(scenarioName)
    };
  }

  /**
   * Gets scenario description
   */
  private static getScenarioDescription(scenario: string): string {
    const descriptions = {
      'optimal-assignment': 'Tests optimal route assignment based on distance calculations',
      'capacity-constraints': 'Tests route capacity validation and constraint handling',
      'bulk-assignment': 'Tests bulk ticket assignment and distribution optimization'
    };
    return descriptions[scenario] || 'Unknown scenario';
  }

  /**
   * Gets expected behavior for scenario
   */
  private static getExpectedBehavior(scenario: string): 'success' | 'warning' | 'error' {
    const behaviors = {
      'optimal-assignment': 'success' as const,
      'capacity-constraints': 'warning' as const,
      'bulk-assignment': 'success' as const
    };
    return behaviors[scenario] || 'success';
  }

  /**
   * Gets validation rules for scenario
   */
  private static getValidationRules(scenario: string): string[] {
    const rules = {
      'optimal-assignment': [
        'Assigned route must be closest available route',
        'All tickets must be assigned successfully',
        'No capacity violations should occur'
      ],
      'capacity-constraints': [
        'System must warn when route capacity is exceeded',
        'Alternative routes must be suggested',
        'Override reasons must be required for capacity violations'
      ],
      'bulk-assignment': [
        'All tickets must be processed',
        'Route distribution should be optimized',
        'No single route should be overloaded'
      ]
    };
    return rules[scenario] || [];
  }
}