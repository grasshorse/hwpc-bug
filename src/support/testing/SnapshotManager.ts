/**
 * Snapshot Manager
 * 
 * Specialized utility for creating and managing isolated test database snapshots.
 * Handles database backup creation, restoration, and versioning.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DatabaseConfig, TestMode } from './types';

export interface DatabaseSnapshot {
  id: string;
  name: string;
  version: string;
  createdAt: Date;
  size: number;
  format: 'sql' | 'json';
  filePath: string;
  checksum: string;
  metadata: {
    tables: string[];
    recordCount: number;
    description?: string;
    tags?: string[];
  };
}

export interface SnapshotCreationOptions {
  name: string;
  description?: string;
  tags?: string[];
  format?: 'sql' | 'json';
  includeTables?: string[];
  excludeTables?: string[];
}

export interface RestoreOptions {
  dropExisting?: boolean;
  validateAfterRestore?: boolean;
  timeout?: number;
}

/**
 * Manages database snapshots for isolated testing
 */
export class SnapshotManager {
  private snapshotDirectory: string;
  private currentVersion: string = '1.0.0';

  constructor(snapshotDirectory: string = '.kiro/test-data/isolated') {
    this.snapshotDirectory = snapshotDirectory;
  }

  /**
   * Creates a database snapshot from current state
   */
  async createSnapshot(
    databaseConfig: DatabaseConfig,
    options: SnapshotCreationOptions
  ): Promise<DatabaseSnapshot> {
    try {
      console.log(`Creating database snapshot: ${options.name}`);

      const snapshotId = this.generateSnapshotId();
      const timestamp = new Date();
      const format = options.format || 'sql';
      const fileName = `${options.name}-${snapshotId}.${format}`;
      const filePath = path.join(this.snapshotDirectory, fileName);

      // Ensure directory exists
      await this.ensureDirectoryExists(this.snapshotDirectory);

      // Extract database data
      const extractedData = await this.extractDatabaseData(databaseConfig, options);

      // Write snapshot file
      let content: string;
      if (format === 'json') {
        content = JSON.stringify(extractedData, null, 2);
      } else {
        content = this.generateSqlDump(extractedData);
      }

      await fs.writeFile(filePath, content, 'utf-8');

      // Calculate checksum
      const checksum = await this.calculateChecksum(content);

      const snapshot: DatabaseSnapshot = {
        id: snapshotId,
        name: options.name,
        version: this.currentVersion,
        createdAt: timestamp,
        size: content.length,
        format,
        filePath,
        checksum,
        metadata: {
          tables: extractedData.tables || [],
          recordCount: extractedData.totalRecords || 0,
          description: options.description,
          tags: options.tags
        }
      };

      // Update snapshot registry
      await this.updateSnapshotRegistry(snapshot);

      console.log(`Snapshot created: ${options.name} (${snapshotId})`);
      return snapshot;

    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw new Error(`Snapshot creation failed: ${error.message}`);
    }
  }

  /**
   * Restores database from snapshot
   */
  async restoreSnapshot(
    snapshotId: string,
    databaseConfig: DatabaseConfig,
    options: RestoreOptions = {}
  ): Promise<void> {
    try {
      console.log(`Restoring database from snapshot: ${snapshotId}`);

      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // Validate snapshot integrity
      await this.validateSnapshotIntegrity(snapshot);

      // Load snapshot content
      const content = await fs.readFile(snapshot.filePath, 'utf-8');

      // Drop existing data if requested
      if (options.dropExisting) {
        await this.dropExistingData(databaseConfig, snapshot.metadata.tables);
      }

      // Restore data based on format
      if (snapshot.format === 'json') {
        await this.restoreFromJson(databaseConfig, JSON.parse(content));
      } else {
        await this.restoreFromSql(databaseConfig, content);
      }

      // Validate restoration if requested
      if (options.validateAfterRestore) {
        await this.validateRestoration(databaseConfig, snapshot);
      }

      console.log(`Database restored from snapshot: ${snapshot.name}`);

    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      throw new Error(`Snapshot restoration failed: ${error.message}`);
    }
  }

