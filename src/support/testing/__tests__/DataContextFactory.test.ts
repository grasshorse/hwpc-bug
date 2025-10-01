/**
 * Unit tests for DataContextFactory
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataContextFactory } from '../DataContextFactory';
import { DatabaseContextManager } from '../DatabaseContextManager';
import { ProductionTestDataManager } from '../ProductionTestDataManager';
import { TestMode } from '../types';

describe('DataContextFactory', () => {
  beforeEach(() => {
    // Clear any cached managers before each test
    DataContextFactory.clearManagers();
  });
  
  afterEach(() => {
    // Clean up after each test
    DataContextFactory.clearManagers();
  });
  
  describe('Manager Creation', () => {
    it('should create DatabaseContextManager for isolated mode', () => {
      const manager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      expect(manager).toBeInstanceOf(DatabaseContextManager);
      expect(manager.getSupportedMode()).toBe(TestMode.ISOLATED);
    });
    
    it('should create ProductionTestDataManager for production mode', () => {
      const manager = DataContextFactory.getManager(TestMode.PRODUCTION);
      
      expect(manager).toBeInstanceOf(ProductionTestDataManager);
      expect(manager.getSupportedMode()).toBe(TestMode.PRODUCTION);
    });
    
    it('should create DatabaseContextManager for dual mode (default)', () => {
      const manager = DataContextFactory.getManager(TestMode.DUAL);
      
      expect(manager).toBeInstanceOf(DatabaseContextManager);
      expect(manager.getSupportedMode()).toBe(TestMode.ISOLATED);
    });
    
    it('should throw error for unsupported mode', () => {
      expect(() => {
        DataContextFactory.getManager('invalid' as TestMode);
      }).toThrow('Unsupported test mode: invalid');
    });
  });
  
  describe('Manager Caching', () => {
    it('should cache managers and return same instance', () => {
      const manager1 = DataContextFactory.getManager(TestMode.ISOLATED);
      const manager2 = DataContextFactory.getManager(TestMode.ISOLATED);
      
      expect(manager1).toBe(manager2);
    });
    
    it('should create different managers for different modes', () => {
      const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      
      expect(isolatedManager).not.toBe(productionManager);
      expect(isolatedManager).toBeInstanceOf(DatabaseContextManager);
      expect(productionManager).toBeInstanceOf(ProductionTestDataManager);
    });
    
    it('should return all cached managers', () => {
      const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      
      const allManagers = DataContextFactory.getAllManagers();
      
      expect(allManagers.size).toBe(2);
      expect(allManagers.get(TestMode.ISOLATED)).toBe(isolatedManager);
      expect(allManagers.get(TestMode.PRODUCTION)).toBe(productionManager);
    });
  });
  
  describe('Manager Registration', () => {
    it('should allow custom manager registration', () => {
      const customManager = new DatabaseContextManager();
      
      DataContextFactory.registerManager(TestMode.PRODUCTION, customManager);
      
      const retrievedManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      expect(retrievedManager).toBe(customManager);
      expect(retrievedManager).toBeInstanceOf(DatabaseContextManager);
    });
    
    it('should override existing manager when registering', () => {
      // Get default manager first
      const defaultManager = DataContextFactory.getManager(TestMode.ISOLATED);
      expect(defaultManager).toBeInstanceOf(DatabaseContextManager);
      
      // Register custom manager
      const customManager = new ProductionTestDataManager();
      DataContextFactory.registerManager(TestMode.ISOLATED, customManager);
      
      // Should return custom manager now
      const retrievedManager = DataContextFactory.getManager(TestMode.ISOLATED);
      expect(retrievedManager).toBe(customManager);
      expect(retrievedManager).toBeInstanceOf(ProductionTestDataManager);
    });
  });
  
  describe('Manager Clearing', () => {
    it('should clear all cached managers', () => {
      // Create some managers
      DataContextFactory.getManager(TestMode.ISOLATED);
      DataContextFactory.getManager(TestMode.PRODUCTION);
      
      expect(DataContextFactory.getAllManagers().size).toBe(2);
      
      // Clear managers
      DataContextFactory.clearManagers();
      
      expect(DataContextFactory.getAllManagers().size).toBe(0);
    });
    
    it('should create new managers after clearing', () => {
      // Create and cache a manager
      const originalManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      // Clear managers
      DataContextFactory.clearManagers();
      
      // Get manager again - should be a new instance
      const newManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      expect(newManager).not.toBe(originalManager);
      expect(newManager).toBeInstanceOf(DatabaseContextManager);
    });
  });
  
  describe('Supported Modes', () => {
    it('should return all supported modes', () => {
      const supportedModes = DataContextFactory.getSupportedModes();
      
      expect(supportedModes).toEqual([
        TestMode.ISOLATED,
        TestMode.PRODUCTION,
        TestMode.DUAL
      ]);
    });
    
    it('should support all returned modes', () => {
      const supportedModes = DataContextFactory.getSupportedModes();
      
      supportedModes.forEach(mode => {
        expect(() => {
          DataContextFactory.getManager(mode);
        }).not.toThrow();
      });
    });
  });
  
  describe('Factory State Management', () => {
    it('should maintain independent state across tests', () => {
      // This test verifies that beforeEach/afterEach cleanup works
      expect(DataContextFactory.getAllManagers().size).toBe(0);
      
      DataContextFactory.getManager(TestMode.ISOLATED);
      expect(DataContextFactory.getAllManagers().size).toBe(1);
    });
    
    it('should handle concurrent manager creation', () => {
      // Simulate concurrent access
      const managers = [
        DataContextFactory.getManager(TestMode.ISOLATED),
        DataContextFactory.getManager(TestMode.ISOLATED),
        DataContextFactory.getManager(TestMode.PRODUCTION),
        DataContextFactory.getManager(TestMode.PRODUCTION)
      ];
      
      // Should have only 2 unique managers
      expect(managers[0]).toBe(managers[1]); // Same isolated manager
      expect(managers[2]).toBe(managers[3]); // Same production manager
      expect(managers[0]).not.toBe(managers[2]); // Different managers
      
      expect(DataContextFactory.getAllManagers().size).toBe(2);
    });
  });
});