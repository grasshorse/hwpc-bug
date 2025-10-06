/**
 * Production Safety Guard
 * Provides safety mechanisms to prevent impact on real customers and routes
 */

import { 
  LocationTestTicket, 
  LocationTestRoute, 
  Assignment, 
  ValidationResult,
  GeoCoordinate 
} from './location-assignment-types';
import { ProductionDataValidator } from './ProductionDataValidator';

export interface SafetyCheckResult {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  recommendations: string[];
}

export interface SafetyConfiguration {
  allowProductionWrites: boolean;
  requireTestIdentifiers: boolean;
  enforceServiceAreaBounds: boolean;
  maxBatchSize: number;
  requireApprovalForHighRisk: boolean;
  logAllOperations: boolean;
}

export class ProductionSafetyGuard {
  private config: SafetyConfiguration;
  private operationLog: Array<{
    timestamp: Date;
    operation: string;
    riskLevel: string;
    details: any;
  }> = [];

  constructor(config?: Partial<SafetyConfiguration>) {
    this.config = {
      allowProductionWrites: false,
      requireTestIdentifiers: true,
      enforceServiceAreaBounds: true,
      maxBatchSize: 50,
      requireApprovalForHighRisk: true,
      logAllOperations: true,
      ...config
    };
  }

  /**
   * Validates assignment safety before execution
   */
  public validateAssignmentSafety(assignment: Assignment): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Basic validation using ProductionDataValidator
    const basicValidation = ProductionDataValidator.validateAssignmentSafety(assignment);
    if (!basicValidation.isValid) {
      issues.push(...(basicValidation.issues || []));
      riskLevel = 'high';
    }

    // Check for production write operations
    if (this.config.allowProductionWrites === false) {
      issues.push('Production writes are disabled by safety configuration');
      riskLevel = 'critical';
      recommendations.push('Enable production writes in safety configuration if intended');
    }

    // Check assignment timing
    const timingRisk = this.assessTimingRisk(assignment);
    if (timingRisk.riskLevel !== 'low') {
      issues.push(...timingRisk.issues);
      recommendations.push(...timingRisk.recommendations);
      if (timingRisk.riskLevel === 'high') riskLevel = 'high';
    }

    // Check for potential customer impact
    const customerImpact = this.assessCustomerImpact(assignment);
    if (customerImpact.riskLevel !== 'low') {
      issues.push(...customerImpact.issues);
      recommendations.push(...customerImpact.recommendations);
      if (customerImpact.riskLevel === 'critical') riskLevel = 'critical';
    }

