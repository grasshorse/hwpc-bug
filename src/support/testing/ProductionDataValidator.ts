/**
 * Production Data Validator
 * Validates test data in production mode to ensure safety and compliance
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  TestLocation, 
  ValidationResult, 
  GeoCoordinate,
  Assignment
} from './location-assignment-types';
import { GeographicUtilities } from './geographic-utilities';

export class ProductionDataValidator {
  private static readonly LOONEY_TUNES_IDENTIFIER = 'looneyTunesTest';
  private static readonly VALID_LOONEY_CHARACTERS = [
    'Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird', 'Sylvester Cat',
    'Pepe Le Pew', 'Foghorn Leghorn', 'Marvin Martian', 'Yosemite Sam', 
    'Speedy Gonzales', 'Elmer Fudd', 'Lola Bunny', 'Taz', 'Road Runner',
    'Wile E Coyote', 'Pepé Le Pew'
  ];

  // Define test service areas (Iowa region for production testing)
  private static readonly TEST_SERVICE_AREAS = [
    {
      name: 'Cedar Falls Test Area',
      bounds: {
        north: 42.5500,
        south: 42.4000,
        east: -92.2000,
        west: -92.6000
      }
    },
    {
      name: 'Waterloo Test Area', 
      bounds: {
        north: 42.5500,
        south: 42.4500,
        east: -92.3000,
        west: -92.5000
      }
    }
  ];

  /**
   * Validates a test ticket for production safety
   */
  public static validateTestTicket(ticket: LocationTestTicket): ValidationResult {
    const issues: string[] = [];

    // Validate customer naming convention
    if (!this.hasLooneyTunesIdentifier(ticket.customerName)) {
      issues.push(`Customer name must include '${this.LOONEY_TUNES_IDENTIFIER}': ${ticket.customerName}`);
    }

    // Validate customer name uses approved character names
    if (!this.hasValidLooneyCharacter(ticket.customerName)) {
      issues.push(`Customer name should include a valid Looney Tunes character: ${ticket.customerName}`);
    }

    // Validate location is in test service area
    if (!this.isInTestServiceArea(ticket.location)) {
      issues.push(`Ticket location outside designated test service areas: ${GeographicUtilities.formatCoordinate(ticket.location)}`);
    }

    // Validate address includes test identifier
    if (!this.hasLooneyTunesIdentifier(ticket.address)) {
      issues.push(`Address must include '${this.LOONEY_TUNES_IDENTIFIER}': ${ticket.address}`);
    }

    // Validate test data flag is set
    if (!ticket.isTestData) {
      issues.push('Ticket must be marked as test data (isTestData: true)');
    }

    // Validate no impact on real customers
    if (this.couldAffectRealCustomers(ticket)) {
      issues.push('Ticket assignment could impact real customer service');
    }

    // Validate coordinate format and bounds
    const coordValidation = GeographicUtilities.validateCoordinate(ticket.location);
    if (!coordValidation.isValid) {
      issues.push(`Invalid coordinates: ${coordValidation.issues?.join(', ')}`);
    }

    return { 
      isValid: issues.length === 0, 
      issues: issues.length > 0 ? issues : undefined 
    };
  }

  /**
   * Validates a test route for production safety
   */
  public static validateTestRoute(route: LocationTestRoute): ValidationResult {
    const issues: string[] = [];

    // Validate route naming convention
    if (!this.hasLooneyTunesIdentifier(route.name)) {
      issues.push(`Route name must include '${this.LOONEY_TUNES_IDENTIFIER}': ${route.name}`);
    }

    // Validate technician name if provided
    if (route.technicianName && !this.hasLooneyTunesIdentifier(route.technicianName)) {
      issues.push(`Technician name must include '${this.LOONEY_TUNES_IDENTIFIER}': ${route.technicianName}`);
    }

    // Validate test route flag is set
    if (!route.isTestRoute) {
      issues.push('Route must be marked as test route (isTestRoute: true)');
    }

    // Validate service area is within test boundaries
    if (!this.isServiceAreaInTestRegion(route.serviceArea)) {
      issues.push('Route service area extends outside designated test regions');
    }

    // Validate capacity is reasonable for testing
    if (route.capacity > 50) {
      issues.push(`Route capacity seems too high for testing: ${route.capacity}`);
    }

    if (route.capacity < 1) {
      issues.push(`Route capacity must be at least 1: ${route.capacity}`);
    }

    // Validate current load doesn't exceed capacity
    if (route.currentLoad > route.capacity) {
      issues.push(`Current load (${route.currentLoad}) exceeds capacity (${route.capacity})`);
    }

    // Validate schedule format
    const scheduleValidation = this.validateRouteSchedule(route.schedule);
    if (!scheduleValidation.isValid) {
      issues.push(`Invalid schedule: ${scheduleValidation.issues?.join(', ')}`);
    }

    return { 
      isValid: issues.length === 0, 
      issues: issues.length > 0 ? issues : undefined 
    };
  }

  /**
   * Validates a test location for production safety
   */
  public static validateTestLocation(location: TestLocation): ValidationResult {
    const issues: string[] = [];

    // Validate location naming convention
    if (!this.hasLooneyTunesIdentifier(location.name)) {
      issues.push(`Location name must include '${this.LOONEY_TUNES_IDENTIFIER}': ${location.name}`);
    }

    // Validate address includes test identifier
    if (!this.hasLooneyTunesIdentifier(location.address)) {
      issues.push(`Address must include '${this.LOONEY_TUNES_IDENTIFIER}': ${location.address}`);
    }

    // Validate coordinates are in test area
    const coordinate: GeoCoordinate = { lat: location.lat, lng: location.lng };
    if (!this.isInTestServiceArea(coordinate)) {
      issues.push(`Location outside designated test service areas: ${GeographicUtilities.formatCoordinate(coordinate)}`);
    }

    // Validate coordinate format
    const coordValidation = GeographicUtilities.validateCoordinate(coordinate);
    if (!coordValidation.isValid) {
      issues.push(`Invalid coordinates: ${coordValidation.issues?.join(', ')}`);
    }

    // Validate test location flag
    if (location.isTestLocation !== true) {
      issues.push('Location must be marked as test location (isTestLocation: true)');
    }

    return { 
      isValid: issues.length === 0, 
      issues: issues.length > 0 ? issues : undefined 
    };
  }

  /**
   * Validates an assignment for production safety
   */
  public static validateAssignmentSafety(assignment: Assignment): ValidationResult {
    const issues: string[] = [];

    // Validate ticket ID format (should be test ticket)
    if (!assignment.ticketId.includes('test') && !assignment.ticketId.includes('looney')) {
      issues.push(`Assignment targets non-test ticket: ${assignment.ticketId}`);
    }

    // Validate route ID format (should be test route)
    if (!assignment.routeId.includes('test') && !assignment.routeId.includes('looney')) {
      issues.push(`Assignment targets non-test route: ${assignment.routeId}`);
    }

    // Validate assigned by user (should be test user)
    if (assignment.assignedBy && !assignment.assignedBy.toLowerCase().includes('test')) {
      issues.push(`Assignment by non-test user: ${assignment.assignedBy}`);
    }

    // Validate assignment doesn't impact real service
    if (this.couldImpactRealService(assignment)) {
      issues.push('Assignment could impact real customer service delivery');
    }

    return { 
      isValid: issues.length === 0, 
      issues: issues.length > 0 ? issues : undefined 
    };
  }

  /**
   * Validates batch of test data items
   */
  public static validateTestDataBatch(data: {
    tickets?: LocationTestTicket[];
    routes?: LocationTestRoute[];
    locations?: TestLocation[];
    assignments?: Assignment[];
  }): ValidationResult {
    const allIssues: string[] = [];

    // Validate tickets
    if (data.tickets) {
      data.tickets.forEach((ticket, index) => {
        const validation = this.validateTestTicket(ticket);
        if (!validation.isValid) {
          allIssues.push(`Ticket ${index + 1} (${ticket.id}): ${validation.issues?.join(', ')}`);
        }
      });
    }

    // Validate routes
    if (data.routes) {
      data.routes.forEach((route, index) => {
        const validation = this.validateTestRoute(route);
        if (!validation.isValid) {
          allIssues.push(`Route ${index + 1} (${route.id}): ${validation.issues?.join(', ')}`);
        }
      });
    }

    // Validate locations
    if (data.locations) {
      data.locations.forEach((location, index) => {
        const validation = this.validateTestLocation(location);
        if (!validation.isValid) {
          allIssues.push(`Location ${index + 1} (${location.name}): ${validation.issues?.join(', ')}`);
        }
      });
    }

    // Validate assignments
    if (data.assignments) {
      data.assignments.forEach((assignment, index) => {
        const validation = this.validateAssignmentSafety(assignment);
        if (!validation.isValid) {
          allIssues.push(`Assignment ${index + 1} (${assignment.id}): ${validation.issues?.join(', ')}`);
        }
      });
    }

    return { 
      isValid: allIssues.length === 0, 
      issues: allIssues.length > 0 ? allIssues : undefined 
    };
  }

  /**
   * Checks if name/text contains looneyTunesTest identifier
   */
  private static hasLooneyTunesIdentifier(text: string): boolean {
    return text.toLowerCase().includes(this.LOONEY_TUNES_IDENTIFIER.toLowerCase());
  }

  /**
   * Checks if name contains a valid Looney Tunes character
   */
  private static hasValidLooneyCharacter(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this.VALID_LOONEY_CHARACTERS.some(character => 
      lowerName.includes(character.toLowerCase())
    );
  }

  /**
   * Checks if coordinate is within designated test service areas
   */
  private static isInTestServiceArea(coordinate: GeoCoordinate): boolean {
    return this.TEST_SERVICE_AREAS.some(area => {
      return coordinate.lat >= area.bounds.south &&
             coordinate.lat <= area.bounds.north &&
             coordinate.lng >= area.bounds.west &&
             coordinate.lng <= area.bounds.east;
    });
  }

  /**
   * Checks if service area is within test regions
   */
  private static isServiceAreaInTestRegion(serviceArea: any): boolean {
    if (!serviceArea.coordinates || !Array.isArray(serviceArea.coordinates)) {
      return false;
    }

    // Check if all coordinates are within test regions
    return serviceArea.coordinates.every((coord: GeoCoordinate) => 
      this.isInTestServiceArea(coord)
    );
  }

  /**
   * Validates route schedule format
   */
  private static validateRouteSchedule(schedule: any): ValidationResult {
    const issues: string[] = [];

    if (!schedule) {
      issues.push('Schedule is required');
      return { isValid: false, issues };
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!schedule.startTime || !timeRegex.test(schedule.startTime)) {
      issues.push(`Invalid start time format: ${schedule.startTime}`);
    }

    if (!schedule.endTime || !timeRegex.test(schedule.endTime)) {
      issues.push(`Invalid end time format: ${schedule.endTime}`);
    }

    // Validate days array
    if (!schedule.days || !Array.isArray(schedule.days)) {
      issues.push('Days must be an array');
    } else {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const invalidDays = schedule.days.filter((day: string) => !validDays.includes(day.toLowerCase()));
      if (invalidDays.length > 0) {
        issues.push(`Invalid days: ${invalidDays.join(', ')}`);
      }
    }

    // Validate timezone
    if (!schedule.timeZone) {
      issues.push('Time zone is required');
    }

    return { 
      isValid: issues.length === 0, 
      issues: issues.length > 0 ? issues : undefined 
    };
  }

  /**
   * Checks if ticket could affect real customers
   */
  private static couldAffectRealCustomers(ticket: LocationTestTicket): boolean {
    // Check if customer ID looks like a real customer ID
    if (ticket.customerId.match(/^\d+$/) && parseInt(ticket.customerId) < 1000000) {
      return true; // Looks like a real customer ID
    }

    // Check if location is too close to known real service areas
    // This would need to be configured based on actual service boundaries
    const realServiceAreas = [
      // Add real service area boundaries here for production validation
    ];

    return realServiceAreas.some(area => {
      // Implementation would check if ticket location overlaps with real service areas
      return false; // Placeholder - implement based on actual service boundaries
    });
  }

  /**
   * Checks if assignment could impact real service delivery
   */
  private static couldImpactRealService(assignment: Assignment): boolean {
    // Check if assignment time conflicts with real service windows
    const now = new Date();
    const assignmentTime = new Date(assignment.assignedAt);
    
    // Don't allow assignments during peak service hours on weekdays
    const hour = assignmentTime.getHours();
    const day = assignmentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (day >= 1 && day <= 5 && hour >= 8 && hour <= 17) {
      // This is during business hours - need extra validation
      return !assignment.routeId.includes('test') && !assignment.routeId.includes('looney');
    }

    return false;
  }

  /**
   * Gets list of valid test service areas
   */
  public static getTestServiceAreas(): Array<{name: string; bounds: any}> {
    return [...this.TEST_SERVICE_AREAS];
  }

  /**
   * Gets list of valid Looney Tunes characters for naming
   */
  public static getValidCharacters(): string[] {
    return [...this.VALID_LOONEY_CHARACTERS];
  }

  /**
   * Gets the required identifier for test data
   */
  public static getTestIdentifier(): string {
    return this.LOONEY_TUNES_IDENTIFIER;
  }
}