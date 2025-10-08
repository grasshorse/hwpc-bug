import { Given, Then, When } from "@cucumber/cucumber";
import HWPCAPIClient from "../api/HWPCAPIClient";
import ContextAwareHWPCAPIClient from "../api/ContextAwareHWPCAPIClient";
import HWPCAPIConstants from "../api/HWPCAPIConstants";
import RESTResponse from "../../support/playwright/API/RESTResponse";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";
import { TestMode } from "../../support/testing/types";
import { EnhancedDataContextManagerImpl } from "../../support/testing/EnhancedDataContextManager";
import { ContextAwareRequestBuilderImpl, ContextAwareRequestBuilderFactory } from "../../support/testing/ContextAwareRequestBuilder";
import { DataValidationService } from "../../support/testing/DataValidationService";
import { ContextAwareErrorHandler, ContextAwareErrorHandlerFactory, ContextAwareError } from "../../support/testing/ContextAwareErrorHandler";
import { EntityType } from "../../support/testing/interfaces/DataContextManager";
import Log from "../../support/logger/Log";

/**
 * HWPC API Step Definitions - Following existing REST step patterns
 * Provides step definitions for HWPC API endpoints with comprehensive error handling
 */

// ===== AUTHENTICATION & SESSION STEPS =====

Given('user has access to HWPC API', async function () {
    // Create context-aware API client if dual-mode context is available
    if (this.testMode && this.dataContext) {
        this.hwpcAPI = new ContextAwareHWPCAPIClient(this.page, this.testMode, this.dataContext);
        Log.info(`Created context-aware HWPC API client for ${this.testMode} mode`);
        
        // Log context information for debugging
        (this.hwpcAPI as ContextAwareHWPCAPIClient).logContextInfo();
    } else {
        // Fallback to standard API client
        this.hwpcAPI = new HWPCAPIClient(this.page);
        Log.info('Created standard HWPC API client (no dual-mode context available)');
    }
    
    // No authentication required currently based on API documentation
});

When('user checks HWPC API health', async function () {
    this.response = await this.hwpcAPI.checkHealth(this.attach);
});

// ===== USER MANAGEMENT STEPS =====

When('user retrieves current HWPC user profile', async function () {
    this.response = await this.hwpcAPI.getCurrentUser(this.attach);
});

When('user updates HWPC user preferences with theme {string} and notifications {string}', 
    async function (theme: string, notifications: string) {
        const preferencesData = {
            preferences: {
                theme: theme,
                notifications: notifications === 'true'
            }
        };
        
        this.response = await this.hwpcAPI.updateUserPreferences(this.attach, preferencesData);
    });

// ===== TICKET MANAGEMENT STEPS =====

When('user makes a request to retrieve all HWPC tickets', async function () {
    this.response = await this.hwpcAPI.getAllTickets(this.attach);
});

When('user makes a request to retrieve HWPC ticket with ID {string}', async function (ticketId: string) {
    // Resolve ticket ID using context-aware data
    const resolvedTicketId = await resolveTicketId(this, ticketId);
    
    this.response = await this.hwpcAPI.getTicketById(this.attach, resolvedTicketId);
    this.currentTicketId = resolvedTicketId;
});

When('user creates a new HWPC ticket with title {string}, description {string}, and priority {string}',
    async function (title: string, description: string, priority: string) {
        let ticketData = {
            title: title,
            description: description,
            priority: priority,
            status: HWPCAPIConstants.TICKET_STATUS_OPEN,
            category: "general",
            customerId: "64fcec34-150a-476f-804a-3e9072a7e6bf" // Default fallback customer UUID
        };
        
        // Use context-aware data if available
        if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient && this.dataContext) {
            try {
                const requestBuilder = ContextAwareRequestBuilderFactory.getBuilder(
                    new EnhancedDataContextManagerImpl(this.testMode || TestMode.ISOLATED)
                );
                ticketData = await requestBuilder.buildTicketRequest(ticketData, this.dataContext);
                Log.info(`Using context-aware ticket data for ${this.testMode} mode`);
            } catch (error) {
                Log.info(`Failed to use context-aware data, falling back to default: ${error.message}`);
            }
        }
        
        this.response = await this.hwpcAPI.createTicket(this.attach, ticketData);
        
        // Store ticket ID for cleanup if creation was successful
        if (await this.response.getStatusCode() === HWPCAPIConstants.STATUS_CREATED) {
            try {
                const responseBody = JSON.parse(await this.response.getBody());
                this.currentTicketId = responseBody.data?.id || responseBody.id;
            } catch (error) {
                // Ticket ID extraction failed, but creation might have succeeded
                console.log('Failed to extract ticket ID from response');
            }
        }
    });

