import { Given, Then, When } from "@cucumber/cucumber";
import HWPCAPIClient from "../api/HWPCAPIClient";
import HWPCAPIConstants from "../api/HWPCAPIConstants";
import RESTResponse from "../../support/playwright/API/RESTResponse";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";

/**
 * HWPC API Step Definitions - Following existing REST step patterns
 * Provides step definitions for HWPC API endpoints with comprehensive error handling
 */

// ===== AUTHENTICATION & SESSION STEPS =====

Given('user has access to HWPC API', async function () {
    if (!this.hwpcAPI) {
        this.hwpcAPI = new HWPCAPIClient(this.page);
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
    this.response = await this.hwpcAPI.getTicketById(this.attach, ticketId);
    this.currentTicketId = ticketId;
});

When('user creates a new HWPC ticket with title {string}, description {string}, and priority {string}',
    async function (title: string, description: string, priority: string) {
        const ticketData = {
            title: title,
            description: description,
            priority: priority,
            status: HWPCAPIConstants.TICKET_STATUS_OPEN,
            category: "general",
            customerId: "443364a5-ec9b-40da-94e5-63bda08de469" // Valid customer UUID from API response
        };
        
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
        // First get the current ticket data
        const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, ticketId);
        
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
            
            this.response = await this.hwpcAPI.updateTicket(this.attach, ticketId, ticketData);
            this.currentTicketId = ticketId;
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
    this.response = await this.hwpcAPI.deleteTicket(this.attach, ticketId);
    this.currentTicketId = ticketId;
});

When('user deletes HWPC ticket with stored ID', async function () {
    if (!this.currentTicketId) {
        throw new Error('No ticket ID stored. Please create a ticket first.');
    }
    
    this.response = await this.hwpcAPI.deleteTicket(this.attach, this.currentTicketId);
});

When('user retrieves HWPC tickets for customer {string}', async function (customerId: string) {
    this.response = await this.hwpcAPI.getTicketsByCustomer(this.attach, customerId);
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
    this.response = await this.hwpcAPI.getCustomerById(this.attach, customerId);
    this.currentCustomerId = customerId;
});

When('user creates a new HWPC customer with name {string}, email {string}, and phone {string}',
    async function (name: string, email: string, phone: string) {
        const customerData = {
            name: name,
            email: email,
            phone: phone,
            serviceType: "standard",
            isActive: true
        };
        
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
        // First get the current customer data
        const currentCustomerResponse = await this.hwpcAPI.getCustomerById(this.attach, customerId);
        
        if (await currentCustomerResponse.getStatusCode() === HWPCAPIConstants.STATUS_OK) {
            const currentCustomerBody = JSON.parse(await currentCustomerResponse.getBody());
            const customerData = currentCustomerBody.data || currentCustomerBody;
            
            // Update specific fields
            customerData.name = name;
            customerData.email = email;
            
            this.response = await this.hwpcAPI.updateCustomer(this.attach, customerId, customerData);
            this.currentCustomerId = customerId;
        } else {
            this.response = currentCustomerResponse;
        }
    });

When('user deletes HWPC customer {string}', async function (customerId: string) {
    this.response = await this.hwpcAPI.deleteCustomer(this.attach, customerId);
    this.currentCustomerId = customerId;
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
    this.response = await this.hwpcAPI.getRouteById(this.attach, routeId);
    this.currentRouteId = routeId;
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