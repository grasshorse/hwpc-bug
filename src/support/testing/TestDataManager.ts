/**
 * Test Data Manager
 * 
 * Central utility for managing test data across both isolated and production modes.
 * Provides unified interface for snapshot management, data validation, and cleanup operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TestMode, TestDataSet, TestMetadata, DatabaseConfig, ProductionConfig } from './types';
import { IsolatedDataProvider } from './IsolatedDataProvider';
import { LooneyTunesDataProvider } from './LooneyTunesDataProvider';

export interface SnapshotInfo {
  id: string;
  name: string;
  version: string;
  mode: TestMode;
  createdAt: Date;
  size: number;
  checksum: string;
  filePath: string;
  metadata: TestMetadata;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedEntities: {
    customers: number;
    routes: number;
    tickets: number;
  };
}

export interface CleanupOptions {
  mode?: TestMode;
  olderThan?: Date;
  preserveLatest?: number;
  dryRun?: boolean;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migratedEntities: number;
  errors: string[];
}

/**
 * Manages test data snapshots, validation, and cleanup across both testing modes
 */
export class TestDataManager {
  private isolatedProvider: IsolatedDataProvider;
  private productionProvider: LooneyTunesDataProvider;
  private snapshotDirectory: string;
  private currentVersion: string = '1.0.0';

  constructor(
    snapshotDirectory: string = '.kiro/test-data',
    isolatedProvider?: IsolatedDataProvider,
    productionProvider?: LooneyTunesDataProvider
  ) {
    this.snapshotDirectory = snapshotDirectory;
    this.isolatedProvider = isolatedProvider || new IsolatedDataProvider();
    this.productionProvider = productionProvider || new LooneyTunesDataProvider();
  }