When('user updates HWPC ticket {string} with title {string} and status {string}',
    async function (ticketId: string, title: string, status: string) {
        // Resolve ticket ID using context-aware data
        const resolvedTicketId = await resolveTicketId(this, ticketId);
        
        // First get the current ticket data
        const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, resolvedTicketId);
        
        if (await currentTicketResponse.getStatusCode() === HWPCAPIConstants.STATUS_OK) {
            const currentTicketBody = JSON.parse(await currentTicketResponse.getBody());
            let ticketData = currentTicketBody.data || currentTicketBody;
            
            // Update specific fields
            ticketData.title = title;
            ticketData.status = status;
            
            // Apply context-aware updates
            ticketData = await buildContextAwareRequest(this, ticketData, 'ticket');
            
            // Remove null values that cause validation errors
            if (ticketData.assignedTo === null) {
                delete ticketData.assignedTo;
            }
            if (ticketData.address === null) {
                delete ticketData.address;
            }
            if (ticketData.lat === null) {
                delete ticketData.lat;
            }
            if (ticketData.lng === null) {
                delete ticketData.lng;
            }
            if (ticketData.scheduledDate === null) {
                delete ticketData.scheduledDate;
            }
            if (ticketData.completedDate === null) {
                delete ticketData.completedDate;
            }
            
            // Remove read-only fields
            delete ticketData.customerName;
            delete ticketData.customerEmail;
            delete ticketData.customerPhone;
            delete ticketData.customerStreet;
            delete ticketData.customerCity;
            delete ticketData.customerState;
            delete ticketData.customerZipCode;
            
            this.response = await this.hwpcAPI.updateTicket(this.attach, resolvedTicketId, ticketData);
            this.currentTicketId = resolvedTicketId;
        } else {
            this.response = currentTicketResponse;
        }
    });

When('user updates HWPC ticket with stored ID with title {string} and status {string}',
    async function (title: string, status: string) {
        if (!this.currentTicketId) {
            throw new Error('No ticket ID stored. Please create a ticket first.');
        }
        
        // First get the current ticket data
        const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, this.currentTicketId);
        
        if (await currentTicketResponse.getStatusCode() === HWPCAPIConstants.STATUS_OK) {
            const currentTicketBody = JSON.parse(await currentTicketResponse.getBody());
            const ticketData = currentTicketBody.data || currentTicketBody;
            
            // Update specific fields
            ticketData.title = title;
            ticketData.status = status;
            
            // Remove null values that cause validation errors
            if (ticketData.assignedTo === null) {
                delete ticketData.assignedTo;
            }
            if (ticketData.address === null) {
                delete ticketData.address;
            }
            if (ticketData.lat === null) {
                delete ticketData.lat;
            }
            if (ticketData.lng === null) {
                delete ticketData.lng;
            }
            if (ticketData.scheduledDate === null) {
                delete ticketData.scheduledDate;
            }
            if (ticketData.completedDate === null) {
                delete ticketData.completedDate;
            }
            
            // Remove read-only fields
            delete ticketData.customerName;
            delete ticketData.customerEmail;
            delete ticketData.customerPhone;
            delete ticketData.customerStreet;
            delete ticketData.customerCity;
            delete ticketData.customerState;
            delete ticketData.customerZipCode;
            
            this.response = await this.hwpcAPI.updateTicket(this.attach, this.currentTicketId, ticketData);
        } else {
            this.response = currentTicketResponse;
        }
    });

When('user deletes HWPC ticket {string}', async function (ticketId: string) {
    // Resolve ticket ID using context-aware data
    const resolvedTicketId = await resolveTicketId(this, ticketId);
    
    this.response = await this.hwpcAPI.deleteTicket(this.attach, resolvedTicketId);
    this.currentTicketId = resolvedTicketId;
});

When('user deletes HWPC ticket with stored ID', async function () {
    if (!this.currentTicketId) {
        throw new Error('No ticket ID stored. Please create a ticket first.');
    }
    
    this.response = await this.hwpcAPI.deleteTicket(this.attach, this.currentTicketId);
});

When('user retrieves HWPC tickets for customer {string}', async function (customerId: string) {
    // Resolve customer ID using context-aware data
    const resolvedCustomerId = await resolveCustomerId(this, customerId);
    
    this.response = await this.hwpcAPI.getTicketsByCustomer(this.attach, resolvedCustomerId);
});

// ===== DATA VALIDATION STEP DEFINITIONS =====

