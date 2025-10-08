/**
 * Enhanced Data Context Manager Implementation
 * 
 * Provides comprehensive data context management with mode-specific data resolution,
 * validation, and context-aware entity creation.
 */

import { TestMode, TestConfig, DataContext, TestCustomer, TestRoute, TestTicket } from './types';
import { 
  EnhancedDataContextManager, 
  ContextAwareDataProvider, 
  EntityType, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  CreatedEntity, 
  TestEntity, 
  DataResolutionOptions 
} from './interfaces/DataContextManager';
import { DataContextFactory } from './DataContextFactory';
import { BaseDataContextManager } from './DataContextManager';
import Log from '../logger/Log';

/**
 * Enhanced implementation of data context manager with context-aware capabilities
 */
export class EnhancedDataContextManagerImpl extends BaseDataContextManager implements EnhancedDataContextManager {
  private dataProvider: ContextAwareDataProvider;
  private createdEntities: CreatedEntity[] = [];
  private currentContext: DataContext | null = null;

  constructor(mode: TestMode, dataProvider?: ContextAwareDataProvider) {
    super(mode);
    this.dataProvider = dataProvider || new DefaultContextAwareDataProvider(mode);
  }

  /**
   * Sets up the data context using the base manager and enhances it with context-aware capabilities
   */
  async setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext> {
    this.validateMode(mode);
    
    try {
      // Use the existing factory to get the base context
      const baseManager = DataContextFactory.getManager(mode);
      const context = await baseManager.setupContext(mode, testConfig);
      
      // Enhance the context with our capabilities
      this.currentContext = context;
      this.dataProvider = new DefaultContextAwareDataProvider(mode, context);
      
      Log.info(`Enhanced data context setup completed for ${mode} mode`);
      return context;
    } catch (error) {
      Log.error(`Failed to setup enhanced data context for ${mode} mode: ${error.message}`);
      throw new Error(`Enhanced context setup failed: ${error.message}`);
    }
  }

