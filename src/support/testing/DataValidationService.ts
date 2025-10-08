/**
 * Data Validation Service
 * 
 * Provides comprehensive validation for test data existence, integrity,
 * and appropriate error handling with actionable suggestions.
 */

import { TestMode, DataContext, TestCustomer, TestRoute, TestTicket } from './types';
import { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  EntityType 
} from './interfaces/DataContextManager';
import Log from '../logger/Log';

/**
 * Service for validating test data and providing error handling
 */
export class DataValidationService {
  private mode: TestMode;
  private context: DataContext | null = null;

  constructor(mode: TestMode, context?: DataContext) {
    this.mode = mode;
    this.context = context || null;
  }

  /**
   * Validates that test data exists before API calls
   */
  async validateTestDataExists(entityType: EntityType, entityId: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!this.context) {
      result.errors.push({
        field: 'context',
        message: 'No data context available for validation',
        code: 'NO_CONTEXT',
        severity: 'error'
      });
      result.suggestions.push('Ensure data context is properly initialized before running tests');
      return result;
    }

    try {
      const entity = await this.findEntity(entityType, entityId);
      
      if (!entity) {
        result.errors.push({
          field: 'entityId',
          message: `${entityType} with ID '${entityId}' not found in ${this.mode} mode`,
          code: 'ENTITY_NOT_FOUND',
          severity: 'error'
        });
        
        // Add specific suggestions based on entity type and mode
        const suggestions = await this.generateEntitySuggestions(entityType, entityId);
        result.suggestions.push(...suggestions);
        
        return result;
      }

      // Validate entity integrity
      const integrityValidation = await this.validateEntityIntegrity(entity, entityType);
      result.errors.push(...integrityValidation.errors);
      result.warnings.push(...integrityValidation.warnings);
      result.suggestions.push(...integrityValidation.suggestions);

      // Validate naming conventions for production mode
      if (this.mode === TestMode.PRODUCTION) {
        const namingValidation = this.validateProductionNaming(entity, entityType);
        result.warnings.push(...namingValidation.warnings);
        result.suggestions.push(...namingValidation.suggestions);
      }

      result.isValid = result.errors.length === 0;
      
      if (result.isValid) {
        Log.info(`Data validation passed for ${entityType} ${entityId} in ${this.mode} mode`);
      } else {
        Log.error(`Data validation failed for ${entityType} ${entityId}: ${result.errors.map(e => e.message).join(', ')}`);
      }

    } catch (error) {
      result.errors.push({
        field: 'validation',
        message: `Validation error: ${error.message}`,
        code: 'VALIDATION_EXCEPTION',
        severity: 'error'
      });
      result.suggestions.push('Check data context setup and entity configuration');
    }

