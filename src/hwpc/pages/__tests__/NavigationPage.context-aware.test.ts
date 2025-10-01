/**
 * Unit tests for NavigationPage Context-Aware functionality
 * 
 * Tests the context-aware navigation functionality including
 * mode-specific element selection, navigation methods, and responsive design validation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Page } from '@playwright/test';
import UIActions from '../../../support/playwright/actions/UIActions';
import NavigationPage from '../NavigationPage';
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
      url: '/test-page',
      urlPatterns: ['/test', '/test-page']
    }),
    getSearchInterfaceSelector: vi.fn().mockReturnValue('.search-interface'),
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
  evaluate: vi.fn().mockResolvedValue(true),
  locator: vi.fn(() => ({
    count: vi.fn().mockResolvedValue(3),
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
  viewportSize: vi.fn().mockReturnValue({ width: 1024, height: 768 }),
  url: vi.fn().mockReturnValue('http://localhost:3000/test-page')
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
  })
} as unknown as UIActions;

describe('NavigationPage Context-Aware Functionality', () => {
  let navigationPage: NavigationPage;
  let mockDataContext: DataContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    navigationPage = new NavigationPage(mockUIActions);
    
    mockDataContext = {
      mode: TestMode.ISOLATED,
      testData: {
        customers: [
          { id: '1', name: 'Test Customer 1', email: 'test1@example.com', phone: '123-456-7890', isTestData: true },
          { id: '2', name: 'Bugs Bunny - looneyTunesTest', email: 'bugs@looney.com', phone: '123-456-7891', isTestData: true }
        ],
        routes: [
          { id: '1', name: 'Test Route 1', location: 'Cedar Falls', isTestData: true },
          { id: '2', name: 'Test Route 2', location: 'Winfield', isTestData: true }
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

  describe('Context-Aware Initialization', () => {
    it('should initialize mode-specific configurations for isolated mode', () => {
      // Arrange
      navigationPage.setDataContext(mockDataContext);
      
      // Act - initialization happens automatically when context is set
      const testMode = navigationPage.getTestMode();
      
      // Assert
      expect(testMode).toBe(TestMode.ISOLATED);
      expect(navigationPage.getDataContext()).toBe(mockDataContext);
    });

    it('should initialize mode-specific configurations for production mode', () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      navigationPage.setDataContext(productionContext);
      
      // Act
      const testMode = navigationPage.getTestMode();
      
      // Assert
      expect(testMode).toBe(TestMode.PRODUCTION);
    });

    it('should validate context successfully with valid test data', async () => {
      // Arrange
      navigationPage.setDataContext(mockDataContext);
      
      // Act
      const isValid = await navigationPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Mode-Specific Element Selection', () => {
    beforeEach(() => {
      navigationPage.setDataContext(mockDataContext);
    });

    it('should return isolated mode selector for navigation container', () => {
      // Act
      const selector = navigationPage.getModeSpecificSelector(
        '[data-testid="main-navigation"], .main-nav, .navbar-nav',
        'navigationContainer'
      );
      
      // Assert
      expect(selector).toBe('[data-testid="main-navigation"], .main-nav');
    });

    it('should return production mode selector when in production mode', () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      navigationPage.setDataContext(productionContext);
      
      // Act
      const selector = navigationPage.getModeSpecificSelector(
        '[data-testid="main-navigation"], .main-nav, .navbar-nav',
        'navigationContainer'
      );
      
      // Assert
      expect(selector).toBe('.navigation, .nav-menu, [data-testid="main-navigation"]');
    });

    it('should validate mode-specific elements successfully', async () => {
      // Act
      const isValid = await navigationPage.validateModeSpecificElements();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Context-Aware Navigation Methods', () => {
    beforeEach(() => {
      navigationPage.setDataContext(mockDataContext);
    });

    it('should perform context-aware navigation to page', async () => {
      // Act & Assert
      await expect(navigationPage.contextAwareNavigateToPage('customers'))
        .resolves.not.toThrow();
    });

    it('should perform context-aware search', async () => {
      // Act & Assert
      await expect(navigationPage.contextAwareSearch('test search', 'customers'))
        .resolves.not.toThrow();
    });

    it('should verify context-aware responsive design', async () => {
      // Act
      const isValid = await navigationPage.verifyContextAwareResponsiveDesign();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Mode-Specific Requirements Validation', () => {
    it('should validate isolated mode requirements successfully', async () => {
      // Arrange
      navigationPage.setDataContext(mockDataContext);
      
      // Act
      const isValid = await navigationPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should validate production mode requirements with looneyTunes data', async () => {
      // Arrange
      const productionContext = { ...mockDataContext, mode: TestMode.PRODUCTION };
      navigationPage.setDataContext(productionContext);
      
      // Act
      const isValid = await navigationPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle dual mode validation', async () => {
      // Arrange
      const dualContext = { ...mockDataContext, mode: TestMode.DUAL };
      navigationPage.setDataContext(dualContext);
      
      // Act
      const isValid = await navigationPage.validateContext();
      
      // Assert
      expect(isValid).toBe(true);
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
      navigationPage.setDataContext(emptyDataContext);
      
      // Act
      const isValid = await navigationPage.validateContext();
      
      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Debug Information Collection', () => {
    beforeEach(() => {
      navigationPage.setDataContext(mockDataContext);
    });

    it('should collect mode-specific debug information', async () => {
      // Act
      const debugInfo = await navigationPage.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.mode).toBe(TestMode.ISOLATED);
      expect(debugInfo.dataContext.hasTestData).toBe(true);
      expect(debugInfo.dataContext.testDataCount).toBe(4); // 2 customers + 2 routes + 1 ticket
      expect(debugInfo.dataContext.testDataTypes).toContain('customers');
      expect(debugInfo.dataContext.testDataTypes).toContain('routes');
      expect(debugInfo.dataContext.testDataTypes).toContain('tickets');
      expect(debugInfo.elements.expected).toBeGreaterThan(0);
      expect(debugInfo.timestamp).toBeInstanceOf(Date);
    });

    it('should handle debug info collection with errors', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Element not found')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act
      const debugInfo = await navigationPage.getModeSpecificDebugInfo();
      
      // Assert
      expect(debugInfo.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      navigationPage.setDataContext(mockDataContext);
    });

    it('should handle navigation errors gracefully', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Navigation element not found')),
        click: vi.fn().mockRejectedValue(new Error('Click failed')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act & Assert
      await expect(navigationPage.contextAwareNavigateToPage('customers'))
        .rejects.toThrow();
    });

    it('should handle search errors gracefully', async () => {
      // Arrange
      mockUIActions.element = vi.fn().mockReturnValue({
        isVisible: vi.fn().mockRejectedValue(new Error('Search element not found')),
        getLocator: vi.fn().mockReturnValue({
          boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
        })
      });
      
      // Act & Assert
      await expect(navigationPage.contextAwareSearch('test'))
        .rejects.toThrow();
    });

    it('should use fallback selectors when primary selectors fail', async () => {
      // Arrange
      let callCount = 0;
      mockUIActions.element = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            isVisible: vi.fn().mockRejectedValue(new Error('Primary selector failed')),
            click: vi.fn().mockRejectedValue(new Error('Primary selector failed')),
            getLocator: vi.fn().mockReturnValue({
              boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
            })
          };
        } else {
          // Fallback succeeds
          return {
            isVisible: vi.fn().mockResolvedValue(true),
            click: vi.fn().mockResolvedValue(undefined),
            getLocator: vi.fn().mockReturnValue({
              boundingBox: vi.fn().mockResolvedValue({ width: 100, height: 50 })
            })
          };
        }
      });
      
      // Act & Assert
      await expect(navigationPage.contextAwareClick('navigationContainer'))
        .resolves.not.toThrow();
    });
  });

  describe('Mobile Responsiveness with Context Awareness', () => {
    beforeEach(() => {
      // Set mobile viewport
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 375, height: 667 });
      navigationPage.setDataContext(mockDataContext);
    });

    it('should handle mobile-specific navigation elements', async () => {
      // Act
      const isValid = await navigationPage.validateModeSpecificElements();
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should verify mobile navigation responsiveness', async () => {
      // Act
      const isValid = await navigationPage.verifyContextAwareResponsiveDesign();
      
      // Assert
      expect(isValid).toBe(true);
    });
  });
});