Given('user validates that test data exists for {string} operations', async function (operationType: string) {
    if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient && this.dataContext) {
        try {
            const validationService = new DataValidationService(this.testMode || TestMode.ISOLATED, this.dataContext);
            
            // Validate that required entities exist based on operation type
            const entitiesToValidate: Array<{type: EntityType, id: string}> = [];
            
            if (operationType.toLowerCase().includes('ticket')) {
                // For ticket operations, validate customers and routes exist
                if (this.dataContext.testData.customers.length > 0) {
                    entitiesToValidate.push({type: EntityType.CUSTOMER, id: this.dataContext.testData.customers[0].id});
                }
                if (this.dataContext.testData.routes.length > 0) {
                    entitiesToValidate.push({type: EntityType.ROUTE, id: this.dataContext.testData.routes[0].id});
                }
            } else if (operationType.toLowerCase().includes('customer')) {
                // For customer operations, validate customers exist
                if (this.dataContext.testData.customers.length > 0) {
                    entitiesToValidate.push({type: EntityType.CUSTOMER, id: this.dataContext.testData.customers[0].id});
                }
            }
            
            if (entitiesToValidate.length > 0) {
                const validationResult = await validationService.validateMultipleEntities(entitiesToValidate);
                
                if (!validationResult.isValid) {
                    const errorHandler = ContextAwareErrorHandlerFactory.getHandler(this.testMode || TestMode.ISOLATED, this.dataContext);
                    const error = await errorHandler.handleValidationFailure({}, 'create', validationResult);
                    throw error;
                }
                
                Log.info(`Test data validation passed for ${operationType} operations in ${this.testMode} mode`);
            } else {
                Log.info(`No test data validation required for ${operationType} operations`);
            }
        } catch (error) {
            if (error instanceof ContextAwareError) {
                Log.error(error.getFormattedMessage());
                throw new Error(error.getFormattedMessage());
            }
            throw error;
        }
    } else {
        Log.info('Skipping test data validation - no context-aware API client available');
    }
});

When('user validates API request data before {string} operation', async function (operation: string) {
    if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient && this.dataContext && this.lastRequestData) {
        try {
            const validationService = new DataValidationService(this.testMode || TestMode.ISOLATED, this.dataContext);
            const validationResult = await validationService.validateApiRequestData(this.lastRequestData, operation as any);
            
            if (!validationResult.isValid) {
                const errorHandler = ContextAwareErrorHandlerFactory.getHandler(this.testMode || TestMode.ISOLATED, this.dataContext);
                const error = await errorHandler.handleValidationFailure(this.lastRequestData, operation as any, validationResult);
                throw error;
            }
            
            Log.info(`API request data validation passed for ${operation} operation`);
        } catch (error) {
            if (error instanceof ContextAwareError) {
                Log.error(error.getFormattedMessage());
                throw new Error(error.getFormattedMessage());
            }
            throw error;
        }
    } else {
        Log.info('Skipping API request validation - no context or request data available');
    }
});

// ===== CONTEXT-AWARE STEP DEFINITIONS =====

When('user makes a request to retrieve HWPC ticket with context-specific ID', async function () {
    if (!(this.hwpcAPI instanceof ContextAwareHWPCAPIClient)) {
        throw new Error('Context-aware API client required for context-specific operations');
    }
    
    const ticketId = this.hwpcAPI.getContextSpecificTicketId();
    this.response = await this.hwpcAPI.getTicketById(this.attach, ticketId);
    this.currentTicketId = ticketId;
});

When('user retrieves HWPC tickets for context-specific customer', async function () {
    if (!(this.hwpcAPI instanceof ContextAwareHWPCAPIClient)) {
        throw new Error('Context-aware API client required for context-specific operations');
    }
    
    const customerId = this.hwpcAPI.getContextSpecificCustomerId();
    this.response = await this.hwpcAPI.getTicketsByCustomer(this.attach, customerId);
    this.currentCustomerId = customerId;
});

When('user creates a new HWPC ticket with context-aware test data', async function () {
    if (!(this.hwpcAPI instanceof ContextAwareHWPCAPIClient)) {
        throw new Error('Context-aware API client required for context-aware ticket creation');
    }
    
    const ticketData = this.hwpcAPI.createContextAwareTicketData();
    this.response = await this.hwpcAPI.createTicket(this.attach, ticketData);
    
    // Store ticket ID for cleanup if creation was successful
    if (await this.response.getStatusCode() === HWPCAPIConstants.STATUS_CREATED) {
        try {
            const responseBody = JSON.parse(await this.response.getBody());
            this.currentTicketId = responseBody.data?.id || responseBody.id;
        } catch (error) {
            console.log('Failed to extract ticket ID from response');
        }
    }
});

When('user creates a new HWPC customer with context-aware test data', async function () {
    if (!(this.hwpcAPI instanceof ContextAwareHWPCAPIClient)) {
        throw new Error('Context-aware API client required for context-aware customer creation');
    }
    
    const customerData = this.hwpcAPI.createContextAwareCustomerData();
    this.response = await this.hwpcAPI.createCustomer(this.attach, customerData);
    
    // Store customer ID for cleanup if creation was successful
    if (await this.response.getStatusCode() === HWPCAPIConstants.STATUS_CREATED) {
        try {
            const responseBody = JSON.parse(await this.response.getBody());
            this.currentCustomerId = responseBody.data?.id || responseBody.id;
        } catch (error) {
            console.log('Failed to extract customer ID from response');
        }
    }
});

