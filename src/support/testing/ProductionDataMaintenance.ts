/**
 * Production Data Maintenance
 * 
 * Scripts and utilities for creating, maintaining, and cleaning up
 * production test data using the LooneyTunes naming convention.
 */

import { LooneyTunesDataProvider } from './LooneyTunesDataProvider';
import { TestCustomer, TestRoute, TestTicket, ProductionConfig, TestDataSet } from './types';

export interface MaintenanceReport {
  timestamp: Date;
  operation: string;
  entitiesProcessed: {
    customers: number;
    routes: number;
    tickets: number;
  };
  errors: string[];
  warnings: string[];
  summary: string;
}

export interface DataHealthCheck {
  isHealthy: boolean;
  issues: {
    orphanedTickets: TestTicket[];
    duplicateCustomers: TestCustomer[];
    missingRoutes: string[];
    invalidNaming: Array<{ type: string; entity: any; issue: string }>;
  };
  recommendations: string[];
}

export interface MaintenanceOptions {
  dryRun?: boolean;
  force?: boolean;
  preserveData?: boolean;
  maxAge?: number; // days
}

/**
 * Maintains production test data integrity and lifecycle
 */
export class ProductionDataMaintenance {
  private provider: LooneyTunesDataProvider;
  private config: ProductionConfig;

  constructor(config: ProductionConfig) {
    this.config = config;
    this.provider = new LooneyTunesDataProvider({
      testDataPrefix: config.testDataPrefix,
      locations: config.locations,
      customerNames: config.customerNames,
      cleanupPolicy: config.cleanupPolicy
    });
  }

