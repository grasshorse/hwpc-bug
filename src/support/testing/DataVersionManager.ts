/**
 * Data Version Manager
 * 
 * Handles test data versioning, migration, and backward compatibility
 * for both isolated and production test data.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TestDataSet, TestMode, TestMetadata } from './types';

export interface DataVersion {
  version: string;
  releaseDate: Date;
  description: string;
  breaking: boolean;
  migrations: Migration[];
  deprecations: string[];
}

export interface Migration {
  id: string;
  name: string;
  description: string;
  fromVersion: string;
  toVersion: string;
  migrator: (data: TestDataSet) => Promise<TestDataSet>;
  rollback?: (data: TestDataSet) => Promise<TestDataSet>;
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  migrations: Migration[];
  estimatedDuration: number;
  risks: string[];
  backupRequired: boolean;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  appliedMigrations: string[];
  duration: number;
  errors: string[];
  warnings: string[];
  backupPath?: string;
}

export interface VersionCompatibility {
  isCompatible: boolean;
  currentVersion: string;
  requiredVersion: string;
  issues: string[];
  recommendations: string[];
}

/**
 * Manages test data versions and migrations
 */
export class DataVersionManager {
  private versions: Map<string, DataVersion> = new Map();
  private migrations: Map<string, Migration> = new Map();
  private currentVersion: string = '1.0.0';
  private versionDirectory: string;

  constructor(versionDirectory: string = '.kiro/test-data/versions') {
    this.versionDirectory = versionDirectory;
    this.initializeVersions();
  }

  /**
   * Registers a new data version
   */
  registerVersion(version: DataVersion): void {
    this.versions.set(version.version, version);
    
    // Register migrations for this version
    version.migrations.forEach(migration => {
      this.migrations.set(migration.id, migration);
    });

    console.log(`Registered version: ${version.version}`);
  }

  /**
   * Creates migration plan from one version to another
   */
  createMigrationPlan(fromVersion: string, toVersion: string): MigrationPlan {
    console.log(`Creating migration plan: ${fromVersion} -> ${toVersion}`);

    const plan: MigrationPlan = {
      fromVersion,
      toVersion,
      migrations: [],
      estimatedDuration: 0,
      risks: [],
      backupRequired: false
    };

    try {
      // Find migration path
      const migrationPath = this.findMigrationPath(fromVersion, toVersion);
      plan.migrations = migrationPath;

      // Calculate estimated duration (mock calculation)
      plan.estimatedDuration = migrationPath.length * 30; // 30 seconds per migration

      // Assess risks
      plan.risks = this.assessMigrationRisks(migrationPath);

      // Determine if backup is required
      plan.backupRequired = migrationPath.some(migration => 
        this.versions.get(migration.toVersion)?.breaking
      );

      console.log(`Migration plan created: ${migrationPath.length} migrations`);

    } catch (error) {
      console.error('Failed to create migration plan:', error);
      plan.risks.push(`Migration planning failed: ${error.message}`);
    }

    return plan;
  }