  /**
   * Creates a new test data snapshot
   */
  async createSnapshot(
    name: string,
    mode: TestMode,
    testData: TestDataSet,
    options: { description?: string; tags?: string[] } = {}
  ): Promise<SnapshotInfo> {
    try {
      const snapshotId = this.generateSnapshotId();
      const timestamp = new Date();
      
      const metadata: TestMetadata = {
        createdAt: timestamp,
        mode,
        version: this.currentVersion,
        testRunId: snapshotId
      };

      const snapshotData = {
        ...testData,
        metadata: {
          ...metadata,
          description: options.description,
          tags: options.tags || []
        }
      };

      // Determine file path based on mode
      const fileName = `${name}-${snapshotId}.json`;
      const modeDirectory = path.join(this.snapshotDirectory, mode);
      const filePath = path.join(modeDirectory, fileName);

      // Ensure directory exists
      await this.ensureDirectoryExists(modeDirectory);

      // Write snapshot data
      const content = JSON.stringify(snapshotData, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');

      // Calculate checksum
      const checksum = await this.calculateChecksum(content);

      const snapshotInfo: SnapshotInfo = {
        id: snapshotId,
        name,
        version: this.currentVersion,
        mode,
        createdAt: timestamp,
        size: content.length,
        checksum,
        filePath,
        metadata
      };

      // Update snapshot registry
      await this.updateSnapshotRegistry(snapshotInfo);

      console.log(`Created snapshot: ${name} (${snapshotId}) in ${mode} mode`);
      return snapshotInfo;

    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw new Error(`Snapshot creation failed: ${error.message}`);
    }
  }

  /**
   * Loads a test data snapshot
   */
  async loadSnapshot(snapshotId: string): Promise<TestDataSet> {
    try {
      const snapshotInfo = await this.getSnapshotInfo(snapshotId);
      if (!snapshotInfo) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      const content = await fs.readFile(snapshotInfo.filePath, 'utf-8');
      const snapshotData = JSON.parse(content);

      // Validate checksum
      const currentChecksum = await this.calculateChecksum(content);
      if (currentChecksum !== snapshotInfo.checksum) {
        throw new Error(`Snapshot integrity check failed: ${snapshotId}`);
      }

      console.log(`Loaded snapshot: ${snapshotInfo.name} (${snapshotId})`);
      return snapshotData;

    } catch (error) {
      console.error('Failed to load snapshot:', error);
      throw new Error(`Snapshot loading failed: ${error.message}`);
    }
  }

  /**
   * Lists available snapshots
   */
  async listSnapshots(mode?: TestMode): Promise<SnapshotInfo[]> {
    try {
      const registry = await this.loadSnapshotRegistry();
      
      if (mode) {
        return registry.filter(snapshot => snapshot.mode === mode);
      }
      
      return registry;
    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Validates test data integrity
   */
  async validateTestData(testData: TestDataSet): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedEntities: {
        customers: 0,
        routes: 0,
        tickets: 0
      }
    };

    try {
      // Validate customers
      for (const customer of testData.customers) {
        if (!this.validateCustomer(customer)) {
          result.errors.push(`Invalid customer: ${customer.id} - ${customer.name}`);
          result.isValid = false;
        } else {
          result.validatedEntities.customers++;
        }
      }

      // Validate routes
      for (const route of testData.routes) {
        if (!this.validateRoute(route)) {
          result.errors.push(`Invalid route: ${route.id} - ${route.name}`);
          result.isValid = false;
        } else {
          result.validatedEntities.routes++;
        }
      }

      // Validate tickets
      for (const ticket of testData.tickets) {
        if (!this.validateTicket(ticket, testData)) {
          result.errors.push(`Invalid ticket: ${ticket.id}`);
          result.isValid = false;
        } else {
          result.validatedEntities.tickets++;
        }
      }

      // Check for orphaned tickets
      const orphanedTickets = testData.tickets.filter(ticket => 
        !testData.customers.some(customer => customer.id === ticket.customerId) ||
        !testData.routes.some(route => route.id === ticket.routeId)
      );

      if (orphanedTickets.length > 0) {
        result.warnings.push(`Found ${orphanedTickets.length} orphaned tickets`);
      }

      console.log(`Validation completed: ${result.isValid ? 'PASSED' : 'FAILED'}`);
      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Cleans up old snapshots and test data
   */
  async cleanup(options: CleanupOptions = {}): Promise<void> {
    try {
      console.log('Starting test data cleanup...');

      const snapshots = await this.listSnapshots(options.mode);
      let snapshotsToDelete = snapshots;

      // Filter by age if specified
      if (options.olderThan) {
        snapshotsToDelete = snapshots.filter(snapshot => 
          snapshot.createdAt < options.olderThan!
        );
      }

      // Preserve latest snapshots if specified
      if (options.preserveLatest && options.preserveLatest > 0) {
        snapshotsToDelete.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        snapshotsToDelete = snapshotsToDelete.slice(options.preserveLatest);
      }

      if (options.dryRun) {
        console.log(`Dry run: Would delete ${snapshotsToDelete.length} snapshots`);
        snapshotsToDelete.forEach(snapshot => {
          console.log(`  - ${snapshot.name} (${snapshot.id}) - ${snapshot.createdAt}`);
        });
        return;
      }

      // Delete snapshots
      for (const snapshot of snapshotsToDelete) {
        await this.deleteSnapshot(snapshot.id);
      }

      console.log(`Cleanup completed: Deleted ${snapshotsToDelete.length} snapshots`);

    } catch (error) {
      console.error('Cleanup failed:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Migrates test data from one version to another
   */
  async migrateTestData(
    fromVersion: string,
    toVersion: string,
    testData: TestDataSet
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      migratedEntities: 0,
      errors: []
    };

    try {
      console.log(`Migrating test data from ${fromVersion} to ${toVersion}`);

      // Apply version-specific migrations
      const migratedData = await this.applyMigrations(testData, fromVersion, toVersion);
      
      // Validate migrated data
      const validation = await this.validateTestData(migratedData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      result.migratedEntities = 
        migratedData.customers.length + 
        migratedData.routes.length + 
        migratedData.tickets.length;

      result.success = true;
      console.log(`Migration completed: ${result.migratedEntities} entities migrated`);

      return result;

    } catch (error) {
      result.errors.push(`Migration error: ${error.message}`);
      console.error('Migration failed:', error);
      return result;
    }
  }

  /**
   * Creates production test data using LooneyTunes provider
   */
  async createProductionTestData(config: ProductionConfig): Promise<TestDataSet> {
    try {
      console.log('Creating production test data...');

      // Configure LooneyTunes provider
      this.productionProvider = new LooneyTunesDataProvider({
        testDataPrefix: config.testDataPrefix,
        locations: config.locations,
        customerNames: config.customerNames,
        cleanupPolicy: config.cleanupPolicy
      });

      // Create test entities
      const customers = await this.productionProvider.createTestCustomers(3);
      const routes = await this.productionProvider.createTestRoutes();
      const tickets = await this.productionProvider.createTestTickets(customers, routes);

      const metadata: TestMetadata = {
        createdAt: new Date(),
        mode: TestMode.PRODUCTION,
        version: this.currentVersion,
        testRunId: this.generateSnapshotId()
      };

      const testData: TestDataSet = {
        customers,
        routes,
        tickets,
        metadata
      };

      console.log('Production test data created successfully');
      return testData;

    } catch (error) {
      console.error('Failed to create production test data:', error);
      throw new Error(`Production test data creation failed: ${error.message}`);
    }
  }

  /**
   * Gets snapshot information
   */
  async getSnapshotInfo(snapshotId: string): Promise<SnapshotInfo | null> {
    try {
      const registry = await this.loadSnapshotRegistry();
      return registry.find(snapshot => snapshot.id === snapshotId) || null;
    } catch (error) {
      console.error('Failed to get snapshot info:', error);
      return null;
    }
  }

  /**
   * Deletes a snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      const snapshotInfo = await this.getSnapshotInfo(snapshotId);
      if (!snapshotInfo) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // Delete snapshot file
      await fs.unlink(snapshotInfo.filePath);

      // Remove from registry
      await this.removeFromSnapshotRegistry(snapshotId);

      console.log(`Deleted snapshot: ${snapshotInfo.name} (${snapshotId})`);

    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw new Error(`Snapshot deletion failed: ${error.message}`);
    }
  }

  // Private helper methods

  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async calculateChecksum(content: string): Promise<string> {
    // Simple checksum implementation - in production would use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async loadSnapshotRegistry(): Promise<SnapshotInfo[]> {
    try {
      const registryPath = path.join(this.snapshotDirectory, 'registry.json');
      const content = await fs.readFile(registryPath, 'utf-8');
      const registry = JSON.parse(content);
      
      // Convert date strings back to Date objects
      return registry.map((snapshot: any) => ({
        ...snapshot,
        createdAt: new Date(snapshot.createdAt)
      }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async updateSnapshotRegistry(snapshotInfo: SnapshotInfo): Promise<void> {
    try {
      const registry = await this.loadSnapshotRegistry();
      registry.push(snapshotInfo);
      
      const registryPath = path.join(this.snapshotDirectory, 'registry.json');
      await this.ensureDirectoryExists(this.snapshotDirectory);
      await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to update snapshot registry:', error);
      throw error;
    }
  }

  private async removeFromSnapshotRegistry(snapshotId: string): Promise<void> {
    try {
      const registry = await this.loadSnapshotRegistry();
      const updatedRegistry = registry.filter(snapshot => snapshot.id !== snapshotId);
      
      const registryPath = path.join(this.snapshotDirectory, 'registry.json');
      await fs.writeFile(registryPath, JSON.stringify(updatedRegistry, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to remove from snapshot registry:', error);
      throw error;
    }
  }

  private validateCustomer(customer: any): boolean {
    return !!(
      customer.id &&
      customer.name &&
      customer.email &&
      customer.phone &&
      typeof customer.isTestData === 'boolean'
    );
  }

  private validateRoute(route: any): boolean {
    return !!(
      route.id &&
      route.name &&
      route.location &&
      typeof route.isTestData === 'boolean'
    );
  }

  private validateTicket(ticket: any, testData: TestDataSet): boolean {
    const hasValidStructure = !!(
      ticket.id &&
      ticket.customerId &&
      ticket.routeId &&
      ticket.status &&
      typeof ticket.isTestData === 'boolean'
    );

    if (!hasValidStructure) return false;

    // Check if referenced customer and route exist
    const customerExists = testData.customers.some(customer => customer.id === ticket.customerId);
    const routeExists = testData.routes.some(route => route.id === ticket.routeId);

    return customerExists && routeExists;
  }

  private async applyMigrations(
    testData: TestDataSet,
    fromVersion: string,
    toVersion: string
  ): Promise<TestDataSet> {
    // Simple migration logic - in production would have more sophisticated versioning
    let migratedData = { ...testData };

    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      // Example migration: add new fields
      migratedData.customers = migratedData.customers.map(customer => ({
        ...customer,
        // Add new field in v1.1.0
        createdAt: new Date().toISOString()
      }));
    }

    // Update metadata version
    migratedData.metadata = {
      ...migratedData.metadata,
      version: toVersion
    };

    return migratedData;
  }
}