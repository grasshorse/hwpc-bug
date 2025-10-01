/**
 * Data Integrity Validator
 * 
 * Comprehensive validation utilities for ensuring test data integrity
 * across both isolated and production testing environments.
 */

import { TestDataSet, TestCustomer, TestRoute, TestTicket, TestMode, TestMetadata } from './types';

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: (data: TestDataSet) => ValidationResult[];
}

export interface ValidationResult {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  entityType?: string;
  entityId?: string;
  details?: any;
}

export interface IntegrityReport {
  isValid: boolean;
  timestamp: Date;
  mode: TestMode;
  totalEntities: number;
  validationResults: ValidationResult[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  recommendations: string[];
}

export interface ValidationOptions {
  mode?: TestMode;
  strictMode?: boolean;
  skipWarnings?: boolean;
  customRules?: ValidationRule[];
}

/**
 * Validates test data integrity with comprehensive rule-based checking
 */
export class DataIntegrityValidator {
  private validationRules: ValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Validates test data set against all rules
   */
  async validateTestData(
    testData: TestDataSet,
    options: ValidationOptions = {}
  ): Promise<IntegrityReport> {
    console.log('Starting data integrity validation...');

    const report: IntegrityReport = {
      isValid: true,
      timestamp: new Date(),
      mode: testData.metadata.mode,
      totalEntities: testData.customers.length + testData.routes.length + testData.tickets.length,
      validationResults: [],
      summary: { errors: 0, warnings: 0, infos: 0 },
      recommendations: []
    };

    try {
      // Get applicable rules
      const rules = this.getApplicableRules(options);

      // Run all validation rules
      for (const rule of rules) {
        try {
          const results = rule.validator(testData);
          report.validationResults.push(...results);
        } catch (error) {
          report.validationResults.push({
            rule: rule.name,
            severity: 'error',
            message: `Validation rule failed: ${error.message}`,
            details: { error: error.message }
          });
        }
      }

      // Calculate summary
      report.validationResults.forEach(result => {
        report.summary[result.severity + 's']++;
        if (result.severity === 'error') {
          report.isValid = false;
        }
      });

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report.validationResults);

      console.log(`Validation completed: ${report.isValid ? 'PASSED' : 'FAILED'}`);
      console.log(`Summary: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.infos} infos`);

    } catch (error) {
      report.isValid = false;
      report.validationResults.push({
        rule: 'system',
        severity: 'error',
        message: `Validation system error: ${error.message}`
      });
      report.summary.errors++;
    }

    return report;
  }

