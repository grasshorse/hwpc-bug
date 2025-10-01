/**
 * LooneyTunesDataProvider
 * 
 * Specialized provider for managing production test entities using Looney Tunes naming convention
 * Handles test customer creation, route management, and ticket utilities for production testing
 */

import { TestCustomer, TestRoute, TestTicket, ProductionConfig } from './types';

export interface LooneyTunesConfig {
  testDataPrefix: string;
  locations: string[];
  customerNames: string[];
  cleanupPolicy: 'preserve' | 'cleanup' | 'archive';
}

export interface TestEntityCreationOptions {
  location?: string;
  characterName?: string;
  routeName?: string;
  customerId?: string;
  routeId?: string;
}

/**
 * Provider for managing Looney Tunes test data in production environment
 */
export class LooneyTunesDataProvider {
  private readonly LOONEY_TUNES_CHARACTERS = [
    'Bugs Bunny',
    'Daffy Duck',
    'Porky Pig',
    'Tweety Bird',
    'Sylvester Cat',
    'Pepe Le Pew',
    'Marvin Martian',
    'Foghorn Leghorn',
    'Speedy Gonzales',
    'Yosemite Sam',
    'Elmer Fudd',
    'Lola Bunny'
  ];

  private readonly DEFAULT_LOCATIONS = ['Cedar Falls', 'Winfield', "O'Fallon"];
  private readonly TEST_DATA_PREFIX = 'looneyTunesTest';

  private config: LooneyTunesConfig;
  private createdEntities: {
    customers: TestCustomer[];
    routes: TestRoute[];
    tickets: TestTicket[];
  } = {
    customers: [],
    routes: [],
    tickets: []
  };

  constructor(config?: Partial<LooneyTunesConfig>) {
    this.config = {
      testDataPrefix: config?.testDataPrefix || this.TEST_DATA_PREFIX,
      locations: config?.locations || this.DEFAULT_LOCATIONS,
      customerNames: config?.customerNames || this.LOONEY_TUNES_CHARACTERS,
      cleanupPolicy: config?.cleanupPolicy || 'preserve'
    };
  }

  /**
   * Creates a test customer with Looney Tunes naming convention
   */
  async createTestCustomer(options: TestEntityCreationOptions = {}): Promise<TestCustomer> {
    const characterName = options.characterName || this.getRandomCharacter();
    const location = options.location || this.getRandomLocation();
    
    const customer: TestCustomer = {
      id: this.generateCustomerId(),
      name: `${characterName} - ${this.config.testDataPrefix}`,
      email: this.generateTestEmail(characterName),
      phone: this.generateTestPhone(),
      isTestData: true
    };

    // In real implementation, this would create the customer in production database
    await this.persistCustomer(customer);
    
    this.createdEntities.customers.push(customer);
    console.log(`Created test customer: ${customer.name} (${customer.email})`);
    
    return customer;
  }

  /**
   * Creates multiple test customers for the specified locations
   */
  async createTestCustomers(count: number = 3): Promise<TestCustomer[]> {
    const customers: TestCustomer[] = [];
    
    for (let i = 0; i < count && i < this.config.customerNames.length; i++) {
      const customer = await this.createTestCustomer({
        characterName: this.config.customerNames[i],
        location: this.config.locations[i % this.config.locations.length]
      });
      customers.push(customer);
    }
    
    return customers;
  }

  /**
   * Creates a test route for specified location
   */
  async createTestRoute(options: TestEntityCreationOptions = {}): Promise<TestRoute> {
    const location = options.location || this.getRandomLocation();
    const routeName = options.routeName || `${location} Test Route`;
    
    const route: TestRoute = {
      id: this.generateRouteId(),
      name: `${routeName} - ${this.config.testDataPrefix}`,
      location,
      isTestData: true
    };

    // In real implementation, this would create the route in production database
    await this.persistRoute(route);
    
    this.createdEntities.routes.push(route);
    console.log(`Created test route: ${route.name} in ${route.location}`);
    
    return route;
  }

  /**
   * Creates test routes for all configured locations
   */
  async createTestRoutes(): Promise<TestRoute[]> {
    const routes: TestRoute[] = [];
    
    for (const location of this.config.locations) {
      const route = await this.createTestRoute({ location });
      routes.push(route);
    }
    
    return routes;
  }

  /**
   * Creates a test ticket linking customer and route
   */
  async createTestTicket(options: TestEntityCreationOptions = {}): Promise<TestTicket> {
    if (!options.customerId || !options.routeId) {
      throw new Error('Both customerId and routeId are required to create a test ticket');
    }

    const ticket: TestTicket = {
      id: this.generateTicketId(),
      customerId: options.customerId,
      routeId: options.routeId,
      status: 'active',
      isTestData: true
    };

    // In real implementation, this would create the ticket in production database
    await this.persistTicket(ticket);
    
    this.createdEntities.tickets.push(ticket);
    console.log(`Created test ticket: ${ticket.id} for customer ${ticket.customerId} on route ${ticket.routeId}`);
    
    return ticket;
  }

  /**
   * Creates test tickets for customer-route pairs
   */
  async createTestTickets(customers: TestCustomer[], routes: TestRoute[]): Promise<TestTicket[]> {
    const tickets: TestTicket[] = [];
    const maxTickets = Math.min(customers.length, routes.length);
    
    for (let i = 0; i < maxTickets; i++) {
      const ticket = await this.createTestTicket({
        customerId: customers[i].id,
        routeId: routes[i].id
      });
      tickets.push(ticket);
    }
    
    return tickets;
  }

