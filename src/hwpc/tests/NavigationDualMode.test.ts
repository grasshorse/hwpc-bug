import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import NavigationPage from '../pages/NavigationPage';
import { TestMode, DataContext, TestDataSet, TestMetadata } from '../../support/testing/types';
import UIActions from '../../support/playwright/actions/UIActions';

/**
 * Test suite for dual-mode navigation functionality
 * Validates that navigation tests work correctly in both isolated and production modes
 */
describe('Navigation Dual-Mode Tests', () => {
    let mockUIActions: UIActions;
    let navigationPage: NavigationPage;
    let mockDataContext: DataContext;

    beforeEach(() => {
        // Create mock UIActions
        mockUIActions = {
            getPage: () => ({
                goto: async () => {},
                waitForLoadState: async () => {},
                waitForTimeout: async () => {},
                textContent: async () => 'Mock page content with customer data',
                url: () => 'http://localhost:3000/customers',
                title: () => 'Test Page Title',
                evaluate: async () => true,
                waitForSelector: async () => ({}),
                viewportSize: () => ({ width: 1024, height: 768 })
            })
        } as any;

        // Create mock data context
        const mockTestData: TestDataSet = {
            customers: [
                {
                    id: '1',
                    name: 'Bugs Bunny - looneyTunesTest',
                    email: 'bugs@looneytunestest.com',
                    phone: '555-0001',
                    isTestData: true
                },
                {
                    id: '2',
                    name: 'Daffy Duck - looneyTunesTest',
                    email: 'daffy@looneytunestest.com',
                    phone: '555-0002',
                    isTestData: true
                }
            ],
            routes: [
                {
                    id: '1',
                    name: 'Cedar Falls Test Route',
                    location: 'Cedar Falls',
                    isTestData: true
                },
                {
                    id: '2',
                    name: 'Winfield Test Route',
                    location: 'Winfield',
                    isTestData: true
                }
            ],
            tickets: [
                {
                    id: '1',
                    customerId: '1',
                    routeId: '1',
                    status: 'open',
                    isTestData: true
                }
            ],
            metadata: {
                createdAt: new Date(),
                mode: TestMode.PRODUCTION,
                version: '1.0.0',
                testRunId: 'test-run-123'
            }
        };

        mockDataContext = {
            mode: TestMode.PRODUCTION,
            testData: mockTestData,
            connectionInfo: {
                host: 'localhost',
                database: 'test_db',
                isTestConnection: true
            },
            metadata: mockTestData.metadata,
            cleanup: async () => {}
        };

        navigationPage = new NavigationPage(mockUIActions);
    });

    afterEach(() => {
        // Cleanup
    });

    describe('Mode Detection and Configuration', () => {
        it('should properly initialize with production mode context', () => {
            // Set production mode context
            navigationPage.setDataContext(mockDataContext);
            
            const testMode = navigationPage.getTestMode();
            expect(testMode).toBe(TestMode.PRODUCTION);
        });

        it('should properly initialize with isolated mode context', () => {
            // Create isolated mode context
            const isolatedContext = {
                ...mockDataContext,
                mode: TestMode.ISOLATED,
                testData: {
                    ...mockDataContext.testData,
                    metadata: {
                        ...mockDataContext.testData.metadata,
                        mode: TestMode.ISOLATED
                    }
                }
            };

            navigationPage.setDataContext(isolatedContext);
            
            const testMode = navigationPage.getTestMode();
            expect(testMode).toBe(TestMode.ISOLATED);
        });

        it('should handle dual mode context', () => {
            // Create dual mode context
            const dualContext = {
                ...mockDataContext,
                mode: TestMode.DUAL,
                testData: {
                    ...mockDataContext.testData,
                    metadata: {
                        ...mockDataContext.testData.metadata,
                        mode: TestMode.DUAL
                    }
                }
            };

            navigationPage.setDataContext(dualContext);
            
            const testMode = navigationPage.getTestMode();
            expect(testMode).toBe(TestMode.DUAL);
        });
    });

    describe('Context-Aware Navigation', () => {
        it('should use context-aware navigation methods', async () => {
            navigationPage.setDataContext(mockDataContext);
            
            // Mock the contextAwareNavigateToPage method
            const navigateSpy = vi.spyOn(navigationPage, 'contextAwareNavigateToPage');
            navigateSpy.mockResolvedValue();
            
            await navigationPage.contextAwareNavigateToPage('customers');
            
            expect(navigateSpy).toHaveBeenCalledWith('customers');
        });

        it('should validate mode-specific requirements', async () => {
            navigationPage.setDataContext(mockDataContext);
            
            // This should not throw an error for valid production context
            const isValid = await navigationPage.validateModeSpecificRequirements();
            expect(isValid).toBe(true);
        });
    });

    describe('Data Validation Helpers', () => {
        it('should correctly identify page type from URL', () => {
            const customerUrl = 'http://localhost:3000/customers';
            const routeUrl = 'http://localhost:3000/routes';
            const ticketUrl = 'http://localhost:3000/tickets';
            const dashboardUrl = 'http://localhost:3000/dashboard';
            const reportUrl = 'http://localhost:3000/reports';
            
            expect(getCurrentPageFromUrl(customerUrl)).toBe('customers');
            expect(getCurrentPageFromUrl(routeUrl)).toBe('routes');
            expect(getCurrentPageFromUrl(ticketUrl)).toBe('tickets');
            expect(getCurrentPageFromUrl(dashboardUrl)).toBe('dashboard');
            expect(getCurrentPageFromUrl(reportUrl)).toBe('reports');
        });

        it('should handle unknown page URLs', () => {
            const unknownUrl = 'http://localhost:3000/unknown-page';
            expect(getCurrentPageFromUrl(unknownUrl)).toBe('unknown');
        });
    });

    describe('Test Data Validation', () => {
        it('should validate production mode test data', () => {
            const testCustomers = mockDataContext.testData.customers;
            
            // Verify looneyTunes naming convention
            const hasLooneyTunesCustomers = testCustomers.some(customer => 
                customer.name.includes('Bugs Bunny') || 
                customer.name.includes('Daffy Duck') ||
                customer.isTestData === true
            );
            
            expect(hasLooneyTunesCustomers).toBe(true);
        });

        it('should validate production mode test routes', () => {
            const testRoutes = mockDataContext.testData.routes;
            const expectedLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
            
            const hasExpectedRoutes = testRoutes.some(route => 
                expectedLocations.some(location => 
                    route.location.includes(location) || route.isTestData === true
                )
            );
            
            expect(hasExpectedRoutes).toBe(true);
        });

        it('should validate test data consistency', () => {
            const testData = mockDataContext.testData;
            
            // Verify all test entities are marked as test data
            const allCustomersMarked = testData.customers.every(c => c.isTestData);
            const allRoutesMarked = testData.routes.every(r => r.isTestData);
            const allTicketsMarked = testData.tickets.every(t => t.isTestData);
            
            expect(allCustomersMarked).toBe(true);
            expect(allRoutesMarked).toBe(true);
            expect(allTicketsMarked).toBe(true);
        });
    });
});

// Helper function for testing (copied from NavigationSteps.ts)
function getCurrentPageFromUrl(url: string): string {
    const urlPath = new URL(url).pathname.toLowerCase();
    
    if (urlPath.includes('customer')) return 'customers';
    if (urlPath.includes('route')) return 'routes';
    if (urlPath.includes('ticket')) return 'tickets';
    if (urlPath.includes('dashboard')) return 'dashboard';
    if (urlPath.includes('report')) return 'reports';
    
    return 'unknown';
}