  /**
   * Validates the context and ensures data integrity
   */
  async validateContext(context: DataContext): Promise<boolean> {
    try {
      // Basic validation using base manager
      const baseManager = DataContextFactory.getManager(context.mode);
      const isBaseValid = await baseManager.validateContext(context);
      
      if (!isBaseValid) {
        return false;
      }

      // Enhanced validation for data integrity
      const validationResult = await this.validateTestDataIntegrity(context);
      
      if (!validationResult.isValid) {
        Log.error(`Context validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        return false;
      }

      Log.info(`Enhanced context validation passed for ${context.mode} mode`);
      return true;
    } catch (error) {
      Log.error(`Context validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Resolves a customer ID based on the current test mode and context
   */
  async resolveCustomerId(baseName?: string, context?: DataContext): Promise<string> {
    const activeContext = context || this.currentContext;
    
    if (!activeContext) {
      throw new Error('No active data context available for customer ID resolution');
    }

    try {
      const customerId = await this.dataProvider.getCustomerId(baseName);
      
      // Validate that the customer exists
      const validationResult = await this.validateEntityExists(EntityType.CUSTOMER, customerId, activeContext);
      
      if (!validationResult.isValid) {
        const suggestions = validationResult.suggestions.join(', ');
        throw new Error(`Customer ID '${customerId}' not found in ${activeContext.mode} mode. Suggestions: ${suggestions}`);
      }

      Log.info(`Resolved customer ID: ${customerId} for ${activeContext.mode} mode`);
      return customerId;
    } catch (error) {
      Log.error(`Failed to resolve customer ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolves a ticket ID based on the current test mode and context
   */
  async resolveTicketId(baseName?: string, context?: DataContext): Promise<string> {
    const activeContext = context || this.currentContext;
    
    if (!activeContext) {
      throw new Error('No active data context available for ticket ID resolution');
    }

    try {
      const ticketId = await this.dataProvider.getTicketId(baseName);
      
      // Validate that the ticket exists
      const validationResult = await this.validateEntityExists(EntityType.TICKET, ticketId, activeContext);
      
      if (!validationResult.isValid) {
        const suggestions = validationResult.suggestions.join(', ');
        throw new Error(`Ticket ID '${ticketId}' not found in ${activeContext.mode} mode. Suggestions: ${suggestions}`);
      }

      Log.info(`Resolved ticket ID: ${ticketId} for ${activeContext.mode} mode`);
      return ticketId;
    } catch (error) {
      Log.error(`Failed to resolve ticket ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolves a route ID based on the current test mode and context
   */
  async resolveRouteId(baseName?: string, context?: DataContext): Promise<string> {
    const activeContext = context || this.currentContext;
    
    if (!activeContext) {
      throw new Error('No active data context available for route ID resolution');
    }

    try {
      const routeId = await this.dataProvider.getRouteId(baseName);
      
      // Validate that the route exists
      const validationResult = await this.validateEntityExists(EntityType.ROUTE, routeId, activeContext);
      
      if (!validationResult.isValid) {
        const suggestions = validationResult.suggestions.join(', ');
        throw new Error(`Route ID '${routeId}' not found in ${activeContext.mode} mode. Suggestions: ${suggestions}`);
      }

      Log.info(`Resolved route ID: ${routeId} for ${activeContext.mode} mode`);
      return routeId;
    } catch (error) {
      Log.error(`Failed to resolve route ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates that the requested entity exists in the current context
   */
  async validateEntityExists(entityType: EntityType, entityId: string, context: DataContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      let entities: any[] = [];
      
      switch (entityType) {
        case EntityType.CUSTOMER:
          entities = context.testData.customers || [];
          break;
        case EntityType.TICKET:
          entities = context.testData.tickets || [];
          break;
        case EntityType.ROUTE:
          entities = context.testData.routes || [];
          break;
        default:
          result.errors.push({
            field: 'entityType',
            message: `Unknown entity type: ${entityType}`,
            code: 'UNKNOWN_ENTITY_TYPE',
            severity: 'error'
          });
          return result;
      }

      const entity = entities.find(e => e.id === entityId);
      
      if (!entity) {
        result.errors.push({
          field: 'entityId',
          message: `${entityType} with ID '${entityId}' not found`,
          code: 'ENTITY_NOT_FOUND',
          severity: 'error'
        });
        
        // Provide suggestions for available entities
        if (entities.length > 0) {
          const availableIds = entities.slice(0, 3).map(e => e.id);
          result.suggestions.push(`Available ${entityType}s: ${availableIds.join(', ')}`);
          
          if (entities.length > 3) {
            result.suggestions.push(`And ${entities.length - 3} more ${entityType}s available`);
          }
        } else {
          result.suggestions.push(`No ${entityType}s available in ${context.mode} mode`);
          result.suggestions.push(`Consider creating test ${entityType}s or checking data setup`);
        }
        
        return result;
      }

      // Validate naming conventions for production mode
      if (context.mode === TestMode.PRODUCTION) {
        const validationWarnings = this.validateProductionNamingConvention(entity, entityType);
        result.warnings.push(...validationWarnings);
      }

      result.isValid = true;
      Log.info(`Entity validation passed: ${entityType} ${entityId} exists in ${context.mode} mode`);
      
    } catch (error) {
      result.errors.push({
        field: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_ERROR',
        severity: 'error'
      });
    }

    return result;
  }

  /**
   * Creates test data appropriate for the current mode
   */
  async createTestEntity(entityType: EntityType, properties?: any, context?: DataContext): Promise<CreatedEntity> {
    const activeContext = context || this.currentContext;
    
    if (!activeContext) {
      throw new Error('No active data context available for entity creation');
    }

    try {
      const testEntity = await this.dataProvider.generateTestEntity(entityType, properties);
      
      const createdEntity: CreatedEntity = {
        type: entityType,
        id: testEntity.id,
        data: testEntity.data,
        createdAt: new Date(),
        needsCleanup: true,
        mode: activeContext.mode
      };

      // Track created entities for cleanup
      this.createdEntities.push(createdEntity);
      
      Log.info(`Created test ${entityType}: ${testEntity.id} in ${activeContext.mode} mode`);
      return createdEntity;
    } catch (error) {
      Log.error(`Failed to create test ${entityType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhanced cleanup that includes created entities
   */
  async cleanupContext(context: DataContext): Promise<void> {
    try {
      // Clean up created entities first
      await this.cleanupCreatedEntities();
      
      // Then perform base cleanup
      await super.cleanupContext(context);
      
      // Reset state
      this.currentContext = null;
      this.createdEntities = [];
      
      Log.info(`Enhanced context cleanup completed for ${context.mode} mode`);
    } catch (error) {
      Log.error(`Enhanced context cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the data provider for external access
   */
  getDataProvider(): ContextAwareDataProvider {
    return this.dataProvider;
  }

  /**
   * Gets all created entities for tracking
   */
  getCreatedEntities(): CreatedEntity[] {
    return [...this.createdEntities];
  }

  // Private helper methods

  private async validateTestDataIntegrity(context: DataContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate customers
    if (context.testData.customers) {
      for (const customer of context.testData.customers) {
        const customerValidation = await this.dataProvider.validateTestData(customer);
        result.errors.push(...customerValidation.errors);
        result.warnings.push(...customerValidation.warnings);
      }
    }

    // Validate tickets
    if (context.testData.tickets) {
      for (const ticket of context.testData.tickets) {
        const ticketValidation = await this.dataProvider.validateTestData(ticket);
        result.errors.push(...ticketValidation.errors);
        result.warnings.push(...ticketValidation.warnings);
      }
    }

    // Validate routes
    if (context.testData.routes) {
      for (const route of context.testData.routes) {
        const routeValidation = await this.dataProvider.validateTestData(route);
        result.errors.push(...routeValidation.errors);
        result.warnings.push(...routeValidation.warnings);
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateProductionNamingConvention(entity: any, entityType: EntityType): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    if (entityType === EntityType.CUSTOMER && entity.name) {
      if (!entity.name.includes('looneyTunesTest')) {
        warnings.push({
          field: 'name',
          message: `Customer name '${entity.name}' does not follow looneyTunesTest naming convention`,
          code: 'NAMING_CONVENTION_WARNING',
          suggestion: 'Ensure production test customers include "looneyTunesTest" in their name'
        });
      }
    }

    return warnings;
  }

  private async cleanupCreatedEntities(): Promise<void> {
    for (const entity of this.createdEntities) {
      if (entity.needsCleanup) {
        try {
          // Here we would implement actual cleanup logic
          // For now, just log the cleanup action
          Log.info(`Cleaning up created ${entity.type}: ${entity.id}`);
        } catch (error) {
          Log.error(`Failed to cleanup ${entity.type} ${entity.id}: ${error.message}`);
        }
      }
    }
  }
}

/**
 * Default implementation of context-aware data provider
 */
export class DefaultContextAwareDataProvider implements ContextAwareDataProvider {
  private mode: TestMode;
  private context: DataContext | null = null;

  constructor(mode: TestMode, context?: DataContext) {
    this.mode = mode;
    this.context = context || null;
  }

  async getCustomerId(baseName?: string): Promise<string> {
    if (this.mode === TestMode.ISOLATED) {
      return baseName || 'cust-001';
    } else if (this.mode === TestMode.PRODUCTION) {
      // In production mode, find an actual looneyTunesTest customer
      if (this.context && this.context.testData.customers.length > 0) {
        const customer = this.context.testData.customers[0];
        return customer.id;
      }
      throw new Error('No looneyTunesTest customers available in production mode');
    }
    
    return baseName || 'cust-001';
  }

  async getTicketId(baseName?: string): Promise<string> {
    if (this.mode === TestMode.ISOLATED) {
      return baseName || 'ticket-001';
    } else if (this.mode === TestMode.PRODUCTION) {
      // In production mode, find an actual looneyTunesTest ticket
      if (this.context && this.context.testData.tickets.length > 0) {
        const ticket = this.context.testData.tickets[0];
        return ticket.id;
      }
      throw new Error('No looneyTunesTest tickets available in production mode');
    }
    
    return baseName || 'ticket-001';
  }

  async getRouteId(baseName?: string): Promise<string> {
    if (this.mode === TestMode.ISOLATED) {
      return baseName || 'route-001';
    } else if (this.mode === TestMode.PRODUCTION) {
      // In production mode, find an actual looneyTunesTest route
      if (this.context && this.context.testData.routes.length > 0) {
        const route = this.context.testData.routes[0];
        return route.id;
      }
      throw new Error('No looneyTunesTest routes available in production mode');
    }
    
    return baseName || 'route-001';
  }

  async generateTestEntity(type: EntityType, properties?: any): Promise<TestEntity> {
    const timestamp = Date.now();
    const testRunId = `test-${timestamp}`;

    switch (type) {
      case EntityType.CUSTOMER:
        return this.generateTestCustomer(testRunId, properties);
      case EntityType.TICKET:
        return this.generateTestTicket(testRunId, properties);
      case EntityType.ROUTE:
        return this.generateTestRoute(testRunId, properties);
      default:
        throw new Error(`Unsupported entity type: ${type}`);
    }
  }

  async validateTestData(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation - ensure required fields exist
    if (!data.id) {
      result.errors.push({
        field: 'id',
        message: 'Entity ID is required',
        code: 'MISSING_ID',
        severity: 'error'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  async getAvailableEntities(entityType: EntityType): Promise<TestEntity[]> {
    if (!this.context) {
      return [];
    }

    let entities: any[] = [];
    
    switch (entityType) {
      case EntityType.CUSTOMER:
        entities = this.context.testData.customers || [];
        break;
      case EntityType.TICKET:
        entities = this.context.testData.tickets || [];
        break;
      case EntityType.ROUTE:
        entities = this.context.testData.routes || [];
        break;
    }

    return entities.map(entity => ({
      id: entity.id,
      type: entityType,
      data: entity,
      isTestData: entity.isTestData || true,
      mode: this.mode
    }));
  }

  // Private helper methods for entity generation

  private generateTestCustomer(testRunId: string, properties?: any): TestEntity {
    const id = `cust-${testRunId}`;
    let customerData: TestCustomer;

    if (this.mode === TestMode.PRODUCTION) {
      const characters = ['Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird'];
      const character = characters[Math.floor(Math.random() * characters.length)];
      
      customerData = {
        id,
        name: `${character} - looneyTunesTest - ${testRunId}`,
        email: `${character.toLowerCase().replace(/\s+/g, '.')}@looneytunestest.com`,
        phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        isTestData: true,
        ...properties
      };
    } else {
      customerData = {
        id,
        name: `Test Customer - ${testRunId}`,
        email: `test.customer.${testRunId}@example.com`,
        phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        isTestData: true,
        ...properties
      };
    }

    return {
      id,
      type: EntityType.CUSTOMER,
      data: customerData,
      isTestData: true,
      mode: this.mode
    };
  }

  private generateTestTicket(testRunId: string, properties?: any): TestEntity {
    const id = `ticket-${testRunId}`;
    let ticketData: TestTicket;

    if (this.mode === TestMode.PRODUCTION) {
      ticketData = {
        id,
        customerId: properties?.customerId || 'cust-001',
        routeId: properties?.routeId || 'route-001',
        status: 'open',
        isTestData: true,
        ...properties
      };
    } else {
      ticketData = {
        id,
        customerId: properties?.customerId || 'cust-001',
        routeId: properties?.routeId || 'route-001',
        status: 'open',
        isTestData: true,
        ...properties
      };
    }

    return {
      id,
      type: EntityType.TICKET,
      data: ticketData,
      isTestData: true,
      mode: this.mode
    };
  }

  private generateTestRoute(testRunId: string, properties?: any): TestEntity {
    const id = `route-${testRunId}`;
    let routeData: TestRoute;

    if (this.mode === TestMode.PRODUCTION) {
      const locations = ['Cedar Falls', 'Winfield', "O'Fallon"];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      routeData = {
        id,
        name: `Test Route - looneyTunesTest - ${testRunId}`,
        location,
        isTestData: true,
        ...properties
      };
    } else {
      routeData = {
        id,
        name: `Test Route - ${testRunId}`,
        location: 'Test Location',
        isTestData: true,
        ...properties
      };
    }

    return {
      id,
      type: EntityType.ROUTE,
      data: routeData,
      isTestData: true,
      mode: this.mode
    };
  }
}