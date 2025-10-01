/**
 * Unit tests for Context-Aware Page Objects
 * 
 * Tests the context-aware functionality of page objects including
 * mode detection, element selection, and data context integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Page } from '@playwright/test';
import UIActions from '../../playwright/actions/UIActions';
import { ContextAwareBasePage } from '../base/ContextAwareBasePage';
import { 
  ContextAwarePageObjectError,
  ModeSpecificDebugInfo,
  ContextAwareElementConfig 
} from '../interfaces/ContextAwarePageObject';
import { TestMode, DataContext, TestDataSet, TestMetadata, ConnectionInfo } from '../types';

// Mock implementation for testing
class MockContextAwarePage extends ContextAwareBasePage {
  constructor(web: UIActions) {
    super(web);
    // Override viewport detection to avoid issues with mock
    (this as any).viewport = { width: 1024, height: 768 };
    (this as any).isMobile = false;
    (this as any).isTablet = false;
  }

  protected initializeModeSpecificConfigurations(): void {
    // Register test element configurations
    this.registerModeSpecificElement({
      elementName: 'testElement',
      baseSelector: '.test-element',
      isolatedModeSelector: '[data-testid="test-element"]',
      productionModeSelector: '.prod-test-element',
      fallbackSelector: '.fallback-element',
      isRequired: true,
      modeSpecific: {
        [TestMode.ISOLATED]: {
          selector: '[data-testid="test-element"]',
          validation: async () => true
        },
        [TestMode.PRODUCTION]: {
          selector: '.prod-test-element',
          validation: async () => true
        }
      }
    });
  }

  protected async validateModeSpecificRequirements(): Promise<boolean> {
    return true;
  }

  public async initialize(): Promise<void> {
    // Mock implementation
  }

  public async validatePageElements(): Promise<void> {
    // Mock implementation
  }

  // Override abstract methods from BasePage
  protected async verifyMobileResponsiveElements(): Promise<void> {
    // Mock implementation
  }

  protected async verifyTabletResponsiveElements(): Promise<void> {
    // Mock implementation
  }

  protected async verifyDesktopResponsiveElements(): Promise<void> {
    // Mock implementation
  }
}

// Mock UIActions and Page
const mockPage = {
  evaluate: vi.fn(),
  locator: vi.fn(() => ({
    count: vi.fn().mockResolvedValue(1),
    boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 }),
    elementHandle: vi.fn().mockResolvedValue({}),
    first: vi.fn().mockReturnThis()
  })),
  keyboard: {
    press: vi.fn()
  },
  waitForTimeout: vi.fn(),
  waitForFunction: vi.fn(),
  waitForLoadState: vi.fn(),
  viewportSize: vi.fn().mockReturnValue({ width: 1024, height: 768 })
} as unknown as Page;

const mockUIActions = {
  getPage: vi.fn().mockReturnValue(mockPage),
  element: vi.fn().mockReturnValue({
    isVisible: vi.fn().mockResolvedValue(true),
    waitTillVisible: vi.fn(),
    click: vi.fn(),
    getLocator: vi.fn().mockReturnValue({
      boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 }),
      elementHandle: vi.fn().mockResolvedValue({})
    })
  }),
  editBox: vi.fn().mockReturnValue({
    isVisible: vi.fn().mockResolvedValue(true),
    fill: vi.fn(),
    keyPress: vi.fn()
  }),
  goto: vi.fn(),
  dropdown: vi.fn().mockReturnValue({
    selectByVisibleText: vi.fn()
  })
} as unknown as UIActions;

describe('ContextAwarePageObjects', () => {
  let mockPage_: MockContextAwarePage;
  let mockDataContext: DataContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPage_ = new MockContextAwarePage(mockUIActions);
    
    mockDataContext = {
      mode: TestMode.ISOLATED,
      testData: {
        customers: [
          { id: '1', name: 'Test Customer 1', email: 'test1@example.com', phone: '123-456-7890', isTestData: true },
          { id: '2', name: 'Bugs Bunny - looneyTunesTest', email: 'bugs@looney.com', phone: '123-456-7891', isTestData: true }
        ],
        routes: [
          { id: '1', name: 'Test Route 1', location: 'Cedar Falls', isTestData: true }
        ],
        tickets: [
          { id: '1', customerId: '1', routeId: '1', status: 'open', isTestData: true }
        ],
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
      cleanup: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Context Management', () => {
    it('should set and get data context correctly', () => {
      // Act
      mockPage_.setDataContext(mockDataContext);
      
      // Assert
      expect(mockPage_.getDataContext()).toBe(mockDataContext);
      expect(mockPage_.getTestMode()).toBe(TestMode.ISOLATED);
    });

    it('should return null when no context is set', () => {
      // Assert
      expect(mockPage_.getDataContext()).toBeNull();
      expect(mockPage_.getTestMode()).toBeNull();
    });

    it('should validate context successfully with valid data', async () => {
      // Arrange
      mockPage_.setDataContext(mockDataContext);
      
      // Act
      const isValid = await mockPage_.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should fail validation when no context is set', async () => {
      // Act
      const isValid = await mockPage_.validateContext();
      
      // Assert
      expect(isValid).toBe(false);
    });

    it('should fail validation when no test data is available', async () => {
      // Arrange
      const emptyDataContext = {
        ...mockDataContext,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: mockDataContext.testData.metadata
        }
      };
      mockPage_.setDataContext(emptyDataContext);
      
      // Act
      const isValid = await mockPage_.validateContext();
      
      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Mode-Specific Selector Management', () => {
    beforeEach(() => {
      mockPage_.setDataContext(mockDataContext);
    });

    it('should return mode-specific selector for isolated mode', () => {
      // Act
      const selector = mockPage_.getModeSpecificSelector('.test-element', 'testElement');
      
      // Assert
      expect(selector).toBe('[data-testid="test-element"]');
    });

    it('should return mode-specific selector for production mode', () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      mockPage_.setDataContext(productionContext);
      
      // Act
      const selector = mockPage_.getModeSpecificSelector('.test-element', 'testElement');
      
      // Assert
      expect(selector).toBe('.prod-test-element');
    });

    it('should return base selector when no mode-specific configuration exists', () => {
      // Act
      const selector = mockPage_.getModeSpecificSelector('.unknown-element', 'unknownElement');
      
      // Assert
      expect(selector).toBe('.unknown-element');
    });

    it('should return fallback selector when mode-specific selector is not available', () => {
      // Arrange
      const dualContext = { ...mockDataContext, mode: TestMode.DUAL };
      mockPage_.setDataContext(dualContext);
      
      // Act
      const selector = mockPage_.getModeSpecificSelector('.test-element', 'testElement');
      
      // Assert
      expect(selector).toBe('.fallback-element');
    });
  });

  describe('Mode-Specific Element Validation', () => {
    beforeEach(() => {
      mockPage_.setDataContext(mockDataContext);
    });

    it('should validate mode-specific elements successfully', async () => {
      // Act
      const isValid = await mockPage_.validateModeSpecificElements();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Element not found')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act
      const isValid = await mockPage_.validateModeSpecificElements();
      
      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Debug Information Collection', () => {
    beforeEach(() => {
      mockPage_.setDataContext(mockDataContext);
    });

    it('should collect comprehensive debug information', async () => {
      // Act
      const debugInfo = await mockPage_.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.mode).toBe(TestMode.ISOLATED);
      expect(debugInfo.dataContext.hasTestData).toBe(true);
      expect(debugInfo.dataContext.testDataCount).toBe(4); // 2 customers + 1 route + 1 ticket
      expect(debugInfo.dataContext.testDataTypes).toContain('customers');
      expect(debugInfo.dataContext.testDataTypes).toContain('routes');
      expect(debugInfo.dataContext.testDataTypes).toContain('tickets');
      expect(debugInfo.elements.expected).toBe(1); // One registered element
      expect(debugInfo.timestamp).toBeInstanceOf(Date);
    });

    it('should handle debug info collection errors', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Debug error')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act
      const debugInfo = await mockPage_.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.errors.length).toBeGreaterThan(0);
      expect(debugInfo.errors[0]).toContain('Debug error');
    });
  });

  describe('Context-Aware Element Interactions', () => {
    beforeEach(() => {
      mockPage_.setDataContext(mockDataContext);
    });

    it('should perform context-aware click successfully', async () => {
      // Act & Assert
      await expect(mockPage_.contextAwareClick('testElement')).resolves.not.toThrow();
    });

    it('should throw ContextAwarePageObjectError when element config not found', async () => {
      // Act & Assert
      await expect(mockPage_.contextAwareClick('unknownElement'))
        .rejects.toThrow(ContextAwarePageObjectError);
    });

    it('should use fallback selector when provided', async () => {
      // Act & Assert
      await expect(mockPage_.contextAwareClick('unknownElement', '.fallback-selector'))
        .resolves.not.toThrow();
    });

    it('should perform context-aware text input successfully', async () => {
      // Act & Assert
      await expect(mockPage_.contextAwareTypeText('testElement', 'test text'))
        .resolves.not.toThrow();
    });

    it('should perform context-aware element wait successfully', async () => {
      // Act & Assert
      await expect(mockPage_.contextAwareWaitForElement('testElement'))
        .resolves.not.toThrow();
    });
  });

  describe('Test Data Access Methods', () => {
    beforeEach(() => {
      mockPage_.setDataContext(mockDataContext);
    });

    it('should return test customers from context', () => {
      // Act
      const customers = (mockPage_ as any).getTestCustomers();
      
      // Assert
      expect(customers).toHaveLength(2);
      expect(customers[0].name).toBe('Test Customer 1');
      expect(customers[1].name).toBe('Bugs Bunny - looneyTunesTest');
    });

    it('should return test routes from context', () => {
      // Act
      const routes = (mockPage_ as any).getTestRoutes();
      
      // Assert
      expect(routes).toHaveLength(1);
      expect(routes[0].location).toBe('Cedar Falls');
    });

    it('should return test tickets from context', () => {
      // Act
      const tickets = (mockPage_ as any).getTestTickets();
      
      // Assert
      expect(tickets).toHaveLength(1);
      expect(tickets[0].status).toBe('open');
    });

    it('should return specific test customer by index', () => {
      // Act
      const customer = (mockPage_ as any).getTestCustomer(0);
      
      // Assert
      expect(customer).not.toBeNull();
      expect(customer.name).toBe('Test Customer 1');
    });

    it('should return specific test customer by criteria', () => {
      // Act
      const customer = (mockPage_ as any).getTestCustomer((c: any) => c.name.includes('Bugs'));
      
      // Assert
      expect(customer).not.toBeNull();
      expect(customer.name).toBe('Bugs Bunny - looneyTunesTest');
    });

    it('should return null when customer not found', () => {
      // Act
      const customer = (mockPage_ as any).getTestCustomer(999);
      
      // Assert
      expect(customer).toBeNull();
    });

    it('should return empty arrays when no context is set', () => {
      // Arrange
      const pageWithoutContext = new MockContextAwarePage(mockUIActions);
      
      // Act & Assert
      expect((pageWithoutContext as any).getTestCustomers()).toEqual([]);
      expect((pageWithoutContext as any).getTestRoutes()).toEqual([]);
      expect((pageWithoutContext as any).getTestTickets()).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should create ContextAwarePageObjectError with correct properties', () => {
      // Arrange
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
  });
});