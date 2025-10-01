/**
 * Integration tests for DataIntegrityValidator
 * 
 * Tests comprehensive data validation rules and integrity checking
 * for test data across both isolated and production modes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataIntegrityValidator } from '../DataIntegrityValidator';
import { TestDataSet, TestMode, TestCustomer, TestRoute, TestTicket } from '../types';

describe('DataIntegrityValidator Integration Tests', () => {
  let validator: DataIntegrityValidator;
  let validTestData: TestDataSet;

  beforeEach(() => {
    validator = new DataIntegrityValidator();

    // Create valid test data
    validTestData = {
      customers: [
        {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs.bunny@looneytunestest.com',
          phone: '555-0001',
          isTestData: true
        },
        {
          id: 'cust-002',
          name: 'Daffy Duck - looneyTunesTest',
          email: 'daffy.duck@looneytunestest.com',
          phone: '555-0002',
          isTestData: true
        }
      ],
      routes: [
        {
          id: 'route-001',
          name: 'Cedar Falls Test Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        },
        {
          id: 'route-002',
          name: 'Winfield Test Route - looneyTunesTest',
          location: 'Winfield',
          isTestData: true
        }
      ],
      tickets: [
        {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        },
        {
          id: 'ticket-002',
          customerId: 'cust-002',
          routeId: 'route-002',
          status: 'pending',
          isTestData: true
        }
      ],
      metadata: {
        createdAt: new Date(),
        mode: TestMode.ISOLATED,
        version: '1.0.0',
        testRunId: 'test-run-001'
      }
    };
  });

  describe('Complete Data Validation', () => {
    it('should validate correct test data successfully', async () => {
      const report = await validator.validateTestData(validTestData);

      expect(report.isValid).toBe(true);
      expect(report.totalEntities).toBe(5); // 2 customers + 2 routes + 1 ticket
      expect(report.validationResults).toHaveLength(0); // No validation errors
      expect(report.summary.errors).toBe(0);
      expect(report.summary.warnings).toBe(0);
      expect(report.recommendations).toHaveLength(0);
    });

    it('should detect multiple validation issues in invalid data', async () => {
      const invalidData: TestDataSet = {
        customers: [
          {
            id: '', // Error: empty ID
            name: 'Invalid Customer',
            email: 'invalid-email', // Error: invalid email format
            phone: '555-0001',
            isTestData: true
          },
          {
            id: 'cust-002',
            name: '', // Error: empty name
            email: 'valid@email.com',
            phone: 'invalid-phone', // Warning: invalid phone format
            isTestData: true
          }
        ],
        routes: [
          {
            id: 'route-001',
            name: 'Valid Route - looneyTunesTest',
            location: 'Invalid Location', // Warning: not in standard locations
            isTestData: true
          }
        ],
        tickets: [
          {
            id: 'ticket-001',
            customerId: 'non-existent-customer', // Error: referential integrity
            routeId: 'route-001',
            status: 'invalid-status', // Warning: invalid status
            isTestData: true
          },
          {
            id: '', // Error: empty ID
            customerId: 'cust-002',
            routeId: 'non-existent-route', // Error: referential integrity
            status: 'active',
            isTestData: true
          }
        ],
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'invalid-test-run'
        }
      };

      const report = await validator.validateTestData(invalidData);

      expect(report.isValid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.summary.warnings).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);

      // Check for specific error types
      const errorMessages = report.validationResults
        .filter(r => r.severity === 'error')
        .map(r => r.message);

      expect(errorMessages.some(msg => msg.includes('ID is required'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('name is required'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Invalid email format'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('non-existent'))).toBe(true);
    });

    it('should validate with strict mode enabled', async () => {
      const report = await validator.validateTestData(validTestData, { strictMode: true });

      expect(report.isValid).toBe(true);
      expect(report.validationResults).toHaveLength(0);
    });

    it('should skip warnings when requested', async () => {
      const dataWithWarnings: TestDataSet = {
        ...validTestData,
        customers: [
          {
            id: 'cust-001',
            name: 'Customer Without Test Naming', // Warning: naming convention
            email: 'customer@example.com',
            phone: '555-0001',
            isTestData: true
          }
        ]
      };

      const report = await validator.validateTestData(dataWithWarnings, { skipWarnings: true });

      const warningResults = report.validationResults.filter(r => r.severity === 'warning');
      expect(warningResults).toHaveLength(0);
    });
  });

  describe('Individual Entity Validation', () => {
    describe('Customer Validation', () => {
      it('should validate correct customer', () => {
        const customer: TestCustomer = {
          id: 'cust-001',
          name: 'Bugs Bunny - looneyTunesTest',
          email: 'bugs@test.com',
          phone: '555-0001',
          isTestData: true
        };

        const results = validator.validateCustomer(customer);
        expect(results).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const invalidCustomer: TestCustomer = {
          id: '',
          name: '',
          email: '',
          phone: '555-0001',
          isTestData: true
        };

        const results = validator.validateCustomer(invalidCustomer);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.message.includes('ID is required'))).toBe(true);
        expect(results.some(r => r.message.includes('name is required'))).toBe(true);
        expect(results.some(r => r.message.includes('email is required'))).toBe(true);
      });

      it('should validate email format', () => {
        const customerWithInvalidEmail: TestCustomer = {
          id: 'cust-001',
          name: 'Test Customer',
          email: 'invalid-email-format',
          phone: '555-0001',
          isTestData: true
        };

        const results = validator.validateCustomer(customerWithInvalidEmail);
        
        expect(results.some(r => r.message.includes('Invalid email format'))).toBe(true);
      });

      it('should validate phone format', () => {
        const customerWithInvalidPhone: TestCustomer = {
          id: 'cust-001',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: 'invalid-phone',
          isTestData: true
        };

        const results = validator.validateCustomer(customerWithInvalidPhone);
        
        expect(results.some(r => r.message.includes('Invalid phone format'))).toBe(true);
        expect(results.find(r => r.message.includes('Invalid phone format'))?.severity).toBe('warning');
      });

      it('should validate test data naming convention', () => {
        const customerWithBadNaming: TestCustomer = {
          id: 'cust-001',
          name: 'Regular Customer Name',
          email: 'test@example.com',
          phone: '555-0001',
          isTestData: true
        };

        const results = validator.validateCustomer(customerWithBadNaming);
        
        expect(results.some(r => r.message.includes('naming convention'))).toBe(true);
      });
    });

    describe('Route Validation', () => {
      it('should validate correct route', () => {
        const route: TestRoute = {
          id: 'route-001',
          name: 'Cedar Falls Route - looneyTunesTest',
          location: 'Cedar Falls',
          isTestData: true
        };

        const results = validator.validateRoute(route);
        expect(results).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const invalidRoute: TestRoute = {
          id: '',
          name: '',
          location: '',
          isTestData: true
        };

        const results = validator.validateRoute(invalidRoute);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.message.includes('Route ID is required'))).toBe(true);
        expect(results.some(r => r.message.includes('Route name is required'))).toBe(true);
        expect(results.some(r => r.message.includes('Route location is required'))).toBe(true);
      });

      it('should validate location against standard list', () => {
        const routeWithInvalidLocation: TestRoute = {
          id: 'route-001',
          name: 'Test Route',
          location: 'Invalid Location',
          isTestData: true
        };

        const results = validator.validateRoute(routeWithInvalidLocation);
        
        expect(results.some(r => r.message.includes('location not in standard list'))).toBe(true);
        expect(results.find(r => r.message.includes('location not in standard list'))?.severity).toBe('warning');
      });
    });

    describe('Ticket Validation', () => {
      it('should validate correct ticket', () => {
        const ticket: TestTicket = {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'active',
          isTestData: true
        };

        const results = validator.validateTicket(ticket, validTestData);
        expect(results).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const invalidTicket: TestTicket = {
          id: '',
          customerId: '',
          routeId: '',
          status: '',
          isTestData: true
        };

        const results = validator.validateTicket(invalidTicket);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.message.includes('Ticket ID is required'))).toBe(true);
        expect(results.some(r => r.message.includes('customer ID is required'))).toBe(true);
        expect(results.some(r => r.message.includes('route ID is required'))).toBe(true);
        expect(results.some(r => r.message.includes('status is required'))).toBe(true);
      });

      it('should validate status values', () => {
        const ticketWithInvalidStatus: TestTicket = {
          id: 'ticket-001',
          customerId: 'cust-001',
          routeId: 'route-001',
          status: 'invalid-status',
          isTestData: true
        };

        const results = validator.validateTicket(ticketWithInvalidStatus);
        
        expect(results.some(r => r.message.includes('Invalid ticket status'))).toBe(true);
      });

      it('should validate referential integrity', () => {
        const ticketWithInvalidReferences: TestTicket = {
          id: 'ticket-001',
          customerId: 'non-existent-customer',
          routeId: 'non-existent-route',
          status: 'active',
          isTestData: true
        };

        const results = validator.validateTicket(ticketWithInvalidReferences, validTestData);
        
        expect(results.some(r => r.message.includes('Referenced customer does not exist'))).toBe(true);
        expect(results.some(r => r.message.includes('Referenced route does not exist'))).toBe(true);
      });
    });
  });

  describe('Custom Validation Rules', () => {
    it('should add and execute custom validation rules', async () => {
      const customRule = {
        name: 'custom-business-rule',
        description: 'Custom business validation rule',
        severity: 'warning' as const,
        validator: (data: TestDataSet) => [
          {
            rule: 'custom-business-rule',
            severity: 'warning' as const,
            message: 'Custom validation triggered'
          }
        ]
      };

      validator.addValidationRule(customRule);

      const report = await validator.validateTestData(validTestData, {
        customRules: [customRule]
      });

      expect(report.validationResults.some(r => r.rule === 'custom-business-rule')).toBe(true);
      expect(report.summary.warnings).toBeGreaterThan(0);
    });

    it('should remove validation rules', async () => {
      const customRule = {
        name: 'removable-rule',
        description: 'Rule to be removed',
        severity: 'info' as const,
        validator: (data: TestDataSet) => [
          {
            rule: 'removable-rule',
            severity: 'info' as const,
            message: 'This rule should be removed'
          }
        ]
      };

      validator.addValidationRule(customRule);
      validator.removeValidationRule('removable-rule');

      const rules = validator.getValidationRules();
      expect(rules.some(r => r.name === 'removable-rule')).toBe(false);
    });
  });

  describe('Built-in Validation Rules', () => {
    it('should detect duplicate entity IDs', async () => {
      const dataWithDuplicates: TestDataSet = {
        ...validTestData,
        customers: [
          ...validTestData.customers,
          {
            id: 'cust-001', // Duplicate ID
            name: 'Duplicate Customer',
            email: 'duplicate@test.com',
            phone: '555-9999',
            isTestData: true
          }
        ]
      };

      const report = await validator.validateTestData(dataWithDuplicates);

      expect(report.isValid).toBe(false);
      expect(report.validationResults.some(r => 
        r.rule === 'duplicate-detection' && r.message.includes('Duplicate customer ID')
      )).toBe(true);
    });

    it('should detect referential integrity violations', async () => {
      const dataWithOrphanedTickets: TestDataSet = {
        ...validTestData,
        tickets: [
          ...validTestData.tickets,
          {
            id: 'orphaned-ticket',
            customerId: 'non-existent-customer',
            routeId: 'non-existent-route',
            status: 'active',
            isTestData: true
          }
        ]
      };

      const report = await validator.validateTestData(dataWithOrphanedTickets);

      expect(report.isValid).toBe(false);
      expect(report.validationResults.some(r => 
        r.rule === 'referential-integrity' && r.message.includes('non-existent customer')
      )).toBe(true);
      expect(report.validationResults.some(r => 
        r.rule === 'referential-integrity' && r.message.includes('non-existent route')
      )).toBe(true);
    });

    it('should validate test data consistency', async () => {
      const inconsistentData: TestDataSet = {
        ...validTestData,
        customers: [
          {
            id: 'cust-001',
            name: 'Test Customer - looneyTunesTest', // Has test naming
            email: 'test@example.com',
            phone: '555-0001',
            isTestData: false // But not marked as test data
          },
          {
            id: 'cust-002',
            name: 'Regular Customer', // No test naming
            email: 'regular@example.com',
            phone: '555-0002',
            isTestData: true // But marked as test data
          }
        ]
      };

      const report = await validator.validateTestData(inconsistentData);

      expect(report.validationResults.some(r => 
        r.rule === 'test-data-consistency' && r.message.includes('test naming but isTestData is false')
      )).toBe(true);
      expect(report.validationResults.some(r => 
        r.rule === 'test-data-consistency' && r.message.includes('marked as test data but lacks test naming')
      )).toBe(true);
    });

    it('should check data completeness', async () => {
      const incompleteData: TestDataSet = {
        customers: [],
        routes: [],
        tickets: [],
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'incomplete-test'
        }
      };

      const report = await validator.validateTestData(incompleteData);

      expect(report.validationResults.some(r => 
        r.rule === 'data-completeness' && r.message.includes('No customers found')
      )).toBe(true);
      expect(report.validationResults.some(r => 
        r.rule === 'data-completeness' && r.message.includes('No routes found')
      )).toBe(true);
    });

    it('should detect unbalanced data ratios', async () => {
      const unbalancedData: TestDataSet = {
        customers: [validTestData.customers[0]], // 1 customer
        routes: [validTestData.routes[0]], // 1 route
        tickets: Array.from({ length: 10 }, (_, i) => ({ // 10 tickets (high ratio)
          id: `ticket-${i}`,
          customerId: validTestData.customers[0].id,
          routeId: validTestData.routes[0].id,
          status: 'active',
          isTestData: true
        })),
        metadata: validTestData.metadata
      };

      const report = await validator.validateTestData(unbalancedData);

      expect(report.validationResults.some(r => 
        r.rule === 'data-completeness' && r.message.includes('High ticket to customer ratio')
      )).toBe(true);
    });
  });

  describe('Validation Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large test dataset
      const largeDataset: TestDataSet = {
        customers: Array.from({ length: 1000 }, (_, i) => ({
          id: `cust-${i}`,
          name: `Customer ${i} - looneyTunesTest`,
          email: `customer${i}@test.com`,
          phone: `555-${i.toString().padStart(4, '0')}`,
          isTestData: true
        })),
        routes: Array.from({ length: 100 }, (_, i) => ({
          id: `route-${i}`,
          name: `Route ${i} - looneyTunesTest`,
          location: ['Cedar Falls', 'Winfield', "O'Fallon"][i % 3],
          isTestData: true
        })),
        tickets: Array.from({ length: 500 }, (_, i) => ({
          id: `ticket-${i}`,
          customerId: `cust-${i % 1000}`,
          routeId: `route-${i % 100}`,
          status: 'active',
          isTestData: true
        })),
        metadata: validTestData.metadata
      };

      const startTime = Date.now();
      const report = await validator.validateTestData(largeDataset);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(report.isValid).toBe(true);
      expect(report.totalEntities).toBe(1600); // 1000 + 100 + 500
    });
  });

  describe('Error Handling', () => {
    it('should handle validation rule failures gracefully', async () => {
      const faultyRule = {
        name: 'faulty-rule',
        description: 'Rule that throws an error',
        severity: 'error' as const,
        validator: (data: TestDataSet) => {
          throw new Error('Validation rule error');
        }
      };

      validator.addValidationRule(faultyRule);

      const report = await validator.validateTestData(validTestData);

      expect(report.isValid).toBe(false);
      expect(report.validationResults.some(r => 
        r.rule === 'faulty-rule' && r.message.includes('Validation rule failed')
      )).toBe(true);
    });

    it('should handle malformed test data gracefully', async () => {
      const malformedData = {
        customers: null,
        routes: undefined,
        tickets: 'invalid',
        metadata: validTestData.metadata
      } as any;

      const report = await validator.validateTestData(malformedData);

      expect(report.isValid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
    });
  });
});