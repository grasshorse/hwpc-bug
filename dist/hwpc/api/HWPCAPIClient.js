"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RESTRequest_1 = __importDefault(require("../../support/playwright/API/RESTRequest"));
const RequestHeader_1 = __importDefault(require("../../support/playwright/API/RequestHeader"));
const Log_1 = __importDefault(require("../../support/logger/Log"));
const HWPCAPIConstants_1 = __importDefault(require("./HWPCAPIConstants"));
/**
 * HWPC API Client - Extends existing REST framework patterns for HWPC-specific API operations
 * Handles authentication, session management, and HWPC-specific endpoints
 */
class HWPCAPIClient {
    constructor(page) {
        this.page = page;
        this.sessionToken = null;
        this.authToken = null;
        this.restRequest = new RESTRequest_1.default(page);
    }
    /**
     * Creates standard HWPC API headers (no authentication required currently)
     * @returns RequestHeader object with standard HWPC headers
     */
    getStandardHeaders() {
        return new RequestHeader_1.default()
            .set(HWPCAPIConstants_1.default.CONTENT_TYPE, HWPCAPIConstants_1.default.APPLICATION_JSON)
            .set(HWPCAPIConstants_1.default.ACCEPT, HWPCAPIConstants_1.default.APPLICATION_JSON)
            .get();
    }
    /**
     * Get current user profile (no authentication required currently)
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - User profile response
     */
    async getCurrentUser(attach) {
        Log_1.default.info('Retrieving current user profile');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.AUTH_USER_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.USER_PROFILE);
    }
    /**
     * Update user preferences
     * @param attach - Cucumber attachment function
     * @param preferences - User preferences data
     * @returns Promise<RESTResponse> - Update response
     */
    async updateUserPreferences(attach, preferences) {
        Log_1.default.info('Updating user preferences');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.AUTH_PREFERENCES_EP}`;
        return await this.restRequest.put(attach, endPoint, this.getStandardHeaders(), JSON.stringify(preferences), HWPCAPIConstants_1.default.USER_PREFERENCES);
    }
    /**
     * Get all tickets
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All tickets response
     */
    async getAllTickets(attach) {
        Log_1.default.info('Retrieving all tickets');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.TICKETS_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.ALL_TICKETS);
    }
    /**
     * Get ticket by ID
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @returns Promise<RESTResponse> - Single ticket response
     */
    async getTicketById(attach, ticketId) {
        Log_1.default.info(`Retrieving ticket with ID: ${ticketId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.SINGLE_TICKET);
    }
    /**
     * Get tickets by customer ID
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Customer tickets response
     */
    async getTicketsByCustomer(attach, customerId) {
        Log_1.default.info(`Retrieving tickets for customer: ${customerId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.TICKETS_BY_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.CUSTOMER_TICKETS);
    }
    /**
     * Get tickets by status
     * @param attach - Cucumber attachment function
     * @param status - Ticket status
     * @returns Promise<RESTResponse> - Status tickets response
     */
    async getTicketsByStatus(attach, status) {
        Log_1.default.info(`Retrieving tickets with status: ${status}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.TICKETS_BY_STATUS_EP.replace('{status}', status)}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.STATUS_TICKETS);
    }
    /**
     * Get ticket statistics
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Ticket statistics response
     */
    async getTicketStats(attach) {
        Log_1.default.info('Retrieving ticket statistics');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.TICKET_STATS_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.TICKET_STATISTICS);
    }
    /**
     * Create a new ticket
     * @param attach - Cucumber attachment function
     * @param ticketData - Ticket creation data
     * @returns Promise<RESTResponse> - Created ticket response
     */
    async createTicket(attach, ticketData) {
        Log_1.default.info('Creating new ticket');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.TICKETS_EP}`;
        return await this.restRequest.post(attach, endPoint, this.getStandardHeaders(), JSON.stringify(ticketData), HWPCAPIConstants_1.default.CREATE_TICKET);
    }
    /**
     * Update an existing ticket
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @param ticketData - Updated ticket data
     * @returns Promise<RESTResponse> - Updated ticket response
     */
    async updateTicket(attach, ticketId, ticketData) {
        Log_1.default.info(`Updating ticket with ID: ${ticketId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.put(attach, endPoint, this.getStandardHeaders(), JSON.stringify(ticketData), HWPCAPIConstants_1.default.UPDATE_TICKET);
    }
    /**
     * Delete a ticket
     * @param attach - Cucumber attachment function
     * @param ticketId - Ticket identifier
     * @returns Promise<RESTResponse> - Delete response
     */
    async deleteTicket(attach, ticketId) {
        Log_1.default.info(`Deleting ticket with ID: ${ticketId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_TICKET_EP.replace('{id}', ticketId)}`;
        return await this.restRequest.delete(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.DELETE_TICKET);
    }
    // ===== CUSTOMER MANAGEMENT =====
    /**
     * Get all customers
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All customers response
     */
    async getAllCustomers(attach) {
        Log_1.default.info('Retrieving all customers');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.CUSTOMERS_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.ALL_CUSTOMERS);
    }
    /**
     * Get customer by ID
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Single customer response
     */
    async getCustomerById(attach, customerId) {
        Log_1.default.info(`Retrieving customer with ID: ${customerId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.SINGLE_CUSTOMER);
    }
    /**
     * Create a new customer
     * @param attach - Cucumber attachment function
     * @param customerData - Customer creation data
     * @returns Promise<RESTResponse> - Created customer response
     */
    async createCustomer(attach, customerData) {
        Log_1.default.info('Creating new customer');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.CUSTOMERS_EP}`;
        return await this.restRequest.post(attach, endPoint, this.getStandardHeaders(), JSON.stringify(customerData), HWPCAPIConstants_1.default.CREATE_CUSTOMER);
    }
    /**
     * Update an existing customer
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @param customerData - Updated customer data
     * @returns Promise<RESTResponse> - Updated customer response
     */
    async updateCustomer(attach, customerId, customerData) {
        Log_1.default.info(`Updating customer with ID: ${customerId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.put(attach, endPoint, this.getStandardHeaders(), JSON.stringify(customerData), HWPCAPIConstants_1.default.UPDATE_CUSTOMER);
    }
    /**
     * Delete a customer
     * @param attach - Cucumber attachment function
     * @param customerId - Customer identifier
     * @returns Promise<RESTResponse> - Delete response
     */
    async deleteCustomer(attach, customerId) {
        Log_1.default.info(`Deleting customer with ID: ${customerId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_CUSTOMER_EP.replace('{id}', customerId)}`;
        return await this.restRequest.delete(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.DELETE_CUSTOMER);
    }
    /**
     * Search customers
     * @param attach - Cucumber attachment function
     * @param searchParams - Search parameters
     * @returns Promise<RESTResponse> - Search results response
     */
    async searchCustomers(attach, searchParams) {
        Log_1.default.info('Searching customers');
        const queryString = new URLSearchParams(searchParams).toString();
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SEARCH_CUSTOMERS_EP}?${queryString}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.CUSTOMER_SEARCH);
    }
    // ===== ROUTE MANAGEMENT =====
    /**
     * Get all routes
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - All routes response
     */
    async getAllRoutes(attach) {
        Log_1.default.info('Retrieving all routes');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.ROUTES_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.ALL_ROUTES);
    }
    /**
     * Get route by ID
     * @param attach - Cucumber attachment function
     * @param routeId - Route identifier
     * @returns Promise<RESTResponse> - Single route response
     */
    async getRouteById(attach, routeId) {
        Log_1.default.info(`Retrieving route with ID: ${routeId}`);
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.SINGLE_ROUTE_EP.replace('{id}', routeId)}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.SINGLE_ROUTE);
    }
    // ===== REPORTS & ANALYTICS =====
    /**
     * Get dashboard data
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Dashboard data response
     */
    async getDashboardData(attach) {
        Log_1.default.info('Retrieving dashboard data');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.DASHBOARD_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.DASHBOARD);
    }
    // ===== HEALTH MONITORING =====
    /**
     * Check API health
     * @param attach - Cucumber attachment function
     * @returns Promise<RESTResponse> - Health check response
     */
    async checkHealth(attach) {
        Log_1.default.info('Checking API health');
        const endPoint = `${process.env.HWPC_API_BASE_URL}${HWPCAPIConstants_1.default.API_HEALTH_EP}`;
        return await this.restRequest.get(attach, endPoint, this.getStandardHeaders(), HWPCAPIConstants_1.default.API_HEALTH);
    }
    /**
     * Clear any stored data (for cleanup)
     */
    clearData() {
        this.authToken = null;
        this.sessionToken = null;
        Log_1.default.info('Client data cleared');
    }
}
exports.default = HWPCAPIClient;
//# sourceMappingURL=HWPCAPIClient.js.map