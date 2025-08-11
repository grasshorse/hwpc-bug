"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const HWPCAPIClient_1 = __importDefault(require("../api/HWPCAPIClient"));
const HWPCAPIConstants_1 = __importDefault(require("../api/HWPCAPIConstants"));
const Assert_1 = __importDefault(require("../../support/playwright/asserts/Assert"));
/**
 * HWPC API Step Definitions - Following existing REST step patterns
 * Provides step definitions for HWPC API endpoints with comprehensive error handling
 */
// ===== AUTHENTICATION & SESSION STEPS =====
(0, cucumber_1.Given)('user has access to HWPC API', async function () {
    if (!this.hwpcAPI) {
        this.hwpcAPI = new HWPCAPIClient_1.default(this.page);
    }
    // No authentication required currently based on API documentation
});
(0, cucumber_1.When)('user checks HWPC API health', async function () {
    this.response = await this.hwpcAPI.checkHealth(this.attach);
});
// ===== USER MANAGEMENT STEPS =====
(0, cucumber_1.When)('user retrieves current HWPC user profile', async function () {
    this.response = await this.hwpcAPI.getCurrentUser(this.attach);
});
(0, cucumber_1.When)('user updates HWPC user preferences with theme {string} and notifications {string}', async function (theme, notifications) {
    const preferencesData = {
        preferences: {
            theme: theme,
            notifications: notifications === 'true'
        }
    };
    this.response = await this.hwpcAPI.updateUserPreferences(this.attach, preferencesData);
});
// ===== TICKET MANAGEMENT STEPS =====
(0, cucumber_1.When)('user makes a request to retrieve all HWPC tickets', async function () {
    this.response = await this.hwpcAPI.getAllTickets(this.attach);
});
(0, cucumber_1.When)('user makes a request to retrieve HWPC ticket with ID {string}', async function (ticketId) {
    this.response = await this.hwpcAPI.getTicketById(this.attach, ticketId);
    this.currentTicketId = ticketId;
});
(0, cucumber_1.When)('user creates a new HWPC ticket with title {string}, description {string}, and priority {string}', async function (title, description, priority) {
    const ticketData = {
        title: title,
        description: description,
        priority: priority,
        status: HWPCAPIConstants_1.default.TICKET_STATUS_OPEN,
        category: "general",
        customerId: "443364a5-ec9b-40da-94e5-63bda08de469" // Valid customer UUID from API response
    };
    this.response = await this.hwpcAPI.createTicket(this.attach, ticketData);
    // Store ticket ID for cleanup if creation was successful
    if (await this.response.getStatusCode() === HWPCAPIConstants_1.default.STATUS_CREATED) {
        try {
            const responseBody = JSON.parse(await this.response.getBody());
            this.currentTicketId = responseBody.data?.id || responseBody.id;
        }
        catch (error) {
            // Ticket ID extraction failed, but creation might have succeeded
            console.log('Failed to extract ticket ID from response');
        }
    }
});
(0, cucumber_1.When)('user updates HWPC ticket {string} with title {string} and status {string}', async function (ticketId, title, status) {
    // First get the current ticket data
    const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, ticketId);
    if (await currentTicketResponse.getStatusCode() === HWPCAPIConstants_1.default.STATUS_OK) {
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
    }
    else {
        this.response = currentTicketResponse;
    }
});
(0, cucumber_1.When)('user updates HWPC ticket with stored ID with title {string} and status {string}', async function (title, status) {
    if (!this.currentTicketId) {
        throw new Error('No ticket ID stored. Please create a ticket first.');
    }
    // First get the current ticket data
    const currentTicketResponse = await this.hwpcAPI.getTicketById(this.attach, this.currentTicketId);
    if (await currentTicketResponse.getStatusCode() === HWPCAPIConstants_1.default.STATUS_OK) {
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
    }
    else {
        this.response = currentTicketResponse;
    }
});
(0, cucumber_1.When)('user deletes HWPC ticket {string}', async function (ticketId) {
    this.response = await this.hwpcAPI.deleteTicket(this.attach, ticketId);
    this.currentTicketId = ticketId;
});
(0, cucumber_1.When)('user deletes HWPC ticket with stored ID', async function () {
    if (!this.currentTicketId) {
        throw new Error('No ticket ID stored. Please create a ticket first.');
    }
    this.response = await this.hwpcAPI.deleteTicket(this.attach, this.currentTicketId);
});
(0, cucumber_1.When)('user retrieves HWPC tickets for customer {string}', async function (customerId) {
    this.response = await this.hwpcAPI.getTicketsByCustomer(this.attach, customerId);
});
(0, cucumber_1.When)('user retrieves HWPC tickets with status {string}', async function (status) {
    this.response = await this.hwpcAPI.getTicketsByStatus(this.attach, status);
});
(0, cucumber_1.When)('user retrieves HWPC ticket statistics', async function () {
    this.response = await this.hwpcAPI.getTicketStats(this.attach);
});
// ===== CUSTOMER MANAGEMENT STEPS =====
(0, cucumber_1.When)('user makes a request to retrieve all HWPC customers', async function () {
    this.response = await this.hwpcAPI.getAllCustomers(this.attach);
});
(0, cucumber_1.When)('user makes a request to retrieve HWPC customer with ID {string}', async function (customerId) {
    this.response = await this.hwpcAPI.getCustomerById(this.attach, customerId);
    this.currentCustomerId = customerId;
});
(0, cucumber_1.When)('user creates a new HWPC customer with name {string}, email {string}, and phone {string}', async function (name, email, phone) {
    const customerData = {
        name: name,
        email: email,
        phone: phone,
        serviceType: "standard",
        isActive: true
    };
    this.response = await this.hwpcAPI.createCustomer(this.attach, customerData);
    // Store customer ID for cleanup if creation was successful
    if (await this.response.getStatusCode() === HWPCAPIConstants_1.default.STATUS_CREATED) {
        try {
            const responseBody = JSON.parse(await this.response.getBody());
            this.currentCustomerId = responseBody.data?.id || responseBody.id;
        }
        catch (error) {
            // Customer ID extraction failed, but creation might have succeeded
            console.log('Failed to extract customer ID from response');
        }
    }
});
(0, cucumber_1.When)('user updates HWPC customer {string} with name {string} and email {string}', async function (customerId, name, email) {
    // First get the current customer data
    const currentCustomerResponse = await this.hwpcAPI.getCustomerById(this.attach, customerId);
    if (await currentCustomerResponse.getStatusCode() === HWPCAPIConstants_1.default.STATUS_OK) {
        const currentCustomerBody = JSON.parse(await currentCustomerResponse.getBody());
        const customerData = currentCustomerBody.data || currentCustomerBody;
        // Update specific fields
        customerData.name = name;
        customerData.email = email;
        this.response = await this.hwpcAPI.updateCustomer(this.attach, customerId, customerData);
        this.currentCustomerId = customerId;
    }
    else {
        this.response = currentCustomerResponse;
    }
});
(0, cucumber_1.When)('user deletes HWPC customer {string}', async function (customerId) {
    this.response = await this.hwpcAPI.deleteCustomer(this.attach, customerId);
    this.currentCustomerId = customerId;
});
(0, cucumber_1.When)('user searches for HWPC customers with query {string}', async function (searchQuery) {
    const searchParams = {
        q: searchQuery,
        fields: "name,email"
    };
    this.response = await this.hwpcAPI.searchCustomers(this.attach, searchParams);
});
// ===== ROUTE MANAGEMENT STEPS =====
(0, cucumber_1.When)('user makes a request to retrieve all HWPC routes', async function () {
    this.response = await this.hwpcAPI.getAllRoutes(this.attach);
});
(0, cucumber_1.When)('user makes a request to retrieve HWPC route with ID {string}', async function (routeId) {
    this.response = await this.hwpcAPI.getRouteById(this.attach, routeId);
    this.currentRouteId = routeId;
});
// ===== DASHBOARD & REPORTS STEPS =====
(0, cucumber_1.When)('user retrieves HWPC dashboard data', async function () {
    this.response = await this.hwpcAPI.getDashboardData(this.attach);
});
// ===== RESPONSE VALIDATION STEPS =====
(0, cucumber_1.Then)('user should get a successful response with status code {int}', async function (expectedStatusCode) {
    const response = this.response;
    await Assert_1.default.assertEquals(await response.getStatusCode(), expectedStatusCode, "Status Code");
});
(0, cucumber_1.Then)('user should get an error response with status code {int}', async function (expectedStatusCode) {
    const response = this.response;
    await Assert_1.default.assertEquals(await response.getStatusCode(), expectedStatusCode, "Error Status Code");
});
(0, cucumber_1.Then)('user should get HWPC API success response', async function () {
    const response = this.response;
    const responseBody = JSON.parse(await response.getBody());
    await Assert_1.default.assertEquals(responseBody.success, true, "API Success Flag");
});
(0, cucumber_1.Then)('user should get HWPC API response with data', async function () {
    const response = this.response;
    const responseBody = JSON.parse(await response.getBody());
    await Assert_1.default.assertNotNull(responseBody.data, "Response Data");
});
(0, cucumber_1.Then)('user should get list of HWPC tickets', async function () {
    const response = this.response;
    await Assert_1.default.assertNotNull(await response.getBody(), HWPCAPIConstants_1.default.ALL_TICKETS);
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const ticketsData = responseBody.data || responseBody;
    await Assert_1.default.assertTrue(Array.isArray(ticketsData), "Tickets List");
});
(0, cucumber_1.Then)('user should get list of HWPC customers', async function () {
    const response = this.response;
    await Assert_1.default.assertNotNull(await response.getBody(), HWPCAPIConstants_1.default.ALL_CUSTOMERS);
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const customersData = responseBody.data || responseBody;
    await Assert_1.default.assertTrue(Array.isArray(customersData), "Customers List");
});
(0, cucumber_1.Then)('user should get list of HWPC routes', async function () {
    const response = this.response;
    await Assert_1.default.assertNotNull(await response.getBody(), HWPCAPIConstants_1.default.ALL_ROUTES);
    // Verify it's an array (basic structure validation)
    const responseBody = JSON.parse(await response.getBody());
    const routesData = responseBody.data || responseBody;
    await Assert_1.default.assertTrue(Array.isArray(routesData), "Routes List");
});
(0, cucumber_1.Then)('user should get HWPC ticket with ID {string}', async function (expectedTicketId) {
    const response = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const ticketData = responseBody.data || responseBody;
    await Assert_1.default.assertEquals(ticketData.id, expectedTicketId, HWPCAPIConstants_1.default.SINGLE_TICKET);
});
(0, cucumber_1.Then)('user should get HWPC customer with ID {string}', async function (expectedCustomerId) {
    const response = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const customerData = responseBody.data || responseBody;
    await Assert_1.default.assertEquals(customerData.id, expectedCustomerId, HWPCAPIConstants_1.default.SINGLE_CUSTOMER);
});
(0, cucumber_1.Then)('user should get HWPC route with ID {string}', async function (expectedRouteId) {
    const response = this.response;
    const responseBody = JSON.parse(await response.getBody());
    const routeData = responseBody.data || responseBody;
    await Assert_1.default.assertEquals(routeData.id, expectedRouteId, HWPCAPIConstants_1.default.SINGLE_ROUTE);
});
(0, cucumber_1.Then)('user should get HWPC ticket with title {string}', async function (expectedTitle) {
    const response = this.response;
    const actualTitle = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_TITLE_JSON_PATH, HWPCAPIConstants_1.default.SINGLE_TICKET);
    await Assert_1.default.assertEquals(actualTitle, expectedTitle, "Ticket Title");
});
(0, cucumber_1.Then)('user should get HWPC ticket with status {string}', async function (expectedStatus) {
    const response = this.response;
    const actualStatus = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_STATUS_JSON_PATH, HWPCAPIConstants_1.default.SINGLE_TICKET);
    await Assert_1.default.assertEquals(actualStatus, expectedStatus, "Ticket Status");
});
(0, cucumber_1.Then)('user should get HWPC ticket with priority {string}', async function (expectedPriority) {
    const response = this.response;
    const actualPriority = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_PRIORITY_JSON_PATH, HWPCAPIConstants_1.default.SINGLE_TICKET);
    await Assert_1.default.assertEquals(actualPriority, expectedPriority, "Ticket Priority");
});
(0, cucumber_1.Then)('user should get created HWPC ticket with title {string}, priority {string}, and status {string}', async function (expectedTitle, expectedPriority, expectedStatus) {
    const response = this.response;
    const actualTitle = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_TITLE_JSON_PATH, HWPCAPIConstants_1.default.CREATE_TICKET);
    const actualPriority = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_PRIORITY_JSON_PATH, HWPCAPIConstants_1.default.CREATE_TICKET);
    const actualStatus = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_STATUS_JSON_PATH, HWPCAPIConstants_1.default.CREATE_TICKET);
    await Assert_1.default.assertEquals(actualTitle, expectedTitle, "Created Ticket Title");
    await Assert_1.default.assertEquals(actualPriority, expectedPriority, "Created Ticket Priority");
    await Assert_1.default.assertEquals(actualStatus, expectedStatus, "Created Ticket Status");
    // Verify ticket ID is present
    await Assert_1.default.assertNotNull(await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.TICKET_ID_JSON_PATH, HWPCAPIConstants_1.default.CREATE_TICKET), "Created Ticket ID");
});
(0, cucumber_1.Then)('user should get HWPC search results containing tickets', async function () {
    const response = this.response;
    await Assert_1.default.assertNotNull(await response.getBody(), HWPCAPIConstants_1.default.TICKET_SEARCH);
    // Verify search results structure
    const responseBody = JSON.parse(await response.getBody());
    const hasResults = Array.isArray(responseBody) ||
        (responseBody.results && Array.isArray(responseBody.results)) ||
        (responseBody.data && Array.isArray(responseBody.data));
    await Assert_1.default.assertTrue(hasResults, "Search Results Structure");
});
(0, cucumber_1.Then)('user should get HWPC search results with total count greater than {int}', async function (minCount) {
    const response = this.response;
    try {
        const totalCount = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.SEARCH_TOTAL_COUNT_JSON_PATH, HWPCAPIConstants_1.default.TICKET_SEARCH);
        await Assert_1.default.assertTrue(parseInt(totalCount) > minCount, "Search Results Count");
    }
    catch (error) {
        // If total count is not available, check array length
        const responseBody = JSON.parse(await response.getBody());
        const results = responseBody.results || responseBody.data || responseBody;
        await Assert_1.default.assertTrue(Array.isArray(results) && results.length > minCount, "Search Results Array Length");
    }
});
(0, cucumber_1.Then)('user should get user profile with username {string}', async function (expectedUsername) {
    const response = this.response;
    const actualUsername = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.USER_NAME_JSON_PATH, HWPCAPIConstants_1.default.USER_PROFILE);
    await Assert_1.default.assertEquals(actualUsername, expectedUsername, "User Profile Username");
});
(0, cucumber_1.Then)('user should get user profile with email {string}', async function (expectedEmail) {
    const response = this.response;
    const actualEmail = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.USER_EMAIL_JSON_PATH, HWPCAPIConstants_1.default.USER_PROFILE);
    await Assert_1.default.assertEquals(actualEmail, expectedEmail, "User Profile Email");
});
// ===== ERROR HANDLING STEPS =====
(0, cucumber_1.Then)('user should get HWPC API error with code {string}', async function (expectedErrorCode) {
    const response = this.response;
    const actualErrorCode = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.ERROR_CODE_JSON_PATH, "API Error");
    await Assert_1.default.assertEquals(actualErrorCode, expectedErrorCode, "API Error Code");
});
(0, cucumber_1.Then)('user should get HWPC API error message containing {string}', async function (expectedMessage) {
    const response = this.response;
    const actualMessage = await response.getTagContentByJsonPath(HWPCAPIConstants_1.default.ERROR_MESSAGE_JSON_PATH, "API Error Message");
    await Assert_1.default.assertContains(actualMessage, expectedMessage, "API Error Message");
});
(0, cucumber_1.Then)('user should get validation error for field {string}', async function (fieldName) {
    const response = this.response;
    const responseBody = await response.getBody();
    await Assert_1.default.assertContains(responseBody, fieldName, "Validation Error Field");
});
// ===== CLEANUP STEPS =====
(0, cucumber_1.Then)('user cleans up the created HWPC ticket', async function () {
    if (this.currentTicketId && this.hwpcAPI) {
        try {
            await this.hwpcAPI.deleteTicket(this.attach, this.currentTicketId);
        }
        catch (error) {
            // Cleanup failed, but don't fail the test
            console.log(`Cleanup failed for ticket ${this.currentTicketId}: ${error}`);
        }
    }
});
(0, cucumber_1.Then)('user cleans up the created HWPC customer', async function () {
    if (this.currentCustomerId && this.hwpcAPI) {
        try {
            await this.hwpcAPI.deleteCustomer(this.attach, this.currentCustomerId);
        }
        catch (error) {
            // Cleanup failed, but don't fail the test
            console.log(`Cleanup failed for customer ${this.currentCustomerId}: ${error}`);
        }
    }
});
(0, cucumber_1.Then)('user cleans up HWPC API client', async function () {
    if (this.hwpcAPI) {
        this.hwpcAPI.clearData();
    }
});
// ===== UTILITY STEPS =====
(0, cucumber_1.Then)('user verifies HWPC API response contains field {string}', async function (fieldName) {
    const response = this.response;
    const responseBody = await response.getBody();
    await Assert_1.default.assertContains(responseBody, fieldName, `Response Field: ${fieldName}`);
});
(0, cucumber_1.Then)('user verifies HWPC API response does not contain field {string}', async function (fieldName) {
    const response = this.response;
    const responseBody = await response.getBody();
    await Assert_1.default.assertNotContains(responseBody, fieldName, `Response Field: ${fieldName}`);
});
(0, cucumber_1.Then)('user stores HWPC ticket ID from response', async function () {
    const response = this.response;
    try {
        const responseBody = JSON.parse(await response.getBody());
        this.currentTicketId = responseBody.data?.id || responseBody.id;
        if (!this.currentTicketId) {
            console.log("No ticket ID found in response");
        }
    }
    catch (error) {
        console.log("Failed to store ticket ID from response:", error);
    }
});
(0, cucumber_1.Then)('user stores HWPC user ID from response', async function () {
    const response = this.response;
    try {
        const responseBody = JSON.parse(await response.getBody());
        this.currentUserId = responseBody.data?.id || responseBody.id;
        if (!this.currentUserId) {
            console.log("No user ID found in response");
        }
    }
    catch (error) {
        console.log("Failed to store user ID from response:", error);
    }
});
//# sourceMappingURL=HWPCAPISteps.js.map