    // Log the operation
    if (this.config.logAllOperations) {
      this.logOperation('assignment_validation', riskLevel, {
        assignmentId: assignment.id,
        ticketId: assignment.ticketId,
        routeId: assignment.routeId,
        issues: issues.length,
        riskLevel
      });
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Validates batch assignment safety
   */
  public validateBatchAssignmentSafety(assignments: Assignment[]): SafetyCheckResult {
    const allIssues: string[] = [];
    const allRecommendations: string[] = [];
    let highestRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check batch size
    if (assignments.length > this.config.maxBatchSize) {
      allIssues.push(`Batch size ${assignments.length} exceeds maximum allowed ${this.config.maxBatchSize}`);
      allRecommendations.push(`Split batch into smaller chunks of ${this.config.maxBatchSize} or less`);
      highestRisk = 'medium';
    }

    // Validate each assignment
    assignments.forEach((assignment, index) => {
      const validation = this.validateAssignmentSafety(assignment);
      if (!validation.isSafe) {
        allIssues.push(`Assignment ${index + 1} (${assignment.id}): ${validation.issues.join(', ')}`);
        allRecommendations.push(...validation.recommendations);
      }
      
      // Track highest risk level
      if (this.getRiskPriority(validation.riskLevel) > this.getRiskPriority(highestRisk)) {
        highestRisk = validation.riskLevel;
      }
    });

    // Check for conflicting assignments
    const conflictCheck = this.checkAssignmentConflicts(assignments);
    if (!conflictCheck.isSafe) {
      allIssues.push(...conflictCheck.issues);
      allRecommendations.push(...conflictCheck.recommendations);
      if (this.getRiskPriority(conflictCheck.riskLevel) > this.getRiskPriority(highestRisk)) {
        highestRisk = conflictCheck.riskLevel;
      }
    }

    // Log batch operation
    if (this.config.logAllOperations) {
      this.logOperation('batch_assignment_validation', highestRisk, {
        batchSize: assignments.length,
        issues: allIssues.length,
        riskLevel: highestRisk
      });
    }

    return {
      isSafe: allIssues.length === 0,
      riskLevel: highestRisk,
      issues: allIssues,
      recommendations: allRecommendations
    };
  }

  /**
   * Validates ticket creation safety
   */
  public validateTicketCreationSafety(ticket: LocationTestTicket): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Basic validation
    const basicValidation = ProductionDataValidator.validateTestTicket(ticket);
    if (!basicValidation.isValid) {
      issues.push(...(basicValidation.issues || []));
      riskLevel = 'high';
    }

    // Check location safety
    const locationSafety = this.assessLocationSafety(ticket.location);
    if (!locationSafety.isSafe) {
      issues.push(...locationSafety.issues);
      recommendations.push(...locationSafety.recommendations);
      if (this.getRiskPriority(locationSafety.riskLevel) > this.getRiskPriority(riskLevel)) {
        riskLevel = locationSafety.riskLevel;
      }
    }

    // Check customer data safety
    if (!this.isTestCustomerSafe(ticket)) {
      issues.push('Customer data does not meet test safety requirements');
      recommendations.push('Ensure customer name includes looneyTunesTest identifier');
      riskLevel = 'high';
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Validates route creation safety
   */
  public validateRouteCreationSafety(route: LocationTestRoute): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Basic validation
    const basicValidation = ProductionDataValidator.validateTestRoute(route);
    if (!basicValidation.isValid) {
      issues.push(...(basicValidation.issues || []));
      riskLevel = 'high';
    }

    // Check service area safety
    const serviceAreaSafety = this.assessServiceAreaSafety(route.serviceArea);
    if (!serviceAreaSafety.isSafe) {
      issues.push(...serviceAreaSafety.issues);
      recommendations.push(...serviceAreaSafety.recommendations);
      if (this.getRiskPriority(serviceAreaSafety.riskLevel) > this.getRiskPriority(riskLevel)) {
        riskLevel = serviceAreaSafety.riskLevel;
      }
    }

    // Check capacity safety
    if (route.capacity > 100) {
      issues.push(`Route capacity ${route.capacity} is unusually high for testing`);
      recommendations.push('Consider using smaller capacity values for test routes');
      riskLevel = 'medium';
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Assesses timing risk for assignments
   */
  private assessTimingRisk(assignment: Assignment): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const assignmentTime = new Date(assignment.assignedAt);
    const now = new Date();
    const hour = assignmentTime.getHours();
    const day = assignmentTime.getDay();

    // Check if assignment is during business hours
    if (day >= 1 && day <= 5 && hour >= 8 && hour <= 17) {
      issues.push('Assignment scheduled during business hours');
      recommendations.push('Consider scheduling test assignments outside business hours');
      riskLevel = 'medium';
    }

    // Check if assignment is in the past
    if (assignmentTime < now) {
      const hoursDiff = (now.getTime() - assignmentTime.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        issues.push(`Assignment is ${Math.round(hoursDiff)} hours in the past`);
        recommendations.push('Verify assignment timestamp is correct');
        riskLevel = 'medium';
      }
    }

    return { isSafe: issues.length === 0, riskLevel, issues, recommendations };
  }

  /**
   * Assesses potential customer impact
   */
  private assessCustomerImpact(assignment: Assignment): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if assignment could affect real customers
    if (!assignment.ticketId.toLowerCase().includes('test') && 
        !assignment.ticketId.toLowerCase().includes('looney')) {
      issues.push('Assignment may affect real customer ticket');
      recommendations.push('Ensure ticket ID includes test identifier');
      riskLevel = 'critical';
    }

    if (!assignment.routeId.toLowerCase().includes('test') && 
        !assignment.routeId.toLowerCase().includes('looney')) {
      issues.push('Assignment may affect real route');
      recommendations.push('Ensure route ID includes test identifier');
      riskLevel = 'critical';
    }

    return { isSafe: issues.length === 0, riskLevel, issues, recommendations };
  }

  /**
   * Assesses location safety
   */
  private assessLocationSafety(location: GeoCoordinate): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if location is in designated test areas
    const testAreas = ProductionDataValidator.getTestServiceAreas();
    const isInTestArea = testAreas.some(area => {
      return location.lat >= area.bounds.south &&
             location.lat <= area.bounds.north &&
             location.lng >= area.bounds.west &&
             location.lng <= area.bounds.east;
    });

    if (!isInTestArea && this.config.enforceServiceAreaBounds) {
      issues.push('Location is outside designated test service areas');
      recommendations.push('Use coordinates within designated test areas');
      riskLevel = 'high';
    }

    return { isSafe: issues.length === 0, riskLevel, issues, recommendations };
  }

