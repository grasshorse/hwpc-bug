/**
 * Assignment Algorithm Validator
 * Validates optimal route selection, distance comparisons, and override reasons
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  Assignment,
  LocationAssignmentTestContext,
  ValidationResult,
  GeoCoordinate 
} from './location-assignment-types';
import { GeographicCalculationHandler, DistanceCalculationResult } from './GeographicCalculationHandler';

export interface OptimalAssignmentResult {
  isOptimal: boolean;
  suggestedRoute: LocationTestRoute;
  optimalRoute: LocationTestRoute;
  distanceComparison: {
    suggestedDistance: number;
    optimalDistance: number;
    differenceKm: number;
    differencePercent: number;
  };
  overrideReason?: string;
  validationDetails: string[];
}

export interface OverrideValidationResult {
  isValidOverride: boolean;
  reason?: string;
  requiredFields: string[];
  missingFields: string[];
  validationErrors: string[];
}

export interface DistanceValidationOptions {
  tolerancePercent?: number; // Allow X% deviation from optimal
  maxDistanceDifferenceKm?: number; // Maximum acceptable distance difference
  requireOverrideForSuboptimal?: boolean;
}

export class AssignmentAlgorithmValidator {
  private readonly geographicHandler: GeographicCalculationHandler;
  private readonly defaultTolerance = 10; // 10% tolerance for "optimal" assignments
  private readonly defaultMaxDifference = 5; // 5km maximum difference

  constructor(private readonly context: LocationAssignmentTestContext) {
    this.geographicHandler = new GeographicCalculationHandler(context);
  }

  /**
   * Validates if a route assignment is optimal or has valid override
   */
  public async validateOptimalAssignment(
    ticket: LocationTestTicket,
    suggestedRoute: LocationTestRoute,
    availableRoutes: LocationTestRoute[],
    options: DistanceValidationOptions = {}
  ): Promise<OptimalAssignmentResult> {
    
    // Calculate distances to all available routes
    const distanceResults = await this.calculateDistancesToRoutes(ticket.location, availableRoutes);
    
    // Find the optimal route (shortest distance with available capacity)
    const optimalRoute = this.findOptimalRoute(availableRoutes, distanceResults);
    
    // Get distances for comparison
    const suggestedDistance = distanceResults.get(suggestedRoute.id)?.distance || 0;
    const optimalDistance = distanceResults.get(optimalRoute.id)?.distance || 0;
    
    // Calculate difference metrics
    const differenceKm = Math.abs(suggestedDistance - optimalDistance);
    const differencePercent = optimalDistance > 0 ? (differenceKm / optimalDistance) * 100 : 0;
    
    // Determine if assignment is optimal within tolerance
    const tolerancePercent = options.tolerancePercent || this.defaultTolerance;
    const maxDifferenceKm = options.maxDistanceDifferenceKm || this.defaultMaxDifference;
    
    const isWithinTolerance = differencePercent <= tolerancePercent && differenceKm <= maxDifferenceKm;
    const isOptimal = suggestedRoute.id === optimalRoute.id || isWithinTolerance;
    

    
    // Validate override if assignment is not optimal
    let overrideReason: string | undefined;
    const validationDetails: string[] = [];
    
    if (!isOptimal) {
      const assignment = await this.findExistingAssignment(ticket.id, suggestedRoute.id);
      if (assignment?.overrideReason) {
        overrideReason = assignment.overrideReason;
        const overrideValidation = await this.validateOverrideReason(assignment);
        
        if (!overrideValidation.isValidOverride) {
          validationDetails.push(`Invalid override: ${overrideValidation.validationErrors.join(', ')}`);
        } else {
          validationDetails.push(`Valid override: ${overrideReason}`);
        }
      } else if (options.requireOverrideForSuboptimal !== false) {
        validationDetails.push('Suboptimal assignment requires override reason');
      }
    } else {
      validationDetails.push('Assignment is within optimal tolerance');
    }
    
    // Add capacity validation
    const capacityValidation = this.validateRouteCapacity(suggestedRoute);
    if (!capacityValidation.isValid) {
      validationDetails.push(`Capacity issue: ${capacityValidation.issues?.join(', ')}`);
    }
    
    return {
      isOptimal,
      suggestedRoute,
      optimalRoute,
      distanceComparison: {
        suggestedDistance,
        optimalDistance,
        differenceKm,
        differencePercent
      },
      overrideReason,
      validationDetails
    };
  }

  /**
   * Validates override reasons for non-optimal assignments
   */
  public async validateOverrideReason(assignment: Assignment): Promise<OverrideValidationResult> {
    const requiredFields = ['overrideReason'];
    const missingFields: string[] = [];
    const validationErrors: string[] = [];
    
    // Check required fields
    if (!assignment.overrideReason || assignment.overrideReason.trim().length === 0) {
      missingFields.push('overrideReason');
    }
    
    if (!assignment.assignedBy || assignment.assignedBy.trim().length === 0) {
      missingFields.push('assignedBy');
    }
    
    // Validate override reason content
    if (assignment.overrideReason) {
      const reason = assignment.overrideReason.toLowerCase();
      const validReasons = [
        'customer request',
        'emergency',
        'technician expertise',
        'equipment availability',
        'schedule conflict',
        'route optimization',
        'capacity management',
        'geographic constraint'
      ];
      
      const hasValidReason = validReasons.some(validReason => 
        reason.includes(validReason) || reason.includes(validReason.replace(' ', '_'))
      );
      
      if (!hasValidReason && assignment.overrideReason.length < 10) {
        validationErrors.push('Override reason must be descriptive (minimum 10 characters) or use standard reason codes');
      }
      
      // Check for test-specific override patterns
      if (this.context.mode !== 'isolated' && !reason.includes('test') && !reason.includes('looneytunes')) {
        // In production mode, ensure override reasons indicate test context
        validationErrors.push('Production mode overrides should indicate test context');
      }
    }
    
    // Validate timestamp
    if (!assignment.assignedAt || isNaN(assignment.assignedAt.getTime())) {
      validationErrors.push('Invalid assignment timestamp');
    }
    
    // Check if assignment is too old (configurable threshold)
    const maxAgeHours = 24; // 24 hours
    const ageHours = (Date.now() - assignment.assignedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > maxAgeHours) {
      validationErrors.push(`Assignment is too old (${ageHours.toFixed(1)} hours)`);
    }
    
    return {
      isValidOverride: missingFields.length === 0 && validationErrors.length === 0,
      reason: assignment.overrideReason,
      requiredFields,
      missingFields,
      validationErrors
    };
  }

  /**
   * Validates assignment against business rules and constraints
   */
  public async validateAssignmentConstraints(
    ticket: LocationTestTicket,
    route: LocationTestRoute
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: Record<string, any> = {};
    
    // 1. Capacity validation
    const capacityValidation = this.validateRouteCapacity(route);
    if (!capacityValidation.isValid) {
      issues.push(...(capacityValidation.issues || []));
    }
    details.capacityCheck = capacityValidation;
    
    // 2. Service area validation
    const serviceAreaValidation = await this.validateServiceArea(ticket.location, route);
    if (!serviceAreaValidation.isValid) {
      issues.push(...(serviceAreaValidation.issues || []));
    }
    details.serviceAreaCheck = serviceAreaValidation;
    
    // 3. Schedule compatibility validation
    const scheduleValidation = this.validateScheduleCompatibility(ticket, route);
    if (!scheduleValidation.isValid) {
      issues.push(...(scheduleValidation.issues || []));
    }
    details.scheduleCheck = scheduleValidation;
    
    // 4. Test data safety validation (production mode)
    if (this.context.mode === 'production') {
      const safetyValidation = this.validateTestDataSafety(ticket, route);
      if (!safetyValidation.isValid) {
        issues.push(...(safetyValidation.issues || []));
      }
      details.safetyCheck = safetyValidation;
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      details
    };
  }

  /**
   * Calculates distances from ticket location to all available routes
   */
  private async calculateDistancesToRoutes(
    ticketLocation: GeoCoordinate,
    routes: LocationTestRoute[]
  ): Promise<Map<string, DistanceCalculationResult>> {
    
    const distanceMap = new Map<string, DistanceCalculationResult>();
    
    // Calculate distances to route centers (or closest points in service area)
    for (const route of routes) {
      try {
        const routeCenter = this.calculateServiceAreaCenter(route.serviceArea);
        const distanceResult = await this.geographicHandler.calculateDistance(
          ticketLocation,
          routeCenter
        );
        
        distanceMap.set(route.id, distanceResult);
      } catch (error) {
        console.warn(`Failed to calculate distance to route ${route.id}:`, error);
        // Set a high distance value for failed calculations
        distanceMap.set(route.id, {
          distance: Number.MAX_SAFE_INTEGER,
          calculationMode: 'euclidean' as any,
          fallbackUsed: true,
          error: (error as Error).message
        });
      }
    }
    
    return distanceMap;
  }

  /**
   * Finds the optimal route based on distance and capacity
   */
  private findOptimalRoute(
    routes: LocationTestRoute[],
    distanceResults: Map<string, DistanceCalculationResult>
  ): LocationTestRoute {
    
    // Filter routes with available capacity
    const availableRoutes = routes.filter(route => 
      route.currentLoad < route.capacity
    );
    
    if (availableRoutes.length === 0) {
      // If no routes have capacity, return the route with most available space
      return routes.reduce((best, current) => {
        const bestAvailable = best.capacity - best.currentLoad;
        const currentAvailable = current.capacity - current.currentLoad;
        return currentAvailable > bestAvailable ? current : best;
      });
    }
    
    // Find route with shortest distance among available routes
    let optimalRoute = availableRoutes[0];
    let shortestDistance = distanceResults.get(optimalRoute.id)?.distance || Number.MAX_SAFE_INTEGER;
    
    for (const route of availableRoutes) {
      const distance = distanceResults.get(route.id)?.distance || Number.MAX_SAFE_INTEGER;
      if (distance < shortestDistance) {
        shortestDistance = distance;
        optimalRoute = route;
      }
    }
    
    return optimalRoute;
  }

  /**
   * Validates route capacity constraints
   */
  private validateRouteCapacity(route: LocationTestRoute): ValidationResult {
    const issues: string[] = [];
    
    if (route.currentLoad >= route.capacity) {
      issues.push(`Route ${route.name} is at full capacity (${route.currentLoad}/${route.capacity})`);
    } else if (route.currentLoad / route.capacity > 0.9) {
      issues.push(`Route ${route.name} is near capacity (${route.currentLoad}/${route.capacity})`);
    }
    
    if (route.capacity <= 0) {
      issues.push(`Route ${route.name} has invalid capacity: ${route.capacity}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      details: {
        currentLoad: route.currentLoad,
        capacity: route.capacity,
        utilizationPercent: (route.currentLoad / route.capacity) * 100
      }
    };
  }

  /**
   * Validates if ticket location is within route service area
   */
  private async validateServiceArea(
    location: GeoCoordinate,
    route: LocationTestRoute
  ): Promise<ValidationResult> {
    
    try {
      const isInArea = this.context.services.locationService.isInServiceArea(
        location,
        route.serviceArea
      );
      
      if (!isInArea) {
        return {
          isValid: false,
          issues: [`Location (${location.lat}, ${location.lng}) is outside service area for route ${route.name}`]
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Service area validation failed: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Validates schedule compatibility between ticket and route
   */
  private validateScheduleCompatibility(
    ticket: LocationTestTicket,
    route: LocationTestRoute
  ): ValidationResult {
    
    const issues: string[] = [];
    
    // Check if route has valid schedule
    if (!route.schedule || !route.schedule.days || route.schedule.days.length === 0) {
      issues.push(`Route ${route.name} has no valid schedule`);
    }
    
    // Check time format
    if (route.schedule) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(route.schedule.startTime)) {
        issues.push(`Invalid start time format: ${route.schedule.startTime}`);
      }
      if (!timeRegex.test(route.schedule.endTime)) {
        issues.push(`Invalid end time format: ${route.schedule.endTime}`);
      }
    }
    
    // For high priority tickets, ensure route can accommodate urgency
    if (ticket.priority === 'urgent' && route.schedule) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (!route.schedule.days.includes(currentDay)) {
        issues.push(`Urgent ticket assigned to route not operating today (${currentDay})`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validates test data safety in production mode
   */
  private validateTestDataSafety(
    ticket: LocationTestTicket,
    route: LocationTestRoute
  ): ValidationResult {
    
    const issues: string[] = [];
    
    // Ensure ticket is marked as test data
    if (!ticket.isTestData) {
      issues.push(`Ticket ${ticket.id} is not marked as test data`);
    }
    
    // Ensure route is marked as test route
    if (!route.isTestRoute) {
      issues.push(`Route ${route.id} is not marked as test route`);
    }
    
    // Check naming conventions
    if (!ticket.customerName.toLowerCase().includes('looneytunestest')) {
      issues.push(`Test ticket customer name must include 'looneyTunesTest': ${ticket.customerName}`);
    }
    
    if (!route.name.toLowerCase().includes('looneytunestest')) {
      issues.push(`Test route name must include 'looneyTunesTest': ${route.name}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Calculates the center point of a service area polygon
   */
  private calculateServiceAreaCenter(serviceArea: any): GeoCoordinate {
    if (!serviceArea.coordinates || serviceArea.coordinates.length === 0) {
      throw new Error('Service area has no coordinates');
    }
    
    const coords = serviceArea.coordinates;
    const sumLat = coords.reduce((sum: number, coord: GeoCoordinate) => sum + coord.lat, 0);
    const sumLng = coords.reduce((sum: number, coord: GeoCoordinate) => sum + coord.lng, 0);
    
    return {
      lat: sumLat / coords.length,
      lng: sumLng / coords.length
    };
  }

  /**
   * Finds existing assignment for ticket and route
   */
  private async findExistingAssignment(
    ticketId: string,
    routeId: string
  ): Promise<Assignment | null> {
    
    try {
      // In a real implementation, this would query the database
      // For now, check the test data context
      const assignments = this.context.testData.assignments || [];
      return assignments.find(a => a.ticketId === ticketId && a.routeId === routeId) || null;
    } catch (error) {
      console.warn('Failed to find existing assignment:', error);
      return null;
    }
  }

  /**
   * Logs validation results for debugging and monitoring
   */
  public logValidationResult(
    result: OptimalAssignmentResult,
    ticket: LocationTestTicket,
    context: string = 'assignment_validation'
  ): void {
    
    const logData = {
      context,
      ticketId: ticket.id,
      isOptimal: result.isOptimal,
      suggestedRoute: result.suggestedRoute.id,
      optimalRoute: result.optimalRoute.id,
      distanceDifference: result.distanceComparison.differenceKm,
      percentDifference: result.distanceComparison.differencePercent,
      overrideReason: result.overrideReason,
      validationDetails: result.validationDetails,
      timestamp: new Date().toISOString()
    };
    
    if (this.context.mode === 'isolated') {
      console.log('Assignment Validation (Isolated):', JSON.stringify(logData, null, 2));
    } else {
      console.log('Assignment Validation (Production):', JSON.stringify(logData, null, 2));
    }
  }
}