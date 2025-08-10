import { Page } from '@playwright/test';
import { ICreateAttachment } from '@cucumber/cucumber/lib/runtime/attachment_manager';
import RESTRequest from '../../support/playwright/API/RESTRequest';
import RESTResponse from '../../support/playwright/API/RESTResponse';
import RequestHeader from '../../support/playwright/API/RequestHeader';
import Log from '../../support/logger/Log';
import HWPCAPIConstants from './HWPCAPIConstants';

/**
 * HWPC API Client - Extends existing REST framework patterns for HWPC-specific API operations
 * Handles authentication, session management, and HWPC-specific endpoints
 */
export default class HWPCAPIClient {
    private restRequest: RESTRequest;
    private sessionToken: string | null = null;
    private authToken: string | null = null;

    constructor(private page: Page) {
        this.restRequest = new RESTRequest(page);
    }

    /**
     * Creates standard HWPC API headers (no authentication required currently)
     * @returns RequestHeader object with standard HWPC headers
     */
    private getStandardHeaders(): any {
        return new RequestHeader()
            .set(HWPCAPIConstants.CONTENT_TYPE, HWPCAPIConstants.APPLICATION_JSON)
            .set(HWPCAPIConstants.ACCEPT, HWPCAPIConstants.APPLICATION_JSON)
            .get();
    }

