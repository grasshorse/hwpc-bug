import { Page } from '@playwright/test';
import { ICreateAttachment } from '@cucumber/cucumber/lib/runtime/attachment_manager';
import HWPCAPIClient from './HWPCAPIClient';
import { TestMode, DataContext, TestCustomer, TestRoute, TestTicket } from '../../support/testing/types';
import Log from '../../support/logger/Log';

/**
 * Context-aware HWPC API Client that adapts to different testing modes
 * Extends the base HWPCAPIClient with dual-mode support
 */
export default class ContextAwareHWPCAPIClient extends HWPCAPIClient {
    private testMode: TestMode;
    private dataContext: DataContext | null = null;

    constructor(page: Page, testMode: TestMode = TestMode.ISOLATED, dataContext?: DataContext) {
        super(page);
        this.testMode = testMode;
        this.dataContext = dataContext || null;
    }

    /**
     * Sets the test mode and data context for this client
     */
    public setContext(testMode: TestMode, dataContext: DataContext): void {
        this.testMode = testMode;
        this.dataContext = dataContext;
        Log.info(`API client context set to ${testMode} mode`);
    }

    /**
     * Gets a context-specific customer ID based on the current test mode
     */
    public getContextSpecificCustomerId(): string {
        if (!this.dataContext) {
            throw new Error('No data context available for context-specific operations');
        }

        const customers = this.dataContext.testData.customers;
        if (!customers || customers.length === 0) {
            throw new Error(`No customers available in ${this.testMode} mode context`);
        }

        // Return the first available customer ID
        const customer = customers[0];
        Log.info(`Using context-specific customer: ${customer.name} (${customer.id}) in ${this.testMode} mode`);
        return customer.id;
    }

    /**
     * Gets a context-specific ticket ID based on the current test mode
     */
    public getContextSpecificTicketId(): string {
        if (!this.dataContext) {
            throw new Error('No data context available for context-specific operations');
        }

        const tickets = this.dataContext.testData.tickets;
        if (!tickets || tickets.length === 0) {
            throw new Error(`No tickets available in ${this.testMode} mode context`);
        }

        // Return the first available ticket ID
        const ticket = tickets[0];
        Log.info(`Using context-specific ticket: ${ticket.id} in ${this.testMode} mode`);
        return ticket.id;
    }

    /**
     * Gets a context-specific route ID based on the current test mode
     */
    public getContextSpecificRouteId(): string {
        if (!this.dataContext) {
            throw new Error('No data context available for context-specific operations');
        }

        const routes = this.dataContext.testData.routes;
        if (!routes || routes.length === 0) {
            throw new Error(`No routes available in ${this.testMode} mode context`);
        }

        // Return the first available route ID
        const route = routes[0];
        Log.info(`Using context-specific route: ${route.name} (${route.id}) in ${this.testMode} mode`);
        return route.id;
    }

    /**
     * Creates context-aware ticket data based on the current test mode
     */
    public createContextAwareTicketData(): any {
        if (!this.dataContext) {
            throw new Error('No data context available for context-aware ticket creation');
        }

        const customers = this.dataContext.testData.customers;
        if (!customers || customers.length === 0) {
            throw new Error(`No customers available in ${this.testMode} mode context`);
        }

        const customer = customers[0];
        const testRunId = this.dataContext.testData.metadata.testRunId;

        let ticketData: any;

        if (this.testMode === TestMode.PRODUCTION) {
            // Production mode: Use Looney Tunes test data
            ticketData = {
                title: `Test API Ticket - ${customer.name} - ${testRunId}`,
                description: `This is a test ticket created via API for ${customer.name} in production mode`,
                priority: "medium",
                status: "open",
                category: "general",
                customerId: customer.id
            };
        } else {
            // Isolated mode: Use generic test data
            ticketData = {
                title: `Test API Ticket - Isolated Mode - ${testRunId}`,
                description: `This is a test ticket created via API in isolated mode`,
                priority: "medium",
                status: "open",
                category: "general",
                customerId: customer.id
            };
        }

        Log.info(`Created context-aware ticket data for ${this.testMode} mode: ${ticketData.title}`);
        return ticketData;
    }