    return result;
  }

  /**
   * Validates multiple entities at once
   */
  async validateMultipleEntities(entities: Array<{type: EntityType, id: string}>): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    for (const entity of entities) {
      const entityValidation = await this.validateTestDataExists(entity.type, entity.id);
      result.errors.push(...entityValidation.errors);
      result.warnings.push(...entityValidation.warnings);
      result.suggestions.push(...entityValidation.suggestions);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validates API request data before sending
   */
  async validateApiRequestData(requestData: any, requestType: 'create' | 'update' | 'delete'): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validate required fields based on request type
      if (requestType === 'create') {
        const requiredFieldValidation = this.validateRequiredFields(requestData);
        result.errors.push(...requiredFieldValidation.errors);
        result.suggestions.push(...requiredFieldValidation.suggestions);
      }

      // Validate foreign key references
      const referenceValidation = await this.validateForeignKeyReferences(requestData);
      result.errors.push(...referenceValidation.errors);
      result.suggestions.push(...referenceValidation.suggestions);

      // Validate data formats
      const formatValidation = this.validateDataFormats(requestData);
      result.errors.push(...formatValidation.errors);
      result.warnings.push(...formatValidation.warnings);

      // Validate production mode requirements
      if (this.mode === TestMode.PRODUCTION) {
        const productionValidation = this.validateProductionRequirements(requestData);
        result.warnings.push(...productionValidation.warnings);
        result.suggestions.push(...productionValidation.suggestions);
      }

      result.isValid = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        field: 'request',
        message: `Request validation error: ${error.message}`,
        code: 'REQUEST_VALIDATION_ERROR',
        severity: 'error'
      });
    }

    return result;
  }

  /**
   * Generates actionable error messages with suggestions
   */
  generateActionableErrorMessage(validationResult: ValidationResult): string {
    if (validationResult.isValid) {
      return 'Validation passed successfully';
    }

    let message = 'Data validation failed:\n';
    
    // Add errors
    if (validationResult.errors.length > 0) {
      message += '\nErrors:\n';
      validationResult.errors.forEach(error => {
        message += `  - ${error.message} (${error.code})\n`;
      });
    }

    // Add warnings
    if (validationResult.warnings.length > 0) {
      message += '\nWarnings:\n';
      validationResult.warnings.forEach(warning => {
        message += `  - ${warning.message}\n`;
      });
    }

    // Add suggestions
    if (validationResult.suggestions.length > 0) {
      message += '\nSuggestions:\n';
      validationResult.suggestions.forEach(suggestion => {
        message += `  - ${suggestion}\n`;
      });
    }

    return message;
  }

  /**
   * Creates a validation error with context information
   */
  createValidationError(message: string, code: string, suggestions: string[] = []): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).suggestions = suggestions;
    (error as any).mode = this.mode;
    return error;
  }

  // Private helper methods

  private async findEntity(entityType: EntityType, entityId: string): Promise<any | null> {
    if (!this.context) return null;

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

    return entities.find(entity => entity.id === entityId) || null;
  }

  private async generateEntitySuggestions(entityType: EntityType, entityId: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (!this.context) {
      suggestions.push('Initialize data context before running tests');
      return suggestions;
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

    if (entities.length === 0) {
      suggestions.push(`No ${entityType}s available in ${this.mode} mode`);
      
      if (this.mode === TestMode.PRODUCTION) {
        suggestions.push(`Create looneyTunesTest ${entityType}s in the production database`);
        suggestions.push(`Ensure ${entityType} names include 'looneyTunesTest' for proper identification`);
      } else {
        suggestions.push(`Load test data for ${entityType}s in isolated mode`);
        suggestions.push(`Check test data configuration and database setup`);
      }
    } else {
      const availableIds = entities.slice(0, 3).map(e => e.id);
      suggestions.push(`Available ${entityType} IDs: ${availableIds.join(', ')}`);
      
      if (entities.length > 3) {
        suggestions.push(`And ${entities.length - 3} more ${entityType}s available`);
      }
      
      // Suggest similar IDs
      const similarIds = entities
        .map(e => e.id)
        .filter(id => this.calculateSimilarity(id, entityId) > 0.5)
        .slice(0, 2);
      
      if (similarIds.length > 0) {
        suggestions.push(`Did you mean: ${similarIds.join(' or ')}?`);
      }
    }

    return suggestions;
  }

  private async validateEntityIntegrity(entity: any, entityType: EntityType): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate required fields based on entity type
    switch (entityType) {
      case EntityType.CUSTOMER:
        if (!entity.name) {
          result.errors.push({
            field: 'name',
            message: 'Customer name is required',
            code: 'MISSING_CUSTOMER_NAME',
            severity: 'error'
          });
        }
        if (!entity.email) {
          result.errors.push({
            field: 'email',
            message: 'Customer email is required',
            code: 'MISSING_CUSTOMER_EMAIL',
            severity: 'error'
          });
        }
        break;
        
      case EntityType.TICKET:
        if (!entity.customerId) {
          result.errors.push({
            field: 'customerId',
            message: 'Ticket must have a customer ID',
            code: 'MISSING_CUSTOMER_ID',
            severity: 'error'
          });
        }
        if (!entity.status) {
          result.errors.push({
            field: 'status',
            message: 'Ticket status is required',
            code: 'MISSING_TICKET_STATUS',
            severity: 'error'
          });
        }
        break;
        
      case EntityType.ROUTE:
        if (!entity.name) {
          result.errors.push({
            field: 'name',
            message: 'Route name is required',
            code: 'MISSING_ROUTE_NAME',
            severity: 'error'
          });
        }
        if (!entity.location) {
          result.errors.push({
            field: 'location',
            message: 'Route location is required',
            code: 'MISSING_ROUTE_LOCATION',
            severity: 'error'
          });
        }
        break;
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateProductionNaming(entity: any, entityType: EntityType): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (entityType === EntityType.CUSTOMER && entity.name) {
      if (!entity.name.includes('looneyTunesTest')) {
        result.warnings.push({
          field: 'name',
          message: `Customer name '${entity.name}' does not follow looneyTunesTest naming convention`,
          code: 'NAMING_CONVENTION_WARNING',
          suggestion: 'Ensure production test customers include "looneyTunesTest" in their name'
        });
        result.suggestions.push('Update customer name to include "looneyTunesTest" identifier');
      }
    }

    return result;
  }

  private validateRequiredFields(requestData: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation for common required fields
    if (requestData.hasOwnProperty('name') && !requestData.name) {
      result.errors.push({
        field: 'name',
        message: 'Name field is required',
        code: 'MISSING_NAME',
        severity: 'error'
      });
      result.suggestions.push('Provide a valid name value');
    }

    if (requestData.hasOwnProperty('email') && !requestData.email) {
      result.errors.push({
        field: 'email',
        message: 'Email field is required',
        code: 'MISSING_EMAIL',
        severity: 'error'
      });
      result.suggestions.push('Provide a valid email address');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async validateForeignKeyReferences(requestData: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate customer ID references
    if (requestData.customerId) {
      const customerValidation = await this.validateTestDataExists(EntityType.CUSTOMER, requestData.customerId);
      if (!customerValidation.isValid) {
        result.errors.push({
          field: 'customerId',
          message: `Referenced customer '${requestData.customerId}' does not exist`,
          code: 'INVALID_CUSTOMER_REFERENCE',
          severity: 'error'
        });
        result.suggestions.push(...customerValidation.suggestions);
      }
    }

    // Validate route ID references
    if (requestData.routeId) {
      const routeValidation = await this.validateTestDataExists(EntityType.ROUTE, requestData.routeId);
      if (!routeValidation.isValid) {
        result.errors.push({
          field: 'routeId',
          message: `Referenced route '${requestData.routeId}' does not exist`,
          code: 'INVALID_ROUTE_REFERENCE',
          severity: 'error'
        });
        result.suggestions.push(...routeValidation.suggestions);
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateDataFormats(requestData: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate email format
    if (requestData.email && !this.isValidEmail(requestData.email)) {
      result.errors.push({
        field: 'email',
        message: `Invalid email format: ${requestData.email}`,
        code: 'INVALID_EMAIL_FORMAT',
        severity: 'error'
      });
      result.suggestions.push('Provide a valid email address (e.g., user@example.com)');
    }

    // Validate phone format
    if (requestData.phone && !this.isValidPhone(requestData.phone)) {
      result.warnings.push({
        field: 'phone',
        message: `Phone number format may be invalid: ${requestData.phone}`,
        code: 'INVALID_PHONE_FORMAT',
        suggestion: 'Use format like 555-1234 or (555) 123-4567'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateProductionRequirements(requestData: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Ensure test data markers are present
    if (requestData.name && !this.containsTestMarkers(requestData.name)) {
      result.warnings.push({
        field: 'name',
        message: 'Production mode data should include test markers',
        code: 'MISSING_TEST_MARKERS',
        suggestion: 'Include "looneyTunesTest" in the name for production test data'
      });
      result.suggestions.push('Add "looneyTunesTest" to identify this as test data');
    }

    // Ensure test data flag is set
    if (requestData.hasOwnProperty('isTestData') && !requestData.isTestData) {
      result.warnings.push({
        field: 'isTestData',
        message: 'Production test data should have isTestData flag set to true',
        code: 'MISSING_TEST_FLAG',
        suggestion: 'Set isTestData: true for production test entities'
      });
    }

    return result;
  }

  // Utility methods

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  private containsTestMarkers(text: string): boolean {
    return text.includes('looneyTunesTest') || text.includes('test') || text.includes('Test');
  }
}