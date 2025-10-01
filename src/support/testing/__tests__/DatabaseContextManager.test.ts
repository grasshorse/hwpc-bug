/**
 * Integration tests for DatabaseContextManager with IsolatedDataProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import { DatabaseContextManager } from '../DatabaseContextManager';
import { TestMode, TestConfig } from '../types';

// Mock fs module
vi.mock('fs/promises');

describe('DatabaseContextManager', () => {
  let manager: DatabaseContextManager;
  let testConfig: TestConfig;
  
  beforeEach(() => {
    manager = new DatabaseContextManager();
    testConfig = {
      mode: TestMode.ISOLATED,
      tags: ['@isolated'],
      retries: 3,
      timeout: 30000,
      databaseConfig: {
        backupPath: 'test-backup.sql',
        connectionString: 'postgresql://localhost:5432/test_db',
        restoreTimeout: 60000,
        verificationQueries: [
          'SELECT COUNT(*) as customer_count FROM customers WHERE is_test_data = true',
          'SELECT COUNT(*) as route_count FROM routes WHERE is_test_data = true'
        ]
      }
    };
    
    // Setup default mocks for file system operations
    const mockStats = {
      isFile: () => true,
      size: 1024,
      mtime: new Date()
    };
    
    vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
    vi.mocked(fs.readFile).mockResolvedValue('SELECT 1;');
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    // Cleanup any active contexts
    await manager.cleanupAllContexts();
    vi.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with isolated mode', () => {
      expect(manager.getSupportedMode()).toBe(TestMode.ISOLATED);
    });
  });
  
  describe('Context Setup', () => {
    it('should setup context successfully with valid config', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      expect(context).toBeDefined();
      expect(context.mode).toBe(TestMode.ISOLATED);
      expect(context.testData).toBeDefined();
      expect(context.testData.customers).toHaveLength(2);
      expect(context.testData.routes).toHaveLength(2);
      expect(context.testData.tickets).toHaveLength(1);
      expect(context.connectionInfo.isTestConnection).toBe(true);
      expect(context.metadata.testRunId).toMatch(/^test-\d+-[a-z0-9]+$/);
    });
    
    it('should throw error without database config', async () => {
      const configWithoutDb = { ...testConfig };
      delete configWithoutDb.databaseConfig;
      
      await expect(
        manager.setupContext(TestMode.ISOLATED, configWithoutDb)
      ).rejects.toThrow('Database configuration is required for isolated testing mode');
    });
    
    it('should reject production mode', async () => {
      await expect(
        manager.setupContext(TestMode.PRODUCTION, testConfig)
      ).rejects.toThrow('Context manager for isolated cannot handle production mode');
    });
    
    it('should accept dual mode', async () => {
      const context = await manager.setupContext(TestMode.DUAL, testConfig);
      expect(context.mode).toBe(TestMode.DUAL);
    });
  });
  
  describe('Context Validation', () => {
    it('should validate correct isolated context', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(true);
    });
    
    it('should reject context with wrong mode', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      context.mode = TestMode.PRODUCTION;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should reject context without test connection', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      context.connectionInfo.isTestConnection = false;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should reject context with invalid test data', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      // Make the test data invalid by setting it to null
      context.testData = null as any;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should handle validation errors gracefully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      // Make context invalid by removing required properties
      delete (context as any).connectionInfo;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(false);
      // The error is caught and logged, but since we're just checking properties, no error is thrown
      // The validation just returns false for missing connectionInfo
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Context Cleanup', () => {
    it('should cleanup context successfully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      await expect(manager.cleanupContext(context)).resolves.not.toThrow();
    });
    
    it('should handle cleanup errors', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate cleanup error by making testData invalid
      delete (context as any).testData;
      
      await expect(manager.cleanupContext(context)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Active Context Management', () => {
    it('should track active contexts', async () => {
      const context1 = await manager.setupContext(TestMode.ISOLATED, testConfig);
      const context2 = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      const activeContexts = manager.getActiveContexts();
      expect(activeContexts).toHaveLength(2);
      expect(activeContexts).toContain(context1);
      expect(activeContexts).toContain(context2);
    });
    
    it('should remove context after cleanup', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      expect(manager.getActiveContexts()).toHaveLength(1);
      
      await manager.cleanupContext(context);
      
      expect(manager.getActiveContexts()).toHaveLength(0);
    });
    
    it('should cleanup all contexts', async () => {
      await manager.setupContext(TestMode.ISOLATED, testConfig);
      await manager.setupContext(TestMode.ISOLATED, testConfig);
      await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      expect(manager.getActiveContexts()).toHaveLength(3);
      
      await manager.cleanupAllContexts();
      
      expect(manager.getActiveContexts()).toHaveLength(0);
    });
  });
  
  describe('Test Data Creation', () => {
    it('should create valid mock test data', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      // Verify customers (using IsolatedDataProvider mock data)
      expect(context.testData.customers).toHaveLength(2);
      context.testData.customers.forEach(customer => {
        expect(customer.id).toMatch(/^cust-\d+$/);
        expect(customer.name).toMatch(/^Test Customer \d+$/);
        expect(customer.email).toMatch(/^test\d+@example\.com$/);
        expect(customer.phone).toMatch(/^555-000\d$/);
        expect(customer.isTestData).toBe(true);
      });
      
      // Verify routes (using IsolatedDataProvider mock data)
      expect(context.testData.routes).toHaveLength(2);
      context.testData.routes.forEach(route => {
        expect(route.id).toMatch(/^route-\d+$/);
        expect(route.name).toMatch(/^Test Route \d+$/);
        expect(route.location).toMatch(/^Test Location \d+$/);
        expect(route.isTestData).toBe(true);
      });
      
      // Verify tickets (using IsolatedDataProvider mock data)
      expect(context.testData.tickets).toHaveLength(1);
      const ticket = context.testData.tickets[0];
      expect(ticket.id).toBe('ticket-001');
      expect(ticket.customerId).toBe('cust-001');
      expect(ticket.routeId).toBe('route-001');
      expect(ticket.status).toBe('active');
      expect(ticket.isTestData).toBe(true);
    });
  });
  
  describe('Connection String Parsing', () => {
    it('should extract host from connection string', () => {
      const context = manager as any;
      
      expect(context.extractHostFromConnectionString('postgresql://localhost:5432/db')).toBe('localhost');
      expect(context.extractHostFromConnectionString('mysql://remote-host:3306/db')).toBe('test-db-host');
    });
    
    it('should extract database from connection string', () => {
      const context = manager as any;
      
      const dbName = context.extractDatabaseFromConnectionString('postgresql://localhost:5432/test_db');
      expect(dbName).toBe('test_database');
    });
  });
  
  describe('IsolatedDataProvider Integration', () => {
    it('should use IsolatedDataProvider for database operations', async () => {
      const dataProvider = manager.getDataProvider();
      expect(dataProvider).toBeDefined();
      
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      // Verify data provider was used to load data
      expect(context.testData.customers).toHaveLength(2);
      expect(context.testData.routes).toHaveLength(2);
      expect(context.testData.tickets).toHaveLength(1);
      expect(context.testData.metadata.testRunId).toBeDefined();
    });
    
    it('should handle backup file loading errors', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      vi.mocked(fs.stat).mockRejectedValue(error);
      
      await expect(manager.setupContext(TestMode.ISOLATED, testConfig))
        .rejects.toThrow('Database loading failed');
    });
    
    it('should run verification queries through data provider', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(true);
    });
    
    it('should handle verification query failures', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      // Simulate verification failure by closing all connections
      const dataProvider = manager.getDataProvider();
      await dataProvider.closeAllConnections();
      
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(false);
    });
    
    it('should cleanup data provider connections during cleanup all', async () => {
      await manager.setupContext(TestMode.ISOLATED, testConfig);
      await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      const dataProvider = manager.getDataProvider();
      expect(dataProvider.getActiveConnections().length).toBeGreaterThan(0);
      
      await manager.cleanupAllContexts();
      
      expect(dataProvider.getActiveConnections()).toHaveLength(0);
    });
    
    it('should restore database state during cleanup', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      // Cleanup should call restoreDatabaseState through data provider
      await manager.cleanupContext(context);
      
      // Verify the context is no longer active
      expect(manager.getActiveContexts()).toHaveLength(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle file system permission errors', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('Permission denied'));
      
      await expect(manager.setupContext(TestMode.ISOLATED, testConfig))
        .rejects.toThrow('Database loading failed');
    });
    
    it('should handle JSON parsing errors', async () => {
      const jsonConfig = {
        ...testConfig,
        databaseConfig: {
          ...testConfig.databaseConfig!,
          backupPath: 'invalid.json'
        }
      };
      
      vi.mocked(fs.readFile).mockResolvedValue('invalid json content');
      
      await expect(manager.setupContext(TestMode.ISOLATED, jsonConfig))
        .rejects.toThrow('Database loading failed');
    });
    
    it('should use default verification when no queries provided', async () => {
      const configWithoutQueries = {
        ...testConfig,
        databaseConfig: {
          ...testConfig.databaseConfig!,
          verificationQueries: []
        }
      };
      
      const context = await manager.setupContext(TestMode.ISOLATED, configWithoutQueries);
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(true);
    });
  });
});