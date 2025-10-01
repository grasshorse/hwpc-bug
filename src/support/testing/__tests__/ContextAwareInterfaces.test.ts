/**
 * Unit tests for Context-Aware Interfaces
 * 
 * Tests the context-aware interfaces and error classes without
 * relying on the full page object inheritance chain.
 */

import { describe, it, expect } from 'vitest';
import { 
  ContextAwarePageObjectError,
  ModeSpecificDebugInfo,
  ContextAwareElementConfig 
} from '../interfaces/ContextAwarePageObject';
import { TestMode, DataContext, TestDataSet, TestMetadata, ConnectionInfo } from '../types';

describe('Context-Aware Interfaces', () => {
  describe('ContextAwarePageObjectError', () => {
    it('should create error with correct properties', () => {
      // Arrange
      const mockDataContext: DataContext = {
        mode: TestMode.ISOLATED,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-123'
          } as TestMetadata
        } as TestDataSet,
        connectionInfo: {
          host: 'localhost',
          database: 'test_db',
          isTestConnection: true
        } as ConnectionInfo,
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-123'
        } as TestMetadata,
        cleanup: async () => {}
      };

      const debugInfo: ModeSpecificDebugInfo = {
        mode: TestMode.ISOLATED,
        dataContext: { hasTestData: true, testDataCount: 1, testDataTypes: ['customers'] },
        selectors: { attempted: [], successful: [], failed: [] },
        elements: { found: 0, expected: 1, modeSpecific: 0 },
        errors: [],
        timestamp: new Date()
      };
      
      // Act
      const error = new ContextAwarePageObjectError(
        'TestPage',
        TestMode.ISOLATED,
        mockDataContext,
        'Test error message',
        debugInfo
      );
      
      // Assert
      expect(error.name).toBe('ContextAwarePageObjectError');
      expect(error.pageName).toBe('TestPage');
      expect(error.mode).toBe(TestMode.ISOLATED);
      expect(error.contextInfo).toBe(mockDataContext);
      expect(error.details).toBe('Test error message');
      expect(error.debugInfo).toBe(debugInfo);
      expect(error.message).toContain('Context-aware page object error in TestPage (isolated): Test error message');
    });

    it('should create error without debug info', () => {
      // Arrange
      const mockDataContext: DataContext = {
        mode: TestMode.PRODUCTION,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.PRODUCTION,
            version: '1.0.0',
            testRunId: 'test-456'
          } as TestMetadata
        } as TestDataSet,
        connectionInfo: {
          host: 'production-host',
          database: 'prod_db',
          isTestConnection: false
        } as ConnectionInfo,
        metadata: {
          createdAt: new Date(),
          mode: TestMode.PRODUCTION,
          version: '1.0.0',
          testRunId: 'test-456'
        } as TestMetadata,
        cleanup: async () => {}
      };
      
      // Act
      const error = new ContextAwarePageObjectError(
        'ProductionPage',
        TestMode.PRODUCTION,
        mockDataContext,
        'Production error'
      );
      
      // Assert
      expect(error.name).toBe('ContextAwarePageObjectError');
      expect(error.pageName).toBe('ProductionPage');
      expect(error.mode).toBe(TestMode.PRODUCTION);
      expect(error.contextInfo).toBe(mockDataContext);
      expect(error.details).toBe('Production error');
      expect(error.debugInfo).toBeUndefined();
      expect(error.message).toContain('Context-aware page object error in ProductionPage (production): Production error');
    });
  });

  describe('ContextAwareElementConfig', () => {
    it('should create valid element configuration', () => {
      // Arrange & Act
      const config: ContextAwareElementConfig = {
        elementName: 'testButton',
        baseSelector: '.test-button',
        isolatedModeSelector: '[data-testid="test-button"]',
        productionModeSelector: '.prod-test-button',
        fallbackSelector: '.fallback-button',
        isRequired: true,
        modeSpecific: {
          [TestMode.ISOLATED]: {
            selector: '[data-testid="test-button"]',
            validation: async () => true
          },
          [TestMode.PRODUCTION]: {
            selector: '.prod-test-button',
            validation: async () => true
          }
        }
      };
      
      // Assert
      expect(config.elementName).toBe('testButton');
      expect(config.baseSelector).toBe('.test-button');
      expect(config.isolatedModeSelector).toBe('[data-testid="test-button"]');
      expect(config.productionModeSelector).toBe('.prod-test-button');
      expect(config.fallbackSelector).toBe('.fallback-button');
      expect(config.isRequired).toBe(true);
      expect(config.modeSpecific[TestMode.ISOLATED]).toBeDefined();
      expect(config.modeSpecific[TestMode.PRODUCTION]).toBeDefined();
      expect(config.modeSpecific[TestMode.ISOLATED]?.selector).toBe('[data-testid="test-button"]');
      expect(config.modeSpecific[TestMode.PRODUCTION]?.selector).toBe('.prod-test-button');
    });

    it('should handle optional properties', () => {
      // Arrange & Act
      const config: ContextAwareElementConfig = {
        elementName: 'optionalElement',
        baseSelector: '.optional-element',
        isRequired: false,
        modeSpecific: {}
      };
      
      // Assert
      expect(config.elementName).toBe('optionalElement');
      expect(config.baseSelector).toBe('.optional-element');
      expect(config.isolatedModeSelector).toBeUndefined();
      expect(config.productionModeSelector).toBeUndefined();
      expect(config.fallbackSelector).toBeUndefined();
      expect(config.isRequired).toBe(false);
      expect(Object.keys(config.modeSpecific)).toHaveLength(0);
    });
  });

  describe('ModeSpecificDebugInfo', () => {
    it('should create valid debug info structure', () => {
      // Arrange & Act
      const debugInfo: ModeSpecificDebugInfo = {
        mode: TestMode.DUAL,
        dataContext: {
          hasTestData: true,
          testDataCount: 5,
          testDataTypes: ['customers', 'routes', 'tickets']
        },
        selectors: {
          attempted: ['selector1', 'selector2'],
          successful: ['selector1'],
          failed: ['selector2']
        },
        elements: {
          found: 3,
          expected: 5,
          modeSpecific: 2
        },
        errors: ['Error 1', 'Error 2'],
        timestamp: new Date('2023-01-01T00:00:00Z')
      };
      
      // Assert
      expect(debugInfo.mode).toBe(TestMode.DUAL);
      expect(debugInfo.dataContext.hasTestData).toBe(true);
      expect(debugInfo.dataContext.testDataCount).toBe(5);
      expect(debugInfo.dataContext.testDataTypes).toEqual(['customers', 'routes', 'tickets']);
      expect(debugInfo.selectors.attempted).toEqual(['selector1', 'selector2']);
      expect(debugInfo.selectors.successful).toEqual(['selector1']);
      expect(debugInfo.selectors.failed).toEqual(['selector2']);
      expect(debugInfo.elements.found).toBe(3);
      expect(debugInfo.elements.expected).toBe(5);
      expect(debugInfo.elements.modeSpecific).toBe(2);
      expect(debugInfo.errors).toEqual(['Error 1', 'Error 2']);
      expect(debugInfo.timestamp).toEqual(new Date('2023-01-01T00:00:00Z'));
    });

    it('should handle empty debug info', () => {
      // Arrange & Act
      const debugInfo: ModeSpecificDebugInfo = {
        mode: TestMode.ISOLATED,
        dataContext: {
          hasTestData: false,
          testDataCount: 0,
          testDataTypes: []
        },
        selectors: {
          attempted: [],
          successful: [],
          failed: []
        },
        elements: {
          found: 0,
          expected: 0,
          modeSpecific: 0
        },
        errors: [],
        timestamp: new Date()
      };
      
      // Assert
      expect(debugInfo.mode).toBe(TestMode.ISOLATED);
      expect(debugInfo.dataContext.hasTestData).toBe(false);
      expect(debugInfo.dataContext.testDataCount).toBe(0);
      expect(debugInfo.dataContext.testDataTypes).toHaveLength(0);
      expect(debugInfo.selectors.attempted).toHaveLength(0);
      expect(debugInfo.selectors.successful).toHaveLength(0);
      expect(debugInfo.selectors.failed).toHaveLength(0);
      expect(debugInfo.elements.found).toBe(0);
      expect(debugInfo.elements.expected).toBe(0);
      expect(debugInfo.elements.modeSpecific).toBe(0);
      expect(debugInfo.errors).toHaveLength(0);
      expect(debugInfo.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('TestMode Integration', () => {
    it('should work with all test modes', () => {
      // Test that our interfaces work with all defined test modes
      const modes = [TestMode.ISOLATED, TestMode.PRODUCTION, TestMode.DUAL];
      
      modes.forEach(mode => {
        const debugInfo: ModeSpecificDebugInfo = {
          mode,
          dataContext: { hasTestData: true, testDataCount: 1, testDataTypes: ['test'] },
          selectors: { attempted: [], successful: [], failed: [] },
          elements: { found: 1, expected: 1, modeSpecific: 1 },
          errors: [],
          timestamp: new Date()
        };
        
        expect(debugInfo.mode).toBe(mode);
      });
    });

    it('should handle mode-specific configurations for all modes', () => {
      const config: ContextAwareElementConfig = {
        elementName: 'multiModeElement',
        baseSelector: '.base-element',
        isRequired: true,
        modeSpecific: {
          [TestMode.ISOLATED]: {
            selector: '[data-testid="isolated-element"]',
            validation: async () => true
          },
          [TestMode.PRODUCTION]: {
            selector: '.production-element',
            validation: async () => true
          }
          // Note: DUAL mode intentionally omitted to test fallback behavior
        }
      };
      
      expect(config.modeSpecific[TestMode.ISOLATED]).toBeDefined();
      expect(config.modeSpecific[TestMode.PRODUCTION]).toBeDefined();
      expect(config.modeSpecific[TestMode.DUAL]).toBeUndefined();
    });
  });
});