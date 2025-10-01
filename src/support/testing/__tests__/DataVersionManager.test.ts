/**
 * Integration tests for DataVersionManager
 * 
 * Tests data versioning, migration planning, and execution
 * for test data version management and backward compatibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataVersionManager } from '../DataVersionManager';
import { TestDataSet, TestMode } from '../types';

describe('DataVersionManager Integration Tests', () => {
  let versionManager: DataVersionManager;
  let tempDirectory: string;
  let mockTestData: TestDataSet;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDirectory = path.join(process.cwd(), 'temp-versions');
    await fs.mkdir(tempDirectory, { recursive: true });

    // Initialize DataVersionManager with temp directory
    versionManager = new DataVersionManager(tempDirectory);

    // Create mock test data
    mockTestData = {
      customers: [
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs@test.com',
          phone: '555-0001',
          isTestData: true
        }
      ],
      routes: [
        {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
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

  describe('Version Registration', () => {
    it('should register new versions successfully', () => {
      const newVersion = {
        version: '1.2.0',
        releaseDate: new Date(),
        description: 'Test version registration',
        breaking: false,
        migrations: [],
        deprecations: []
      };

      versionManager.registerVersion(newVersion);

      const versionInfo = versionManager.getVersionInfo('1.2.0');
      expect(versionInfo).toBeDefined();
      expect(versionInfo!.description).toBe('Test version registration');
    });

    it('should list available versions in order', () => {
      const versions = versionManager.getAvailableVersions();

      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].version).toBe('1.0.0');
      
      // Versions should be sorted
      for (let i = 1; i < versions.length; i++) {
        expect(versions[i].version >= versions[i-1].version).toBe(true);
      }
    });

    it('should get current version', () => {
      const currentVersion = versionManager.getCurrentVersion();
      expect(currentVersion).toBe('1.0.0');
    });

    it('should set current version', () => {
      versionManager.setCurrentVersion('1.1.0');
      expect(versionManager.getCurrentVersion()).toBe('1.1.0');
    });

    it('should throw error when setting invalid version', () => {
      expect(() => {
        versionManager.setCurrentVersion('99.0.0');
      }).toThrow('Version not found: 99.0.0');
    });
  });

  describe('Migration Planning', () => {
    it('should create migration plan for valid version path', () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');

      expect(plan.fromVersion).toBe('1.0.0');
      expect(plan.toVersion).toBe('1.1.0');
      expect(plan.migrations.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
      expect(plan.risks).toBeDefined();
      expect(typeof plan.backupRequired).toBe('boolean');
    });

    it('should create migration plan for multi-step migration', () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '2.0.0');

      expect(plan.fromVersion).toBe('1.0.0');
      expect(plan.toVersion).toBe('2.0.0');
      expect(plan.migrations.length).toBeGreaterThan(1); // Multi-step migration
      expect(plan.backupRequired).toBe(true); // Breaking changes in 2.0.0
    });

    it('should assess migration risks correctly', () => {
      const plan = versionManager.createMigrationPlan('1.1.0', '2.0.0');

      expect(plan.risks.some(risk => risk.includes('Breaking changes'))).toBe(true);
    });

    it('should handle invalid migration paths', () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '99.0.0');

      expect(plan.risks.length).toBeGreaterThan(0);
      expect(plan.risks.some(risk => risk.includes('Migration planning failed'))).toBe(true);
    });
  });

  describe('Migration Execution', () => {
    it('should execute simple migration successfully', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(mockTestData, plan);

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe('1.0.0');
      expect(result.toVersion).toBe('1.1.0');
      expect(result.appliedMigrations.length).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should perform dry run migration', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(mockTestData, plan, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.appliedMigrations).toHaveLength(0); // No migrations applied in dry run
    });

    it('should create backup when required', async () => {
      const plan = versionManager.createMigrationPlan('1.1.0', '2.0.0'); // Breaking change
      const result = await versionManager.executeMigration(mockTestData, plan, { createBackup: true });

      expect(result.backupPath).toBeDefined();
      
      if (result.backupPath) {
        const backupExists = await fs.access(result.backupPath).then(() => true).catch(() => false);
        expect(backupExists).toBe(true);
      }
    });

    it('should handle migration failures with rollback', async () => {
      // Create a failing migration
      const failingMigration = {
        id: 'failing-migration',
        name: 'Failing Migration',
        description: 'Migration that always fails',
        fromVersion: '1.0.0',
        toVersion: '1.0.1',
        migrator: async (data: TestDataSet) => {
          throw new Error('Migration failed intentionally');
        },
        rollback: async (data: TestDataSet) => {
          return data; // Successful rollback
        }
      };

      const failingVersion = {
        version: '1.0.1',
        releaseDate: new Date(),
        description: 'Version with failing migration',
        breaking: false,
        migrations: [failingMigration],
        deprecations: []
      };

      versionManager.registerVersion(failingVersion);

      const plan = versionManager.createMigrationPlan('1.0.0', '1.0.1');
      const result = await versionManager.executeMigration(mockTestData, plan);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('rolled back'))).toBe(true);
    });

    it('should handle rollback failures', async () => {
      // Create a migration with failing rollback
      const failingRollbackMigration = {
        id: 'failing-rollback-migration',
        name: 'Failing Rollback Migration',
        description: 'Migration with failing rollback',
        fromVersion: '1.0.0',
        toVersion: '1.0.2',
        migrator: async (data: TestDataSet) => {
          throw new Error('Migration failed');
        },
        rollback: async (data: TestDataSet) => {
          throw new Error('Rollback also failed');
        }
      };

      const failingRollbackVersion = {
        version: '1.0.2',
        releaseDate: new Date(),
        description: 'Version with failing rollback',
        breaking: false,
        migrations: [failingRollbackMigration],
        deprecations: []
      };

      versionManager.registerVersion(failingRollbackVersion);

      const plan = versionManager.createMigrationPlan('1.0.0', '1.0.2');
      const result = await versionManager.executeMigration(mockTestData, plan);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Rollback failed'))).toBe(true);
    });
  });

  describe('Version Compatibility', () => {
    it('should check compatibility for same major version', () => {
      const compatibility = versionManager.checkCompatibility('1.0.0', '1.1.0');

      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.currentVersion).toBe('1.0.0');
      expect(compatibility.requiredVersion).toBe('1.1.0');
      expect(compatibility.issues.some(issue => issue.includes('Minor version upgrade'))).toBe(true);
    });

    it('should detect major version incompatibility', () => {
      const compatibility = versionManager.checkCompatibility('1.0.0', '2.0.0');

      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.issues.some(issue => issue.includes('Major version upgrade'))).toBe(true);
      expect(compatibility.recommendations.some(rec => rec.includes('Upgrade from v1.0.0 to v2.0.0'))).toBe(true);
    });

    it('should detect version downgrade', () => {
      const compatibility = versionManager.checkCompatibility('2.0.0', '1.0.0');

      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.issues.some(issue => issue.includes('Version downgrade'))).toBe(true);
    });

    it('should detect breaking changes', () => {
      const compatibility = versionManager.checkCompatibility('1.0.0', '2.0.0');

      expect(compatibility.issues.some(issue => issue.includes('Breaking changes'))).toBe(true);
      expect(compatibility.recommendations.some(rec => rec.includes('migration guide'))).toBe(true);
    });

    it('should handle compatibility check errors', () => {
      const compatibility = versionManager.checkCompatibility('invalid.version', '1.0.0');

      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.issues.some(issue => issue.includes('compatibility check failed'))).toBe(true);
    });
  });

  describe('Data Version Validation', () => {
    it('should validate known data version', () => {
      const isValid = versionManager.validateDataVersion(mockTestData);
      expect(isValid).toBe(true);
    });

    it('should reject unknown data version', () => {
      const invalidData = {
        ...mockTestData,
        metadata: {
          ...mockTestData.metadata,
          version: '99.0.0'
        }
      };

      const isValid = versionManager.validateDataVersion(invalidData);
      expect(isValid).toBe(false);
    });

    it('should handle validation errors gracefully', () => {
      const malformedData = {
        metadata: null
      } as any;

      const isValid = versionManager.validateDataVersion(malformedData);
      expect(isValid).toBe(false);
    });
  });

  describe('Built-in Migrations', () => {
    it('should execute timestamp addition migration (1.0.0 -> 1.1.0)', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(mockTestData, plan);

      expect(result.success).toBe(true);
      expect(result.appliedMigrations).toContain('add-timestamps-1.1.0');
    });

    it('should execute entity restructure migration (1.1.0 -> 2.0.0)', async () => {
      // First migrate to 1.1.0
      const plan1 = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      await versionManager.executeMigration(mockTestData, plan1);

      // Then migrate to 2.0.0
      const plan2 = versionManager.createMigrationPlan('1.1.0', '2.0.0');
      const result = await versionManager.executeMigration(mockTestData, plan2);

      expect(result.success).toBe(true);
      expect(result.appliedMigrations).toContain('restructure-entities-2.0.0');
    });

    it('should rollback timestamp migration successfully', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      
      // Mock migration failure to trigger rollback
      const originalMigration = plan.migrations[0];
      plan.migrations[0] = {
        ...originalMigration,
        migrator: async (data: TestDataSet) => {
          // Apply migration first
          const migratedData = await originalMigration.migrator(data);
          // Then fail
          throw new Error('Simulated migration failure');
        }
      };

      const result = await versionManager.executeMigration(mockTestData, plan);

      expect(result.success).toBe(false);
      expect(result.warnings.some(w => w.includes('rolled back'))).toBe(true);
    });
  });

  describe('Backup Management', () => {
    it('should create backup with proper naming', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(mockTestData, plan, { createBackup: true });

      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toContain('backup-1.0.0-');
      expect(result.backupPath).toContain('.json');
    });

    it('should create valid backup content', async () => {
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(mockTestData, plan, { createBackup: true });

      if (result.backupPath) {
        const backupContent = await fs.readFile(result.backupPath, 'utf-8');
        const backup = JSON.parse(backupContent);

        expect(backup.version).toBe('1.0.0');
        expect(backup.timestamp).toBeDefined();
        expect(backup.data).toBeDefined();
        expect(backup.data.customers).toHaveLength(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors during backup creation', async () => {
      // Make backup directory read-only
      const backupDir = path.join(tempDirectory, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      await fs.chmod(backupDir, 0o444);

      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      
      try {
        const result = await versionManager.executeMigration(mockTestData, plan, { createBackup: true });
        expect(result.success).toBe(false);
        expect(result.errors.some(e => e.includes('Migration failed'))).toBe(true);
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(backupDir, 0o755);
      }
    });

    it('should handle migration timeout scenarios', async () => {
      // Create a slow migration
      const slowMigration = {
        id: 'slow-migration',
        name: 'Slow Migration',
        description: 'Migration that takes too long',
        fromVersion: '1.0.0',
        toVersion: '1.0.3',
        migrator: async (data: TestDataSet) => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return data;
        }
      };

      const slowVersion = {
        version: '1.0.3',
        releaseDate: new Date(),
        description: 'Version with slow migration',
        breaking: false,
        migrations: [slowMigration],
        deprecations: []
      };

      versionManager.registerVersion(slowVersion);

      const plan = versionManager.createMigrationPlan('1.0.0', '1.0.3');
      const result = await versionManager.executeMigration(mockTestData, plan);

      // Should complete successfully (our timeout is generous for tests)
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(100);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large data migrations efficiently', async () => {
      // Create large test dataset
      const largeData: TestDataSet = {
        customers: Array.from({ length: 1000 }, (_, i) => ({
          id: `cust-${i}`,
          name: `Customer ${i} - looneyTunesTest`,
          email: `customer${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`,
          isTestData: true
        })),
        routes: Array.from({ length: 100 }, (_, i) => ({
          id: `route-${i}`,
          name: `Route ${i} - looneyTunesTest`,
          location: ['Cedar Falls', 'Winfield', "O'Fallon"][i % 3],
          isTestData: true
        })),
        tickets: Array.from({ length: 500 }, (_, i) => ({
          id: `ticket-${i}`,
          customerId: `cust-${i % 1000}`,
          routeId: `route-${i % 100}`,
          status: 'active',
          isTestData: true
        })),
        metadata: mockTestData.metadata
      };

      const startTime = Date.now();
      const plan = versionManager.createMigrationPlan('1.0.0', '1.1.0');
      const result = await versionManager.executeMigration(largeData, plan);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent migration planning', () => {
      const plans = [
        versionManager.createMigrationPlan('1.0.0', '1.1.0'),
        versionManager.createMigrationPlan('1.1.0', '2.0.0'),
        versionManager.createMigrationPlan('1.0.0', '2.0.0')
      ];

      plans.forEach(plan => {
        expect(plan.fromVersion).toBeDefined();
        expect(plan.toVersion).toBeDefined();
        expect(plan.migrations).toBeDefined();
      });
    });
  });
});