/**
 * ProductionSafetyValidator for operation validation
 * Ensures test operations don't affect real production data
 */

import { TestMode } from './types';

export interface TestOperation {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  targetEntity?: any;
  entityName?: string;
}

export interface SafetyValidationResult {
  isValid: boolean;
  issues?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Validates operations to ensure production safety
 */
export class ProductionSafetyValidator {
  private readonly testMarkers = [
    'looneyTunesTest',
    'test_',
    'Test Route',
    'looneytunestest.com'
  ];

  private readonly looneyTunesCharacters = [
    'Bugs Bunny',
    'Daffy Duck',
    'Porky Pig',
    'Tweety Bird',
    'Sylvester Cat',
    'Pepe Le Pew',
    'Foghorn Leghorn',
    'Marvin Martian',
    'Yosemite Sam',
    'Speedy Gonzales'
  ];

  private readonly dangerousPatterns = [
    /\b(admin|administrator|root|system|super)\b/i,
    /\b(all|every|entire|complete)\b/i,
    /\b(production|prod|live|real)\b/i,
    /\b(delete|drop|truncate|remove)\s+(all|everything|\*)\b/i
  ];

  /**
   * Validates test operation for production safety
   */
  public validateTestOperation(operation: TestOperation, mode: TestMode): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Only validate production mode operations
    if (mode !== TestMode.PRODUCTION) {
      return {
        isValid: true,
        riskLevel: 'low'
      };
    }

    // Validate entity safety
    const entityValidation = this.validateEntitySafety(operation);
    if (!entityValidation.isValid) {
      issues.push(...(entityValidation.issues || []));
      riskLevel = this.escalateRiskLevel(riskLevel, entityValidation.riskLevel);
    }

    // Validate operation type safety
    const operationValidation = this.validateOperationType(operation);
    if (!operationValidation.isValid) {
      issues.push(...(operationValidation.issues || []));
      riskLevel = this.escalateRiskLevel(riskLevel, operationValidation.riskLevel);
    }

    // Validate naming conventions
    const namingValidation = this.validateNamingConventions(operation);
    if (!namingValidation.isValid) {
      issues.push(...(namingValidation.issues || []));
      riskLevel = this.escalateRiskLevel(riskLevel, namingValidation.riskLevel);
    }