When('user updates HWPC ticket with stored ID using context-aware data', async function () {
    if (!this.currentTicketId) {
        throw new Error('No ticket ID stored. Please create a ticket first.');
    }
    
    if (!(this.hwpcAPI instanceof ContextAwareHWPCAPIClient)) {
        throw new Error('Context-aware API client required for context-aware ticket updates');
    }
    
    // First get the current ticket data
    const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, this.currentTicketId);
    
    if (await currentTicketResponse.getStatusCode() === HWPCAPIConstants.STATUS_OK) {
        const currentTicketBody = JSON.parse(await currentTicketResponse.getBody());
        const ticketData = currentTicketBody.data || currentTicketBody;
        
        // Apply context-aware updates
        const updateData = this.hwpcAPI.createContextAwareTicketUpdateData();
        Object.assign(ticketData, updateData);
        
        // Remove null values that cause validation errors
        if (ticketData.assignedTo === null) {
            delete ticketData.assignedTo;
        }
        if (ticketData.address === null) {
            delete ticketData.address;
        }
        if (ticketData.lat === null) {
            delete ticketData.lat;
        }
        if (ticketData.lng === null) {
            delete ticketData.lng;
        }
        if (ticketData.scheduledDate === null) {
            delete ticketData.scheduledDate;
        }
        if (ticketData.completedDate === null) {
            delete ticketData.completedDate;
        }
        
        // Remove read-only fields
        delete ticketData.customerName;
        delete ticketData.customerEmail;
        delete ticketData.customerPhone;
        delete ticketData.customerStreet;
        delete ticketData.customerCity;
        delete ticketData.customerState;
        delete ticketData.customerZipCode;
        
        this.response = await this.hwpcAPI.updateTicket(this.attach, this.currentTicketId, ticketData);
    } else {
        this.response = currentTicketResponse;
    }
});

When('user retrieves HWPC tickets with status {string}', async function (status: string) {
    this.response = await this.hwpcAPI.getTicketsByStatus(this.attach, status);
});

When('user retrieves HWPC ticket statistics', async function () {
    this.response = await this.hwpcAPI.getTicketStats(this.attach);
});

// ===== CUSTOMER MANAGEMENT STEPS =====

When('user makes a request to retrieve all HWPC customers', async function () {
    this.response = await this.hwpcAPI.getAllCustomers(this.attach);
});

When('user makes a request to retrieve HWPC customer with ID {string}', async function (customerId: string) {
    // Resolve customer ID using context-aware data
    const resolvedCustomerId = await resolveCustomerId(this, customerId);
    
    this.response = await this.hwpcAPI.getCustomerById(this.attach, resolvedCustomerId);
    this.currentCustomerId = resolvedCustomerId;
});

When('user creates a new HWPC customer with name {string}, email {string}, and phone {string}',
    async function (name: string, email: string, phone: string) {
        let customerData = {
            name: name,
            email: email,
            phone: phone,
            serviceType: "standard",
            isActive: true
        };
        
        // Use context-aware data if available
        customerData = await buildContextAwareRequest(this, customerData, 'customer');
        
        this.response = await this.hwpcAPI.createCustomer(this.attach, customerData);
        
        // Store customer ID for cleanup if creation was successful
        if (await this.response.getStatusCode() === HWPCAPIConstants.STATUS_CREATED) {
            try {
                const responseBody = JSON.parse(await this.response.getBody());
                this.currentCustomerId = responseBody.data?.id || responseBody.id;
            } catch (error) {
                // Customer ID extraction failed, but creation might have succeeded
                console.log('Failed to extract customer ID from response');
            }
        }
    });

When('user updates HWPC customer {string} with name {string} and email {string}',
    async function (customerId: string, name: string, email: string) {
        // Resolve customer ID using context-aware data
        const resolvedCustomerId = await resolveCustomerId(this, customerId);
        
        // First get the current customer data
        const currentCustomerResponse = await this.hwpcAPI.getCustomerById(this.attach, resolvedCustomerId);
        
        if (await currentCustomerResponse.getStatusCode() === HWPCAPIConstants.STATUS_OK) {
            const currentCustomerBody = JSON.parse(await currentCustomerResponse.getBody());
            let customerData = currentCustomerBody.data || currentCustomerBody;
            
            // Update specific fields
            customerData.name = name;
            customerData.email = email;
            
            // Apply context-aware updates
            customerData = await buildContextAwareRequest(this, customerData, 'customer');
            
            this.response = await this.hwpcAPI.updateCustomer(this.attach, resolvedCustomerId, customerData);
            this.currentCustomerId = resolvedCustomerId;
        } else {
            this.response = currentCustomerResponse;
        }
    });

When('user deletes HWPC customer {string}', async function (customerId: string) {
    // Resolve customer ID using context-aware data
    const resolvedCustomerId = await resolveCustomerId(this, customerId);
    
    this.response = await this.hwpcAPI.deleteCustomer(this.attach, resolvedCustomerId);
    this.currentCustomerId = resolvedCustomerId;
});

