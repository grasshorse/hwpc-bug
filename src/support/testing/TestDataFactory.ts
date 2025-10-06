/**
 * Base TestDataFactory interface with dual-mode support
 * Provides factory methods for creating test data in both isolated and production modes
 */

import { TestMode, TestCustomer, TestRoute, TestTicket } from './types';

export interface TestDataFactory {
  /**
   * Creates test customers with mode-appropriate naming conventions
   */
  createCustomers(count: number, mode: TestMode, options?: CustomerOptions): Promise<TestCustomer[]>;
  
  /**
   * Creates test tickets with proper test markers and location data
   */
  createTickets(count: number, mode: TestMode, options?: TicketOptions): Promise<TestTicket[]>;
  
  /**
   * Creates test routes with service area management and naming patterns
   */
  createRoutes(count: number, mode: TestMode, options?: RouteOptions): Promise<TestRoute[]>;
  
  /**
   * Creates assignments linking tickets to routes with validation
   */
  createAssignments(tickets: TestTicket[], routes: TestRoute[], mode: TestMode): Promise<Assignment[]>;
  
  /**
   * Validates that test data follows naming conventions for the given mode
   */
  validateTestDataNaming(data: any[], mode: TestMode): ValidationResult;
}

export interface CustomerOptions {
  namePrefix?: string;
  addressPattern?: string;
  serviceArea?: string;
  testMarker?: string;
  looneyTunesCharacter?: string; // For production mode
  emailDomain?: string; // Defaults to looneytunestest.com in production
}

export interface TicketOptions {
  priorityDistribution?: PriorityDistribution;
  locationBounds?: GeographicBounds;
  statusFilter?: TicketStatus[];
  testMarker?: string;
  assignToTestRoutes?: boolean; // Only assign to test routes in production
}

export interface RouteOptions {
  capacityRange?: [number, number];
  serviceAreas?: string[];
  scheduleType?: ScheduleType;
  testMarker?: string;
  locationName?: string; // For production route naming
  testRoutePattern?: boolean; // Use "[Location] Test Route - looneyTunesTest" pattern
}

export interface Assignment {
  id: string;
  ticketId: string;
  routeId: string;
  assignedAt: Date;
  isTestData: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues?: string[];
}

export interface PriorityDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export enum TicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ScheduleType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ON_DEMAND = 'on_demand'
}

/**
 * Base implementation of TestDataFactory with common functionality
 */
export abstract class BaseTestDataFactory implements TestDataFactory {
  protected testId: string;
  protected createdData: Map<string, any[]> = new Map();

  constructor(testId: string) {
    this.testId = testId;
  }

  abstract createCustomers(count: number, mode: TestMode, options?: CustomerOptions): Promise<TestCustomer[]>;
  abstract createTickets(count: number, mode: TestMode, options?: TicketOptions): Promise<TestTicket[]>;
  abstract createRoutes(count: number, mode: TestMode, options?: RouteOptions): Promise<TestRoute[]>;
  abstract createAssignments(tickets: TestTicket[], routes: TestRoute[], mode: TestMode): Promise<Assignment[]>;

  /**
   * Validates test data naming conventions based on mode
   */
  public validateTestDataNaming(data: any[], mode: TestMode): ValidationResult {
    const issues: string[] = [];

    data.forEach((item, index) => {
      if (mode === TestMode.PRODUCTION) {
        // Production mode requires looneyTunesTest naming
        if (item.name && !item.name.includes('looneyTunesTest')) {
          issues.push(`Item ${index + 1}: Name "${item.name}" doesn't follow looneyTunesTest convention`);
        }
        if (item.email && !item.email.includes('looneytunestest.com')) {
          issues.push(`Item ${index + 1}: Email "${item.email}" doesn't use looneytunestest.com domain`);
        }
      } else if (mode === TestMode.ISOLATED) {
        // Isolated mode requires unique test identifiers
        if (item.name && !item.name.includes(this.testId)) {
          issues.push(`Item ${index + 1}: Name "${item.name}" doesn't include test ID for isolation`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Registers created data for cleanup tracking
   */
  protected registerCreatedData(type: string, data: any[]): void {
    if (!this.createdData.has(type)) {
      this.createdData.set(type, []);
    }
    this.createdData.get(type)!.push(...data);
  }

  /**
   * Gets all created data for cleanup purposes
   */
  public getCreatedData(): Map<string, any[]> {
    return new Map(this.createdData);
  }

  /**
   * Clears the created data registry
   */
  public clearCreatedData(): void {
    this.createdData.clear();
  }
}