  /**
   * Validates individual customer entity
   */
  validateCustomer(customer: TestCustomer, context?: TestDataSet): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Required fields validation
    if (!customer.id) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Customer ID is required',
        entityType: 'customer',
        entityId: customer.id
      });
    }

    if (!customer.name || customer.name.trim().length === 0) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Customer name is required',
        entityType: 'customer',
        entityId: customer.id
      });
    }

    if (!customer.email) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Customer email is required',
        entityType: 'customer',
        entityId: customer.id
      });
    }

    // Email format validation
    if (customer.email && !this.isValidEmail(customer.email)) {
      results.push({
        rule: 'email-format',
        severity: 'error',
        message: 'Invalid email format',
        entityType: 'customer',
        entityId: customer.id,
        details: { email: customer.email }
      });
    }

    // Phone format validation
    if (customer.phone && !this.isValidPhone(customer.phone)) {
      results.push({
        rule: 'phone-format',
        severity: 'warning',
        message: 'Invalid phone format',
        entityType: 'customer',
        entityId: customer.id,
        details: { phone: customer.phone }
      });
    }

    // Test data naming validation
    if (customer.isTestData && !this.isValidTestDataName(customer.name)) {
      results.push({
        rule: 'test-data-naming',
        severity: 'warning',
        message: 'Test data naming convention not followed',
        entityType: 'customer',
        entityId: customer.id,
        details: { name: customer.name }
      });
    }

    return results;
  }

  /**
   * Validates individual route entity
   */
  validateRoute(route: TestRoute, context?: TestDataSet): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Required fields validation
    if (!route.id) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Route ID is required',
        entityType: 'route',
        entityId: route.id
      });
    }

    if (!route.name || route.name.trim().length === 0) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Route name is required',
        entityType: 'route',
        entityId: route.id
      });
    }

    if (!route.location || route.location.trim().length === 0) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Route location is required',
        entityType: 'route',
        entityId: route.id
      });
    }

    // Location validation
    const validLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
    if (route.location && !validLocations.includes(route.location)) {
      results.push({
        rule: 'valid-location',
        severity: 'warning',
        message: 'Route location not in standard list',
        entityType: 'route',
        entityId: route.id,
        details: { location: route.location, validLocations }
      });
    }

    // Test data naming validation
    if (route.isTestData && !this.isValidTestDataName(route.name)) {
      results.push({
        rule: 'test-data-naming',
        severity: 'warning',
        message: 'Test data naming convention not followed',
        entityType: 'route',
        entityId: route.id,
        details: { name: route.name }
      });
    }

    return results;
  }

  /**
   * Validates individual ticket entity
   */
  validateTicket(ticket: TestTicket, context?: TestDataSet): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Required fields validation
    if (!ticket.id) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Ticket ID is required',
        entityType: 'ticket',
        entityId: ticket.id
      });
    }

    if (!ticket.customerId) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Ticket customer ID is required',
        entityType: 'ticket',
        entityId: ticket.id
      });
    }

    if (!ticket.routeId) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Ticket route ID is required',
        entityType: 'ticket',
        entityId: ticket.id
      });
    }

    if (!ticket.status) {
      results.push({
        rule: 'required-fields',
        severity: 'error',
        message: 'Ticket status is required',
        entityType: 'ticket',
        entityId: ticket.id
      });
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'pending', 'completed', 'cancelled'];
    if (ticket.status && !validStatuses.includes(ticket.status)) {
      results.push({
        rule: 'valid-status',
        severity: 'warning',
        message: 'Invalid ticket status',
        entityType: 'ticket',
        entityId: ticket.id,
        details: { status: ticket.status, validStatuses }
      });
    }

    // Reference validation (if context provided)
    if (context) {
      const customerExists = context.customers.some(c => c.id === ticket.customerId);
      if (!customerExists) {
        results.push({
          rule: 'referential-integrity',
          severity: 'error',
          message: 'Referenced customer does not exist',
          entityType: 'ticket',
          entityId: ticket.id,
          details: { customerId: ticket.customerId }
        });
      }

      const routeExists = context.routes.some(r => r.id === ticket.routeId);
      if (!routeExists) {
        results.push({
          rule: 'referential-integrity',
          severity: 'error',
          message: 'Referenced route does not exist',
          entityType: 'ticket',
          entityId: ticket.id,
          details: { routeId: ticket.routeId }
        });
      }
    }

    return results;
  }

  /**
   * Adds custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Removes validation rule by name
   */
  removeValidationRule(ruleName: string): void {
    this.validationRules = this.validationRules.filter(rule => rule.name !== ruleName);
  }

  /**
   * Gets all validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  // Private helper methods

  private initializeDefaultRules(): void {
    // Entity structure validation
    this.validationRules.push({
      name: 'entity-structure',
      description: 'Validates basic entity structure and required fields',
      severity: 'error',
      validator: (data: TestDataSet) => {
        const results: ValidationResult[] = [];

        // Validate customers
        data.customers.forEach(customer => {
          results.push(...this.validateCustomer(customer, data));
        });

        // Validate routes
        data.routes.forEach(route => {
          results.push(...this.validateRoute(route, data));
        });

        // Validate tickets
        data.tickets.forEach(ticket => {
          results.push(...this.validateTicket(ticket, data));
        });

        return results;
      }
    });

    // Referential integrity validation
    this.validationRules.push({
      name: 'referential-integrity',
      description: 'Validates relationships between entities',
      severity: 'error',
      validator: (data: TestDataSet) => {
        const results: ValidationResult[] = [];

        // Check for orphaned tickets
        data.tickets.forEach(ticket => {
          const customerExists = data.customers.some(c => c.id === ticket.customerId);
          const routeExists = data.routes.some(r => r.id === ticket.routeId);

          if (!customerExists) {
            results.push({
              rule: 'referential-integrity',
              severity: 'error',
              message: 'Ticket references non-existent customer',
              entityType: 'ticket',
              entityId: ticket.id,
              details: { customerId: ticket.customerId }
            });
          }

          if (!routeExists) {
            results.push({
              rule: 'referential-integrity',
              severity: 'error',
              message: 'Ticket references non-existent route',
              entityType: 'ticket',
              entityId: ticket.id,
              details: { routeId: ticket.routeId }
            });
          }
        });

        return results;
      }
    });

    // Duplicate detection
    this.validationRules.push({
      name: 'duplicate-detection',
      description: 'Detects duplicate entities',
      severity: 'warning',
      validator: (data: TestDataSet) => {
        const results: ValidationResult[] = [];

        // Check for duplicate customer IDs
        const customerIds = new Set<string>();
        data.customers.forEach(customer => {
          if (customerIds.has(customer.id)) {
            results.push({
              rule: 'duplicate-detection',
              severity: 'error',
              message: 'Duplicate customer ID found',
              entityType: 'customer',
              entityId: customer.id
            });
          }
          customerIds.add(customer.id);
        });

        // Check for duplicate route IDs
        const routeIds = new Set<string>();
        data.routes.forEach(route => {
          if (routeIds.has(route.id)) {
            results.push({
              rule: 'duplicate-detection',
              severity: 'error',
              message: 'Duplicate route ID found',
              entityType: 'route',
              entityId: route.id
            });
          }
          routeIds.add(route.id);
        });

        // Check for duplicate ticket IDs
        const ticketIds = new Set<string>();
        data.tickets.forEach(ticket => {
          if (ticketIds.has(ticket.id)) {
            results.push({
              rule: 'duplicate-detection',
              severity: 'error',
              message: 'Duplicate ticket ID found',
              entityType: 'ticket',
              entityId: ticket.id
            });
          }
          ticketIds.add(ticket.id);
        });

        return results;
      }
    });

    // Test data consistency
    this.validationRules.push({
      name: 'test-data-consistency',
      description: 'Validates test data naming and marking consistency',
      severity: 'warning',
      validator: (data: TestDataSet) => {
        const results: ValidationResult[] = [];

        // Check test data marking consistency for customers
        data.customers.forEach(customer => {
          const hasTestPrefix = customer.name.includes('looneyTunesTest') || 
                               customer.name.includes('Test');
          
          if (hasTestPrefix && !customer.isTestData) {
            results.push({
              rule: 'test-data-consistency',
              severity: 'warning',
              message: 'Entity has test naming but isTestData is false',
              entityType: 'customer',
              entityId: customer.id,
              details: { name: customer.name, isTestData: customer.isTestData }
            });
          }

          if (!hasTestPrefix && customer.isTestData) {
            results.push({
              rule: 'test-data-consistency',
              severity: 'warning',
              message: 'Entity marked as test data but lacks test naming',
              entityType: 'customer',
              entityId: customer.id,
              details: { name: customer.name, isTestData: customer.isTestData }
            });
          }
        });

        // Check test data marking consistency for routes
        data.routes.forEach(route => {
          const hasTestPrefix = route.name.includes('looneyTunesTest') || 
                               route.name.includes('Test');
          
          if (hasTestPrefix && !route.isTestData) {
            results.push({
              rule: 'test-data-consistency',
              severity: 'warning',
              message: 'Entity has test naming but isTestData is false',
              entityType: 'route',
              entityId: route.id,
              details: { name: route.name, isTestData: route.isTestData }
            });
          }

          if (!hasTestPrefix && route.isTestData) {
            results.push({
              rule: 'test-data-consistency',
              severity: 'warning',
              message: 'Entity marked as test data but lacks test naming',
              entityType: 'route',
              entityId: route.id,
              details: { name: route.name, isTestData: route.isTestData }
            });
          }
        });

        // Check test data marking consistency for tickets
        data.tickets.forEach(ticket => {
          // Tickets don't have names, so just check isTestData consistency
          // This could be expanded with other business rules
        });

        return results;
      }
    });

    // Data completeness
    this.validationRules.push({
      name: 'data-completeness',
      description: 'Validates data set completeness',
      severity: 'info',
      validator: (data: TestDataSet) => {
        const results: ValidationResult[] = [];

        if (data.customers.length === 0) {
          results.push({
            rule: 'data-completeness',
            severity: 'warning',
            message: 'No customers found in test data set'
          });
        }

        if (data.routes.length === 0) {
          results.push({
            rule: 'data-completeness',
            severity: 'warning',
            message: 'No routes found in test data set'
          });
        }

        if (data.tickets.length === 0) {
          results.push({
            rule: 'data-completeness',
            severity: 'info',
            message: 'No tickets found in test data set'
          });
        }

        // Check for balanced data
        const customerCount = data.customers.length;
        const routeCount = data.routes.length;
        const ticketCount = data.tickets.length;

        if (ticketCount > customerCount * 3) {
          results.push({
            rule: 'data-completeness',
            severity: 'info',
            message: 'High ticket to customer ratio detected',
            details: { customers: customerCount, tickets: ticketCount }
          });
        }

        return results;
      }
    });
  }

  private getApplicableRules(options: ValidationOptions): ValidationRule[] {
    let rules = [...this.validationRules];

    // Add custom rules if provided
    if (options.customRules) {
      rules.push(...options.customRules);
    }

    // Filter by severity if skipWarnings is true
    if (options.skipWarnings) {
      rules = rules.filter(rule => rule.severity === 'error');
    }

    return rules;
  }

  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    const errorCount = results.filter(r => r.severity === 'error').length;
    const warningCount = results.filter(r => r.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical errors before proceeding`);
    }

    if (warningCount > 0) {
      recommendations.push(`Review ${warningCount} warnings for data quality improvements`);
    }

    // Specific recommendations based on common issues
    const duplicateIssues = results.filter(r => r.rule === 'duplicate-detection');
    if (duplicateIssues.length > 0) {
      recommendations.push('Remove duplicate entities to prevent conflicts');
    }

    const referentialIssues = results.filter(r => r.rule === 'referential-integrity');
    if (referentialIssues.length > 0) {
      recommendations.push('Fix referential integrity issues by creating missing entities or removing orphaned records');
    }

    const namingIssues = results.filter(r => r.rule === 'test-data-naming');
    if (namingIssues.length > 0) {
      recommendations.push('Update entity names to follow test data naming conventions');
    }

    return recommendations;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\d{3}-\d{4}$|^\(\d{3}\)\s\d{3}-\d{4}$|^\d{10}$/;
    return phoneRegex.test(phone);
  }

  private isValidTestDataName(name: string): boolean {
    return name.includes('looneyTunesTest') || 
           name.includes('Test') || 
           name.includes('Bugs Bunny') ||
           name.includes('Daffy Duck') ||
           name.includes('Porky Pig');
  }
}