When('user searches for HWPC customers with query {string}', async function (searchQuery: string) {
    const searchParams = {
        q: searchQuery,
        fields: "name,email"
    };
    
    this.response = await this.hwpcAPI.searchCustomers(this.attach, searchParams);
});

// ===== ROUTE MANAGEMENT STEPS =====

When('user makes a request to retrieve all HWPC routes', async function () {
    this.response = await this.hwpcAPI.getAllRoutes(this.attach);
});

When('user makes a request to retrieve HWPC route with ID {string}', async function (routeId: string) {
    // Resolve route ID using context-aware data
    const resolvedRouteId = await resolveRouteId(this, routeId);
    
    this.response = await this.hwpcAPI.getRouteById(this.attach, resolvedRouteId);
    this.currentRouteId = resolvedRouteId;
});

// ===== DASHBOARD & REPORTS STEPS =====

When('user retrieves HWPC dashboard data', async function () {
    this.response = await this.hwpcAPI.getDashboardData(this.attach);
});

// ===== RESPONSE VALIDATION STEPS =====

Then('user should get a successful response with status code {int}', async function (expectedStatusCode: number) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getStatusCode(), expectedStatusCode, "Status Code");
});

Then('user should get an error response with status code {int}', async function (expectedStatusCode: number) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getStatusCode(), expectedStatusCode, "Error Status Code");
});

Then('user should get HWPC API success response', async function () {
    const response: RESTResponse = this.response;
    const responseBody = JSON.parse(await response.getBody());
    await Assert.assertEquals(responseBody.success, true, "API Success Flag");
});

Then('user should get HWPC API response with data', async function () {
    const response: RESTResponse = this.response;
    const responseBody = JSON.parse(await response.getBody());
    await Assert.assertNotNull(responseBody.data, "Response Data");
});

Then('user should get list of HWPC tickets', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.ALL_TICKETS);
    
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const ticketsData = responseBody.data || responseBody;
    await Assert.assertTrue(Array.isArray(ticketsData), "Tickets List");
});

Then('user should get list of HWPC customers', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.ALL_CUSTOMERS);
    
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const customersData = responseBody.data || responseBody;
    await Assert.assertTrue(Array.isArray(customersData), "Customers List");
});

Then('user should get list of HWPC routes', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.ALL_ROUTES);
    
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const routesData = responseBody.data || responseBody;
    await Assert.assertTrue(Array.isArray(routesData), "Routes List");
});

Then('user should get HWPC ticket with ID {string}', async function (expectedTicketId: string) {
    const response: RESTResponse = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const ticketData = responseBody.data || responseBody;
    await Assert.assertEquals(ticketData.id, expectedTicketId, HWPCAPIConstants.SINGLE_TICKET);
});

// ===== CONTEXT-AWARE VALIDATION STEPS =====

Then('user should get HWPC ticket with context-specific data', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.SINGLE_TICKET);
    
    // Validate context-specific response if context-aware client is available
    if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient) {
        const responseBody = await response.getBody();
        const isValid = await this.hwpcAPI.validateContextSpecificResponse(responseBody, 'ticket');
        await Assert.assertTrue(isValid, "Context-specific ticket validation");
        
        Log.info(`Validated context-specific ticket response for ${this.hwpcAPI.getTestMode()} mode`);
    }
});

Then('user should get created HWPC ticket with context-specific data', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.CREATE_TICKET);
    
    // Verify ticket ID is present
    await Assert.assertNotNull(
        await response.getTagContentByJsonPath(HWPCAPIConstants.TICKET_ID_JSON_PATH, HWPCAPIConstants.CREATE_TICKET),
        "Created Ticket ID"
    );
    
    // Validate context-specific response if context-aware client is available
    if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient) {
        const responseBody = await response.getBody();
        const isValid = await this.hwpcAPI.validateContextSpecificResponse(responseBody, 'ticket');
        await Assert.assertTrue(isValid, "Context-specific created ticket validation");
        
        Log.info(`Validated context-specific created ticket response for ${this.hwpcAPI.getTestMode()} mode`);
    }
});

Then('user should get HWPC ticket with updated context-specific data', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.UPDATE_TICKET);
    
    // Verify the ticket was updated with context-aware data
    const actualStatus = await response.getTagContentByJsonPath(
        HWPCAPIConstants.TICKET_STATUS_JSON_PATH, 
        HWPCAPIConstants.UPDATE_TICKET
    );
    await Assert.assertEquals(actualStatus, "in_progress", "Updated Ticket Status");
    
    // Validate context-specific response if context-aware client is available
    if (this.hwpcAPI instanceof ContextAwareHWPCAPIClient) {
        const responseBody = await response.getBody();
        const isValid = await this.hwpcAPI.validateContextSpecificResponse(responseBody, 'ticket');
        await Assert.assertTrue(isValid, "Context-specific updated ticket validation");
        
        Log.info(`Validated context-specific updated ticket response for ${this.hwpcAPI.getTestMode()} mode`);
    }
});

