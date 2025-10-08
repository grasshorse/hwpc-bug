/**
 * Enhanced Data Context Management Interfaces
 * 
 * Provides comprehensive interfaces for managing test data contexts
 * with mode-specific data resolution and validation capabilities.
 */

import { TestMode, TestConfig, DataContext, TestCustomer, TestRoute, TestTicket } from '../types';

/**
 * Enhanced interface for managing test data contexts with context-aware data resolution
 */
export interface EnhancedDataContextManager {
  /**
   * Sets up the data context for a test based on the specified mode and configuration
   */
  setupContext(mode: TestMode, testConfig: TestConfig): Promise<DataContext>;
  
  /**
   * Validates that the data context is properly configured and accessible
   */
  validateContext(context: DataContext): Promise<boolean>;
  
  /**
   * Cleans up the data context after test execution
   */
  cleanupContext(context: DataContext): Promise<void>;
  
  /**
   * Gets the supported test mode for this context manager
   */
  getSupportedMode(): TestMode;
  
  /**
   * Resolves a customer ID based on the current test mode and context
   */
  resolveCustomerId(baseName?: string, context?: DataContext): Promise<string>;
  
  /**
   * Resolves a ticket ID based on the current test mode and context
   */
  resolveTicketId(baseName?: string, context?: DataContext): Promise<string>;
  
  /**
   * Resolves a route ID based on the current test mode and context
   */
  resolveRouteId(baseName?: string, context?: DataContext): Promise<string>;
  
  /**
   * Validates that the requested entity exists in the current context
   */
  validateEntityExists(entityType: EntityType, entityId: string, context: DataContext): Promise<ValidationResult>;
  
  /**
   * Creates test data appropriate for the current mode
   */
  createTestEntity(entityType: EntityType, properties?: any, context?: DataContext): Promise<CreatedEntity>;
}

/**
 * Data provider interface for context-aware data resolution
 */
export interface ContextAwareDataProvider {
  /**
   * Gets a customer ID appropriate for the current test mode
   */
  getCustomerId(baseName?: string): Promise<string>;
  
  /**
   * Gets a ticket ID appropriate for the current test mode
   */
  getTicketId(baseName?: string): Promise<string>;
  
  /**
   * Gets a route ID appropriate for the current test mode
   */
  getRouteId(baseName?: string): Promise<string>;
  
  /**
   * Generates a new test entity with context-appropriate properties
   */
  generateTestEntity(type: EntityType, properties?: any): Promise<TestEntity>;
  
  /**
   * Validates that test data exists and is accessible
   */
  validateTestData(data: any): Promise<ValidationResult>;
  
  /**
   * Gets all available entities of a specific type
   */
  getAvailableEntities(entityType: EntityType): Promise<TestEntity[]>;
}

/**
 * Entity types supported by the data context manager
 */
export enum EntityType {
  CUSTOMER = 'customer',
  TICKET = 'ticket',
  ROUTE = 'route'
}

/**
 * Validation result for entity existence and data integrity
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

/**
 * Created entity information
 */
export interface CreatedEntity {
  type: EntityType;
  id: string;
  data: any;
  createdAt: Date;
  needsCleanup: boolean;
  mode: TestMode;
}

/**
 * Generic test entity interface
 */
export interface TestEntity {
  id: string;
  type: EntityType;
  data: any;
  isTestData: boolean;
  mode: TestMode;
}

/**
 * Data resolution options
 */
export interface DataResolutionOptions {
  preferExisting: boolean;
  createIfMissing: boolean;
  validateNamingConvention: boolean;
  requireTestDataFlag: boolean;
}

/**
 * Context-aware request builder interface
 */
export interface ContextAwareRequestBuilder {
  /**
   * Builds a ticket request with context-appropriate data
   */
  buildTicketRequest(data: any, context: DataContext): Promise<any>;
  
  /**
   * Builds a customer request with context-appropriate data
   */
  buildCustomerRequest(data: any, context: DataContext): Promise<any>;
  
  /**
   * Builds a route request with context-appropriate data
   */
  buildRouteRequest(data: any, context: DataContext): Promise<any>;
  
  /**
   * Resolves contextual IDs in request data
   */
  resolveContextualIds(data: any, context: DataContext): Promise<any>;
}