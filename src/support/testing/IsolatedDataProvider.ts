/**
 * Isolated Data Provider for Database State Management
 * 
 * Handles database backup loading, restoration, and data verification
 * for isolated testing mode.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TestDataSet, TestMetadata, DatabaseConfig, TestMode } from './types';

export interface DatabaseConnection {
  host: string;
  database: string;
  connectionString: string;
  isConnected: boolean;
}

export interface BackupInfo {
  filePath: string;
  size: number;
  createdAt: Date;
  checksum?: string;
}

export interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  queryResults: Record<string, any>;
}

/**
 * Manages database state for isolated testing
 */
export class IsolatedDataProvider {
  private connections: Map<string, DatabaseConnection> = new Map();
  private backupDirectory: string;
  
  constructor(backupDirectory: string = '.kiro/test-data/isolated') {
    this.backupDirectory = backupDirectory;
  }
  
  /**
   * Loads database state from backup file
   */
  async loadDatabaseState(config: DatabaseConfig, testRunId: string): Promise<TestDataSet> {
    try {
      console.log(`Loading database state from: ${config.backupPath}`);
      
      // Validate backup file exists
      const backupInfo = await this.validateBackupFile(config.backupPath);
      
      // Create test database connection
      const connection = await this.createTestConnection(config.connectionString, testRunId);
      
      // Load backup data
      const backupData = await this.loadBackupFile(config.backupPath);
      
      // Restore database from backup
      await this.restoreFromBackup(connection, backupData);
      
      // Extract test data from restored database
      const testData = await this.extractTestData(connection, testRunId);
      
      console.log(`Database state loaded successfully for test run: ${testRunId}`);
      return testData;
      
    } catch (error) {
      console.error('Failed to load database state:', error);
      throw new Error(`Database loading failed: ${error.message}`);
    }
  }
  
  /**
   * Restores database to original state
   */
  async restoreDatabaseState(connectionString: string, testRunId: string): Promise<void> {
    try {
      console.log(`Restoring database state for test run: ${testRunId}`);
      
      const connection = this.connections.get(testRunId);
      if (!connection) {
        throw new Error(`No connection found for test run: ${testRunId}`);
      }
      
      // Drop test data and restore original state
      await this.dropTestData(connection);
      await this.restoreOriginalState(connection);
      
      // Close and remove connection
      await this.closeConnection(testRunId);
      
      console.log('Database state restored successfully');
    } catch (error) {
      console.error('Failed to restore database state:', error);
      throw error;
    }
  }
  