Then('user should get HWPC customer with ID {string}', async function (expectedCustomerId: string) {
    const response: RESTResponse = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const customerData = responseBody.data || responseBody;
    await Assert.assertEquals(customerData.id, expectedCustomerId, HWPCAPIConstants.SINGLE_CUSTOMER);
});

Then('user should get HWPC route with ID {string}', async function (expectedRouteId: string) {
    const response: RESTResponse = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const routeData = responseBody.data || responseBody;
    await Assert.assertEquals(routeData.id, expectedRouteId, HWPCAPIConstants.SINGLE_ROUTE);
});

Then('user should get HWPC ticket with title {string}', async function (expectedTitle: string) {
    const response: RESTResponse = this.response;
    const actualTitle = await response.getTagContentByJsonPath(
        HWPCAPIConstants.TICKET_TITLE_JSON_PATH, 
        HWPCAPIConstants.SINGLE_TICKET
    );
    await Assert.assertEquals(actualTitle, expectedTitle, "Ticket Title");
});

Then('user should get HWPC ticket with status {string}', async function (expectedStatus: string) {
    const response: RESTResponse = this.response;
    const actualStatus = await response.getTagContentByJsonPath(
        HWPCAPIConstants.TICKET_STATUS_JSON_PATH, 
        HWPCAPIConstants.SINGLE_TICKET
    );
    await Assert.assertEquals(actualStatus, expectedStatus, "Ticket Status");
});

Then('user should get HWPC ticket with priority {string}', async function (expectedPriority: string) {
    const response: RESTResponse = this.response;
    const actualPriority = await response.getTagContentByJsonPath(
        HWPCAPIConstants.TICKET_PRIORITY_JSON_PATH, 
        HWPCAPIConstants.SINGLE_TICKET
    );
    await Assert.assertEquals(actualPriority, expectedPriority, "Ticket Priority");
});

Then('user should get created HWPC ticket with title {string}, priority {string}, and status {string}',
    async function (expectedTitle: string, expectedPriority: string, expectedStatus: string) {
        const response: RESTResponse = this.response;
        
        const actualTitle = await response.getTagContentByJsonPath(
            HWPCAPIConstants.TICKET_TITLE_JSON_PATH, 
            HWPCAPIConstants.CREATE_TICKET
        );
        const actualPriority = await response.getTagContentByJsonPath(
            HWPCAPIConstants.TICKET_PRIORITY_JSON_PATH, 
            HWPCAPIConstants.CREATE_TICKET
        );
        const actualStatus = await response.getTagContentByJsonPath(
            HWPCAPIConstants.TICKET_STATUS_JSON_PATH, 
            HWPCAPIConstants.CREATE_TICKET
        );
        
        await Assert.assertEquals(actualTitle, expectedTitle, "Created Ticket Title");
        await Assert.assertEquals(actualPriority, expectedPriority, "Created Ticket Priority");
        await Assert.assertEquals(actualStatus, expectedStatus, "Created Ticket Status");
        
        // Verify ticket ID is present
        await Assert.assertNotNull(
            await response.getTagContentByJsonPath(HWPCAPIConstants.TICKET_ID_JSON_PATH, HWPCAPIConstants.CREATE_TICKET),
            "Created Ticket ID"
        );
    });

Then('user should get HWPC search results containing tickets', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), HWPCAPIConstants.TICKET_SEARCH);
    
    // Verify search results structure
    const responseBody = JSON.parse(await response.getBody());
    const hasResults = Array.isArray(responseBody) || 
                      (responseBody.results && Array.isArray(responseBody.results)) ||
                      (responseBody.data && Array.isArray(responseBody.data));
    
    await Assert.assertTrue(hasResults, "Search Results Structure");
});

Then('user should get HWPC search results with total count greater than {int}', async function (minCount: number) {
    const response: RESTResponse = this.response;
    
    try {
        const totalCount = await response.getTagContentByJsonPath(
            HWPCAPIConstants.SEARCH_TOTAL_COUNT_JSON_PATH, 
            HWPCAPIConstants.TICKET_SEARCH
        );
        await Assert.assertTrue(parseInt(totalCount) > minCount, "Search Results Count");
    } catch (error) {
        // If total count is not available, check array length
        const responseBody = JSON.parse(await response.getBody());
        const results = responseBody.results || responseBody.data || responseBody;
        await Assert.assertTrue(Array.isArray(results) && results.length > minCount, "Search Results Array Length");
    }
});

Then('user should get user profile with username {string}', async function (expectedUsername: string) {
    const response: RESTResponse = this.response;
    const actualUsername = await response.getTagContentByJsonPath(
        HWPCAPIConstants.USER_NAME_JSON_PATH, 
        HWPCAPIConstants.USER_PROFILE
    );
    await Assert.assertEquals(actualUsername, expectedUsername, "User Profile Username");
});

