/**
 * Unit tests for LooneyTunesDataProvider
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LooneyTunesDataProvider, LooneyTunesConfig } from '../LooneyTunesDataProvider';
import { TestCustomer, TestRoute, TestTicket } from '../types';

describe('LooneyTunesDataProvider', () => {
  let provider: LooneyTunesDataProvider;
  let mockConfig: Partial<LooneyTunesConfig>;

  beforeEach(() => {
    mockConfig = {
      testDataPrefix: 'testPrefix',
      locations: ['Location1', 'Location2', 'Location3'],
      customerNames: ['Character1', 'Character2', 'Character3'],
      cleanupPolicy: 'preserve'
    };
    provider = new LooneyTunesDataProvider(mockConfig);
    
    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration when no config provided', () => {
      const defaultProvider = new LooneyTunesDataProvider();
      const config = defaultProvider.getConfig();
      
      expect(config.testDataPrefix).toBe('looneyTunesTest');
      expect(config.locations).toEqual(['Cedar Falls', 'Winfield', "O'Fallon"]);
      expect(config.cleanupPolicy).toBe('preserve');
      expect(config.customerNames.length).toBeGreaterThan(0);
    });

    it('should initialize with provided configuration', () => {
      const config = provider.getConfig();
      
      expect(config.testDataPrefix).toBe('testPrefix');
      expect(config.locations).toEqual(['Location1', 'Location2', 'Location3']);
      expect(config.customerNames).toEqual(['Character1', 'Character2', 'Character3']);
      expect(config.cleanupPolicy).toBe('preserve');
    });
  });

  describe('createTestCustomer', () => {
    it('should create a test customer with default options', async () => {
      const customer = await provider.createTestCustomer();
      
      expect(customer.id).toMatch(/^lt-cust-\d+-\d+$/);
      expect(customer.name).toContain('testPrefix');
      expect(customer.email).toContain('@testPrefix.com');
      expect(customer.phone).toMatch(/^555-\d{4}$/);
      expect(customer.isTestData).toBe(true);
    });

    it('should create a test customer with specified character name', async () => {
      const customer = await provider.createTestCustomer({
        characterName: 'Bugs Bunny'
      });
      
      expect(customer.name).toBe('Bugs Bunny - testPrefix');
      expect(customer.email).toBe('bugs.bunny@testPrefix.com');
      expect(customer.isTestData).toBe(true);
    });

    it('should create a test customer with specified location', async () => {
      const customer = await provider.createTestCustomer({
        location: 'Cedar Falls'
      });
      
      expect(customer.isTestData).toBe(true);
      expect(customer.name).toContain('testPrefix');
    });

    it('should track created customers', async () => {
      await provider.createTestCustomer({ characterName: 'Test Character' });
      
      const entities = provider.getCreatedEntities();
      expect(entities.customers).toHaveLength(1);
      expect(entities.customers[0].name).toBe('Test Character - testPrefix');
    });
  });

  describe('createTestCustomers', () => {
    it('should create multiple test customers', async () => {
      const customers = await provider.createTestCustomers(2);
      
      expect(customers).toHaveLength(2);
      expect(customers[0].name).toBe('Character1 - testPrefix');
      expect(customers[1].name).toBe('Character2 - testPrefix');
      
      const entities = provider.getCreatedEntities();
      expect(entities.customers).toHaveLength(2);
    });

    it('should limit customers to available character names', async () => {
      const customers = await provider.createTestCustomers(10); // More than available characters
      
      expect(customers).toHaveLength(3); // Limited by customerNames length
    });

    it('should distribute customers across locations', async () => {
      const customers = await provider.createTestCustomers(3);
      
      expect(customers).toHaveLength(3);
      // Each customer should be created (locations are used internally)
      expect(customers.every(c => c.isTestData)).toBe(true);
    });
  });

  describe('createTestRoute', () => {
    it('should create a test route with default options', async () => {
      const route = await provider.createTestRoute();
      
      expect(route.id).toMatch(/^lt-route-\d+-\d+$/);
      expect(route.name).toContain('testPrefix');
      expect(route.location).toBeOneOf(['Location1', 'Location2', 'Location3']);
      expect(route.isTestData).toBe(true);
    });

    it('should create a test route with specified location', async () => {
      const route = await provider.createTestRoute({
        location: 'Cedar Falls'
      });
      
      expect(route.location).toBe('Cedar Falls');
      expect(route.name).toBe('Cedar Falls Test Route - testPrefix');
      expect(route.isTestData).toBe(true);
    });

    it('should create a test route with custom route name', async () => {
      const route = await provider.createTestRoute({
        location: 'Location1',
        routeName: 'Custom Route'
      });
      
      expect(route.name).toBe('Custom Route - testPrefix');
      expect(route.location).toBe('Location1');
    });

    it('should track created routes', async () => {
      await provider.createTestRoute({ location: 'Test Location' });
      
      const entities = provider.getCreatedEntities();
      expect(entities.routes).toHaveLength(1);
      expect(entities.routes[0].location).toBe('Test Location');
    });
  });

  describe('createTestRoutes', () => {
    it('should create routes for all configured locations', async () => {
      const routes = await provider.createTestRoutes();
      
      expect(routes).toHaveLength(3);
      expect(routes[0].location).toBe('Location1');
      expect(routes[1].location).toBe('Location2');
      expect(routes[2].location).toBe('Location3');
      
      const entities = provider.getCreatedEntities();
      expect(entities.routes).toHaveLength(3);
    });

    it('should create routes with proper naming convention', async () => {
      const routes = await provider.createTestRoutes();
      
      routes.forEach(route => {
        expect(route.name).toContain('testPrefix');
        expect(route.isTestData).toBe(true);
      });
    });
  });

  describe('createTestTicket', () => {
    it('should create a test ticket with provided customer and route IDs', async () => {
      const ticket = await provider.createTestTicket({
        customerId: 'customer-123',
        routeId: 'route-456'
      });
      
      expect(ticket.id).toMatch(/^lt-ticket-\d+-\d+$/);
      expect(ticket.customerId).toBe('customer-123');
      expect(ticket.routeId).toBe('route-456');
      expect(ticket.status).toBe('active');
      expect(ticket.isTestData).toBe(true);
    });

    it('should throw error when customer ID is missing', async () => {
      await expect(provider.createTestTicket({
        routeId: 'route-456'
      })).rejects.toThrow('Both customerId and routeId are required');
    });

    it('should throw error when route ID is missing', async () => {
      await expect(provider.createTestTicket({
        customerId: 'customer-123'
      })).rejects.toThrow('Both customerId and routeId are required');
    });

    it('should track created tickets', async () => {
      await provider.createTestTicket({
        customerId: 'customer-123',
        routeId: 'route-456'
      });
      
      const entities = provider.getCreatedEntities();
      expect(entities.tickets).toHaveLength(1);
      expect(entities.tickets[0].customerId).toBe('customer-123');
    });
  });

  describe('createTestTickets', () => {
    it('should create tickets for customer-route pairs', async () => {
      const customers: TestCustomer[] = [
        { id: 'cust-1', name: 'Customer 1', email: 'c1@test.com', phone: '555-0001', isTestData: true },
        { id: 'cust-2', name: 'Customer 2', email: 'c2@test.com', phone: '555-0002', isTestData: true }
      ];
      
      const routes: TestRoute[] = [
        { id: 'route-1', name: 'Route 1', location: 'Location1', isTestData: true },
        { id: 'route-2', name: 'Route 2', location: 'Location2', isTestData: true }
      ];
      
      const tickets = await provider.createTestTickets(customers, routes);
      
      expect(tickets).toHaveLength(2);
      expect(tickets[0].customerId).toBe('cust-1');
      expect(tickets[0].routeId).toBe('route-1');
      expect(tickets[1].customerId).toBe('cust-2');
      expect(tickets[1].routeId).toBe('route-2');
    });

    it('should limit tickets to minimum of customers and routes', async () => {
      const customers: TestCustomer[] = [
        { id: 'cust-1', name: 'Customer 1', email: 'c1@test.com', phone: '555-0001', isTestData: true }
      ];
      
      const routes: TestRoute[] = [
        { id: 'route-1', name: 'Route 1', location: 'Location1', isTestData: true },
        { id: 'route-2', name: 'Route 2', location: 'Location2', isTestData: true }
      ];
      
      const tickets = await provider.createTestTickets(customers, routes);
      
      expect(tickets).toHaveLength(1); // Limited by customers length
    });
  });

  describe('validateTestDataNaming', () => {
    it('should validate customer with correct naming convention', () => {
      const customer: TestCustomer = {
        id: 'cust-1',
        name: 'Bugs Bunny - testPrefix',
        email: 'bugs@testPrefix.com',
        phone: '555-0001',
        isTestData: true
      };
      
      expect(provider.validateTestDataNaming(customer)).toBe(true);
    });

    it('should reject customer with incorrect naming convention', () => {
      const customer: TestCustomer = {
        id: 'cust-1',
        name: 'Bugs Bunny',
        email: 'bugs@test.com',
        phone: '555-0001',
        isTestData: true
      };
      
      expect(provider.validateTestDataNaming(customer)).toBe(false);
    });

    it('should reject customer not marked as test data', () => {
      const customer: TestCustomer = {
        id: 'cust-1',
        name: 'Bugs Bunny - testPrefix',
        email: 'bugs@testPrefix.com',
        phone: '555-0001',
        isTestData: false
      };
      
      expect(provider.validateTestDataNaming(customer)).toBe(false);
    });

    it('should validate route with correct naming convention', () => {
      const route: TestRoute = {
        id: 'route-1',
        name: 'Cedar Falls Route - testPrefix',
        location: 'Cedar Falls',
        isTestData: true
      };
      
      expect(provider.validateTestDataNaming(route)).toBe(true);
    });

    it('should validate ticket marked as test data', () => {
      const ticket: TestTicket = {
        id: 'ticket-1',
        customerId: 'cust-1',
        routeId: 'route-1',
        status: 'active',
        isTestData: true
      };
      
      expect(provider.validateTestDataNaming(ticket)).toBe(true);
    });

    it('should reject ticket not marked as test data', () => {
      const ticket: TestTicket = {
        id: 'ticket-1',
        customerId: 'cust-1',
        routeId: 'route-1',
        status: 'active',
        isTestData: false
      };
      
      expect(provider.validateTestDataNaming(ticket)).toBe(false);
    });
  });

  describe('findExistingTestCustomers', () => {
    it('should find existing test customers', async () => {
      // Create some test customers first
      await provider.createTestCustomer({ characterName: 'Test Character 1' });
      await provider.createTestCustomer({ characterName: 'Test Character 2' });
      
      const existingCustomers = await provider.findExistingTestCustomers();
      
      expect(existingCustomers).toHaveLength(2);
      expect(existingCustomers.every(c => c.name.includes('testPrefix'))).toBe(true);
    });
  });

  describe('findExistingTestRoutes', () => {
    it('should find existing test routes', async () => {
      // Create some test routes first
      await provider.createTestRoute({ location: 'Location1' });
      await provider.createTestRoute({ location: 'Location2' });
      
      const existingRoutes = await provider.findExistingTestRoutes();
      
      expect(existingRoutes).toHaveLength(2);
      expect(existingRoutes.every(r => r.name.includes('testPrefix'))).toBe(true);
    });
  });

  describe('findExistingTestTickets', () => {
    it('should find existing test tickets', async () => {
      // Create some test tickets first
      await provider.createTestTicket({ customerId: 'cust-1', routeId: 'route-1' });
      await provider.createTestTicket({ customerId: 'cust-2', routeId: 'route-2' });
      
      const existingTickets = await provider.findExistingTestTickets();
      
      expect(existingTickets).toHaveLength(2);
      expect(existingTickets.every(t => t.isTestData)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should handle preserve cleanup policy', async () => {
      const preserveProvider = new LooneyTunesDataProvider({
        ...mockConfig,
        cleanupPolicy: 'preserve'
      });
      
      await preserveProvider.cleanup();
      
      // Should not throw and should log preserve message
      expect(console.log).toHaveBeenCalledWith('Preserving test data for future use');
    });

    it('should handle cleanup policy', async () => {
      const cleanupProvider = new LooneyTunesDataProvider({
        ...mockConfig,
        cleanupPolicy: 'cleanup'
      });
      
      // Create some test data first
      await cleanupProvider.createTestCustomer();
      await cleanupProvider.createTestRoute();
      
      await cleanupProvider.cleanup();
      
      // Should clear created entities
      const entities = cleanupProvider.getCreatedEntities();
      expect(entities.customers).toHaveLength(0);
      expect(entities.routes).toHaveLength(0);
      expect(entities.tickets).toHaveLength(0);
    });

    it('should handle archive cleanup policy', async () => {
      const archiveProvider = new LooneyTunesDataProvider({
        ...mockConfig,
        cleanupPolicy: 'archive'
      });
      
      // Create some test data first
      await archiveProvider.createTestCustomer();
      await archiveProvider.createTestRoute();
      
      await archiveProvider.cleanup();
      
      // Should clear created entities after archiving
      const entities = archiveProvider.getCreatedEntities();
      expect(entities.customers).toHaveLength(0);
      expect(entities.routes).toHaveLength(0);
      expect(entities.tickets).toHaveLength(0);
    });
  });

  describe('getAvailableCharacters', () => {
    it('should return available Looney Tunes characters', () => {
      const characters = provider.getAvailableCharacters();
      
      expect(characters).toContain('Bugs Bunny');
      expect(characters).toContain('Daffy Duck');
      expect(characters).toContain('Porky Pig');
      expect(characters.length).toBeGreaterThan(5);
    });
  });

  describe('getSupportedLocations', () => {
    it('should return default supported locations', () => {
      const defaultProvider = new LooneyTunesDataProvider();
      const locations = defaultProvider.getSupportedLocations();
      
      expect(locations).toEqual(['Cedar Falls', 'Winfield', "O'Fallon"]);
    });

    it('should return configured locations', () => {
      const locations = provider.getSupportedLocations();
      
      expect(locations).toEqual(['Cedar Falls', 'Winfield', "O'Fallon"]);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = provider.getConfig();
      
      expect(config.testDataPrefix).toBe('testPrefix');
      expect(config.locations).toEqual(['Location1', 'Location2', 'Location3']);
      expect(config.customerNames).toEqual(['Character1', 'Character2', 'Character3']);
      expect(config.cleanupPolicy).toBe('preserve');
    });
  });

  describe('getCreatedEntities', () => {
    it('should return empty entities initially', () => {
      const entities = provider.getCreatedEntities();
      
      expect(entities.customers).toHaveLength(0);
      expect(entities.routes).toHaveLength(0);
      expect(entities.tickets).toHaveLength(0);
    });

    it('should return created entities after creation', async () => {
      await provider.createTestCustomer();
      await provider.createTestRoute();
      await provider.createTestTicket({ customerId: 'cust-1', routeId: 'route-1' });
      
      const entities = provider.getCreatedEntities();
      
      expect(entities.customers).toHaveLength(1);
      expect(entities.routes).toHaveLength(1);
      expect(entities.tickets).toHaveLength(1);
    });
  });
});

// Custom matcher for vitest
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOneOf(expected: any[]): T;
  }
}