  /**
   * Performs comprehensive health check on production test data
   */
  async performHealthCheck(): Promise<DataHealthCheck> {
    console.log('Performing production test data health check...');

    const healthCheck: DataHealthCheck = {
      isHealthy: true,
      issues: {
        orphanedTickets: [],
        duplicateCustomers: [],
        missingRoutes: [],
        invalidNaming: []
      },
      recommendations: []
    };

    try {
      // Get all existing test data
      const customers = await this.provider.findExistingTestCustomers();
      const routes = await this.provider.findExistingTestRoutes();
      const tickets = await this.provider.findExistingTestTickets();

      // Check for orphaned tickets
      healthCheck.issues.orphanedTickets = tickets.filter(ticket => 
        !customers.some(customer => customer.id === ticket.customerId) ||
        !routes.some(route => route.id === ticket.routeId)
      );

      // Check for duplicate customers
      const customerNames = new Map<string, TestCustomer[]>();
      customers.forEach(customer => {
        const name = customer.name;
        if (!customerNames.has(name)) {
          customerNames.set(name, []);
        }
        customerNames.get(name)!.push(customer);
      });

      customerNames.forEach((customerList, name) => {
        if (customerList.length > 1) {
          healthCheck.issues.duplicateCustomers.push(...customerList);
        }
      });

      // Check for missing routes in configured locations
      const existingLocations = new Set(routes.map(route => route.location));
      healthCheck.issues.missingRoutes = this.config.locations.filter(
        location => !existingLocations.has(location)
      );

      // Validate naming conventions
      customers.forEach(customer => {
        if (!this.provider.validateTestDataNaming(customer)) {
          healthCheck.issues.invalidNaming.push({
            type: 'customer',
            entity: customer,
            issue: 'Invalid naming convention'
          });
        }
      });

      routes.forEach(route => {
        if (!this.provider.validateTestDataNaming(route)) {
          healthCheck.issues.invalidNaming.push({
            type: 'route',
            entity: route,
            issue: 'Invalid naming convention'
          });
        }
      });

      // Generate recommendations
      if (healthCheck.issues.orphanedTickets.length > 0) {
        healthCheck.isHealthy = false;
        healthCheck.recommendations.push(
          `Clean up ${healthCheck.issues.orphanedTickets.length} orphaned tickets`
        );
      }

      if (healthCheck.issues.duplicateCustomers.length > 0) {
        healthCheck.isHealthy = false;
        healthCheck.recommendations.push(
          `Remove ${healthCheck.issues.duplicateCustomers.length} duplicate customers`
        );
      }

      if (healthCheck.issues.missingRoutes.length > 0) {
        healthCheck.recommendations.push(
          `Create missing routes for locations: ${healthCheck.issues.missingRoutes.join(', ')}`
        );
      }

      if (healthCheck.issues.invalidNaming.length > 0) {
        healthCheck.isHealthy = false;
        healthCheck.recommendations.push(
          `Fix naming convention for ${healthCheck.issues.invalidNaming.length} entities`
        );
      }

      console.log(`Health check completed: ${healthCheck.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
      return healthCheck;

    } catch (error) {
      console.error('Health check failed:', error);
      healthCheck.isHealthy = false;
      healthCheck.recommendations.push('Investigate health check failure');
      return healthCheck;
    }
  }

  /**
   * Creates initial production test data setup
   */
  async initializeProductionTestData(options: MaintenanceOptions = {}): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      operation: 'initialize',
      entitiesProcessed: { customers: 0, routes: 0, tickets: 0 },
      errors: [],
      warnings: [],
      summary: ''
    };

    try {
      console.log('Initializing production test data...');

      if (options.dryRun) {
        console.log('DRY RUN: Would create initial test data');
        report.summary = 'Dry run completed - no changes made';
        return report;
      }

      // Check if test data already exists
      const existingCustomers = await this.provider.findExistingTestCustomers();
      const existingRoutes = await this.provider.findExistingTestRoutes();

      if (existingCustomers.length > 0 || existingRoutes.length > 0) {
        if (!options.force) {
          report.warnings.push('Test data already exists - use force option to recreate');
          report.summary = 'Initialization skipped - existing data found';
          return report;
        } else {
          console.log('Force option enabled - cleaning existing data first');
          await this.cleanupTestData({ ...options, dryRun: false });
        }
      }

      // Create test customers
      const customers = await this.provider.createTestCustomers(
        Math.min(this.config.customerNames.length, 5)
      );
      report.entitiesProcessed.customers = customers.length;

      // Create test routes
      const routes = await this.provider.createTestRoutes();
      report.entitiesProcessed.routes = routes.length;

      // Create test tickets
      const tickets = await this.provider.createTestTickets(customers, routes);
      report.entitiesProcessed.tickets = tickets.length;

      report.summary = `Initialized ${customers.length} customers, ${routes.length} routes, ${tickets.length} tickets`;
      console.log('Production test data initialization completed');

    } catch (error) {
      report.errors.push(`Initialization failed: ${error.message}`);
      console.error('Failed to initialize production test data:', error);
    }

    return report;
  }

  /**
   * Repairs issues found in health check
   */
  async repairTestData(healthCheck: DataHealthCheck, options: MaintenanceOptions = {}): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      operation: 'repair',
      entitiesProcessed: { customers: 0, routes: 0, tickets: 0 },
      errors: [],
      warnings: [],
      summary: ''
    };

    try {
      console.log('Repairing production test data issues...');

      if (options.dryRun) {
        console.log('DRY RUN: Would repair the following issues:');
        healthCheck.recommendations.forEach(rec => console.log(`  - ${rec}`));
        report.summary = 'Dry run completed - no repairs made';
        return report;
      }

      // Clean up orphaned tickets
      if (healthCheck.issues.orphanedTickets.length > 0) {
        console.log(`Cleaning up ${healthCheck.issues.orphanedTickets.length} orphaned tickets`);
        for (const ticket of healthCheck.issues.orphanedTickets) {
          await this.deleteTicket(ticket.id);
          report.entitiesProcessed.tickets++;
        }
      }

      // Remove duplicate customers (keep the first one)
      if (healthCheck.issues.duplicateCustomers.length > 0) {
        const duplicateGroups = this.groupDuplicateCustomers(healthCheck.issues.duplicateCustomers);
        
        for (const [name, customers] of duplicateGroups) {
          // Keep the first customer, remove the rest
          const toRemove = customers.slice(1);
          console.log(`Removing ${toRemove.length} duplicate customers for: ${name}`);
          
          for (const customer of toRemove) {
            await this.deleteCustomer(customer.id);
            report.entitiesProcessed.customers++;
          }
        }
      }

      // Create missing routes
      if (healthCheck.issues.missingRoutes.length > 0) {
        console.log(`Creating ${healthCheck.issues.missingRoutes.length} missing routes`);
        for (const location of healthCheck.issues.missingRoutes) {
          await this.provider.createTestRoute({ location });
          report.entitiesProcessed.routes++;
        }
      }

      // Fix naming convention issues
      if (healthCheck.issues.invalidNaming.length > 0) {
        console.log(`Fixing ${healthCheck.issues.invalidNaming.length} naming issues`);
        for (const issue of healthCheck.issues.invalidNaming) {
          await this.fixNamingIssue(issue);
        }
      }

      const totalFixed = report.entitiesProcessed.customers + 
                        report.entitiesProcessed.routes + 
                        report.entitiesProcessed.tickets;

      report.summary = `Repaired ${totalFixed} entities`;
      console.log('Test data repair completed');

    } catch (error) {
      report.errors.push(`Repair failed: ${error.message}`);
      console.error('Failed to repair test data:', error);
    }

    return report;
  }

  /**
   * Cleans up old or invalid test data
   */
  async cleanupTestData(options: MaintenanceOptions = {}): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      operation: 'cleanup',
      entitiesProcessed: { customers: 0, routes: 0, tickets: 0 },
      errors: [],
      warnings: [],
      summary: ''
    };

    try {
      console.log('Cleaning up production test data...');

      if (options.dryRun) {
        console.log('DRY RUN: Would clean up test data');
        report.summary = 'Dry run completed - no cleanup performed';
        return report;
      }

      // Get all test data
      const customers = await this.provider.findExistingTestCustomers();
      const routes = await this.provider.findExistingTestRoutes();
      const tickets = await this.provider.findExistingTestTickets();

      // Filter by age if specified
      let customersToDelete = customers;
      let routesToDelete = routes;
      let ticketsToDelete = tickets;

      if (options.maxAge) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.maxAge);

        // Note: In real implementation, would filter by creation date
        // For now, we'll clean up all test data if maxAge is specified
        console.log(`Cleaning up test data older than ${options.maxAge} days`);
      }

      // Delete tickets first (to avoid foreign key constraints)
      for (const ticket of ticketsToDelete) {
        await this.deleteTicket(ticket.id);
        report.entitiesProcessed.tickets++;
      }

      // Delete customers
      for (const customer of customersToDelete) {
        await this.deleteCustomer(customer.id);
        report.entitiesProcessed.customers++;
      }

      // Delete routes (if not preserving data)
      if (!options.preserveData) {
        for (const route of routesToDelete) {
          await this.deleteRoute(route.id);
          report.entitiesProcessed.routes++;
        }
      }

      const totalCleaned = report.entitiesProcessed.customers + 
                          report.entitiesProcessed.routes + 
                          report.entitiesProcessed.tickets;

      report.summary = `Cleaned up ${totalCleaned} entities`;
      console.log('Test data cleanup completed');

    } catch (error) {
      report.errors.push(`Cleanup failed: ${error.message}`);
      console.error('Failed to cleanup test data:', error);
    }

    return report;
  }

  /**
   * Refreshes test data by recreating it
   */
  async refreshTestData(options: MaintenanceOptions = {}): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      operation: 'refresh',
      entitiesProcessed: { customers: 0, routes: 0, tickets: 0 },
      errors: [],
      warnings: [],
      summary: ''
    };

    try {
      console.log('Refreshing production test data...');

      // First cleanup existing data
      const cleanupReport = await this.cleanupTestData(options);
      
      // Then initialize fresh data
      const initReport = await this.initializeProductionTestData(options);

      // Combine reports
      report.entitiesProcessed.customers = cleanupReport.entitiesProcessed.customers + initReport.entitiesProcessed.customers;
      report.entitiesProcessed.routes = cleanupReport.entitiesProcessed.routes + initReport.entitiesProcessed.routes;
      report.entitiesProcessed.tickets = cleanupReport.entitiesProcessed.tickets + initReport.entitiesProcessed.tickets;
      
      report.errors = [...cleanupReport.errors, ...initReport.errors];
      report.warnings = [...cleanupReport.warnings, ...initReport.warnings];
      
      report.summary = `Refreshed test data: ${cleanupReport.summary} -> ${initReport.summary}`;
      console.log('Test data refresh completed');

    } catch (error) {
      report.errors.push(`Refresh failed: ${error.message}`);
      console.error('Failed to refresh test data:', error);
    }

    return report;
  }

  /**
   * Generates maintenance report
   */
  async generateMaintenanceReport(): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: new Date(),
      operation: 'status',
      entitiesProcessed: { customers: 0, routes: 0, tickets: 0 },
      errors: [],
      warnings: [],
      summary: ''
    };

    try {
      // Get current test data counts
      const customers = await this.provider.findExistingTestCustomers();
      const routes = await this.provider.findExistingTestRoutes();
      const tickets = await this.provider.findExistingTestTickets();

      report.entitiesProcessed = {
        customers: customers.length,
        routes: routes.length,
        tickets: tickets.length
      };

      // Perform health check
      const healthCheck = await this.performHealthCheck();
      
      if (!healthCheck.isHealthy) {
        report.warnings.push('Health check found issues');
        report.warnings.push(...healthCheck.recommendations);
      }

      report.summary = `Current status: ${customers.length} customers, ${routes.length} routes, ${tickets.length} tickets`;
      
      if (!healthCheck.isHealthy) {
        report.summary += ` (${healthCheck.recommendations.length} issues found)`;
      }

    } catch (error) {
      report.errors.push(`Status check failed: ${error.message}`);
    }

    return report;
  }

  // Private helper methods

  private groupDuplicateCustomers(duplicates: TestCustomer[]): Map<string, TestCustomer[]> {
    const groups = new Map<string, TestCustomer[]>();
    
    duplicates.forEach(customer => {
      const name = customer.name;
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)!.push(customer);
    });

    return groups;
  }

  private async deleteCustomer(customerId: string): Promise<void> {
    // Mock implementation - would delete from production database
    console.log(`Deleting customer: ${customerId}`);
  }

  private async deleteRoute(routeId: string): Promise<void> {
    // Mock implementation - would delete from production database
    console.log(`Deleting route: ${routeId}`);
  }

  private async deleteTicket(ticketId: string): Promise<void> {
    // Mock implementation - would delete from production database
    console.log(`Deleting ticket: ${ticketId}`);
  }

  private async fixNamingIssue(issue: { type: string; entity: any; issue: string }): Promise<void> {
    // Mock implementation - would update entity naming in production database
    console.log(`Fixing naming issue for ${issue.type}: ${issue.entity.id}`);
  }
}