Then('user should get user profile with email {string}', async function (expectedEmail: string) {
    const response: RESTResponse = this.response;
    const actualEmail = await response.getTagContentByJsonPath(
        HWPCAPIConstants.USER_EMAIL_JSON_PATH, 
        HWPCAPIConstants.USER_PROFILE
    );
    await Assert.assertEquals(actualEmail, expectedEmail, "User Profile Email");
});

// ===== ERROR HANDLING STEPS =====

Then('user should get HWPC API error with code {string}', async function (expectedErrorCode: string) {
    const response: RESTResponse = this.response;
    const actualErrorCode = await response.getTagContentByJsonPath(
        HWPCAPIConstants.ERROR_CODE_JSON_PATH, 
        "API Error"
    );
    await Assert.assertEquals(actualErrorCode, expectedErrorCode, "API Error Code");
});

Then('user should get HWPC API error message containing {string}', async function (expectedMessage: string) {
    const response: RESTResponse = this.response;
    const actualMessage = await response.getTagContentByJsonPath(
        HWPCAPIConstants.ERROR_MESSAGE_JSON_PATH, 
        "API Error Message"
    );
    await Assert.assertContains(actualMessage, expectedMessage, "API Error Message");
});

Then('user should get validation error for field {string}', async function (fieldName: string) {
    const response: RESTResponse = this.response;
    const responseBody = await response.getBody();
    await Assert.assertContains(responseBody, fieldName, "Validation Error Field");
});

// ===== CLEANUP STEPS =====

Then('user cleans up the created HWPC ticket', async function () {
    if (this.currentTicketId && this.hwpcAPI) {
        try {
            await this.hwpcAPI.deleteTicket(this.attach, this.currentTicketId);
        } catch (error) {
            // Cleanup failed, but don't fail the test
            console.log(`Cleanup failed for ticket ${this.currentTicketId}: ${error}`);
        }
    }
});

Then('user cleans up the created HWPC customer', async function () {
    if (this.currentCustomerId && this.hwpcAPI) {
        try {
            await this.hwpcAPI.deleteCustomer(this.attach, this.currentCustomerId);
        } catch (error) {
            // Cleanup failed, but don't fail the test
            console.log(`Cleanup failed for customer ${this.currentCustomerId}: ${error}`);
        }
    }
});

Then('user cleans up HWPC API client', async function () {
    if (this.hwpcAPI) {
        this.hwpcAPI.clearData();
    }
});

// ===== UTILITY STEPS =====

Then('user verifies HWPC API response contains field {string}', async function (fieldName: string) {
    const response: RESTResponse = this.response;
    const responseBody = await response.getBody();
    await Assert.assertContains(responseBody, fieldName, `Response Field: ${fieldName}`);
});

Then('user verifies HWPC API response does not contain field {string}', async function (fieldName: string) {
    const response: RESTResponse = this.response;
    const responseBody = await response.getBody();
    await Assert.assertNotContains(responseBody, fieldName, `Response Field: ${fieldName}`);
});

Then('user stores HWPC ticket ID from response', async function () {
    const response: RESTResponse = this.response;
    try {
        const responseBody = JSON.parse(await response.getBody());
        this.currentTicketId = responseBody.data?.id || responseBody.id;
        if (!this.currentTicketId) {
            console.log("No ticket ID found in response");
        }
    } catch (error) {
        console.log("Failed to store ticket ID from response:", error);
    }
});

Then('user stores HWPC user ID from response', async function () {
    const response: RESTResponse = this.response;
    try {
        const responseBody = JSON.parse(await response.getBody());
        this.currentUserId = responseBody.data?.id || responseBody.id;
        if (!this.currentUserId) {
            console.log("No user ID found in response");
        }
    } catch (error) {
        console.log("Failed to store user ID from response:", error);
    }
});

// ===== CONTEXT-AWARE DATA HELPER FUNCTIONS =====

/**
 * Helper function to resolve customer ID using context-aware data with validation
 */
async function resolveCustomerId(context: any, baseName?: string): Promise<string> {
    if (context.hwpcAPI instanceof ContextAwareHWPCAPIClient && context.dataContext) {
        try {
            const dataManager = new EnhancedDataContextManagerImpl(context.testMode || TestMode.ISOLATED);
            const customerId = await dataManager.resolveCustomerId(baseName, context.dataContext);
            
            // Validate that the customer exists
            const validationService = new DataValidationService(context.testMode || TestMode.ISOLATED, context.dataContext);
            const validationResult = await validationService.validateTestDataExists(EntityType.CUSTOMER, customerId);
            
            if (!validationResult.isValid) {
                const errorHandler = ContextAwareErrorHandlerFactory.getHandler(context.testMode || TestMode.ISOLATED, context.dataContext);
                const error = await errorHandler.handleEntityNotFound(EntityType.CUSTOMER, customerId, 'customer ID resolution');
                Log.error(error.getFormattedMessage());
                throw error;
            }
            
            return customerId;
        } catch (error) {
            if (error instanceof ContextAwareError) {
                throw error;
            }
            Log.info(`Failed to resolve customer ID contextually: ${error.message}`);
        }
    }
    
    // Fallback to hardcoded ID
    return "64fcec34-150a-476f-804a-3e9072a7e6bf";
}