  /**
   * Validates that an entity follows Looney Tunes test data naming convention
   */
  validateTestDataNaming(entity: TestCustomer | TestRoute | TestTicket): boolean {
    if ('name' in entity) {
      // Customer or Route
      return entity.isTestData && entity.name.includes(this.config.testDataPrefix);
    } else {
      // Ticket
      return entity.isTestData;
    }
  }

  /**
   * Gets all created test entities
   */
  getCreatedEntities() {
    return {
      customers: [...this.createdEntities.customers],
      routes: [...this.createdEntities.routes],
      tickets: [...this.createdEntities.tickets]
    };
  }

  /**
   * Finds existing test customers in production
   */
  async findExistingTestCustomers(): Promise<TestCustomer[]> {
    // In real implementation, this would query production database
    // for customers with looneyTunesTest naming pattern
    console.log('Searching for existing test customers in production...');
    
    // Mock implementation - would return actual database results
    return this.createdEntities.customers.filter(customer => 
      customer.name.includes(this.config.testDataPrefix)
    );
  }

  /**
   * Finds existing test routes in production
   */
  async findExistingTestRoutes(): Promise<TestRoute[]> {
    // In real implementation, this would query production database
    // for routes with looneyTunesTest naming pattern
    console.log('Searching for existing test routes in production...');
    
    // Mock implementation - would return actual database results
    return this.createdEntities.routes.filter(route => 
      route.name.includes(this.config.testDataPrefix)
    );
  }

  /**
   * Finds existing test tickets in production
   */
  async findExistingTestTickets(): Promise<TestTicket[]> {
    // In real implementation, this would query production database
    // for tickets marked as test data
    console.log('Searching for existing test tickets in production...');
    
    // Mock implementation - would return actual database results
    return this.createdEntities.tickets.filter(ticket => ticket.isTestData);
  }

  /**
   * Cleans up test data based on cleanup policy
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up test data with policy: ${this.config.cleanupPolicy}`);
    
    switch (this.config.cleanupPolicy) {
      case 'cleanup':
        await this.deleteAllTestData();
        break;
      case 'archive':
        await this.archiveAllTestData();
        break;
      case 'preserve':
      default:
        console.log('Preserving test data for future use');
        break;
    }
  }

  /**
   * Gets available Looney Tunes characters
   */
  getAvailableCharacters(): string[] {
    return [...this.LOONEY_TUNES_CHARACTERS];
  }

  /**
   * Gets supported test locations
   */
  getSupportedLocations(): string[] {
    return [...this.DEFAULT_LOCATIONS];
  }

  /**
   * Gets current configuration
   */
  getConfig(): LooneyTunesConfig {
    return { ...this.config };
  }

  // Private helper methods

  private getRandomCharacter(): string {
    const availableCharacters = this.config.customerNames.filter(name => 
      !this.createdEntities.customers.some(customer => customer.name.includes(name))
    );
    
    if (availableCharacters.length === 0) {
      return this.config.customerNames[Math.floor(Math.random() * this.config.customerNames.length)];
    }
    
    return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
  }

  private getRandomLocation(): string {
    return this.config.locations[Math.floor(Math.random() * this.config.locations.length)];
  }

  private generateCustomerId(): string {
    return `lt-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private generateRouteId(): string {
    return `lt-route-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private generateTicketId(): string {
    return `lt-ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private generateTestEmail(characterName: string): string {
    const emailName = characterName.toLowerCase().replace(/\s+/g, '.');
    return `${emailName}@${this.config.testDataPrefix}.com`;
  }

  private generateTestPhone(): string {
    return `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }

  private async persistCustomer(customer: TestCustomer): Promise<void> {
    // In real implementation, this would make API call or database insert
    // to create the customer in production
    console.log(`Persisting customer to production: ${customer.name}`);
  }

  private async persistRoute(route: TestRoute): Promise<void> {
    // In real implementation, this would make API call or database insert
    // to create the route in production
    console.log(`Persisting route to production: ${route.name}`);
  }

  private async persistTicket(ticket: TestTicket): Promise<void> {
    // In real implementation, this would make API call or database insert
    // to create the ticket in production
    console.log(`Persisting ticket to production: ${ticket.id}`);
  }

  private async deleteAllTestData(): Promise<void> {
    // In real implementation, this would delete all test entities from production
    // IMPORTANT: Only delete entities marked as isTestData: true
    console.log('Deleting all test data from production');
    
    for (const ticket of this.createdEntities.tickets) {
      console.log(`Deleting test ticket: ${ticket.id}`);
    }
    
    for (const customer of this.createdEntities.customers) {
      console.log(`Deleting test customer: ${customer.name}`);
    }
    
    for (const route of this.createdEntities.routes) {
      console.log(`Deleting test route: ${route.name}`);
    }
    
    // Clear local tracking
    this.createdEntities = { customers: [], routes: [], tickets: [] };
  }

  private async archiveAllTestData(): Promise<void> {
    // In real implementation, this would move test entities to archive tables
    console.log('Archiving all test data');
    
    // Clear local tracking after archiving
    this.createdEntities = { customers: [], routes: [], tickets: [] };
  }
}