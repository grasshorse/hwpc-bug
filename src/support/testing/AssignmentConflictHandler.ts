/**
 * Assignment Conflict Handler
 * Handles capacity constraints, conflicts, and alternative route suggestions
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  Assignment,
  LocationAssignmentTestContext,
  ValidationResult,
  ConflictResolution,
  GeoCoordinate,
  Priority 
} from './location-assignment-types';
import { GeographicCalculationHandler } from './GeographicCalculationHandler';
import { TestMode } from './types';

export interface CapacityConflict {
  type: 'at_capacity' | 'over_capacity' | 'near_capacity';
  route: LocationTestRoute;
  currentLoad: number;
  capacity: number;
  utilizationPercent: number;
  conflictingTickets?: string[];
}

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflicts: CapacityConflict[];
  affectedRoutes: string[];
  totalConflictingTickets: number;
  resolutionStrategies: ConflictResolution[];
}

export interface AlternativeRouteOptions {
  maxDistance?: number; // Maximum acceptable distance from optimal
  maxDistancePercent?: number; // Maximum percentage increase from optimal
  includeNearCapacity?: boolean; // Include routes near capacity
  prioritizeByDistance?: boolean; // Prioritize by distance vs capacity
  requireSameServiceType?: boolean; // Must support same service type
}

export interface CapacityWarningThresholds {
  nearCapacityPercent: number; // Warn when route reaches this % of capacity
  criticalCapacityPercent: number; // Critical warning threshold
  overCapacityAction: 'warn' | 'block' | 'suggest_alternative';
}

export class AssignmentConflictHandler {
  private readonly geographicHandler: GeographicCalculationHandler;
  private readonly defaultWarningThresholds: CapacityWarningThresholds = {
    nearCapacityPercent: 85,
    criticalCapacityPercent: 95,
    overCapacityAction: 'suggest_alternative'
  };

  constructor(private readonly context: LocationAssignmentTestContext) {
    this.geographicHandler = new GeographicCalculationHandler(context);
  }

  /**
   * Handles capacity conflicts for route assignments
   */
  public async handleCapacityConflict(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    thresholds: CapacityWarningThresholds = this.defaultWarningThresholds
  ): Promise<ConflictResolution> {
    
    const conflict = this.analyzeCapacityConflict(route, thresholds);
    
    if (!conflict) {
      return {
        strategy: 'suggest-alternative-route',
        reason: 'No capacity conflict detected'
      };
    }

    // Handle different conflict types
    switch (conflict.type) {
      case 'over_capacity':
        return await this.handleOverCapacityConflict(ticket, route, conflict);
      
      case 'at_capacity':
        return await this.handleAtCapacityConflict(ticket, route, conflict);
      
      case 'near_capacity':
        return await this.handleNearCapacityConflict(ticket, route, conflict, thresholds);
      
      default:
        return {
          strategy: 'suggest-alternative-route',
          reason: 'Unknown conflict type'
        };
    }
  }

  /**
   * Analyzes capacity conflicts for a route
   */
  public analyzeCapacityConflict(
    route: LocationTestRoute,
    thresholds: CapacityWarningThresholds = this.defaultWarningThresholds
  ): CapacityConflict | null {
    
    const utilizationPercent = (route.currentLoad / route.capacity) * 100;
    
    if (route.currentLoad > route.capacity) {
      return {
        type: 'over_capacity',
        route,
        currentLoad: route.currentLoad,
        capacity: route.capacity,
        utilizationPercent
      };
    }
    
    if (route.currentLoad >= route.capacity) {
      return {
        type: 'at_capacity',
        route,
        currentLoad: route.currentLoad,
        capacity: route.capacity,
        utilizationPercent
      };
    }
    
    if (utilizationPercent >= thresholds.nearCapacityPercent) {
      return {
        type: 'near_capacity',
        route,
        currentLoad: route.currentLoad,
        capacity: route.capacity,
        utilizationPercent
      };
    }
    
    return null;
  }

  /**
   * Performs comprehensive conflict analysis for multiple routes
   */
  public async analyzeMultipleRouteConflicts(
    tickets: LocationTestTicket[],
    routes: LocationTestRoute[],
    thresholds: CapacityWarningThresholds = this.defaultWarningThresholds
  ): Promise<ConflictAnalysis> {
    
    const conflicts: CapacityConflict[] = [];
    const affectedRoutes: string[] = [];
    let totalConflictingTickets = 0;
    
    // Analyze each route for conflicts
    for (const route of routes) {
      const conflict = this.analyzeCapacityConflict(route, thresholds);
      if (conflict) {
        conflicts.push(conflict);
        affectedRoutes.push(route.id);
        
        // Count tickets that would be affected
        const routeTickets = tickets.filter(t => t.assignedRouteId === route.id);
        totalConflictingTickets += routeTickets.length;
      }
    }
    
    // Generate resolution strategies
    const resolutionStrategies: ConflictResolution[] = [];
    
    for (const conflict of conflicts) {
      const ticketsForRoute = tickets.filter(t => t.assignedRouteId === conflict.route.id);
      
      for (const ticket of ticketsForRoute) {
        const resolution = await this.handleCapacityConflict(ticket, conflict.route, thresholds);
        resolutionStrategies.push(resolution);
      }
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      affectedRoutes,
      totalConflictingTickets,
      resolutionStrategies
    };
  }

  /**
   * Suggests alternative routes for a ticket
   */
  public async suggestAlternativeRoutes(
    ticket: LocationTestTicket,
    originalRoute: LocationTestRoute,
    availableRoutes: LocationTestRoute[],
    options: AlternativeRouteOptions = {}
  ): Promise<LocationTestRoute[]> {
    
    // Filter out the original route and routes without capacity
    let candidateRoutes = availableRoutes.filter(route => 
      route.id !== originalRoute.id && 
      (route.currentLoad < route.capacity || options.includeNearCapacity === true)
    );
    

    
    // Filter by service type if required
    if (options.requireSameServiceType) {
      // In a real implementation, this would check service type compatibility
      // For now, we'll assume all routes can handle all service types
    }
    
    // Calculate distances to candidate routes
    const routeDistances = new Map<string, number>();
    const originalDistance = await this.calculateDistanceToRoute(ticket.location, originalRoute);
    
    for (const route of candidateRoutes) {
      try {
        const distance = await this.calculateDistanceToRoute(ticket.location, route);
        routeDistances.set(route.id, distance);
      } catch (error) {
        console.warn(`Failed to calculate distance to route ${route.id}:`, error);
        // Exclude routes we can't calculate distance to
        candidateRoutes = candidateRoutes.filter(r => r.id !== route.id);
      }
    }
    
    // Filter by distance constraints
    if (options.maxDistance || options.maxDistancePercent) {
      candidateRoutes = candidateRoutes.filter(route => {
        const distance = routeDistances.get(route.id) || Number.MAX_SAFE_INTEGER;
        
        if (options.maxDistance && distance > options.maxDistance) {
          return false;
        }
        
        if (options.maxDistancePercent) {
          const percentIncrease = ((distance - originalDistance) / originalDistance) * 100;
          if (percentIncrease > options.maxDistancePercent) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Sort by priority criteria
    if (options.prioritizeByDistance) {
      candidateRoutes.sort((a, b) => {
        const distanceA = routeDistances.get(a.id) || Number.MAX_SAFE_INTEGER;
        const distanceB = routeDistances.get(b.id) || Number.MAX_SAFE_INTEGER;
        return distanceA - distanceB;
      });
    } else {
      // Prioritize by available capacity
      candidateRoutes.sort((a, b) => {
        const capacityA = (a.capacity - a.currentLoad) / a.capacity;
        const capacityB = (b.capacity - b.currentLoad) / b.capacity;
        return capacityB - capacityA; // Higher available capacity first
      });
    }
    
    // Limit results to top 5 alternatives
    return candidateRoutes.slice(0, 5);
  }

  /**
   * Validates route capacity and generates warnings
   */
  public validateRouteCapacity(
    route: LocationTestRoute,
    thresholds: CapacityWarningThresholds = this.defaultWarningThresholds
  ): ValidationResult {
    
    const utilizationPercent = (route.currentLoad / route.capacity) * 100;
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for capacity violations
    if (route.currentLoad > route.capacity) {
      issues.push(`Route ${route.name} is over capacity: ${route.currentLoad}/${route.capacity} (${utilizationPercent.toFixed(1)}%)`);
    } else if (route.currentLoad >= route.capacity) {
      issues.push(`Route ${route.name} is at full capacity: ${route.currentLoad}/${route.capacity}`);
    } else if (utilizationPercent >= thresholds.criticalCapacityPercent) {
      warnings.push(`Route ${route.name} is at critical capacity: ${utilizationPercent.toFixed(1)}%`);
    } else if (utilizationPercent >= thresholds.nearCapacityPercent) {
      warnings.push(`Route ${route.name} is near capacity: ${utilizationPercent.toFixed(1)}%`);
    }
    
    // Validate capacity configuration
    if (route.capacity <= 0) {
      issues.push(`Route ${route.name} has invalid capacity: ${route.capacity}`);
    }
    
    if (route.currentLoad < 0) {
      issues.push(`Route ${route.name} has invalid current load: ${route.currentLoad}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      details: {
        currentLoad: route.currentLoad,
        capacity: route.capacity,
        utilizationPercent,
        availableSlots: Math.max(0, route.capacity - route.currentLoad),
        warnings: warnings.length > 0 ? warnings : undefined
      }
    };
  }

  /**
   * Handles over-capacity conflicts
   */
  private async handleOverCapacityConflict(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    conflict: CapacityConflict
  ): Promise<ConflictResolution> {
    
    if (this.context.mode === TestMode.ISOLATED) {
      return this.simulateOverCapacityResolution(ticket, route, conflict);
    } else {
      return this.resolveRealOverCapacityConflict(ticket, route, conflict);
    }
  }

  /**
   * Handles at-capacity conflicts
   */
  private async handleAtCapacityConflict(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    conflict: CapacityConflict
  ): Promise<ConflictResolution> {
    
    // Check if this is a high priority ticket that might justify override
    if (ticket.priority === Priority.URGENT || ticket.priority === Priority.HIGH) {
      const alternativeRoutes = await this.suggestAlternativeRoutes(
        ticket, 
        route, 
        this.context.testData.routes,
        { maxDistancePercent: 25, includeNearCapacity: true } // Allow 25% distance increase for urgent tickets
      );
      
      if (alternativeRoutes.length > 0) {
        return {
          strategy: 'suggest-alternative-route',
          alternativeRoutes,
          reason: `Route at capacity, suggesting ${alternativeRoutes.length} alternatives for ${ticket.priority} priority ticket`
        };
      } else {
        return {
          strategy: 'suggest-alternative-route',
          alternativeRoutes: [],
          reason: `No suitable alternatives found for ${ticket.priority} priority ticket, capacity override may be justified`
        };
      }
    }
    
    // For normal priority tickets, suggest alternatives or reschedule
    const alternativeRoutes = await this.suggestAlternativeRoutes(
      ticket, 
      route, 
      this.context.testData.routes
    );
    
    if (alternativeRoutes.length > 0) {
      return {
        strategy: 'suggest-alternative-route',
        alternativeRoutes,
        reason: `Route at capacity, ${alternativeRoutes.length} alternatives available`
      };
    } else {
      return {
        strategy: 'reschedule',
        estimatedDelay: this.calculateEstimatedDelay(route),
        reason: 'Route at capacity and no suitable alternatives available'
      };
    }
  }

  /**
   * Handles near-capacity conflicts
   */
  private async handleNearCapacityConflict(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    conflict: CapacityConflict,
    thresholds: CapacityWarningThresholds
  ): Promise<ConflictResolution> {
    
    const alternativeRoutes = await this.suggestAlternativeRoutes(
      ticket, 
      route, 
      this.context.testData.routes,
      { maxDistancePercent: 15, includeNearCapacity: false }
    );
    
    if (alternativeRoutes.length > 0 && conflict.utilizationPercent >= thresholds.criticalCapacityPercent) {
      return {
        strategy: 'suggest-alternative-route',
        alternativeRoutes,
        reason: `Route at critical capacity (${conflict.utilizationPercent.toFixed(1)}%), alternatives recommended`
      };
    }
    
    // Allow assignment but with warning
    return {
      strategy: 'suggest-alternative-route',
      alternativeRoutes: alternativeRoutes.slice(0, 2), // Show top 2 alternatives
      reason: `Route near capacity (${conflict.utilizationPercent.toFixed(1)}%), assignment allowed with warning`
    };
  }

  /**
   * Simulates conflict resolution for isolated mode testing
   */
  private simulateOverCapacityResolution(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    conflict: CapacityConflict
  ): ConflictResolution {
    
    // In isolated mode, we can simulate different resolution strategies
    const strategies = ['suggest-alternative-route', 'reschedule', 'reject'] as const;
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    switch (strategy) {
      case 'suggest-alternative-route':
        // Return mock alternative routes
        const mockAlternatives = this.context.testData.routes
          .filter(r => r.id !== route.id && r.currentLoad < r.capacity)
          .slice(0, 3);
        
        return {
          strategy,
          alternativeRoutes: mockAlternatives,
          reason: `Simulated: Route over capacity by ${conflict.currentLoad - conflict.capacity} tickets`
        };
      
      case 'reschedule':
        return {
          strategy,
          estimatedDelay: Math.floor(Math.random() * 24) + 1, // 1-24 hours
          reason: 'Simulated: No alternatives available, reschedule required'
        };
      
      case 'reject':
        return {
          strategy,
          reason: 'Simulated: Assignment rejected due to capacity constraints'
        };
    }
  }

  /**
   * Resolves real over-capacity conflicts in production mode
   */
  private async resolveRealOverCapacityConflict(
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    conflict: CapacityConflict
  ): Promise<ConflictResolution> {
    
    // In production mode, use real business logic
    const alternativeRoutes = await this.suggestAlternativeRoutes(
      ticket, 
      route, 
      this.context.testData.routes,
      { maxDistancePercent: 30, includeNearCapacity: true }
    );
    
    if (alternativeRoutes.length > 0) {
      return {
        strategy: 'suggest-alternative-route',
        alternativeRoutes,
        reason: `Route over capacity by ${conflict.currentLoad - conflict.capacity} assignments`
      };
    } else {
      return {
        strategy: 'reject',
        reason: 'Route over capacity and no suitable alternatives available'
      };
    }
  }

  /**
   * Calculates distance from ticket location to route center
   */
  private async calculateDistanceToRoute(
    location: GeoCoordinate,
    route: LocationTestRoute
  ): Promise<number> {
    
    const routeCenter = this.calculateServiceAreaCenter(route.serviceArea);
    const result = await this.geographicHandler.calculateDistance(location, routeCenter);
    return result.distance;
  }

  /**
   * Calculates the center point of a service area
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
   * Calculates estimated delay for rescheduling
   */
  private calculateEstimatedDelay(route: LocationTestRoute): number {
    // Simple estimation based on current overload
    const overloadFactor = route.currentLoad / route.capacity;
    
    if (overloadFactor <= 1) {
      return 0; // No delay if not overloaded
    }
    
    // Estimate delay in hours based on overload
    const baseDelay = 4; // 4 hours base delay
    const additionalDelay = (overloadFactor - 1) * 8; // 8 hours per 100% overload
    
    return Math.ceil(baseDelay + additionalDelay);
  }

  /**
   * Logs conflict resolution for monitoring and debugging
   */
  public logConflictResolution(
    resolution: ConflictResolution,
    ticket: LocationTestTicket,
    route: LocationTestRoute,
    context: string = 'conflict_resolution'
  ): void {
    
    const logData = {
      context,
      ticketId: ticket.id,
      routeId: route.id,
      strategy: resolution.strategy,
      reason: resolution.reason,
      alternativeCount: resolution.alternativeRoutes?.length || 0,
      estimatedDelay: resolution.estimatedDelay,
      routeCapacity: {
        current: route.currentLoad,
        maximum: route.capacity,
        utilization: ((route.currentLoad / route.capacity) * 100).toFixed(1) + '%'
      },
      timestamp: new Date().toISOString()
    };
    
    if (this.context.mode === TestMode.ISOLATED) {
      console.log('Conflict Resolution (Isolated):', JSON.stringify(logData, null, 2));
    } else {
      console.log('Conflict Resolution (Production):', JSON.stringify(logData, null, 2));
    }
  }
}