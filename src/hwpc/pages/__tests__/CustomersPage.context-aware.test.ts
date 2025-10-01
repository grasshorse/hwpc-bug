/**
 * Unit tests for CustomersPage Context-Aware functionality
 * 
 * Tests the context-aware customer page functionality including
 * customer search, filtering, and data validation across different testing modes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Page } from '@playwright/test';
import UIActions from '../../../support/playwright/actions/UIActions';
import CustomersPage from '../CustomersPage';
import { TestMode, DataContext, TestDataSet, TestMetadata, ConnectionInfo } from '../../../support/testing/types';

// Mock NavigationConstants
vi.mock('../../constants/NavigationConstants', () => ({
  default: {
    NAVIGATION_CONTAINER: '[data-testid="main-navigation"], .main-nav, .navbar-nav',
    MAIN_NAVIGATION: '.navigation, .main-nav, .navbar-nav',
    MOBILE_MENU_TOGGLE: '[data-testid="mobile-menu-toggle"]',
    SPA_TIMEOUTS: {
      initialization: 5000,
      navigationRender: 3000,
      routeChange: 5000,
      componentMount: 3000
    },
    getPageConfig: vi.fn().mockReturnValue({
      url: '/customers',
      urlPatterns: ['/customers', '/customer']
    }),
    getSearchInterfaceSelector: vi.fn().mockReturnValue('.customer-search'),
    isTouchTargetAdequate: vi.fn().mockReturnValue(true),
    getViewportCategoryByWidth: vi.fn().mockReturnValue('desktop')
  }
}));

// Mock Constants
vi.mock('../../constants/Constants', () => ({
  default: {
    RESPONSIVE_BREAKPOINT_MOBILE: 768,
    RESPONSIVE_BREAKPOINT_TABLET: 1024,
    MOBILE_VIEWPORT: { width: 375, height: 667 },
    TABLET_VIEWPORT: { width: 768, height: 1024 },
    DESKTOP_VIEWPORT: { width: 1024, height: 768 }
  }
}));

// Mock UIActions and Page
const mockPage = {
  evaluate: vi.fn().mockImplementation((fn, ...args) => {
    // Mock different behaviors based on the function being evaluated
    const fnString = fn.toString();
    
    if (fnString.includes('bugs') || fnString.includes('daffy') || fnString.includes('looney')) {
      return Promise.resolve(true); // Mock finding looneyTunes customers
    }
    
    if (fnString.includes('querySelectorAll')) {
      return Promise.resolve(3); // Mock customer count
    }
    
    return Promise.resolve(true);
  }),
  locator: vi.fn(() => ({
    count: vi.fn().mockResolvedValue(3),
    boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 }),
    elementHandle: vi.fn().mockResolvedValue({}),
    first: vi.fn().mockReturnThis(),
    nth: vi.fn().mockReturnThis()
  })),
  keyboard: {
    press: vi.fn()
  },
  waitForTimeout: vi.fn(),
  waitForFunction: vi.fn(),
  waitForLoadState: vi.fn(),
  viewportSize: vi.fn().mockReturnValue({ width: 1024, height: 768 }),
  url: vi.fn().mockReturnValue('http://localhost:3000/customers')
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
  dropdown: vi.fn().mockReturnValue({
    selectByVisibleText: vi.fn()
  })
} as unknown as UIActions;

describe('CustomersPage Context-Aware Functionality', () => {
  let customersPage: CustomersPage;
  let mockDataContext: DataContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    customersPage = new CustomersPage(mockUIActions);
    
    mockDataContext = {
      mode: TestMode.ISOLATED,
      testData: {
        customers: [
          { id: '1', name: 'Test Customer 1', email: 'test1@example.com', phone: '123-456-7890', isTestData: true },
          { id: '2', name: 'Bugs Bunny - looneyTunesTest', email: 'bugs@looney.com', phone: '123-456-7891', isTestData: true },
          { id: '3', name: 'Daffy Duck - looneyTunesTest', email: 'daffy@looney.com', phone: '123-456-7892', isTestData: true }
        ],
        routes: [
          { id: '1', name: 'Test Route 1', location: 'Cedar Falls', isTestData: true },
          { id: '2', name: 'Test Route 2', location: 'Winfield', isTestData: true }
        ],
        tickets: [
          { id: '1', customerId: '1', routeId: '1', status: 'open', isTestData: true },
          { id: '2', customerId: '2', routeId: '2', status: 'closed', isTestData: true }
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

  describe('Context-Aware Initialization', () => {
    it('should initialize customer page configurations for isolated mode', () => {
      // Arrange & Act
      customersPage.setDataContext(mockDataContext);
      
      // Assert
      expect(customersPage.getTestMode()).toBe(TestMode.ISOLATED);
      expect(customersPage.getDataContext()).toBe(mockDataContext);
    });

    it('should initialize customer page configurations for production mode', () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      
      // Act
      customersPage.setDataContext(productionContext);
      
      // Assert
      expect(customersPage.getTestMode()).toBe(TestMode.PRODUCTION);
    });

    it('should validate customer page context successfully', async () => {
      // Arrange
      customersPage.setDataContext(mockDataContext);
      
      // Act
      const isValid = await customersPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Mode-Specific Customer Element Selection', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should return isolated mode selector for customer list container', () => {
      // Act
      const selector = customersPage.getModeSpecificSelector(
        '[data-testid="customers-container"], .customers-container',
        'customerListContainer'
      );
      
      // Assert
      expect(selector).toBe('[data-testid="customers-container"], .customers-container');
    });

    it('should return production mode selector when in production mode', () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      customersPage.setDataContext(productionContext);
      
      // Act
      const selector = customersPage.getModeSpecificSelector(
        '[data-testid="customers-container"], .customers-container',
        'customerListContainer'
      );
      
      // Assert
      expect(selector).toBe('.customers-container, .customer-list, .customers-list');
    });

    it('should validate customer-specific elements successfully', async () => {
      // Act
      const isValid = await customersPage.validateModeSpecificElements();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Context-Aware Customer Search', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should perform context-aware customer search in isolated mode', async () => {
      // Act & Assert
      await expect(customersPage.searchCustomers('Test Customer'))
        .resolves.not.toThrow();
    });

    it('should perform context-aware customer search in production mode', async () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      customersPage.setDataContext(productionContext);
      
      // Act & Assert
      await expect(customersPage.searchCustomers('Bugs Bunny'))
        .resolves.not.toThrow();
    });

    it('should handle mobile customer search interface', async () => {
      // Arrange
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 375, height: 667 });
      
      // Act & Assert
      await expect(customersPage.searchCustomers('Test'))
        .resolves.not.toThrow();
    });

    it('should verify customer search responsiveness', async () => {
      // Act
      const isResponsive = await customersPage.verifyCustomerSearchResponsiveness();
      
      // Assert
      expect(isResponsive).toBe(true);
    });
  });

  describe('Context-Aware Customer Data Validation', () => {
    it('should validate isolated mode customer requirements', async () => {
      // Arrange
      customersPage.setDataContext(mockDataContext);
      
      // Act
      const isValid = await customersPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should validate production mode customer requirements with looneyTunes data', async () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      customersPage.setDataContext(productionContext);
      
      // Act
      const isValid = await customersPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should fail validation when no looneyTunes customers in production mode', async () => {
      // Arrange
      const productionContextWithoutLooneyTunes = {
        ...mockDataContext,
        mode: TestMode.PRODUCTION,
        testData: {
          ...mockDataContext.testData,
          customers: [
            { id: '1', name: 'Regular Customer', email: 'regular@example.com', phone: '123-456-7890', isTestData: false }
          ]
        }
      };
      customersPage.setDataContext(productionContextWithoutLooneyTunes);
      
      // Act
      const isValid = await customersPage.validateContext();
      
      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle dual mode validation', async () => {
      // Arrange
      const dualContext = { ...mockDataContext, mode: TestMode.DUAL };
      customersPage.setDataContext(dualContext);
      
      // Act
      const isValid = await customersPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Customer List Operations', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should get customer count correctly', async () => {
      // Act
      const count = await customersPage.getCustomerCount();
      
      // Assert
      expect(count).toBe(3);
    });

    it('should view customer details with context awareness', async () => {
      // Act & Assert
      await expect(customersPage.viewCustomerDetails(0))
        .resolves.not.toThrow();
    });

    it('should verify customer contact information', async () => {
      // Act
      const isValid = await customersPage.verifyCustomerContactInfo();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle customer details view on mobile', async () => {
      // Arrange
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 375, height: 667 });
      
      // Act & Assert
      await expect(customersPage.viewCustomerDetails(0))
        .resolves.not.toThrow();
    });
  });

  describe('Customer Filtering with Context Awareness', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should apply customer filters with context awareness', async () => {
      // Act & Assert
      await expect(customersPage.applyCustomerFilters({
        type: 'residential',
        status: 'active',
        location: 'Cedar Falls'
      })).resolves.not.toThrow();
    });

    it('should handle mobile filter interface', async () => {
      // Arrange
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 375, height: 667 });
      
      // Act & Assert
      await expect(customersPage.applyCustomerFilters({
        type: 'commercial'
      })).resolves.not.toThrow();
    });
  });

  describe('Responsive Layout Verification', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should verify customer list responsive layout on desktop', async () => {
      // Act
      const isValid = await customersPage.verifyCustomerListResponsiveLayout();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should verify customer list responsive layout on mobile', async () => {
      // Arrange
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 375, height: 667 });
      
      // Act
      const isValid = await customersPage.verifyCustomerListResponsiveLayout();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should verify customer list responsive layout on tablet', async () => {
      // Arrange
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 768, height: 1024 });
      
      // Act
      const isValid = await customersPage.verifyCustomerListResponsiveLayout();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should handle customer search errors gracefully', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Search element not found')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act & Assert
      await expect(customersPage.searchCustomers('test'))
        .rejects.toThrow();
    });

    it('should handle customer list loading errors', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Customer list not found')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act
      const count = await customersPage.getCustomerCount();
      
      // Assert
      expect(count).toBe(0); // Should handle error gracefully
    });

    it('should handle customer details view errors', async () => {
      // Arrange
      mockPage.locator = vi.fn(() => ({
        count: vi.fn().mockResolvedValue(0), // No customers found
        nth: vi.fn().mockReturnThis()
      }));
      
      // Act & Assert
      await expect(customersPage.viewCustomerDetails(0))
        .rejects.toThrow('Customer index 0 is out of range');
    });
  });

  describe('Test Data Access', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should access test customers from context', () => {
      // Act
      const customers = (customersPage as any).getTestCustomers();
      
      // Assert
      expect(customers).toHaveLength(3);
      expect(customers[0].name).toBe('Test Customer 1');
      expect(customers[1].name).toBe('Bugs Bunny - looneyTunesTest');
      expect(customers[2].name).toBe('Daffy Duck - looneyTunesTest');
    });

    it('should find specific test customer by criteria', () => {
      // Act
      const customer = (customersPage as any).getTestCustomer((c: any) => c.name.includes('Bugs'));
      
      // Assert
      expect(customer).not.toBeNull();
      expect(customer.name).toBe('Bugs Bunny - looneyTunesTest');
    });

    it('should access test routes from context', () => {
      // Act
      const routes = (customersPage as any).getTestRoutes();
      
      // Assert
      expect(routes).toHaveLength(2);
      expect(routes[0].location).toBe('Cedar Falls');
      expect(routes[1].location).toBe('Winfield');
    });
  });

  describe('Debug Information Collection', () => {
    beforeEach(() => {
      customersPage.setDataContext(mockDataContext);
    });

    it('should collect customer page debug information', async () => {
      // Act
      const debugInfo = await customersPage.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.mode).toBe(TestMode.ISOLATED);
      expect(debugInfo.dataContext.hasTestData).toBe(true);
      expect(debugInfo.dataContext.testDataCount).toBe(7); // 3 customers + 2 routes + 2 tickets
      expect(debugInfo.dataContext.testDataTypes).toContain('customers');
      expect(debugInfo.dataContext.testDataTypes).toContain('routes');
      expect(debugInfo.dataContext.testDataTypes).toContain('tickets');
      expect(debugInfo.timestamp).toBeInstanceOf(Date);
    });

    it('should handle debug info collection errors', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Debug collection failed')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act
      const debugInfo = await customersPage.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.errors.length).toBeGreaterThan(0);
    });
  });
});