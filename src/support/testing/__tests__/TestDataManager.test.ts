/**
 * Integration tests for TestDataManager
 * 
 * Tests the complete test data management workflow including
 * snapshot creation, validation, cleanup, and migration operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TestDataManager } from '../TestDataManager';
import { TestMode, TestDataSet, TestMetadata } from '../types';

describe('TestDataManager Integration Tests', () => {
  let testDataManager: TestDataManager;
  let tempDirectory: string;
  let mockTestData: TestDataSet;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDirectory = path.join(process.cwd(), 'temp-test-data');
    await fs.mkdir(tempDirectory, { recursive: true });

    // Initialize TestDataManager with temp directory
    testDataManager = new TestDataManager(tempDirectory);

    // Create mock test data
    mockTestData = {
      customers: [
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs.bunny@looneytunestest.com',
          phone: '555-0001',
          isTestData: true
        },
        {
          id: 'cust-002',
          name: 'Daffy Duck - looneyTunesTest',
          email: 'daffy.duck@looneytunestest.com',
          phone: '555-0002',
          isTestData: true
        }
      ],
      routes: [
        {
          id: 'route-001',
          name: 'Cedar Falls Test Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        },
        {
          id: 'route-002',
          name: 'Winfield Test Route - looneyTunesTest',
          location: 'Winfield',
          isTestData: true
        }
      ],
      tickets: [
        {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        }
      ],
      metadata: {
        createdAt: new Date(),
        mode: TestMode.ISOLATED,
        version: '1.0.0',
        testRunId: 'test-run-001'
      }
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('Snapshot Management', () => {
    it('should create and load snapshots successfully', async () => {
      // Create snapshot
      const snapshot = await testDataManager.createSnapshot(
        'test-snapshot',
        TestMode.ISOLATED,
        mockTestData,
        { description: 'Test snapshot for integration testing' }
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.name).toBe('test-snapshot');
      expect(snapshot.mode).toBe(TestMode.ISOLATED);
      expect(snapshot.size).toBeGreaterThan(0);

      // Verify snapshot file exists
      const snapshotExists = await fs.access(snapshot.filePath).then(() => true).catch(() => false);
      expect(snapshotExists).toBe(true);

      // Load snapshot
      const loadedData = await testDataManager.loadSnapshot(snapshot.id);
      expect(loadedData).toBeDefined();
      expect(loadedData.customers).toHaveLength(2);
      expect(loadedData.routes).toHaveLength(2);
      expect(loadedData.tickets).toHaveLength(1);
    });

    it('should list snapshots correctly', async () => {
      // Create multiple snapshots
      await testDataManager.createSnapshot('snapshot-1', TestMode.ISOLATED, mockTestData);
      await testDataManager.createSnapshot('snapshot-2', TestMode.PRODUCTION, mockTestData);

      // List all snapshots
      const allSnapshots = await testDataManager.listSnapshots();
      expect(allSnapshots).toHaveLength(2);

      // List snapshots by mode
      const isolatedSnapshots = await testDataManager.listSnapshots(TestMode.ISOLATED);
      expect(isolatedSnapshots).toHaveLength(1);
      expect(isolatedSnapshots[0].name).toBe('snapshot-1');

      const productionSnapshots = await testDataManager.listSnapshots(TestMode.PRODUCTION);
      expect(productionSnapshots).toHaveLength(1);
      expect(productionSnapshots[0].name).toBe('snapshot-2');
    });

    it('should delete snapshots correctly', async () => {
      // Create snapshot
      const snapshot = await testDataManager.createSnapshot('to-delete', TestMode.ISOLATED, mockTestData);

      // Verify snapshot exists
      let snapshotInfo = await testDataManager.getSnapshotInfo(snapshot.id);
      expect(snapshotInfo).toBeDefined();

      // Delete snapshot
      await testDataManager.deleteSnapshot(snapshot.id);

      // Verify snapshot is deleted
      snapshotInfo = await testDataManager.getSnapshotInfo(snapshot.id);
      expect(snapshotInfo).toBeNull();

      // Verify file is deleted
      const fileExists = await fs.access(snapshot.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate correct test data', async () => {
      const validation = await testDataManager.validateTestData(mockTestData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validatedEntities.customers).toBe(2);
      expect(validation.validatedEntities.routes).toBe(2);
      expect(validation.validatedEntities.tickets).toBe(1);
    });

    it('should detect validation errors in invalid data', async () => {
      // Create invalid test data
      const invalidData: TestDataSet = {
        ...mockTestData,
        customers: [
          {
            id: '', // Invalid: empty ID
            name: 'Invalid Customer',
            email: 'invalid-email', // Invalid: bad email format
            phone: '555-0001',
            isTestData: true
          }
        ],
        tickets: [
          {
            id: 'ticket-001',
            customerId: 'non-existent-customer', // Invalid: references non-existent customer
            routeId: 'route-001',
            status: 'active',
            isTestData: true
          }
        ]
      };

      const validation = await testDataManager.validateTestData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('empty ID'))).toBe(true);
      expect(validation.errors.some(error => error.includes('invalid-email'))).toBe(true);
      expect(validation.errors.some(error => error.includes('non-existent-customer'))).toBe(true);
    });

    it('should detect orphaned tickets', async () => {
      const dataWithOrphanedTickets: TestDataSet = {
        ...mockTestData,
        tickets: [
          ...mockTestData.tickets,
          {
            id: 'orphaned-ticket',
            customerId: 'non-existent-customer',
            routeId: 'non-existent-route',
            status: 'active',
            isTestData: true
          }
        ]
      };

      const validation = await testDataManager.validateTestData(dataWithOrphanedTickets);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(warning => warning.includes('orphaned'))).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should perform dry run cleanup without deleting data', async () => {
      // Create multiple snapshots
      const snapshot1 = await testDataManager.createSnapshot('old-snapshot-1', TestMode.ISOLATED, mockTestData);
      const snapshot2 = await testDataManager.createSnapshot('old-snapshot-2', TestMode.ISOLATED, mockTestData);

      // Perform dry run cleanup
      await testDataManager.cleanup({ dryRun: true });

      // Verify snapshots still exist
      const snapshots = await testDataManager.listSnapshots();
      expect(snapshots).toHaveLength(2);
    });

    it('should preserve latest snapshots when specified', async () => {
      // Create multiple snapshots with delays to ensure different timestamps
      const snapshot1 = await testDataManager.createSnapshot('snapshot-1', TestMode.ISOLATED, mockTestData);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const snapshot2 = await testDataManager.createSnapshot('snapshot-2', TestMode.ISOLATED, mockTestData);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const snapshot3 = await testDataManager.createSnapshot('snapshot-3', TestMode.ISOLATED, mockTestData);

      // Cleanup preserving latest 2 snapshots
      await testDataManager.cleanup({ preserveLatest: 2 });

      // Verify only 2 snapshots remain
      const remainingSnapshots = await testDataManager.listSnapshots();
      expect(remainingSnapshots).toHaveLength(2);

      // Verify the latest snapshots are preserved
      const snapshotIds = remainingSnapshots.map(s => s.id);
      expect(snapshotIds).toContain(snapshot2.id);
      expect(snapshotIds).toContain(snapshot3.id);
      expect(snapshotIds).not.toContain(snapshot1.id);
    });

    it('should cleanup snapshots by age', async () => {
      // Create snapshot
      const snapshot = await testDataManager.createSnapshot('old-snapshot', TestMode.ISOLATED, mockTestData);

      // Set cutoff date to future (making snapshot "old")
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      // Cleanup old snapshots
      await testDataManager.cleanup({ olderThan: futureDate });

      // Verify snapshot was deleted
      const snapshots = await testDataManager.listSnapshots();
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('Migration Operations', () => {
    it('should migrate test data between versions', async () => {
      const migrationResult = await testDataManager.migrateTestData('1.0.0', '1.1.0', mockTestData);

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.fromVersion).toBe('1.0.0');
      expect(migrationResult.toVersion).toBe('1.1.0');
      expect(migrationResult.migratedEntities).toBeGreaterThan(0);
      expect(migrationResult.errors).toHaveLength(0);
    });

    it('should handle migration failures gracefully', async () => {
      // Test migration to non-existent version
      const migrationResult = await testDataManager.migrateTestData('1.0.0', '99.0.0', mockTestData);

      expect(migrationResult.success).toBe(false);
      expect(migrationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Production Test Data Creation', () => {
    it('should create production test data successfully', async () => {
      const productionConfig = {
        testDataPrefix: 'looneyTunesTest',
        locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
        customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
        cleanupPolicy: 'preserve' as const
      };

      const testData = await testDataManager.createProductionTestData(productionConfig);

      expect(testData).toBeDefined();
      expect(testData.customers.length).toBeGreaterThan(0);
      expect(testData.routes.length).toBeGreaterThan(0);
      expect(testData.metadata.mode).toBe(TestMode.PRODUCTION);

      // Verify naming conventions
      testData.customers.forEach(customer => {
        expect(customer.name).toContain('looneyTunesTest');
        expect(customer.isTestData).toBe(true);
      });

      testData.routes.forEach(route => {
        expect(route.name).toContain('looneyTunesTest');
        expect(route.isTestData).toBe(true);
        expect(productionConfig.locations).toContain(route.location);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing snapshot gracefully', async () => {
      await expect(testDataManager.loadSnapshot('non-existent-snapshot')).rejects.toThrow('Snapshot not found');
    });

    it('should handle corrupted snapshot files', async () => {
      // Create a snapshot
      const snapshot = await testDataManager.createSnapshot('test-snapshot', TestMode.ISOLATED, mockTestData);

      // Corrupt the snapshot file
      await fs.writeFile(snapshot.filePath, 'corrupted data', 'utf-8');

      // Attempt to load corrupted snapshot
      await expect(testDataManager.loadSnapshot(snapshot.id)).rejects.toThrow();
    });

    it('should handle file system errors during cleanup', async () => {
      // Create snapshot
      const snapshot = await testDataManager.createSnapshot('test-snapshot', TestMode.ISOLATED, mockTestData);

      // Make file read-only to simulate permission error
      await fs.chmod(snapshot.filePath, 0o444);

      // Attempt cleanup - should handle error gracefully
      await expect(testDataManager.cleanup()).resolves.not.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(snapshot.filePath, 0o644);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent snapshot creation', async () => {
      // Create multiple snapshots concurrently
      const promises = [
        testDataManager.createSnapshot('concurrent-1', TestMode.ISOLATED, mockTestData),
        testDataManager.createSnapshot('concurrent-2', TestMode.ISOLATED, mockTestData),
        testDataManager.createSnapshot('concurrent-3', TestMode.ISOLATED, mockTestData)
      ];

      const snapshots = await Promise.all(promises);

      expect(snapshots).toHaveLength(3);
      snapshots.forEach(snapshot => {
        expect(snapshot).toBeDefined();
        expect(snapshot.id).toBeDefined();
      });

      // Verify all snapshots are listed
      const allSnapshots = await testDataManager.listSnapshots();
      expect(allSnapshots).toHaveLength(3);
    });

    it('should handle concurrent validation operations', async () => {
      // Run multiple validations concurrently
      const promises = [
        testDataManager.validateTestData(mockTestData),
        testDataManager.validateTestData(mockTestData),
        testDataManager.validateTestData(mockTestData)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.validatedEntities.customers).toBe(2);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large test data sets efficiently', async () => {
      // Create large test data set
      const largeTestData: TestDataSet = {
        customers: Array.from({ length: 1000 }, (_, i) => ({
          id: `cust-${i.toString().padStart(4, '0')}`,
          name: `Customer ${i} - looneyTunesTest`,
          email: `customer${i}@looneytunestest.com`,
          phone: `555-${i.toString().padStart(4, '0')}`,
          isTestData: true
        })),
        routes: Array.from({ length: 100 }, (_, i) => ({
          id: `route-${i.toString().padStart(3, '0')}`,
          name: `Route ${i} - looneyTunesTest`,
          location: ['Cedar Falls', 'Winfield', "O'Fallon"][i % 3],
          isTestData: true
        })),
        tickets: Array.from({ length: 500 }, (_, i) => ({
          id: `ticket-${i.toString().padStart(4, '0')}`,
          customerId: `cust-${(i % 1000).toString().padStart(4, '0')}`,
          routeId: `route-${(i % 100).toString().padStart(3, '0')}`,
          status: 'active',
          isTestData: true
        })),
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'large-test-run'
        }
      };

      const startTime = Date.now();

      // Create snapshot with large data
      const snapshot = await testDataManager.createSnapshot('large-snapshot', TestMode.ISOLATED, largeTestData);
      
      // Validate large data
      const validation = await testDataManager.validateTestData(largeTestData);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(snapshot).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.validatedEntities.customers).toBe(1000);
      expect(validation.validatedEntities.routes).toBe(100);
      expect(validation.validatedEntities.tickets).toBe(500);
    });
  });
});