/**
 * Unit tests for ProductionTestDataManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductionTestDataManager } from '../ProductionTestDataManager';
import { TestMode, TestConfig } from '../types';

describe('ProductionTestDataManager', () => {
  let manager: ProductionTestDataManager;
  let testConfig: TestConfig;
  
  beforeEach(() => {
    manager = new ProductionTestDataManager();
    testConfig = {
      mode: TestMode.PRODUCTION,
      tags: ['@production'],
      retries: 3,
      timeout: 30000,
      productionConfig: {
        testDataPrefix: 'looneyTunesTest',
        locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
        customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig'],
        cleanupPolicy: 'preserve'
      }
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with production mode', () => {
      expect(manager.getSupportedMode()).toBe(TestMode.PRODUCTION);
    });
    
    it('should have predefined Looney Tunes characters', () => {
      const characters = manager.getAvailableCharacters();
      
      expect(characters).toContain('Bugs Bunny');
      expect(characters).toContain('Daffy Duck');
      expect(characters).toContain('Porky Pig');
      expect(characters).toContain('Tweety Bird');
      expect(characters.length).toBeGreaterThan(5);
    });
    
    it('should have default locations', () => {
      const locations = manager.getSupportedLocations();
      
      expect(locations).toEqual(['Cedar Falls', 'Winfield', "O'Fallon"]);
    });
  });
  
  describe('Context Setup', () => {
    it('should setup context successfully with valid config', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      expect(context).toBeDefined();
      expect(context.mode).toBe(TestMode.PRODUCTION);
      expect(context.testData).toBeDefined();
      expect(context.connectionInfo.isTestConnection).toBe(false);
      expect(context.metadata.testRunId).toMatch(/^test-\d+-[a-z0-9]+$/);
    });
    
    it('should throw error without production config', async () => {
      const configWithoutProd = { ...testConfig };
      delete configWithoutProd.productionConfig;
      
      await expect(
        manager.setupContext(TestMode.PRODUCTION, configWithoutProd)
      ).rejects.toThrow('Production configuration is required for production testing mode');
    });
    
    it('should reject isolated mode', async () => {
      await expect(
        manager.setupContext(TestMode.ISOLATED, testConfig)
      ).rejects.toThrow('Context manager for production cannot handle isolated mode');
    });
    
    it('should accept dual mode', async () => {
      const context = await manager.setupContext(TestMode.DUAL, testConfig);
      expect(context.mode).toBe(TestMode.DUAL);
    });
  });
  
  describe('Test Data Creation', () => {
    it('should create test customers with looneyTunesTest naming', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      expect(context.testData.customers).toHaveLength(4);
      
      context.testData.customers.forEach(customer => {
        expect(customer.name).toContain('looneyTunesTest');
        expect(customer.email).toContain('looneyTunesTest.com');
        expect(customer.phone).toMatch(/^555-\d{4}$/);
        expect(customer.isTestData).toBe(true);
      });
      
      // Check specific characters
      const customerNames = context.testData.customers.map(c => c.name);
      expect(customerNames.some(name => name.includes('Bugs Bunny'))).toBe(true);
      expect(customerNames.some(name => name.includes('Daffy Duck'))).toBe(true);
    });
    
    it('should create test routes for specified locations', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      expect(context.testData.routes).toHaveLength(3);
      
      const locations = context.testData.routes.map(r => r.location);
      expect(locations).toContain('Cedar Falls');
      expect(locations).toContain('Winfield');
      expect(locations).toContain("O'Fallon");
      
      context.testData.routes.forEach(route => {
        expect(route.name).toContain('looneyTunesTest');
        expect(route.isTestData).toBe(true);
      });
    });
    
    it('should create test tickets linking customers and routes', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      expect(context.testData.tickets).toHaveLength(3); // min(customers, routes)
      
      context.testData.tickets.forEach(ticket => {
        expect(ticket.customerId).toMatch(/^lt-cust-\d+-\d+$/);
        expect(ticket.routeId).toMatch(/^lt-route-\d+-\d+$/);
        expect(ticket.status).toBe('active');
        expect(ticket.isTestData).toBe(true);
      });
    });
  });
  
  describe('Context Validation', () => {
    it('should validate correct production context', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(true);
    });
    
    it('should reject context with wrong mode', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      context.mode = TestMode.ISOLATED;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should reject context with invalid naming convention', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Remove looneyTunesTest from customer names
      context.testData.customers[0].name = 'Invalid Customer';
      context.testData.customers[0].email = 'invalid@example.com';
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should reject context with non-test data', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Mark data as non-test data
      context.testData.customers[0].isTestData = false;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
    
    it('should handle validation errors gracefully', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Make context invalid
      delete (context as any).testData;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const isValid = await manager.validateContext(context);
      
      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Production context validation failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Context Cleanup', () => {
    it('should cleanup context with preserve policy', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await expect(manager.cleanupContext(context)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Preserving test data for future use');
      
      consoleSpy.mockRestore();
    });
    
    it('should handle cleanup errors', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate error by making testData invalid
      delete (context as any).testData;
      
      await expect(manager.cleanupContext(context)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Active Test Data Management', () => {
    it('should track active test data', async () => {
      const context1 = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      const context2 = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      const activeData = manager.getActiveTestData();
      expect(activeData).toHaveLength(2);
      expect(activeData).toContain(context1.testData);
      expect(activeData).toContain(context2.testData);
    });
    
    it('should remove test data after cleanup', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      expect(manager.getActiveTestData()).toHaveLength(1);
      
      await manager.cleanupContext(context);
      
      expect(manager.getActiveTestData()).toHaveLength(0);
    });
  });
  
  describe('Test Customer Creation', () => {
    it('should create individual test customer using LooneyTunesDataProvider', async () => {
      const customer = await manager.createTestCustomer('Tweety Bird', 'Cedar Falls');
      
      expect(customer.name).toBe('Tweety Bird - looneyTunesTest');
      expect(customer.email).toBe('tweety.bird@looneyTunesTest.com');
      expect(customer.phone).toMatch(/^555-\d{4}$/);
      expect(customer.isTestData).toBe(true);
      expect(customer.id).toMatch(/^lt-cust-\d+-\d+$/);
    });
    
    it('should handle special characters in names', async () => {
      const customer = await manager.createTestCustomer("Pepe Le Pew", 'Winfield');
      
      expect(customer.name).toBe("Pepe Le Pew - looneyTunesTest");
      expect(customer.email).toBe('pepe.le.pew@looneyTunesTest.com');
      expect(customer.isTestData).toBe(true);
    });
  });

  describe('Test Route Creation', () => {
    it('should create individual test route using LooneyTunesDataProvider', async () => {
      const route = await manager.createTestRoute('Cedar Falls', 'Express Route');
      
      expect(route.name).toBe('Express Route - looneyTunesTest');
      expect(route.location).toBe('Cedar Falls');
      expect(route.isTestData).toBe(true);
      expect(route.id).toMatch(/^lt-route-\d+-\d+$/);
    });
    
    it('should create route with default name when not specified', async () => {
      const route = await manager.createTestRoute('Winfield');
      
      expect(route.name).toBe('Winfield Test Route - looneyTunesTest');
      expect(route.location).toBe('Winfield');
      expect(route.isTestData).toBe(true);
    });
  });

  describe('Test Ticket Creation', () => {
    it('should create individual test ticket using LooneyTunesDataProvider', async () => {
      const ticket = await manager.createTestTicket('customer-123', 'route-456');
      
      expect(ticket.customerId).toBe('customer-123');
      expect(ticket.routeId).toBe('route-456');
      expect(ticket.status).toBe('active');
      expect(ticket.isTestData).toBe(true);
      expect(ticket.id).toMatch(/^lt-ticket-\d+-\d+$/);
    });
  });

  describe('LooneyTunesDataProvider Integration', () => {
    it('should provide access to LooneyTunesDataProvider', () => {
      const provider = manager.getLooneyTunesProvider();
      
      expect(provider).toBeDefined();
      expect(provider.getAvailableCharacters()).toContain('Bugs Bunny');
      expect(provider.getSupportedLocations()).toEqual(['Cedar Falls', 'Winfield', "O'Fallon"]);
    });
    
    it('should use LooneyTunesDataProvider for test data creation', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Verify that test data follows LooneyTunesDataProvider patterns
      context.testData.customers.forEach(customer => {
        expect(customer.id).toMatch(/^lt-cust-\d+-\d+$/);
        expect(customer.name).toContain('looneyTunesTest');
        expect(customer.isTestData).toBe(true);
      });
      
      context.testData.routes.forEach(route => {
        expect(route.id).toMatch(/^lt-route-\d+-\d+$/);
        expect(route.name).toContain('looneyTunesTest');
        expect(route.isTestData).toBe(true);
      });
      
      context.testData.tickets.forEach(ticket => {
        expect(ticket.id).toMatch(/^lt-ticket-\d+-\d+$/);
        expect(ticket.isTestData).toBe(true);
      });
    });
    
    it('should use LooneyTunesDataProvider for validation', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Create invalid test data that doesn't follow naming convention
      context.testData.customers[0].name = 'Invalid Customer';
      context.testData.customers[0].isTestData = false;
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Data Accessibility Verification', () => {
    it('should verify test data accessibility', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // This calls the private method through validateContext
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(true);
    });
    
    it('should handle accessibility verification errors', async () => {
      const context = await manager.setupContext(TestMode.PRODUCTION, testConfig);
      
      // Remove all customers to simulate accessibility failure
      context.testData.customers = [];
      
      const isValid = await manager.validateContext(context);
      expect(isValid).toBe(false);
    });
  });
});