  /**
   * Lists available snapshots
   */
  async listSnapshots(): Promise<DatabaseSnapshot[]> {
    try {
      return await this.loadSnapshotRegistry();
    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Gets snapshot by ID
   */
  async getSnapshot(snapshotId: string): Promise<DatabaseSnapshot | null> {
    try {
      const snapshots = await this.loadSnapshotRegistry();
      return snapshots.find(snapshot => snapshot.id === snapshotId) || null;
    } catch (error) {
      console.error('Failed to get snapshot:', error);
      return null;
    }
  }

  /**
   * Deletes a snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // Delete snapshot file
      await fs.unlink(snapshot.filePath);

      // Remove from registry
      await this.removeFromRegistry(snapshotId);

      console.log(`Deleted snapshot: ${snapshot.name} (${snapshotId})`);

    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw new Error(`Snapshot deletion failed: ${error.message}`);
    }
  }

  /**
   * Validates snapshot integrity
   */
  async validateSnapshotIntegrity(snapshot: DatabaseSnapshot): Promise<boolean> {
    try {
      // Check if file exists
      await fs.access(snapshot.filePath);

      // Validate checksum
      const content = await fs.readFile(snapshot.filePath, 'utf-8');
      const currentChecksum = await this.calculateChecksum(content);

      if (currentChecksum !== snapshot.checksum) {
        throw new Error(`Checksum mismatch for snapshot: ${snapshot.id}`);
      }

      return true;

    } catch (error) {
      console.error('Snapshot integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Creates a snapshot from existing backup file
   */
  async importSnapshot(
    backupFilePath: string,
    options: SnapshotCreationOptions
  ): Promise<DatabaseSnapshot> {
    try {
      console.log(`Importing snapshot from: ${backupFilePath}`);

      // Validate backup file exists
      await fs.access(backupFilePath);
      const stats = await fs.stat(backupFilePath);

      const snapshotId = this.generateSnapshotId();
      const timestamp = new Date();
      const format = path.extname(backupFilePath).slice(1) as 'sql' | 'json';
      const fileName = `${options.name}-${snapshotId}.${format}`;
      const filePath = path.join(this.snapshotDirectory, fileName);

      // Ensure directory exists
      await this.ensureDirectoryExists(this.snapshotDirectory);

      // Copy backup file to snapshot directory
      await fs.copyFile(backupFilePath, filePath);

      // Read content for checksum calculation
      const content = await fs.readFile(filePath, 'utf-8');
      const checksum = await this.calculateChecksum(content);

      // Analyze content to extract metadata
      const metadata = await this.analyzeSnapshotContent(content, format);

      const snapshot: DatabaseSnapshot = {
        id: snapshotId,
        name: options.name,
        version: this.currentVersion,
        createdAt: timestamp,
        size: stats.size,
        format,
        filePath,
        checksum,
        metadata: {
          ...metadata,
          description: options.description,
          tags: options.tags
        }
      };

      // Update snapshot registry
      await this.updateSnapshotRegistry(snapshot);

      console.log(`Snapshot imported: ${options.name} (${snapshotId})`);
      return snapshot;

    } catch (error) {
      console.error('Failed to import snapshot:', error);
      throw new Error(`Snapshot import failed: ${error.message}`);
    }
  }

  /**
   * Exports snapshot to specified location
   */
  async exportSnapshot(snapshotId: string, exportPath: string): Promise<void> {
    try {
      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      await fs.copyFile(snapshot.filePath, exportPath);
      console.log(`Snapshot exported to: ${exportPath}`);

    } catch (error) {
      console.error('Failed to export snapshot:', error);
      throw new Error(`Snapshot export failed: ${error.message}`);
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
    // Simple checksum implementation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private async extractDatabaseData(
    config: DatabaseConfig,
    options: SnapshotCreationOptions
  ): Promise<any> {
    // Mock implementation - in real scenario would connect to database
    console.log('Extracting database data...');

    const mockData = {
      tables: ['customers', 'routes', 'tickets'],
      totalRecords: 150,
      data: {
        customers: [
          { id: 1, name: 'Test Customer 1', email: 'test1@example.com', is_test_data: true },
          { id: 2, name: 'Test Customer 2', email: 'test2@example.com', is_test_data: true }
        ],
        routes: [
          { id: 1, name: 'Test Route 1', location: 'Cedar Falls', is_test_data: true },
          { id: 2, name: 'Test Route 2', location: 'Winfield', is_test_data: true }
        ],
        tickets: [
          { id: 1, customer_id: 1, route_id: 1, status: 'active', is_test_data: true }
        ]
      }
    };

    // Filter tables if specified
    if (options.includeTables) {
      mockData.tables = mockData.tables.filter(table => 
        options.includeTables!.includes(table)
      );
    }

    if (options.excludeTables) {
      mockData.tables = mockData.tables.filter(table => 
        !options.excludeTables!.includes(table)
      );
    }

    return mockData;
  }

  private generateSqlDump(data: any): string {
    let sql = '-- Database Snapshot SQL Dump\n';
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Generate CREATE TABLE and INSERT statements
    for (const tableName of data.tables) {
      if (data.data[tableName]) {
        sql += `-- Table: ${tableName}\n`;
        sql += `DROP TABLE IF EXISTS ${tableName};\n`;
        
        // Mock CREATE TABLE statement
        sql += `CREATE TABLE ${tableName} (\n`;
        sql += `  id INTEGER PRIMARY KEY,\n`;
        sql += `  name VARCHAR(255),\n`;
        sql += `  is_test_data BOOLEAN DEFAULT FALSE\n`;
        sql += `);\n\n`;

        // Generate INSERT statements
        for (const record of data.data[tableName]) {
          const columns = Object.keys(record).join(', ');
          const values = Object.values(record).map(v => 
            typeof v === 'string' ? `'${v}'` : v
          ).join(', ');
          sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
        }
        sql += '\n';
      }
    }

    return sql;
  }

  private async restoreFromJson(config: DatabaseConfig, data: any): Promise<void> {
    console.log('Restoring from JSON data...');
    
    // Mock implementation - would execute database operations
    for (const tableName of data.tables) {
      if (data.data[tableName]) {
        console.log(`Restoring table: ${tableName} (${data.data[tableName].length} records)`);
      }
    }
  }

  private async restoreFromSql(config: DatabaseConfig, sql: string): Promise<void> {
    console.log('Restoring from SQL dump...');
    
    // Mock implementation - would execute SQL statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    console.log(`Executing ${statements.length} SQL statements`);
  }

  private async dropExistingData(config: DatabaseConfig, tables: string[]): Promise<void> {
    console.log('Dropping existing data...');
    
    // Mock implementation - would drop tables or truncate data
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
    }
  }

  private async validateRestoration(
    config: DatabaseConfig,
    snapshot: DatabaseSnapshot
  ): Promise<void> {
    console.log('Validating restoration...');
    
    // Mock implementation - would run validation queries
    for (const table of snapshot.metadata.tables) {
      console.log(`Validating table: ${table}`);
    }
  }

  private async analyzeSnapshotContent(content: string, format: 'sql' | 'json'): Promise<any> {
    if (format === 'json') {
      const data = JSON.parse(content);
      return {
        tables: data.tables || [],
        recordCount: data.totalRecords || 0
      };
    } else {
      // Analyze SQL content
      const tables = this.extractTablesFromSql(content);
      const recordCount = this.countRecordsInSql(content);
      
      return {
        tables,
        recordCount
      };
    }
  }

  private extractTablesFromSql(sql: string): string[] {
    const tableRegex = /CREATE TABLE\s+(\w+)/gi;
    const tables: string[] = [];
    let match;
    
    while ((match = tableRegex.exec(sql)) !== null) {
      tables.push(match[1]);
    }
    
    return tables;
  }

  private countRecordsInSql(sql: string): number {
    const insertRegex = /INSERT INTO/gi;
    const matches = sql.match(insertRegex);
    return matches ? matches.length : 0;
  }

  private async loadSnapshotRegistry(): Promise<DatabaseSnapshot[]> {
    try {
      const registryPath = path.join(this.snapshotDirectory, 'snapshots.json');
      const content = await fs.readFile(registryPath, 'utf-8');
      const registry = JSON.parse(content);
      
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

  private async updateSnapshotRegistry(snapshot: DatabaseSnapshot): Promise<void> {
    try {
      const registry = await this.loadSnapshotRegistry();
      registry.push(snapshot);
      
      const registryPath = path.join(this.snapshotDirectory, 'snapshots.json');
      await this.ensureDirectoryExists(this.snapshotDirectory);
      await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to update snapshot registry:', error);
      throw error;
    }
  }

  private async removeFromRegistry(snapshotId: string): Promise<void> {
    try {
      const registry = await this.loadSnapshotRegistry();
      const updatedRegistry = registry.filter(snapshot => snapshot.id !== snapshotId);
      
      const registryPath = path.join(this.snapshotDirectory, 'snapshots.json');
      await fs.writeFile(registryPath, JSON.stringify(updatedRegistry, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to remove from registry:', error);
      throw error;
    }
  }
}