  /**
   * Executes migration plan
   */
  async executeMigration(
    testData: TestDataSet,
    plan: MigrationPlan,
    options: { createBackup?: boolean; dryRun?: boolean } = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    
    const result: MigrationResult = {
      success: false,
      fromVersion: plan.fromVersion,
      toVersion: plan.toVersion,
      appliedMigrations: [],
      duration: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log(`Starting migration: ${plan.fromVersion} -> ${plan.toVersion}`);

      if (options.dryRun) {
        console.log('DRY RUN: Migration simulation');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Create backup if required or requested
      if (plan.backupRequired || options.createBackup) {
        const backupPath = await this.createBackup(testData, plan.fromVersion);
        result.backupPath = backupPath;
        console.log(`Backup created: ${backupPath}`);
      }

      // Execute migrations in sequence
      let currentData = { ...testData };
      
      for (const migration of plan.migrations) {
        try {
          console.log(`Applying migration: ${migration.name}`);
          
          currentData = await migration.migrator(currentData);
          result.appliedMigrations.push(migration.id);
          
          console.log(`Migration applied: ${migration.name}`);
          
        } catch (error) {
          result.errors.push(`Migration ${migration.name} failed: ${error.message}`);
          
          // Attempt rollback if available
          if (migration.rollback) {
            try {
              console.log(`Rolling back migration: ${migration.name}`);
              currentData = await migration.rollback(currentData);
              result.warnings.push(`Migration ${migration.name} rolled back`);
            } catch (rollbackError) {
              result.errors.push(`Rollback failed for ${migration.name}: ${rollbackError.message}`);
            }
          }
          
          throw error;
        }
      }

      // Update metadata version
      currentData.metadata = {
        ...currentData.metadata,
        version: plan.toVersion
      };

      result.success = true;
      console.log('Migration completed successfully');

    } catch (error) {
      result.errors.push(`Migration failed: ${error.message}`);
      console.error('Migration execution failed:', error);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Checks version compatibility
   */
  checkCompatibility(
    currentVersion: string,
    requiredVersion: string
  ): VersionCompatibility {
    const compatibility: VersionCompatibility = {
      isCompatible: false,
      currentVersion,
      requiredVersion,
      issues: [],
      recommendations: []
    };

    try {
      const current = this.parseVersion(currentVersion);
      const required = this.parseVersion(requiredVersion);

      // Check major version compatibility
      if (current.major < required.major) {
        compatibility.issues.push('Major version upgrade required');
        compatibility.recommendations.push(`Upgrade from v${currentVersion} to v${requiredVersion}`);
      } else if (current.major > required.major) {
        compatibility.issues.push('Version downgrade detected');
        compatibility.recommendations.push('Consider using a compatible version');
      }

      // Check minor version compatibility
      if (current.major === required.major && current.minor < required.minor) {
        compatibility.issues.push('Minor version upgrade recommended');
        compatibility.recommendations.push(`Update to v${requiredVersion} for latest features`);
      }

      // Check for breaking changes
      const breakingVersions = this.getBreakingVersionsBetween(currentVersion, requiredVersion);
      if (breakingVersions.length > 0) {
        compatibility.issues.push(`Breaking changes in versions: ${breakingVersions.join(', ')}`);
        compatibility.recommendations.push('Review migration guide for breaking changes');
      }

      // Determine overall compatibility
      compatibility.isCompatible = compatibility.issues.length === 0 || 
        (compatibility.issues.length === 1 && compatibility.issues[0].includes('recommended'));

    } catch (error) {
      compatibility.issues.push(`Version compatibility check failed: ${error.message}`);
    }

    return compatibility;
  }

  /**
   * Gets available versions
   */
  getAvailableVersions(): DataVersion[] {
    return Array.from(this.versions.values()).sort((a, b) => 
      this.compareVersions(a.version, b.version)
    );
  }

  /**
   * Gets version information
   */
  getVersionInfo(version: string): DataVersion | null {
    return this.versions.get(version) || null;
  }

  /**
   * Gets current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Sets current version
   */
  setCurrentVersion(version: string): void {
    if (!this.versions.has(version)) {
      throw new Error(`Version not found: ${version}`);
    }
    this.currentVersion = version;
  }

  /**
   * Validates test data version
   */
  validateDataVersion(testData: TestDataSet): boolean {
    try {
      const dataVersion = testData.metadata.version;
      const versionInfo = this.versions.get(dataVersion);
      
      if (!versionInfo) {
        console.warn(`Unknown data version: ${dataVersion}`);
        return false;
      }

      // Additional validation logic could be added here
      return true;

    } catch (error) {
      console.error('Version validation failed:', error);
      return false;
    }
  }

  // Private helper methods

  private initializeVersions(): void {
    // Register version 1.0.0
    this.registerVersion({
      version: '1.0.0',
      releaseDate: new Date('2024-01-01'),
      description: 'Initial version with basic customer, route, and ticket entities',
      breaking: false,
      migrations: [],
      deprecations: []
    });

    // Register version 1.1.0
    this.registerVersion({
      version: '1.1.0',
      releaseDate: new Date('2024-06-01'),
      description: 'Added timestamp fields and enhanced metadata',
      breaking: false,
      migrations: [
        {
          id: 'add-timestamps-1.1.0',
          name: 'Add Timestamp Fields',
          description: 'Adds createdAt and updatedAt fields to all entities',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrator: async (data: TestDataSet) => {
            const timestamp = new Date().toISOString();
            
            return {
              ...data,
              customers: data.customers.map(customer => ({
                ...customer,
                createdAt: timestamp,
                updatedAt: timestamp
              })),
              routes: data.routes.map(route => ({
                ...route,
                createdAt: timestamp,
                updatedAt: timestamp
              })),
              tickets: data.tickets.map(ticket => ({
                ...ticket,
                createdAt: timestamp,
                updatedAt: timestamp
              }))
            };
          },
          rollback: async (data: TestDataSet) => {
            return {
              ...data,
              customers: data.customers.map(customer => {
                const { createdAt, updatedAt, ...rest } = customer as any;
                return rest;
              }),
              routes: data.routes.map(route => {
                const { createdAt, updatedAt, ...rest } = route as any;
                return rest;
              }),
              tickets: data.tickets.map(ticket => {
                const { createdAt, updatedAt, ...rest } = ticket as any;
                return rest;
              })
            };
          }
        }
      ],
      deprecations: []
    });

    // Register version 2.0.0
    this.registerVersion({
      version: '2.0.0',
      releaseDate: new Date('2024-12-01'),
      description: 'Major restructure with new entity relationships',
      breaking: true,
      migrations: [
        {
          id: 'restructure-entities-2.0.0',
          name: 'Restructure Entity Relationships',
          description: 'Updates entity structure for improved relationships',
          fromVersion: '1.1.0',
          toVersion: '2.0.0',
          migrator: async (data: TestDataSet) => {
            // Mock major restructuring
            return {
              ...data,
              customers: data.customers.map(customer => ({
                ...customer,
                profile: {
                  preferences: {},
                  settings: {}
                }
              })),
              routes: data.routes.map(route => ({
                ...route,
                schedule: {
                  days: [],
                  times: []
                }
              }))
            };
          }
        }
      ],
      deprecations: ['Legacy ticket status values']
    });
  }

  private findMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    const path: Migration[] = [];
    let currentVersion = fromVersion;

    // Simple linear migration path - in production would use graph traversal
    while (currentVersion !== toVersion) {
      const migration = Array.from(this.migrations.values()).find(m => 
        m.fromVersion === currentVersion
      );

      if (!migration) {
        throw new Error(`No migration path found from ${currentVersion} to ${toVersion}`);
      }

      path.push(migration);
      currentVersion = migration.toVersion;

      // Prevent infinite loops
      if (path.length > 10) {
        throw new Error('Migration path too long - possible circular dependency');
      }
    }

    return path;
  }

  private assessMigrationRisks(migrations: Migration[]): string[] {
    const risks: string[] = [];

    // Check for breaking changes
    const breakingMigrations = migrations.filter(m => 
      this.versions.get(m.toVersion)?.breaking
    );

    if (breakingMigrations.length > 0) {
      risks.push('Breaking changes detected - thorough testing required');
    }

    // Check for migrations without rollback
    const noRollbackMigrations = migrations.filter(m => !m.rollback);
    if (noRollbackMigrations.length > 0) {
      risks.push('Some migrations cannot be rolled back');
    }

    // Check migration chain length
    if (migrations.length > 3) {
      risks.push('Long migration chain - increased failure risk');
    }

    return risks;
  }

  private async createBackup(testData: TestDataSet, version: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${version}-${timestamp}.json`;
    const backupPath = path.join(this.versionDirectory, 'backups', backupFileName);

    // Ensure backup directory exists
    await this.ensureDirectoryExists(path.dirname(backupPath));

    // Write backup
    const backupData = {
      version,
      timestamp: new Date(),
      data: testData
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    return backupPath;
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  private compareVersions(a: string, b: string): number {
    const versionA = this.parseVersion(a);
    const versionB = this.parseVersion(b);

    if (versionA.major !== versionB.major) {
      return versionA.major - versionB.major;
    }
    if (versionA.minor !== versionB.minor) {
      return versionA.minor - versionB.minor;
    }
    return versionA.patch - versionB.patch;
  }

  private getBreakingVersionsBetween(fromVersion: string, toVersion: string): string[] {
    const breakingVersions: string[] = [];
    
    for (const [version, versionInfo] of this.versions) {
      if (versionInfo.breaking && 
          this.compareVersions(version, fromVersion) > 0 && 
          this.compareVersions(version, toVersion) <= 0) {
        breakingVersions.push(version);
      }
    }

    return breakingVersions;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}