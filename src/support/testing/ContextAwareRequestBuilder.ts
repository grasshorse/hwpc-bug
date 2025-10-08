/**
 * Context-Aware Request Builder
 * 
 * Builds API requests with context-appropriate data resolution,
 * replacing hardcoded IDs with contextual values based on test mode.
 */

import { DataContext, TestMode } from './types';
import { ContextAwareRequestBuilder, EntityType } from './interfaces/DataContextManager';
import { EnhancedDataContextManagerImpl } from './EnhancedDataContextManager';
import Log from '../logger/Log';

/**
 * Implementation of context-aware request builder
 */
export class ContextAwareRequestBuilderImpl implements ContextAwareRequestBuilder {
  private dataContextManager: EnhancedDataContextManagerImpl;

  constructor(dataContextManager: EnhancedDataContextManagerImpl) {
    this.dataContextManager = dataContextManager;
  }

  /**
   * Builds a ticket request with context-appropriate data
   */
  async buildTicketRequest(data: any, context: DataContext): Promise<any> {
    try {
      const resolvedData = { ...data };

      // Resolve customer ID if present
      if (resolvedData.customerId) {
        if (this.isHardcodedId(resolvedData.customerId)) {
          resolvedData.customerId = await this.dataContextManager.resolveCustomerId(
            this.extractBaseName(resolvedData.customerId), 
            context
          );
        }
      } else if (context.mode === TestMode.PRODUCTION) {
        // For production mode, ensure we have a valid customer ID
        resolvedData.customerId = await this.dataContextManager.resolveCustomerId(undefined, context);
      }

      // Resolve route ID if present
      if (resolvedData.routeId && this.isHardcodedId(resolvedData.routeId)) {
        resolvedData.routeId = await this.dataContextManager.resolveRouteId(
          this.extractBaseName(resolvedData.routeId), 
          context
        );
      }

      // Add context-appropriate naming for production mode
      if (context.mode === TestMode.PRODUCTION) {
        if (resolvedData.title && !resolvedData.title.includes('looneyTunesTest')) {
          resolvedData.title = `${resolvedData.title} - looneyTunesTest`;
        }
        if (resolvedData.description && !resolvedData.description.includes('looneyTunesTest')) {
          resolvedData.description = `${resolvedData.description} (looneyTunesTest)`;
        }
      }

      Log.info(`Built context-aware ticket request for ${context.mode} mode`);
      return resolvedData;
    } catch (error) {
      Log.error(`Failed to build ticket request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Builds a customer request with context-appropriate data
   */
  async buildCustomerRequest(data: any, context: DataContext): Promise<any> {
    try {
      const resolvedData = { ...data };

      // Add context-appropriate naming for production mode
      if (context.mode === TestMode.PRODUCTION) {
        if (resolvedData.name && !resolvedData.name.includes('looneyTunesTest')) {
          // Use Looney Tunes character names for production test data
          const characters = ['Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird', 'Sylvester Cat'];
          const character = characters[Math.floor(Math.random() * characters.length)];
          resolvedData.name = `${character} - looneyTunesTest - ${Date.now()}`;
        }
        
        if (resolvedData.email && !resolvedData.email.includes('looneytunestest.com')) {
          const baseName = resolvedData.name?.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '') || 'test';
          resolvedData.email = `${baseName}@looneytunestest.com`;
        }
      }

      // Ensure test data flag is set
      resolvedData.isTestData = true;

      Log.info(`Built context-aware customer request for ${context.mode} mode`);
      return resolvedData;
    } catch (error) {
      Log.error(`Failed to build customer request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Builds a route request with context-appropriate data
   */
  async buildRouteRequest(data: any, context: DataContext): Promise<any> {
    try {
      const resolvedData = { ...data };

      // Add context-appropriate naming and location for production mode
      if (context.mode === TestMode.PRODUCTION) {
        if (resolvedData.name && !resolvedData.name.includes('looneyTunesTest')) {
          resolvedData.name = `${resolvedData.name} - looneyTunesTest`;
        }
        
        // Use valid production locations
        if (!resolvedData.location) {
          const validLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
          resolvedData.location = validLocations[Math.floor(Math.random() * validLocations.length)];
        }
      }

      // Ensure test data flag is set
      resolvedData.isTestData = true;

      Log.info(`Built context-aware route request for ${context.mode} mode`);
      return resolvedData;
    } catch (error) {
      Log.error(`Failed to build route request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolves contextual IDs in request data
   */
  async resolveContextualIds(data: any, context: DataContext): Promise<any> {
    try {
      const resolvedData = { ...data };

      // Recursively resolve IDs in nested objects
      for (const [key, value] of Object.entries(resolvedData)) {
        if (typeof value === 'string' && this.isHardcodedId(value)) {
          resolvedData[key] = await this.resolveId(key, value, context);
        } else if (typeof value === 'object' && value !== null) {
          resolvedData[key] = await this.resolveContextualIds(value, context);
        }
      }

      Log.info(`Resolved contextual IDs for ${context.mode} mode`);
      return resolvedData;
    } catch (error) {
      Log.error(`Failed to resolve contextual IDs: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Checks if an ID appears to be hardcoded (follows patterns like cust-001, ticket-001)
   */
  private isHardcodedId(id: string): boolean {
    const hardcodedPatterns = [
      /^cust-\d{3}$/,      // cust-001, cust-002, etc.
      /^ticket-\d{3}$/,   // ticket-001, ticket-002, etc.
      /^route-\d{3}$/     // route-001, route-002, etc.
    ];

    return hardcodedPatterns.some(pattern => pattern.test(id));
  }

  /**
   * Extracts the base name from a hardcoded ID (e.g., "cust-001" -> "cust")
   */
  private extractBaseName(id: string): string {
    const match = id.match(/^([a-z]+)-\d+$/);
    return match ? match[1] : id;
  }

  /**
   * Resolves a specific ID based on the field name and context
   */
  private async resolveId(fieldName: string, id: string, context: DataContext): Promise<string> {
    const baseName = this.extractBaseName(id);

    // Determine entity type based on field name or ID pattern
    if (fieldName.toLowerCase().includes('customer') || baseName === 'cust') {
      return await this.dataContextManager.resolveCustomerId(baseName, context);
    } else if (fieldName.toLowerCase().includes('ticket') || baseName === 'ticket') {
      return await this.dataContextManager.resolveTicketId(baseName, context);
    } else if (fieldName.toLowerCase().includes('route') || baseName === 'route') {
      return await this.dataContextManager.resolveRouteId(baseName, context);
    }

    // If we can't determine the type, return the original ID
    Log.info(`Could not determine entity type for field '${fieldName}' with ID '${id}', returning original`);
    return id;
  }
}

/**
 * Factory for creating context-aware request builders
 */
export class ContextAwareRequestBuilderFactory {
  private static builders: Map<string, ContextAwareRequestBuilderImpl> = new Map();

  /**
   * Gets or creates a request builder for the specified data context manager
   */
  static getBuilder(dataContextManager: EnhancedDataContextManagerImpl): ContextAwareRequestBuilderImpl {
    const key = dataContextManager.getSupportedMode();
    
    if (!this.builders.has(key)) {
      this.builders.set(key, new ContextAwareRequestBuilderImpl(dataContextManager));
    }

    return this.builders.get(key)!;
  }

  /**
   * Clears all cached builders
   */
  static clearBuilders(): void {
    this.builders.clear();
  }
}

/**
 * Utility functions for working with context-aware requests
 */
export class RequestContextUtils {
  /**
   * Validates that a request contains appropriate test data markers for the given mode
   */
  static validateRequestForMode(request: any, mode: TestMode): boolean {
    if (mode === TestMode.PRODUCTION) {
      // Check for looneyTunesTest markers in production mode
      const hasTestMarkers = this.containsTestMarkers(request);
      if (!hasTestMarkers) {
        Log.info('Production mode request does not contain looneyTunesTest markers');
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if a request contains appropriate test data markers
   */
  private static containsTestMarkers(obj: any): boolean {
    if (typeof obj === 'string') {
      return obj.includes('looneyTunesTest') || obj.includes('test');
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (this.containsTestMarkers(value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sanitizes request data to ensure it's appropriate for the test mode
   */
  static sanitizeRequestForMode(request: any, mode: TestMode): any {
    const sanitized = { ...request };

    if (mode === TestMode.PRODUCTION) {
      // Ensure test data flags are set
      sanitized.isTestData = true;
      
      // Add test markers to string fields if missing
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string' && ['name', 'title', 'description'].includes(key)) {
          if (!value.includes('looneyTunesTest') && !value.includes('test')) {
            sanitized[key] = `${value} - looneyTunesTest`;
          }
        }
      }
    }

    return sanitized;
  }
}