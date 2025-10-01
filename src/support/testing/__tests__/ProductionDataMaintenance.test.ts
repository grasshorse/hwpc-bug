/**
 * Integration tests for ProductionDataMaintenance
 * 
 * Tests production test data maintenance operations including
 * health checks, initialization, repair, and cleanup operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductionDataMaintenance } from '../ProductionDataMaintenance';
import { LooneyTunesDataProvider } from '../LooneyTunesDataProvider';
import { ProductionConfig, TestCustomer, TestRoute, TestTicket } from '../types';

describe('ProductionDataMaintenance Integration Tests', () => {
  let maintenance: ProductionDataMaintenance;
  let mockProvider: LooneyTunesDataProvider;
  let productionConfig: ProductionConfig;

  beforeEach(() => {
    productionConfig = {
      testDataPrefix: 'looneyTunesTest',
      locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
      customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
      cleanupPolicy: 'preserve'
    };

    maintenance = new ProductionDataMaintenance(productionConfig);
    mockProvider = new LooneyTunesDataProvider(productionConfig);
  });

  describe('Health Check Operations', () => {
    it('should perform comprehensive health check on healthy data', async () => {
      // Create healthy test data
      const customers = await mockProvider.createTestCustomers(3);
      const routes = await mockProvider.createTestRoutes();
      const tickets = await mockProvider.createTestTickets(customers, routes);

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.isHealthy).toBe(true);
      expect(healthCheck.issues.orphanedTickets).toHaveLength(0);
      expect(healthCheck.issues.duplicateCustomers).toHaveLength(0);
      expect(healthCheck.issues.missingRoutes).toHaveLength(0);
      expect(healthCheck.issues.invalidNaming).toHaveLength(0);
      expect(healthCheck.recommendations).toHaveLength(0);
    });

    it('should detect orphaned tickets', async () => {
      // Mock provider to return orphaned tickets
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs@test.com',
          phone: '555-0001',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([
        {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        },
        {
          id: 'ticket-002',
          customerId: 'non-existent-customer',
          routeId: 'non-existent-route',
          status: 'active',
          isTestData: true
        }
      ]);

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.issues.orphanedTickets).toHaveLength(1);
      expect(healthCheck.issues.orphanedTickets[0].id).toBe('ticket-002');
      expect(healthCheck.recommendations).toContain('Clean up 1 orphaned tickets');
    });

    it('should detect duplicate customers', async () => {
      const duplicateCustomers: TestCustomer[] = [
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs1@test.com',
          phone: '555-0001',
          isTestData: true
        },
        {
          id: 'cust-002',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs2@test.com',
          phone: '555-0002',
          isTestData: true
        }
      ];

      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue(duplicateCustomers);
      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([]);

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.issues.duplicateCustomers).toHaveLength(2);
      expect(healthCheck.recommendations).toContain('Remove 2 duplicate customers');
    });

    it('should detect missing routes for configured locations', async () => {
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        }
        // Missing Winfield and O'Fallon routes
      ]);
      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([]);

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.issues.missingRoutes).toContain('Winfield');
      expect(healthCheck.issues.missingRoutes).toContain("O'Fallon");
      expect(healthCheck.recommendations).toContain('Create missing routes for locations: Winfield, O\'Fallon');
    });

    it('should detect invalid naming conventions', async () => {
      const invalidCustomers: TestCustomer[] = [
        {
          id: 'cust-001',
          name: 'Invalid Customer Name', // Missing looneyTunesTest
          email: 'invalid@test.com',
          phone: '555-0001',
          isTestData: true
        }
      ];

      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue(invalidCustomers);
      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'validateTestDataNaming').mockReturnValue(false);

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.issues.invalidNaming).toHaveLength(1);
      expect(healthCheck.recommendations).toContain('Fix naming convention for 1 entities');
    });
  });

  describe('Initialization Operations', () => {
    it('should initialize production test data successfully', async () => {
      const report = await maintenance.initializeProductionTestData();

      expect(report.operation).toBe('initialize');
      expect(report.entitiesProcessed.customers).toBeGreaterThan(0);
      expect(report.entitiesProcessed.routes).toBeGreaterThan(0);
      expect(report.entitiesProcessed.tickets).toBeGreaterThan(0);
      expect(report.errors).toHaveLength(0);
      expect(report.summary).toContain('Initialized');
    });

    it('should skip initialization if data already exists without force option', async () => {
      // Mock existing data
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([
        {
          id: 'existing-customer',
          name: 'Existing Customer - looneyTunesTest',
          email: 'existing@test.com',
          phone: '555-0000',
          isTestData: true
        }
      ]);

      const report = await maintenance.initializeProductionTestData();

      expect(report.warnings).toContain('Test data already exists - use force option to recreate');
      expect(report.summary).toBe('Initialization skipped - existing data found');
    });

    it('should recreate data when force option is used', async () => {
      // Mock existing data
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([
        {
          id: 'existing-customer',
          name: 'Existing Customer - looneyTunesTest',
          email: 'existing@test.com',
          phone: '555-0000',
          isTestData: true
        }
      ]);

      const report = await maintenance.initializeProductionTestData({ force: true });

      expect(report.entitiesProcessed.customers).toBeGreaterThan(0);
      expect(report.summary).toContain('Initialized');
    });

    it('should perform dry run without creating data', async () => {
      const report = await maintenance.initializeProductionTestData({ dryRun: true });

      expect(report.summary).toBe('Dry run completed - no changes made');
      expect(report.entitiesProcessed.customers).toBe(0);
      expect(report.entitiesProcessed.routes).toBe(0);
      expect(report.entitiesProcessed.tickets).toBe(0);
    });
  });

  describe('Repair Operations', () => {
    it('should repair orphaned tickets', async () => {
      const healthCheck = {
        isHealthy: false,
        issues: {
          orphanedTickets: [
            {
              id: 'orphaned-ticket',
              customerId: 'non-existent',
              routeId: 'non-existent',
              status: 'active',
              isTestData: true
            }
          ],
          duplicateCustomers: [],
          missingRoutes: [],
          invalidNaming: []
        },
        recommendations: ['Clean up 1 orphaned tickets']
      };

      const report = await maintenance.repairTestData(healthCheck);

      expect(report.operation).toBe('repair');
      expect(report.entitiesProcessed.tickets).toBe(1);
      expect(report.summary).toContain('Repaired 1 entities');
    });

    it('should repair duplicate customers', async () => {
      const duplicateCustomers: TestCustomer[] = [
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs1@test.com',
          phone: '555-0001',
          isTestData: true
        },
        {
          id: 'cust-002',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs2@test.com',
          phone: '555-0002',
          isTestData: true
        }
      ];

      const healthCheck = {
        isHealthy: false,
        issues: {
          orphanedTickets: [],
          duplicateCustomers,
          missingRoutes: [],
          invalidNaming: []
        },
        recommendations: ['Remove duplicate customers']
      };

      const report = await maintenance.repairTestData(healthCheck);

      expect(report.operation).toBe('repair');
      expect(report.entitiesProcessed.customers).toBe(1); // One duplicate removed
    });

    it('should create missing routes', async () => {
      const healthCheck = {
        isHealthy: false,
        issues: {
          orphanedTickets: [],
          duplicateCustomers: [],
          missingRoutes: ['Winfield', "O'Fallon"],
          invalidNaming: []
        },
        recommendations: ['Create missing routes']
      };

      const report = await maintenance.repairTestData(healthCheck);

      expect(report.operation).toBe('repair');
      expect(report.entitiesProcessed.routes).toBe(2);
    });

    it('should perform dry run repair without making changes', async () => {
      const healthCheck = {
        isHealthy: false,
        issues: {
          orphanedTickets: [
            {
              id: 'orphaned-ticket',
              customerId: 'non-existent',
              routeId: 'non-existent',
              status: 'active',
              isTestData: true
            }
          ],
          duplicateCustomers: [],
          missingRoutes: [],
          invalidNaming: []
        },
        recommendations: ['Clean up orphaned tickets']
      };

      const report = await maintenance.repairTestData(healthCheck, { dryRun: true });

      expect(report.summary).toBe('Dry run completed - no repairs made');
      expect(report.entitiesProcessed.tickets).toBe(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup all test data', async () => {
      // Mock existing test data
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs@test.com',
          phone: '555-0001',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([
        {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        }
      ]);

      const report = await maintenance.cleanupTestData();

      expect(report.operation).toBe('cleanup');
      expect(report.entitiesProcessed.customers).toBe(1);
      expect(report.entitiesProcessed.routes).toBe(1);
      expect(report.entitiesProcessed.tickets).toBe(1);
      expect(report.summary).toContain('Cleaned up 3 entities');
    });

    it('should preserve routes when preserveData option is used', async () => {
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        }
      ]);
      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([]);

      const report = await maintenance.cleanupTestData({ preserveData: true });

      expect(report.entitiesProcessed.routes).toBe(0); // Routes preserved
    });

    it('should perform dry run cleanup', async () => {
      const report = await maintenance.cleanupTestData({ dryRun: true });

      expect(report.summary).toBe('Dry run completed - no cleanup performed');
    });
  });

  describe('Refresh Operations', () => {
    it('should refresh test data by cleaning and reinitializing', async () => {
      const report = await maintenance.refreshTestData();

      expect(report.operation).toBe('refresh');
      expect(report.summary).toContain('Refreshed test data');
      expect(report.errors).toHaveLength(0);
    });

    it('should handle refresh errors gracefully', async () => {
      // Mock cleanup to fail
      vi.spyOn(maintenance, 'cleanupTestData').mockRejectedValue(new Error('Cleanup failed'));

      const report = await maintenance.refreshTestData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('Refresh failed');
    });
  });

  describe('Status Reporting', () => {
    it('should generate comprehensive maintenance report', async () => {
      // Mock existing data
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs@test.com',
          phone: '555-0001',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        }
      ]);

      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([
        {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        }
      ]);

      const report = await maintenance.generateMaintenanceReport();

      expect(report.operation).toBe('status');
      expect(report.entitiesProcessed.customers).toBe(1);
      expect(report.entitiesProcessed.routes).toBe(1);
      expect(report.entitiesProcessed.tickets).toBe(1);
      expect(report.summary).toContain('Current status: 1 customers, 1 routes, 1 tickets');
    });

    it('should include health check issues in status report', async () => {
      // Mock unhealthy data
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestRoutes').mockResolvedValue([]);
      vi.spyOn(mockProvider, 'findExistingTestTickets').mockResolvedValue([
        {
          id: 'orphaned-ticket',
          customerId: 'non-existent',
          routeId: 'non-existent',
          status: 'active',
          isTestData: true
        }
      ]);

      const report = await maintenance.generateMaintenanceReport();

      expect(report.warnings).toContain('Health check found issues');
      expect(report.summary).toContain('issues found');
    });
  });

  describe('Error Handling', () => {
    it('should handle health check failures gracefully', async () => {
      // Mock provider methods to throw errors
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockRejectedValue(new Error('Database error'));

      const healthCheck = await maintenance.performHealthCheck();

      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.recommendations).toContain('Investigate health check failure');
    });

    it('should handle initialization failures', async () => {
      // Mock provider to throw error during customer creation
      vi.spyOn(mockProvider, 'createTestCustomers').mockRejectedValue(new Error('Creation failed'));

      const report = await maintenance.initializeProductionTestData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('Initialization failed');
    });

    it('should handle cleanup failures', async () => {
      // Mock provider methods to throw errors
      vi.spyOn(mockProvider, 'findExistingTestCustomers').mockRejectedValue(new Error('Query failed'));

      const report = await maintenance.cleanupTestData();

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain('Cleanup failed');
    });
  });

  describe('Configuration Validation', () => {
    it('should work with different cleanup policies', async () => {
      const archiveConfig = { ...productionConfig, cleanupPolicy: 'archive' as const };
      const archiveMaintenance = new ProductionDataMaintenance(archiveConfig);

      const report = await archiveMaintenance.cleanupTestData();
      expect(report).toBeDefined();
    });

    it('should handle custom locations and customer names', async () => {
      const customConfig = {
        ...productionConfig,
        locations: ['Custom Location 1', 'Custom Location 2'],
        customerNames: ['Custom Character 1', 'Custom Character 2']
      };

      const customMaintenance = new ProductionDataMaintenance(customConfig);
      const report = await customMaintenance.initializeProductionTestData();

      expect(report.entitiesProcessed.customers).toBeGreaterThan(0);
      expect(report.entitiesProcessed.routes).toBeGreaterThan(0);
    });
  });
});