    /**
     * Get current user profile (no authentication required currently)
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - User profile response
     */
    public async getCurrentUser(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving current user profile');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.AUTH_USER_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.USER_PROFILE
        );
    }

    /**
     * Update user preferences
     * @param attach - Cucumber attachment function
     * @param preferences - User preferences data
     * @returns Promise<RESTResponse> - Update response
     */
    public async updateUserPreferences(attach: ICreateAttachment, preferences: any): Promise<RESTResponse> {
        Log.info('Updating user preferences');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.AUTH_PREFERENCES_EP}`;
        return await this.restRequest.put(
            attach,
            endPoint,
            this.getStandardHeaders(),
            JSON.stringify(preferences),
            HWPCAPIConstants.USER_PREFERENCES
        );
    }

    /**
     * Get all tickets
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All tickets response
     */
    public async getAllTickets(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving all tickets');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.TICKETS_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.ALL_TICKETS
        );
    }

    /**
     * Get ticket by ID
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @returns Promise<RESTResponse> - Single ticket response
     */
    public async getTicketById(attach: ICreateAttachment, ticketId: string): Promise<RESTResponse> {
        Log.info(`Retrieving ticket with ID: ${ticketId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.SINGLE_TICKET
        );
    }

    /**
     * Get tickets by customer ID
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Customer tickets response
     */
    public async getTicketsByCustomer(attach: ICreateAttachment, customerId: string): Promise<RESTResponse> {
        Log.info(`Retrieving tickets for customer: ${customerId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.TICKETS_BY_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.CUSTOMER_TICKETS
        );
    }

    /**
     * Get tickets by status
     * @param attach - Cucumber attachment function
     * @param status - Ticket status
     * @returns Promise<RESTResponse> - Status tickets response
     */
    public async getTicketsByStatus(attach: ICreateAttachment, status: string): Promise<RESTResponse> {
        Log.info(`Retrieving tickets with status: ${status}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.TICKETS_BY_STATUS_EP.replace('{status}', status)}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.STATUS_TICKETS
        );
    }

    /**
     * Get ticket statistics
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Ticket statistics response
     */
    public async getTicketStats(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving ticket statistics');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.TICKET_STATS_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.TICKET_STATISTICS
        );
    }

    /**
     * Create a new ticket
     * @param attach - Cucumber attachment function
     * @param ticketData - Ticket creation data
     * @returns Promise<RESTResponse> - Created ticket response
     */
    public async createTicket(attach: ICreateAttachment, ticketData: any): Promise<RESTResponse> {
        Log.info('Creating new ticket');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.TICKETS_EP}`;
        return await this.restRequest.post(
            attach,
            endPoint,
            this.getStandardHeaders(),
            JSON.stringify(ticketData),
            HWPCAPIConstants.CREATE_TICKET
        );
    }

    /**
     * Update an existing ticket
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @param ticketData - Updated ticket data
     * @returns Promise<RESTResponse> - Updated ticket response
     */
    public async updateTicket(attach: ICreateAttachment, ticketId: string, ticketData: any): Promise<RESTResponse> {
        Log.info(`Updating ticket with ID: ${ticketId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.put(
            attach,
            endPoint,
            this.getStandardHeaders(),
            JSON.stringify(ticketData),
            HWPCAPIConstants.UPDATE_TICKET
        );
    }

    /**
     * Delete a ticket
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @returns Promise<RESTResponse> - Delete response
     */
    public async deleteTicket(attach: ICreateAttachment, ticketId: string): Promise<RESTResponse> {
        Log.info(`Deleting ticket with ID: ${ticketId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.delete(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.DELETE_TICKET
        );
    }

    // ===== CUSTOMER MANAGEMENT =====

    /**
     * Get all customers
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All customers response
     */
    public async getAllCustomers(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving all customers');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.CUSTOMERS_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.ALL_CUSTOMERS
        );
    }

    /**
     * Get customer by ID
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Single customer response
     */
    public async getCustomerById(attach: ICreateAttachment, customerId: string): Promise<RESTResponse> {
        Log.info(`Retrieving customer with ID: ${customerId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.SINGLE_CUSTOMER
        );
    }

    /**
     * Create a new customer
     * @param attach - Cucumber attachment function
     * @param customerData - Customer creation data
     * @returns Promise<RESTResponse> - Created customer response
     */
    public async createCustomer(attach: ICreateAttachment, customerData: any): Promise<RESTResponse> {
        Log.info('Creating new customer');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.CUSTOMERS_EP}`;
        return await this.restRequest.post(
            attach,
            endPoint,
            this.getStandardHeaders(),
            JSON.stringify(customerData),
            HWPCAPIConstants.CREATE_CUSTOMER
        );
    }

    /**
     * Update an existing customer
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @param customerData - Updated customer data
     * @returns Promise<RESTResponse> - Updated customer response
     */
    public async updateCustomer(attach: ICreateAttachment, customerId: string, customerData: any): Promise<RESTResponse> {
        Log.info(`Updating customer with ID: ${customerId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.put(
            attach,
            endPoint,
            this.getStandardHeaders(),
            JSON.stringify(customerData),
            HWPCAPIConstants.UPDATE_CUSTOMER
        );
    }

    /**
     * Delete a customer
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Delete response
     */
    public async deleteCustomer(attach: ICreateAttachment, customerId: string): Promise<RESTResponse> {
        Log.info(`Deleting customer with ID: ${customerId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.delete(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.DELETE_CUSTOMER
        );
    }

    /**
     * Search customers
     * @param attach - Cucumber attachment function
     * @param searchParams - Search parameters
     * @returns Promise<RESTResponse> - Search results response
     */
    public async searchCustomers(attach: ICreateAttachment, searchParams: any): Promise<RESTResponse> {
        Log.info('Searching customers');
        
        const queryString = new URLSearchParams(searchParams).toString();
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SEARCH_CUSTOMERS_EP}?${queryString}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.CUSTOMER_SEARCH
        );
    }

    // ===== ROUTE MANAGEMENT =====

    /**
     * Get all routes
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All routes response
     */
    public async getAllRoutes(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving all routes');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.ROUTES_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.ALL_ROUTES
        );
    }

    /**
     * Get route by ID
     * @param attach - Cucumber attachment function
     * @param routeId - Route identifier
     * @returns Promise<RESTResponse> - Single route response
     */
    public async getRouteById(attach: ICreateAttachment, routeId: string): Promise<RESTResponse> {
        Log.info(`Retrieving route with ID: ${routeId}`);
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.SINGLE_ROUTE_EP.replace('{id}', routeId)}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.SINGLE_ROUTE
        );
    }

    // ===== REPORTS & ANALYTICS =====

    /**
     * Get dashboard data
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Dashboard data response
     */
    public async getDashboardData(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Retrieving dashboard data');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.DASHBOARD_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.DASHBOARD
        );
    }

    // ===== HEALTH MONITORING =====

    /**
     * Check API health
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Health check response
     */
    public async checkHealth(attach: ICreateAttachment): Promise<RESTResponse> {
        Log.info('Checking API health');
        
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants.API_HEALTH_EP}`;
        return await this.restRequest.get(
            attach,
            endPoint,
            this.getStandardHeaders(),
            HWPCAPIConstants.API_HEALTH
        );
    }

    /**
     * Clear any stored data (for cleanup)
     */
    public clearData(): void {
        this.authToken = null;
        this.sessionToken = null;
        Log.info('Client data cleared');
    }
}