    // Check for dangerous patterns
    const patternValidation = this.validateDangerousPatterns(operation);
    if (!patternValidation.isValid) {
      issues.push(...(patternValidation.issues || []));
      riskLevel = this.escalateRiskLevel(riskLevel, patternValidation.riskLevel);
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Validates that entity is safe for test operations
   */
  private validateEntitySafety(operation: TestOperation): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const entity = operation.targetEntity;
    const entityName = operation.entityName;

    // Check if entity has test markers
    if (entity || entityName) {
      const hasTestMarker = this.hasTestMarkers(entity || { name: entityName });
      
      if (!hasTestMarker) {
        issues.push(`Entity "${entityName || 'unknown'}" lacks test markers - potential production data`);
        riskLevel = 'high';
      }
    }

    // Validate specific entity types
    if (operation.entityType) {
      const typeValidation = this.validateEntityType(operation.entityType, entity);
      if (!typeValidation.isValid) {
        issues.push(...(typeValidation.issues || []));
        riskLevel = this.escalateRiskLevel(riskLevel, typeValidation.riskLevel);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Validates operation type for safety
   */
  private validateOperationType(operation: TestOperation): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    switch (operation.type) {
      case 'delete':
        // Delete operations are high risk
        riskLevel = 'high';
        
        // Ensure we're only deleting test data
        if (!this.isTestEntity(operation.targetEntity || { name: operation.entityName })) {
          issues.push('Delete operation targets non-test entity');
          riskLevel = 'critical';
        }
        break;

      case 'update':
        // Update operations are medium risk
        riskLevel = 'medium';
        
        // Ensure we're only updating test data
        if (!this.isTestEntity(operation.targetEntity || { name: operation.entityName })) {
          issues.push('Update operation targets non-test entity');
          riskLevel = 'high';
        }
        break;

      case 'create':
        // Create operations are generally safe but validate naming
        riskLevel = 'low';
        break;

      default:
        issues.push(`Unknown operation type: ${operation.type}`);
        riskLevel = 'medium';
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Validates naming conventions for test data
   */
  private validateNamingConventions(operation: TestOperation): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const entityName = operation.entityName || operation.targetEntity?.name;
    
    if (entityName) {
      // Check for looneyTunesTest naming
      if (!entityName.includes('looneyTunesTest')) {
        issues.push(`Entity name "${entityName}" doesn't follow looneyTunesTest convention`);
        riskLevel = 'medium';
      }

      // Check for Looney Tunes characters in customer names
      if (operation.entityType === 'customer' || operation.entityType === 'user') {
        const hasCharacter = this.looneyTunesCharacters.some(character => 
          entityName.includes(character)
        );
        
        if (!hasCharacter) {
          issues.push(`Customer name "${entityName}" should include a Looney Tunes character`);
          riskLevel = 'medium';
        }
      }

      // Check email domain for customers
      const email = operation.targetEntity?.email;
      if (email && !email.includes('looneytunestest.com')) {
        issues.push(`Email "${email}" doesn't use looneytunestest.com domain`);
        riskLevel = 'medium';
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Validates against dangerous patterns
   */
  private validateDangerousPatterns(operation: TestOperation): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const textToCheck = [
      operation.entityName,
      operation.targetEntity?.name,
      operation.targetEntity?.email,
      operation.targetEntity?.identifier
    ].filter(Boolean).join(' ');

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(textToCheck)) {
        issues.push(`Dangerous pattern detected: ${pattern.source}`);
        riskLevel = 'critical';
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Validates specific entity types
   */
  private validateEntityType(entityType: string, entity: any): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    switch (entityType.toLowerCase()) {
      case 'customer':
      case 'user':
        if (entity?.email && !entity.email.includes('looneytunestest.com')) {
          issues.push('Customer email must use looneytunestest.com domain');
          riskLevel = 'medium';
        }
        break;

      case 'route':
        if (entity?.name && !entity.name.includes('Test Route')) {
          issues.push('Route name must include "Test Route" marker');
          riskLevel = 'medium';
        }
        break;

      case 'ticket':
        if (entity?.customerId && !this.looksLikeTestId(entity.customerId)) {
          issues.push('Ticket references non-test customer ID');
          riskLevel = 'high';
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Checks if entity has test markers
   */
  private hasTestMarkers(entity: any): boolean {
    if (!entity) return false;

    const fieldsToCheck = ['name', 'email', 'identifier', 'title'];
    
    return fieldsToCheck.some(field => {
      const value = entity[field];
      if (!value || typeof value !== 'string') return false;
      
      return this.testMarkers.some(marker => 
        value.toLowerCase().includes(marker.toLowerCase())
      );
    });
  }

  /**
   * Checks if entity is a test entity
   */
  private isTestEntity(entity: any): boolean {
    if (!entity) return false;

    // Check for test markers
    if (this.hasTestMarkers(entity)) return true;

    // Check for Looney Tunes characters
    if (entity.name) {
      const hasCharacter = this.looneyTunesCharacters.some(character => 
        entity.name.includes(character)
      );
      if (hasCharacter) return true;
    }

    // Check for test ID patterns
    if (entity.id && this.looksLikeTestId(entity.id)) return true;

    return false;
  }

  /**
   * Checks if ID looks like a test ID
   */
  private looksLikeTestId(id: string): boolean {
    const testIdPatterns = [
      /^test_/i,
      /looneyTunesTest/i,
      /_test_/i,
      /^[0-9]+_test/i
    ];

    return testIdPatterns.some(pattern => pattern.test(id));
  }

  /**
   * Escalates risk level to higher level
   */
  private escalateRiskLevel(
    current: 'low' | 'medium' | 'high' | 'critical',
    new_level: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(new_level);
    
    return levels[Math.max(currentIndex, newIndex)] as any;
  }

  /**
   * Validates bulk operations for additional safety
   */
  public validateBulkOperation(operations: TestOperation[], mode: TestMode): SafetyValidationResult {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for bulk delete operations
    const deleteOperations = operations.filter(op => op.type === 'delete');
    if (deleteOperations.length > 10) {
      issues.push(`Bulk delete operation with ${deleteOperations.length} items - high risk`);
      riskLevel = 'high';
    }

    // Validate each operation
    for (const operation of operations) {
      const validation = this.validateTestOperation(operation, mode);
      if (!validation.isValid) {
        issues.push(...(validation.issues || []));
        riskLevel = this.escalateRiskLevel(riskLevel, validation.riskLevel);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      riskLevel
    };
  }

  /**
   * Gets list of test markers
   */
  public getTestMarkers(): string[] {
    return [...this.testMarkers];
  }

  /**
   * Gets list of Looney Tunes characters
   */
  public getLooneyTunesCharacters(): string[] {
    return [...this.looneyTunesCharacters];
  }
}