/**
 * Integration tests for SnapshotManager
 * 
 * Tests database snapshot creation, restoration, and management operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SnapshotManager } from '../SnapshotManager';
import { DatabaseConfig } from '../types';

describe('SnapshotManager Integration Tests', () => {
  let snapshotManager: SnapshotManager;
  let tempDirectory: string;
  let mockDatabaseConfig: DatabaseConfig;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDirectory = path.join(process.cwd(), 'temp-snapshots');
    await fs.mkdir(tempDirectory, { recursive: true });

    // Initialize SnapshotManager with temp directory
    snapshotManager = new SnapshotManager(tempDirectory);

    // Mock database configuration
    mockDatabaseConfig = {
      backupPath: 'test-backup.sql',
      connectionString: 'postgresql://localhost:5432/test_db',
      restoreTimeout: 30000,
      verificationQueries: [
        'SELECT COUNT(*) FROM customers',
        'SELECT COUNT(*) FROM routes',
        'SELECT COUNT(*) FROM tickets'
      ]
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

  describe('Snapshot Creation', () => {
    it('should create SQL snapshot successfully', async () => {
      const options = {
        name: 'test-sql-snapshot',
        description: 'Test SQL snapshot creation',
        format: 'sql' as const,
        tags: ['test', 'integration']
      };

      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, options);

      expect(snapshot).toBeDefined();
      expect(snapshot.name).toBe('test-sql-snapshot');
      expect(snapshot.format).toBe('sql');
      expect(snapshot.size).toBeGreaterThan(0);
      expect(snapshot.metadata.description).toBe('Test SQL snapshot creation');
      expect(snapshot.metadata.tags).toEqual(['test', 'integration']);

      // Verify snapshot file exists
      const fileExists = await fs.access(snapshot.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.readFile(snapshot.filePath, 'utf-8');
      expect(content).toContain('-- Database Snapshot SQL Dump');
      expect(content).toContain('CREATE TABLE');
      expect(content).toContain('INSERT INTO');
    });

    it('should create JSON snapshot successfully', async () => {
      const options = {
        name: 'test-json-snapshot',
        description: 'Test JSON snapshot creation',
        format: 'json' as const
      };

      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, options);

      expect(snapshot).toBeDefined();
      expect(snapshot.format).toBe('json');

      // Verify file content is valid JSON
      const content = await fs.readFile(snapshot.filePath, 'utf-8');
      const jsonData = JSON.parse(content);
      expect(jsonData).toBeDefined();
      expect(jsonData.tables).toBeDefined();
      expect(jsonData.data).toBeDefined();
    });

    it('should handle snapshot creation with table filtering', async () => {
      const options = {
        name: 'filtered-snapshot',
        includeTables: ['customers', 'routes'],
        excludeTables: ['tickets']
      };

      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, options);

      expect(snapshot).toBeDefined();
      expect(snapshot.metadata.tables).toContain('customers');
      expect(snapshot.metadata.tables).toContain('routes');
      expect(snapshot.metadata.tables).not.toContain('tickets');
    });
  });

  describe('Snapshot Restoration', () => {
    it('should restore snapshot successfully', async () => {
      // Create a snapshot first
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'restore-test-snapshot'
      });

      // Restore the snapshot
      const restoreOptions = {
        dropExisting: true,
        validateAfterRestore: true,
        timeout: 30000
      };

      await expect(
        snapshotManager.restoreSnapshot(snapshot.id, mockDatabaseConfig, restoreOptions)
      ).resolves.not.toThrow();
    });

    it('should validate snapshot integrity before restoration', async () => {
      // Create a snapshot
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'integrity-test-snapshot'
      });

      // Corrupt the snapshot file
      await fs.writeFile(snapshot.filePath, 'corrupted data', 'utf-8');

      // Attempt to restore corrupted snapshot
      await expect(
        snapshotManager.restoreSnapshot(snapshot.id, mockDatabaseConfig)
      ).rejects.toThrow('Checksum mismatch');
    });

    it('should handle missing snapshot gracefully', async () => {
      await expect(
        snapshotManager.restoreSnapshot('non-existent-snapshot', mockDatabaseConfig)
      ).rejects.toThrow('Snapshot not found');
    });
  });

  describe('Snapshot Management', () => {
    it('should list snapshots correctly', async () => {
      // Create multiple snapshots
      const snapshot1 = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'snapshot-1'
      });
      const snapshot2 = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'snapshot-2'
      });

      const snapshots = await snapshotManager.listSnapshots();

      expect(snapshots).toHaveLength(2);
      expect(snapshots.map(s => s.name)).toContain('snapshot-1');
      expect(snapshots.map(s => s.name)).toContain('snapshot-2');
    });

    it('should get snapshot by ID', async () => {
      const createdSnapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'get-test-snapshot'
      });

      const retrievedSnapshot = await snapshotManager.getSnapshot(createdSnapshot.id);

      expect(retrievedSnapshot).toBeDefined();
      expect(retrievedSnapshot!.id).toBe(createdSnapshot.id);
      expect(retrievedSnapshot!.name).toBe('get-test-snapshot');
    });

    it('should delete snapshot successfully', async () => {
      // Create snapshot
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'delete-test-snapshot'
      });

      // Verify snapshot exists
      let retrievedSnapshot = await snapshotManager.getSnapshot(snapshot.id);
      expect(retrievedSnapshot).toBeDefined();

      // Delete snapshot
      await snapshotManager.deleteSnapshot(snapshot.id);

      // Verify snapshot is deleted
      retrievedSnapshot = await snapshotManager.getSnapshot(snapshot.id);
      expect(retrievedSnapshot).toBeNull();

      // Verify file is deleted
      const fileExists = await fs.access(snapshot.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });
  });

  describe('Snapshot Import/Export', () => {
    it('should import existing backup file as snapshot', async () => {
      // Create a mock backup file
      const backupContent = `
        -- Test backup file
        CREATE TABLE customers (id INTEGER, name VARCHAR(255));
        INSERT INTO customers (id, name) VALUES (1, 'Test Customer');
      `;
      const backupFilePath = path.join(tempDirectory, 'test-backup.sql');
      await fs.writeFile(backupFilePath, backupContent, 'utf-8');

      // Import the backup as snapshot
      const snapshot = await snapshotManager.importSnapshot(backupFilePath, {
        name: 'imported-snapshot',
        description: 'Imported from backup file'
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.name).toBe('imported-snapshot');
      expect(snapshot.format).toBe('sql');
      expect(snapshot.metadata.description).toBe('Imported from backup file');

      // Verify content was imported correctly
      const content = await fs.readFile(snapshot.filePath, 'utf-8');
      expect(content).toContain('Test backup file');
      expect(content).toContain('CREATE TABLE customers');
    });

    it('should export snapshot to specified location', async () => {
      // Create snapshot
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'export-test-snapshot'
      });

      // Export snapshot
      const exportPath = path.join(tempDirectory, 'exported-snapshot.sql');
      await snapshotManager.exportSnapshot(snapshot.id, exportPath);

      // Verify exported file exists and has correct content
      const exportedContent = await fs.readFile(exportPath, 'utf-8');
      const originalContent = await fs.readFile(snapshot.filePath, 'utf-8');
      expect(exportedContent).toBe(originalContent);
    });
  });

  describe('Snapshot Validation', () => {
    it('should validate snapshot integrity successfully', async () => {
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'validation-test-snapshot'
      });

      const isValid = await snapshotManager.validateSnapshotIntegrity(snapshot);
      expect(isValid).toBe(true);
    });

    it('should detect corrupted snapshots', async () => {
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'corruption-test-snapshot'
      });

      // Corrupt the snapshot file
      await fs.writeFile(snapshot.filePath, 'corrupted content', 'utf-8');

      const isValid = await snapshotManager.validateSnapshotIntegrity(snapshot);
      expect(isValid).toBe(false);
    });

    it('should handle missing snapshot files', async () => {
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'missing-file-test'
      });

      // Delete the snapshot file
      await fs.unlink(snapshot.filePath);

      const isValid = await snapshotManager.validateSnapshotIntegrity(snapshot);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const invalidConfig = {
        ...mockDatabaseConfig,
        connectionString: 'invalid://connection/string'
      };

      // Should not throw but handle error internally
      await expect(
        snapshotManager.createSnapshot(invalidConfig, { name: 'error-test' })
      ).resolves.toBeDefined();
    });

    it('should handle file system permission errors', async () => {
      // Make directory read-only
      await fs.chmod(tempDirectory, 0o444);

      await expect(
        snapshotManager.createSnapshot(mockDatabaseConfig, { name: 'permission-test' })
      ).rejects.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(tempDirectory, 0o755);
    });

    it('should handle invalid snapshot formats', async () => {
      // Create snapshot with invalid format
      const options = {
        name: 'invalid-format-test',
        format: 'invalid' as any
      };

      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, options);
      
      // Should default to SQL format
      expect(snapshot.format).toBe('sql');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large snapshots efficiently', async () => {
      const startTime = Date.now();

      // Create a large snapshot (simulated)
      const snapshot = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'large-snapshot-test',
        description: 'Performance test with large dataset'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(snapshot).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent snapshot operations', async () => {
      // Create multiple snapshots concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        snapshotManager.createSnapshot(mockDatabaseConfig, {
          name: `concurrent-snapshot-${i}`
        })
      );

      const snapshots = await Promise.all(promises);

      expect(snapshots).toHaveLength(5);
      snapshots.forEach((snapshot, i) => {
        expect(snapshot.name).toBe(`concurrent-snapshot-${i}`);
      });

      // Verify all snapshots are listed
      const allSnapshots = await snapshotManager.listSnapshots();
      expect(allSnapshots).toHaveLength(5);
    });
  });

  describe('Registry Management', () => {
    it('should maintain snapshot registry correctly', async () => {
      // Create snapshots
      const snapshot1 = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'registry-test-1'
      });
      const snapshot2 = await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'registry-test-2'
      });

      // Verify registry file exists and contains snapshots
      const registryPath = path.join(tempDirectory, 'snapshots.json');
      const registryExists = await fs.access(registryPath).then(() => true).catch(() => false);
      expect(registryExists).toBe(true);

      const registryContent = await fs.readFile(registryPath, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry).toHaveLength(2);
      expect(registry.map((s: any) => s.name)).toContain('registry-test-1');
      expect(registry.map((s: any) => s.name)).toContain('registry-test-2');
    });

    it('should handle registry corruption gracefully', async () => {
      // Create a snapshot first
      await snapshotManager.createSnapshot(mockDatabaseConfig, {
        name: 'registry-corruption-test'
      });

      // Corrupt the registry file
      const registryPath = path.join(tempDirectory, 'snapshots.json');
      await fs.writeFile(registryPath, 'invalid json', 'utf-8');

      // Should handle corruption and return empty list
      const snapshots = await snapshotManager.listSnapshots();
      expect(snapshots).toEqual([]);
    });
  });
});