  /**
   * Assesses service area safety
   */
  private assessServiceAreaSafety(serviceArea: any): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (!serviceArea.coordinates || !Array.isArray(serviceArea.coordinates)) {
      issues.push('Service area coordinates are invalid');
      recommendations.push('Provide valid coordinate array for service area');
      riskLevel = 'high';
      return { isSafe: false, riskLevel, issues, recommendations };
    }

    // Check if all coordinates are in test areas
    const testAreas = ProductionDataValidator.getTestServiceAreas();
    const allCoordsInTestArea = serviceArea.coordinates.every((coord: GeoCoordinate) => {
      return testAreas.some(area => {
        return coord.lat >= area.bounds.south &&
               coord.lat <= area.bounds.north &&
               coord.lng >= area.bounds.west &&
               coord.lng <= area.bounds.east;
      });
    });

    if (!allCoordsInTestArea && this.config.enforceServiceAreaBounds) {
      issues.push('Service area extends outside designated test regions');
      recommendations.push('Ensure all service area coordinates are within test boundaries');
      riskLevel = 'high';
    }

    return { isSafe: issues.length === 0, riskLevel, issues, recommendations };
  }

  /**
   * Checks for assignment conflicts
   */
  private checkAssignmentConflicts(assignments: Assignment[]): SafetyCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for duplicate ticket assignments
    const ticketIds = assignments.map(a => a.ticketId);
    const duplicateTickets = ticketIds.filter((id, index) => ticketIds.indexOf(id) !== index);
    
    if (duplicateTickets.length > 0) {
      issues.push(`Duplicate ticket assignments found: ${duplicateTickets.join(', ')}`);
      recommendations.push('Remove duplicate assignments before processing');
      riskLevel = 'medium';
    }

    // Check for route overloading (simplified check)
    const routeAssignments = new Map<string, number>();
    assignments.forEach(assignment => {
      const count = routeAssignments.get(assignment.routeId) || 0;
      routeAssignments.set(assignment.routeId, count + 1);
    });

    routeAssignments.forEach((count, routeId) => {
      if (count > 20) { // Arbitrary threshold for testing
        issues.push(`Route ${routeId} has ${count} assignments, which may be excessive`);
        recommendations.push('Distribute assignments more evenly across routes');
        riskLevel = 'medium';
      }
    });

    return { isSafe: issues.length === 0, riskLevel, issues, recommendations };
  }

  /**
   * Checks if customer data is safe for testing
   */
  private isTestCustomerSafe(ticket: LocationTestTicket): boolean {
    return ticket.isTestData && 
           ticket.customerName.toLowerCase().includes('looneytunestest');
  }

  /**
   * Gets numeric priority for risk levels
   */
  private getRiskPriority(riskLevel: string): number {
    const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
    return priorities[riskLevel] || 1;
  }

  /**
   * Logs safety operations
   */
  private logOperation(operation: string, riskLevel: string, details: any): void {
    this.operationLog.push({
      timestamp: new Date(),
      operation,
      riskLevel,
      details
    });

    // Keep only last 1000 log entries
    if (this.operationLog.length > 1000) {
      this.operationLog = this.operationLog.slice(-1000);
    }
  }

  /**
   * Gets operation log
   */
  public getOperationLog(): Array<{
    timestamp: Date;
    operation: string;
    riskLevel: string;
    details: any;
  }> {
    return [...this.operationLog];
  }

  /**
   * Gets current safety configuration
   */
  public getConfiguration(): SafetyConfiguration {
    return { ...this.config };
  }

  /**
   * Updates safety configuration
   */
  public updateConfiguration(newConfig: Partial<SafetyConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clears operation log
   */
  public clearLog(): void {
    this.operationLog = [];
  }

  /**
   * Validates database reset operation safety
   */
  public async validateDatabaseReset(options: any): Promise<SafetyCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if production writes are allowed
    if (!this.config.allowProductionWrites) {
      issues.push('Database reset blocked: Production writes are disabled');
      recommendations.push('Enable production writes in safety configuration if reset is intended');
      riskLevel = 'critical';
    }

    // Check reset scope
    if (options?.dropTables) {
      issues.push('Database reset includes dropping tables - high risk operation');
      recommendations.push('Consider using data cleanup instead of dropping tables');
      riskLevel = 'high';
    }

    if (options?.recreateSchema) {
      issues.push('Database reset includes schema recreation - high risk operation');
      recommendations.push('Verify schema recreation is necessary');
      riskLevel = 'high';
    }

    // Log the operation
    if (this.config.logAllOperations) {
      this.logOperation('database_reset_validation', riskLevel, {
        options,
        issues: issues.length,
        riskLevel
      });
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Validates cleanup operation safety
   */
  public async validateCleanupOperation(options?: any): Promise<SafetyCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check cleanup scope
    if (options?.removeAssignments === false && options?.removeTickets === false) {
      issues.push('Cleanup operation will not remove any test data');
      recommendations.push('Enable removal of assignments or tickets for effective cleanup');
      riskLevel = 'medium';
    }

    if (!options?.preserveRoutes && !options?.preserveLocations) {
      issues.push('Cleanup will remove all routes and locations - verify this is intended');
      recommendations.push('Consider preserving routes and locations for reuse');
      riskLevel = 'medium';
    }

    // Log the operation
    if (this.config.logAllOperations) {
      this.logOperation('cleanup_validation', riskLevel, {
        options,
        issues: issues.length,
        riskLevel
      });
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Validates test data safety
   */
  public async validateTestDataSafety(testData: { tickets: any[]; routes: any[] }): Promise<SafetyCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Validate all tickets
    for (const ticket of testData.tickets) {
      const ticketValidation = this.validateTicketCreationSafety(ticket);
      if (!ticketValidation.isSafe) {
        issues.push(`Ticket ${ticket.id}: ${ticketValidation.issues.join(', ')}`);
        if (this.getRiskPriority(ticketValidation.riskLevel) > this.getRiskPriority(riskLevel)) {
          riskLevel = ticketValidation.riskLevel;
        }
      }
    }

    // Validate all routes
    for (const route of testData.routes) {
      const routeValidation = this.validateRouteCreationSafety(route);
      if (!routeValidation.isSafe) {
        issues.push(`Route ${route.id}: ${routeValidation.issues.join(', ')}`);
        if (this.getRiskPriority(routeValidation.riskLevel) > this.getRiskPriority(riskLevel)) {
          riskLevel = routeValidation.riskLevel;
        }
      }
    }

    // Check data volume
    if (testData.tickets.length > 1000 || testData.routes.length > 100) {
      issues.push('Large volume of test data may impact system performance');
      recommendations.push('Consider reducing test data volume or using batch processing');
      riskLevel = 'medium';
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues,
      recommendations
    };
  }

  /**
   * Performs pre-setup safety check
   */
  public async performPreSetupSafetyCheck(): Promise<ValidationResult> {
    const issues: string[] = [];

    // Check configuration
    if (!this.config.allowProductionWrites) {
      issues.push('Production writes are disabled - setup may fail');
    }

    if (!this.config.requireTestIdentifiers) {
      issues.push('Test identifier requirement is disabled - risk of affecting real data');
    }

    // Check system state (placeholder - would check actual system state)
    const systemTime = new Date();
    const hour = systemTime.getHours();
    const day = systemTime.getDay();

    if (day >= 1 && day <= 5 && hour >= 8 && hour <= 17) {
      issues.push('Setup during business hours increases risk of production impact');
    }

    // Log the check
    if (this.config.logAllOperations) {
      this.logOperation('pre_setup_safety_check', issues.length > 0 ? 'medium' : 'low', {
        issues: issues.length,
        timestamp: systemTime
      });
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }
}