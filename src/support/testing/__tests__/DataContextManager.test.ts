/**
 * Unit tests for Data Context Management Framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataContextManager, BaseDataContextManager } from '../DataContextManager';
import { TestMode, TestConfig, DataContext } from '../types';

// Mock implementation for testing
class MockDataContextManager extends BaseDataContextManager {
  constructor(mode: TestMode) {
    super(mode);
  }
  
  async setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext> {
    this.validateMode(mode);
    
    const testRunId = this.generateTestRunId();
    return {
      mode,
      testData: {
        customers: [],
        routes: [],
        tickets: [],
        metadata: {
          createdAt: new Date(),
          mode,
          version: '1.0.0',
          testRunId
        }
      },
      connectionInfo: {
        host: 'mock-host',
        database: 'mock-db',
        isTestConnection: true
      },
      cleanup: vi.fn().mockResolvedValue(undefined)
    };
  }
  
  async validateContext(context: DataContext): Promise<boolean> {
    return context.mode === this.getSupportedMode();
  }
}

describe('DataContextManager', () => {
  let manager: MockDataContextManager;
  let testConfig: TestConfig;
  
  beforeEach(() => {
    manager = new MockDataContextManager(TestMode.ISOLATED);
    testConfig = {
      mode: TestMode.ISOLATED,
      tags: ['@isolated'],
      retries: 3,
      timeout: 30000,
      databaseConfig: {
        backupPath: '/path/to/backup.sql',
        connectionString: 'postgresql://localhost:5432/test_db',
        restoreTimeout: 60000,
        verificationQueries: ['SELECT COUNT(*) FROM customers']
      }
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('BaseDataContextManager', () => {
    it('should create manager with correct mode', () => {
      expect(manager.getSupportedMode()).toBe(TestMode.ISOLATED);
    });
    
    it('should setup context successfully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      expect(context).toBeDefined();
      expect(context.mode).toBe(TestMode.ISOLATED);
      expect(context.testData).toBeDefined();
      expect(context.connectionInfo).toBeDefined();
      expect(context.cleanup).toBeDefined();
    });
    
    it('should validate context successfully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(true);
    });
    
    it('should cleanup context successfully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      
      await expect(manager.cleanupContext(context)).resolves.not.toThrow();
      expect(context.cleanup).toHaveBeenCalled();
    });
    
    it('should throw error for unsupported mode', async () => {
      await expect(
        manager.setupContext(TestMode.PRODUCTION, testConfig)
      ).rejects.toThrow('Context manager for isolated cannot handle production mode');
    });
    
    it('should allow dual mode', async () => {
      const context = await manager.setupContext(TestMode.DUAL, testConfig);
      expect(context.mode).toBe(TestMode.DUAL);
    });
    
    it('should generate unique test run IDs', () => {
      const id1 = (manager as any).generateTestRunId();
      const id2 = (manager as any).generateTestRunId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-\d+-[a-z0-9]+$/);
    });
    
    it('should handle cleanup errors gracefully', async () => {
      const context = await manager.setupContext(TestMode.ISOLATED, testConfig);
      const cleanupError = new Error('Cleanup failed');
      
      // Mock cleanup to throw error
      vi.mocked(context.cleanup).mockRejectedValue(cleanupError);
      
      // Console.error should be called, but error should be re-thrown
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(manager.cleanupContext(context)).rejects.toThrow('Cleanup failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cleanup context for mode isolated:',
        cleanupError
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Mode Validation', () => {
    it('should validate correct mode', () => {
      expect(() => (manager as any).validateMode(TestMode.ISOLATED)).not.toThrow();
    });
    
    it('should validate dual mode', () => {
      expect(() => (manager as any).validateMode(TestMode.DUAL)).not.toThrow();
    });
    
    it('should reject incorrect mode', () => {
      expect(() => (manager as any).validateMode(TestMode.PRODUCTION)).toThrow();
    });
  });
  
  describe('Test Run ID Generation', () => {
    it('should generate valid test run IDs', () => {
      const id = (manager as any).generateTestRunId();
      
      expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(10);
    });
    
    it('should generate unique IDs', () => {
      const ids = new Set();
      
      for (let i = 0; i < 100; i++) {
        const id = (manager as any).generateTestRunId();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });
  });
});