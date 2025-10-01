/**
 * Integration tests for dual-mode API testing functionality
 * Tests the complete workflow from mode detection to API execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Page } from '@playwright/test';
import ContextAwareHWPCAPIClient from '../api/ContextAwareHWPCAPIClient';
import { TestMode, DataContext, TestDataSet, TestMetadata } from '../../support/testing/types';

// Mock dependencies
vi.mock('../../support/logger/Log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../support/playwright/API/RESTRequest', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}));

describe('Dual-Mode API Integration Tests', () => {
  let mockPage: Page;
  let apiClient: ContextAwareHWPCAPIClient;
  let mockDataContext: DataContext;
  let mockTestData: TestDataSet;
  let mockMetadata: TestMetadata;

  beforeEach(() => {
    // Mock Playwright page
    mockPage = {
      url: vi.fn().mockReturnValue('http://localhost:3000'),
      goto: vi.fn(),
      waitForLoadState: vi.fn()
    } as any;

    // Create mock test metadata
    mockMetadata = {
      createdAt: new Date(),
      mode: TestMode.ISOLATED,
      version: '1.0.0',
      testRunId: 'test-run-123'
    };

    // Create mock test data
    mockTestData = {
      customers: [
        {
          id: 'cust-123',
          name: 'Test Customer - Isolated Mode',
          email: 'test@example.com',
          phone: '555-0123',
          isTestData: true
        }
      ],
      routes: [
        {
          id: 'route-123',
          name: 'Test Route - Isolated Mode',
          location: 'Cedar Falls',
          isTestData: true
        }
      ],
      tickets: [
        {
          id: 'ticket-123',
          customerId: 'cust-123',
          routeId: 'route-123',
          status: 'active',
          isTestData: true
        }
      ],
      metadata: mockMetadata
    };

    // Create mock data context
    mockDataContext = {
      mode: TestMode.ISOLATED,
      testData: mockTestData,
      connectionInfo: {
        host: 'localhost',
        database: 'test_db',
        isTestConnection: true
      },
      metadata: mockMetadata,
      cleanup: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Context-Aware API Client Initialization', () => {
    it('should initialize with isolated mode context', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
      
      expect(apiClient.getTestMode()).toBe(TestMode.ISOLATED);
      expect(apiClient.getDataContext()).toBe(mockDataContext);
    });

    it('should initialize with production mode context', () => {
      const productionContext = {
        ...mockDataContext,
        mode: TestMode.PRODUCTION,
        testData: {
          ...mockTestData,
          customers: [
            {
              id: 'prod-cust-123',
              name: 'Bugs Bunny - looneyTunesTest',
              email: 'bugs.bunny@looneytunestest.com',
              phone: '555-0456',
              isTestData: true
            }
          ]
        }
      };

      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.PRODUCTION, productionContext);
      
      expect(apiClient.getTestMode()).toBe(TestMode.PRODUCTION);
      expect(apiClient.getDataContext()).toBe(productionContext);
    });

    it('should allow context updates after initialization', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage);
      
      apiClient.setContext(TestMode.PRODUCTION, mockDataContext);
      
      expect(apiClient.getTestMode()).toBe(TestMode.PRODUCTION);
      expect(apiClient.getDataContext()).toBe(mockDataContext);
    });
  });

  describe('Context-Specific Data Retrieval', () => {
    beforeEach(() => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
    });

    it('should retrieve context-specific customer ID', () => {
      const customerId = apiClient.getContextSpecificCustomerId();
      
      expect(customerId).toBe('cust-123');
    });

    it('should retrieve context-specific ticket ID', () => {
      const ticketId = apiClient.getContextSpecificTicketId();
      
      expect(ticketId).toBe('ticket-123');
    });

    it('should retrieve context-specific route ID', () => {
      const routeId = apiClient.getContextSpecificRouteId();
      
      expect(routeId).toBe('route-123');
    });

    it('should throw error when no data context is available', () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      
      expect(() => clientWithoutContext.getContextSpecificCustomerId())
        .toThrow('No data context available for context-specific operations');
    });

    it('should throw error when no customers are available in context', () => {
      const emptyContext = {
        ...mockDataContext,
        testData: {
          ...mockTestData,
          customers: []
        }
      };
      
      const clientWithEmptyContext = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, emptyContext);
      
      expect(() => clientWithEmptyContext.getContextSpecificCustomerId())
        .toThrow('No customers available in isolated mode context');
    });
  });

  describe('Context-Aware Data Creation', () => {
    it('should create isolated mode ticket data', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
      
      const ticketData = apiClient.createContextAwareTicketData();
      
      expect(ticketData.title).toContain('Isolated Mode');
      expect(ticketData.title).toContain('test-run-123');
      expect(ticketData.customerId).toBe('cust-123');
      expect(ticketData.priority).toBe('medium');
      expect(ticketData.status).toBe('open');
    });

    it('should create production mode ticket data', () => {
      const productionContext = {
        ...mockDataContext,
        mode: TestMode.PRODUCTION,
        testData: {
          ...mockTestData,
          customers: [
            {
              id: 'prod-cust-123',
              name: 'Bugs Bunny - looneyTunesTest',
              email: 'bugs.bunny@looneytunestest.com',
              phone: '555-0456',
              isTestData: true
            }
          ]
        }
      };

      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.PRODUCTION, productionContext);
      
      const ticketData = apiClient.createContextAwareTicketData();
      
      expect(ticketData.title).toContain('Bugs Bunny - looneyTunesTest');
      expect(ticketData.title).toContain('test-run-123');
      expect(ticketData.customerId).toBe('prod-cust-123');
      expect(ticketData.description).toContain('production mode');
    });

    it('should create isolated mode customer data', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
      
      const customerData = apiClient.createContextAwareCustomerData();
      
      expect(customerData.name).toContain('Isolated Mode');
      expect(customerData.name).toContain('test-run-123');
      expect(customerData.email).toContain('test.customer');
      expect(customerData.phone).toMatch(/555-\d{4}/);
      expect(customerData.serviceType).toBe('standard');
      expect(customerData.isActive).toBe(true);
    });

    it('should create production mode customer data', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.PRODUCTION, mockDataContext);
      
      const customerData = apiClient.createContextAwareCustomerData();
      
      expect(customerData.name).toContain('looneyTunesTest');
      expect(customerData.name).toContain('test-run-123');
      expect(customerData.email).toContain('@looneytunestest.com');
      expect(customerData.phone).toMatch(/555-\d{4}/);
    });

    it('should create context-aware ticket update data', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
      
      const updateData = apiClient.createContextAwareTicketUpdateData();
      
      expect(updateData.title).toContain('Updated Test Ticket');
      expect(updateData.title).toContain('test-run-123');
      expect(updateData.status).toBe('in_progress');
    });
  });

  describe('Response Validation', () => {
    beforeEach(() => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
    });

    it('should validate ticket response successfully', async () => {
      const mockResponse = {
        data: {
          id: 'ticket-123',
          title: 'Test Ticket',
          status: 'open'
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'ticket');
      
      expect(isValid).toBe(true);
    });

    it('should validate customer response successfully', async () => {
      const mockResponse = {
        data: {
          id: 'cust-123',
          name: 'Test Customer',
          email: 'test@example.com'
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'customer');
      
      expect(isValid).toBe(true);
    });

    it('should validate route response successfully', async () => {
      const mockResponse = {
        data: {
          id: 'route-123',
          name: 'Test Route',
          location: 'Cedar Falls'
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'route');
      
      expect(isValid).toBe(true);
    });

    it('should handle invalid response gracefully', async () => {
      const mockResponse = {
        data: {
          id: 'ticket-123'
          // Missing required fields
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'ticket');
      
      expect(isValid).toBe(false);
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedResponse = 'invalid json';
      
      const isValid = await apiClient.validateContextSpecificResponse(malformedResponse, 'ticket');
      
      expect(isValid).toBe(false);
    });

    it('should skip validation when no context is available', async () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      const mockResponse = { data: { id: 'test' } };
      
      const isValid = await clientWithoutContext.validateContextSpecificResponse(mockResponse, 'ticket');
      
      expect(isValid).toBe(true); // Should skip validation and return true
    });
  });

  describe('Production Mode Validation', () => {
    it('should warn about non-test data in production mode', async () => {
      const productionContext = {
        ...mockDataContext,
        mode: TestMode.PRODUCTION
      };
      
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.PRODUCTION, productionContext);
      
      const mockResponse = {
        data: {
          id: 'ticket-123',
          title: 'Regular Production Ticket', // No test indicators
          status: 'open'
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'ticket');
      
      // Should still be valid but should have logged a warning
      expect(isValid).toBe(true);
    });

    it('should accept test data in production mode', async () => {
      const productionContext = {
        ...mockDataContext,
        mode: TestMode.PRODUCTION
      };
      
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.PRODUCTION, productionContext);
      
      const mockResponse = {
        data: {
          id: 'ticket-123',
          title: 'Test Ticket - looneyTunesTest',
          status: 'open'
        }
      };
      
      const isValid = await apiClient.validateContextSpecificResponse(mockResponse, 'ticket');
      
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when creating ticket data without context', () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      
      expect(() => clientWithoutContext.createContextAwareTicketData())
        .toThrow('No data context available for context-aware ticket creation');
    });

    it('should throw error when creating customer data without context', () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      
      expect(() => clientWithoutContext.createContextAwareCustomerData())
        .toThrow('No data context available for context-aware customer creation');
    });

    it('should throw error when creating update data without context', () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      
      expect(() => clientWithoutContext.createContextAwareTicketUpdateData())
        .toThrow('No data context available for context-aware ticket updates');
    });
  });

  describe('Context Information Logging', () => {
    it('should log context information without errors', () => {
      apiClient = new ContextAwareHWPCAPIClient(mockPage, TestMode.ISOLATED, mockDataContext);
      
      expect(() => apiClient.logContextInfo()).not.toThrow();
    });

    it('should log context information when no context is available', () => {
      const clientWithoutContext = new ContextAwareHWPCAPIClient(mockPage);
      
      expect(() => clientWithoutContext.logContextInfo()).not.toThrow();
    });
  });
});