    /**
     * Creates context-aware customer data based on the current test mode
     */
    public createContextAwareCustomerData(): any {
        if (!this.dataContext) {
            throw new Error('No data context available for context-aware customer creation');
        }

        const testRunId = this.dataContext.testData.metadata.testRunId;
        let customerData: any;

        if (this.testMode === TestMode.PRODUCTION) {
            // Production mode: Use Looney Tunes naming convention
            const characters = ['Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird'];
            const character = characters[Math.floor(Math.random() * characters.length)];
            
            customerData = {
                name: `${character} - looneyTunesTest - ${testRunId}`,
                email: `${character.toLowerCase().replace(/\s+/g, '.')}@looneytunestest.com`,
                phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                serviceType: "standard",
                isActive: true
            };
        } else {
            // Isolated mode: Use generic test data
            customerData = {
                name: `Test Customer - Isolated Mode - ${testRunId}`,
                email: `test.customer.${testRunId}@example.com`,
                phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                serviceType: "standard",
                isActive: true
            };
        }

        Log.info(`Created context-aware customer data for ${this.testMode} mode: ${customerData.name}`);
        return customerData;
    }

    /**
     * Creates context-aware update data for tickets
     */
    public createContextAwareTicketUpdateData(): any {
        if (!this.dataContext) {
            throw new Error('No data context available for context-aware ticket updates');
        }

        const testRunId = this.dataContext.testData.metadata.testRunId;
        let updateData: any;

        if (this.testMode === TestMode.PRODUCTION) {
            updateData = {
                title: `Updated Test Ticket - Production Mode - ${testRunId}`,
                status: "in_progress"
            };
        } else {
            updateData = {
                title: `Updated Test Ticket - Isolated Mode - ${testRunId}`,
                status: "in_progress"
            };
        }

        Log.info(`Created context-aware ticket update data for ${this.testMode} mode`);
        return updateData;
    }

    /**
     * Validates that the response contains context-appropriate data
     */
    public async validateContextSpecificResponse(response: any, expectedType: 'ticket' | 'customer' | 'route'): Promise<boolean> {
        if (!this.dataContext) {
            Log.info('No data context available for response validation');
            return true; // Skip validation if no context
        }

        try {
            const responseBody = typeof response === 'string' ? JSON.parse(response) : response;
            const data = responseBody.data || responseBody;

            switch (expectedType) {
                case 'ticket':
                    return this.validateTicketResponse(data);
                case 'customer':
                    return this.validateCustomerResponse(data);
                case 'route':
                    return this.validateRouteResponse(data);
                default:
                    Log.info(`Unknown response type for validation: ${expectedType}`);
                    return true;
            }
        } catch (error) {
            Log.error(`Failed to validate context-specific response: ${error.message}`);
            return false;
        }
    }

    /**
     * Gets the current test mode
     */
    public getTestMode(): TestMode {
        return this.testMode;
    }

    /**
     * Gets the current data context
     */
    public getDataContext(): DataContext | null {
        return this.dataContext;
    }

    /**
     * Logs context information for debugging
     */
    public logContextInfo(): void {
        Log.info(`API Client Context Info:`);
        Log.info(`  Mode: ${this.testMode}`);
        Log.info(`  Has Data Context: ${!!this.dataContext}`);
        
        if (this.dataContext) {
            Log.info(`  Test Run ID: ${this.dataContext.testData.metadata.testRunId}`);
            Log.info(`  Customers: ${this.dataContext.testData.customers?.length || 0}`);
            Log.info(`  Routes: ${this.dataContext.testData.routes?.length || 0}`);
            Log.info(`  Tickets: ${this.dataContext.testData.tickets?.length || 0}`);
        }
    }

    // Private validation methods

    private validateTicketResponse(data: any): boolean {
        if (this.testMode === TestMode.PRODUCTION) {
            // In production mode, validate that test data follows naming conventions
            if (data.title && !data.title.includes('looneyTunesTest') && !data.title.includes('Test')) {
                Log.info(`Production mode ticket response may not be test data: ${data.title}`);
            }
        }
        
        // Basic validation - ticket should have required fields
        return !!(data.id && data.title && data.status);
    }

    private validateCustomerResponse(data: any): boolean {
        if (this.testMode === TestMode.PRODUCTION) {
            // In production mode, validate that test data follows naming conventions
            if (data.name && !data.name.includes('looneyTunesTest') && !data.name.includes('Test')) {
                Log.info(`Production mode customer response may not be test data: ${data.name}`);
            }
        }
        
        // Basic validation - customer should have required fields
        return !!(data.id && data.name && data.email);
    }

    private validateRouteResponse(data: any): boolean {
        if (this.testMode === TestMode.PRODUCTION) {
            // In production mode, validate that test data follows naming conventions
            if (data.name && !data.name.includes('looneyTunesTest') && !data.name.includes('Test')) {
                Log.info(`Production mode route response may not be test data: ${data.name}`);
            }
        }
        
        // Basic validation - route should have required fields
        return !!(data.id && data.name && data.location);
    }
}