  /**
   * Runs verification queries to ensure data integrity
   */
  async runVerificationQueries(
    connectionString: string, 
    queries: string[], 
    testRunId: string
  ): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      queryResults: {}
    };
    
    try {
      const connection = this.connections.get(testRunId);
      if (!connection) {
        result.isValid = false;
        result.errors.push(`No connection found for test run: ${testRunId}`);
        return result;
      }
      
      // Execute each verification query
      for (const query of queries) {
        try {
          const queryResult = await this.executeQuery(connection, query);
          result.queryResults[query] = queryResult;
          
          // Basic validation - ensure query returned results
          if (!queryResult || (Array.isArray(queryResult) && queryResult.length === 0)) {
            result.warnings.push(`Query returned no results: ${query}`);
          }
        } catch (error) {
          result.isValid = false;
          result.errors.push(`Query failed: ${query} - ${error.message}`);
        }
      }
      
      return result;
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Verification failed: ${error.message}`);
      return result;
    }
  }
  
  /**
   * Creates a test database connection
   */
  async createTestConnection(connectionString: string, testRunId: string): Promise<DatabaseConnection> {
    try {
      // Parse connection string to extract components
      const { host, database } = this.parseConnectionString(connectionString);
      
      // Create test-specific database name
      const testDatabase = `${database}_test_${testRunId}`;
      const testConnectionString = connectionString.replace(database, testDatabase);
      
      const connection: DatabaseConnection = {
        host,
        database: testDatabase,
        connectionString: testConnectionString,
        isConnected: false
      };
      
      // Simulate connection establishment
      await this.establishConnection(connection);
      
      // Store connection for later use
      this.connections.set(testRunId, connection);
      
      return connection;
    } catch (error) {
      throw new Error(`Failed to create test connection: ${error.message}`);
    }
  }
  
  /**
   * Validates that backup file exists and is readable
   */
  async validateBackupFile(backupPath: string): Promise<BackupInfo> {
    try {
      const fullPath = path.resolve(this.backupDirectory, backupPath);
      const stats = await fs.stat(fullPath);
      
      if (!stats.isFile()) {
        throw new Error(`Backup path is not a file: ${fullPath}`);
      }
      
      return {
        filePath: fullPath,
        size: stats.size,
        createdAt: stats.mtime
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Backup file not found: ${backupPath}`);
      }
      throw new Error(`Failed to validate backup file: ${error.message}`);
    }
  }
  
  /**
   * Loads backup file content
   */
  private async loadBackupFile(backupPath: string): Promise<any> {
    try {
      const fullPath = path.resolve(this.backupDirectory, backupPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Try to parse as JSON first, then as SQL
      if (backupPath.endsWith('.json')) {
        return JSON.parse(content);
      } else if (backupPath.endsWith('.sql')) {
        return { sql: content };
      } else {
        // Default to treating as SQL
        return { sql: content };
      }
    } catch (error) {
      throw new Error(`Failed to load backup file: ${error.message}`);
    }
  }
  
  /**
   * Restores database from backup data
   */
  private async restoreFromBackup(connection: DatabaseConnection, backupData: any): Promise<void> {
    try {
      console.log(`Restoring backup to database: ${connection.database}`);
      
      if (backupData.sql) {
        // Execute SQL backup
        await this.executeSqlBackup(connection, backupData.sql);
      } else {
        // Handle JSON backup
        await this.restoreJsonBackup(connection, backupData);
      }
      
      console.log('Backup restoration completed');
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }
  
  /**
   * Extracts test data from restored database
   */
  private async extractTestData(connection: DatabaseConnection, testRunId: string): Promise<TestDataSet> {
    try {
      // Execute queries to extract test data
      const customers = await this.executeQuery(connection, 'SELECT * FROM customers WHERE is_test_data = true');
      const routes = await this.executeQuery(connection, 'SELECT * FROM routes WHERE is_test_data = true');
      const tickets = await this.executeQuery(connection, 'SELECT * FROM tickets WHERE is_test_data = true');
      
      const metadata: TestMetadata = {
        createdAt: new Date(),
        mode: TestMode.ISOLATED,
        version: '1.0.0',
        testRunId
      };
      
      return {
        customers: customers.map(this.mapCustomerFromDb),
        routes: routes.map(this.mapRouteFromDb),
        tickets: tickets.map(this.mapTicketFromDb),
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to extract test data: ${error.message}`);
    }
  }
  
  /**
   * Parses connection string to extract components
   */
  private parseConnectionString(connectionString: string): { host: string; database: string } {
    // Simple parsing - in real implementation, would use proper connection string parser
    const host = connectionString.includes('localhost') ? 'localhost' : 'test-db-host';
    const database = 'test_database';
    
    return { host, database };
  }
  
  /**
   * Establishes database connection
   */
  private async establishConnection(connection: DatabaseConnection): Promise<void> {
    // Simulate connection establishment
    console.log(`Connecting to database: ${connection.database} on ${connection.host}`);
    
    // In real implementation, would establish actual database connection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    connection.isConnected = true;
    console.log('Database connection established');
  }
  
  /**
   * Executes SQL backup script
   */
  private async executeSqlBackup(connection: DatabaseConnection, sql: string): Promise<void> {
    // Simulate SQL execution
    console.log('Executing SQL backup script...');
    
    // In real implementation, would execute SQL statements
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('SQL backup script executed successfully');
  }
  
  /**
   * Restores from JSON backup
   */
  private async restoreJsonBackup(connection: DatabaseConnection, data: any): Promise<void> {
    // Simulate JSON data restoration
    console.log('Restoring from JSON backup...');
    
    // In real implementation, would insert JSON data into database
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('JSON backup restored successfully');
  }
  
  /**
   * Executes a database query
   */
  private async executeQuery(connection: DatabaseConnection, query: string): Promise<any[]> {
    // Simulate query execution
    console.log(`Executing query: ${query}`);
    
    // Return mock data based on query type
    if (query.includes('customers')) {
      return [
        { id: 'cust-001', name: 'Test Customer 1', email: 'test1@example.com', phone: '555-0001', is_test_data: true },
        { id: 'cust-002', name: 'Test Customer 2', email: 'test2@example.com', phone: '555-0002', is_test_data: true }
      ];
    } else if (query.includes('routes')) {
      return [
        { id: 'route-001', name: 'Test Route 1', location: 'Test Location 1', is_test_data: true },
        { id: 'route-002', name: 'Test Route 2', location: 'Test Location 2', is_test_data: true }
      ];
    } else if (query.includes('tickets')) {
      return [
        { id: 'ticket-001', customer_id: 'cust-001', route_id: 'route-001', status: 'active', is_test_data: true }
      ];
    }
    
    return [];
  }
  
  /**
   * Drops test data from database
   */
  private async dropTestData(connection: DatabaseConnection): Promise<void> {
    console.log('Dropping test data...');
    
    // Simulate dropping test data
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Test data dropped successfully');
  }
  
  /**
   * Restores original database state
   */
  private async restoreOriginalState(connection: DatabaseConnection): Promise<void> {
    console.log('Restoring original database state...');
    
    // Simulate restoration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Original state restored successfully');
  }
  
  /**
   * Closes database connection
   */
  private async closeConnection(testRunId: string): Promise<void> {
    const connection = this.connections.get(testRunId);
    if (connection) {
      console.log(`Closing connection for test run: ${testRunId}`);
      connection.isConnected = false;
      this.connections.delete(testRunId);
    }
  }
  
  /**
   * Maps database customer record to TestCustomer
   */
  private mapCustomerFromDb(dbRecord: any): any {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      isTestData: dbRecord.is_test_data
    };
  }
  
  /**
   * Maps database route record to TestRoute
   */
  private mapRouteFromDb(dbRecord: any): any {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      location: dbRecord.location,
      isTestData: dbRecord.is_test_data
    };
  }
  
  /**
   * Maps database ticket record to TestTicket
   */
  private mapTicketFromDb(dbRecord: any): any {
    return {
      id: dbRecord.id,
      customerId: dbRecord.customer_id,
      routeId: dbRecord.route_id,
      status: dbRecord.status,
      isTestData: dbRecord.is_test_data
    };
  }
  
  /**
   * Gets all active connections (for debugging/monitoring)
   */
  getActiveConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Closes all active connections (emergency cleanup)
   */
  async closeAllConnections(): Promise<void> {
    const testRunIds = Array.from(this.connections.keys());
    const closePromises = testRunIds.map(testRunId => this.closeConnection(testRunId));
    
    await Promise.allSettled(closePromises);
    this.connections.clear();
  }
}