/**
 * Helper function to resolve ticket ID using context-aware data with validation
 */
async function resolveTicketId(context: any, baseName?: string): Promise<string> {
    if (context.hwpcAPI instanceof ContextAwareHWPCAPIClient && context.dataContext) {
        try {
            const dataManager = new EnhancedDataContextManagerImpl(context.testMode || TestMode.ISOLATED);
            const ticketId = await dataManager.resolveTicketId(baseName, context.dataContext);
            
            // Validate that the ticket exists
            const validationService = new DataValidationService(context.testMode || TestMode.ISOLATED, context.dataContext);
            const validationResult = await validationService.validateTestDataExists(EntityType.TICKET, ticketId);
            
            if (!validationResult.isValid) {
                const errorHandler = ContextAwareErrorHandlerFactory.getHandler(context.testMode || TestMode.ISOLATED, context.dataContext);
                const error = await errorHandler.handleEntityNotFound(EntityType.TICKET, ticketId, 'ticket ID resolution');
                Log.error(error.getFormattedMessage());
                throw error;
            }
            
            return ticketId;
        } catch (error) {
            if (error instanceof ContextAwareError) {
                throw error;
            }
            Log.info(`Failed to resolve ticket ID contextually: ${error.message}`);
        }
    }
    
    // Fallback to default pattern
    return baseName || "ticket-001";
}

/**
 * Helper function to resolve route ID using context-aware data with validation
 */
async function resolveRouteId(context: any, baseName?: string): Promise<string> {
    if (context.hwpcAPI instanceof ContextAwareHWPCAPIClient && context.dataContext) {
        try {
            const dataManager = new EnhancedDataContextManagerImpl(context.testMode || TestMode.ISOLATED);
            const routeId = await dataManager.resolveRouteId(baseName, context.dataContext);
            
            // Validate that the route exists
            const validationService = new DataValidationService(context.testMode || TestMode.ISOLATED, context.dataContext);
            const validationResult = await validationService.validateTestDataExists(EntityType.ROUTE, routeId);
            
            if (!validationResult.isValid) {
                const errorHandler = ContextAwareErrorHandlerFactory.getHandler(context.testMode || TestMode.ISOLATED, context.dataContext);
                const error = await errorHandler.handleEntityNotFound(EntityType.ROUTE, routeId, 'route ID resolution');
                Log.error(error.getFormattedMessage());
                throw error;
            }
            
            return routeId;
        } catch (error) {
            if (error instanceof ContextAwareError) {
                throw error;
            }
            Log.info(`Failed to resolve route ID contextually: ${error.message}`);
        }
    }
    
    // Fallback to default pattern
    return baseName || "route-001";
}

/**
 * Helper function to build context-aware request data with validation
 */
async function buildContextAwareRequest(context: any, requestData: any, requestType: 'ticket' | 'customer' | 'route'): Promise<any> {
    if (context.hwpcAPI instanceof ContextAwareHWPCAPIClient && context.dataContext) {
        try {
            // Validate request data before processing
            const validationService = new DataValidationService(context.testMode || TestMode.ISOLATED, context.dataContext);
            const validationResult = await validationService.validateApiRequestData(requestData, 'create');
            
            if (!validationResult.isValid) {
                const errorHandler = ContextAwareErrorHandlerFactory.getHandler(context.testMode || TestMode.ISOLATED, context.dataContext);
                const error = await errorHandler.handleValidationFailure(requestData, 'create', validationResult);
                Log.error(error.getFormattedMessage());
                
                // Try to recover from validation errors
                const recovered = await errorHandler.attemptRecovery(error);
                if (!recovered) {
                    throw error;
                }
            }
            
            const dataManager = new EnhancedDataContextManagerImpl(context.testMode || TestMode.ISOLATED);
            const requestBuilder = ContextAwareRequestBuilderFactory.getBuilder(dataManager);
            
            switch (requestType) {
                case 'ticket':
                    return await requestBuilder.buildTicketRequest(requestData, context.dataContext);
                case 'customer':
                    return await requestBuilder.buildCustomerRequest(requestData, context.dataContext);
                case 'route':
                    return await requestBuilder.buildRouteRequest(requestData, context.dataContext);
                default:
                    return await requestBuilder.resolveContextualIds(requestData, context.dataContext);
            }
        } catch (error) {
            if (error instanceof ContextAwareError) {
                throw error;
            }
            
            // Handle unexpected errors
            const errorHandler = ContextAwareErrorHandlerFactory.getHandler(context.testMode || TestMode.ISOLATED, context.dataContext);
            const contextError = await errorHandler.handleApiRequestError(`build ${requestType} request`, requestData, error);
            Log.error(contextError.getFormattedMessage());
            throw contextError;
        }
    }
    
    return requestData;
}