"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const CommonPage_1 = __importDefault(require("../pages/CommonPage"));
const HomePage_1 = __importDefault(require("../pages/HomePage"));
const SearchResultsPage_1 = __importDefault(require("../pages/SearchResultsPage"));
(0, cucumber_1.Given)('user is on tickets page', async function () {
    try {
        console.log('Navigating to tickets page...');
        await new HomePage_1.default(this.web).navigateToTicketsPage();
        console.log('Successfully navigated to tickets page');
    }
    catch (error) {
        console.error('Failed to navigate to tickets page:', error.message);
        throw new Error(`Navigation to tickets page failed: ${error.message}`);
    }
});
(0, cucumber_1.Given)('user is on tickets page with {string} viewport', async function (viewportType) {
    try {
        console.log(`Setting ${viewportType} viewport and navigating to tickets page...`);
        const homePage = new HomePage_1.default(this.web);
        // Set appropriate viewport based on type
        switch (viewportType.toLowerCase()) {
            case 'mobile':
                await homePage.setMobileViewport();
                break;
            case 'tablet':
                await homePage.setTabletViewport();
                break;
            case 'desktop':
                await homePage.setDesktopViewport();
                break;
            default:
                console.warn(`Unknown viewport type: ${viewportType}, using mobile as default`);
                await homePage.setMobileViewport();
        }
        await homePage.navigateToTicketsPage();
        console.log(`Successfully navigated to tickets page with ${viewportType} viewport`);
    }
    catch (error) {
        console.error(`Failed to navigate to tickets page with ${viewportType} viewport:`, error.message);
        throw new Error(`Navigation failed: ${error.message}`);
    }
});
(0, cucumber_1.When)('the user searches for ticket {string}', async function (ticket) {
    try {
        console.log(`Searching for ticket: "${ticket}"`);
        const commonPage = new CommonPage_1.default(this.web);
        // Use the enhanced mobile-first search method
        await commonPage.searchTicket(ticket);
        console.log(`Successfully initiated search for ticket: "${ticket}"`);
    }
    catch (error) {
        console.error(`Failed to search for ticket "${ticket}":`, error.message);
        throw new Error(`Search operation failed: ${error.message}`);
    }
});
(0, cucumber_1.When)('the user searches for product {string}', async function (product) {
    try {
        console.log(`Searching for product: "${product}" (legacy method)`);
        await new CommonPage_1.default(this.web).searchProduct(product);
        console.log(`Successfully initiated search for product: "${product}"`);
    }
    catch (error) {
        console.error(`Failed to search for product "${product}":`, error.message);
        throw new Error(`Product search operation failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('user should see {string} ticket displayed on search result', async function (ticket) {
    try {
        console.log(`Verifying search results contain ticket: "${ticket}"`);
        const searchResultsPage = new SearchResultsPage_1.default(this.web);
        // Verify responsive results display first
        await searchResultsPage.verifyResponsiveResults();
        // Then verify the specific ticket is found
        await searchResultsPage.verifyTicketSearchResult(ticket);
        console.log(`Successfully verified ticket "${ticket}" is displayed in search results`);
    }
    catch (error) {
        console.error(`Failed to verify ticket "${ticket}" in search results:`, error.message);
        throw new Error(`Search result verification failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('user should see {string} product displayed on search result', async function (product) {
    try {
        console.log(`Verifying search results contain product: "${product}" (legacy method)`);
        await new SearchResultsPage_1.default(this.web).verifySearchResult(product);
        console.log(`Successfully verified product "${product}" is displayed in search results`);
    }
    catch (error) {
        console.error(`Failed to verify product "${product}" in search results:`, error.message);
        throw new Error(`Product search result verification failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('user should see a ticket search result message as {string}', async function (message) {
    try {
        console.log(`Verifying no results message: "${message}"`);
        await new SearchResultsPage_1.default(this.web).verifyInvalidSearchMessage(message);
        console.log(`Successfully verified no results message: "${message}"`);
    }
    catch (error) {
        console.error(`Failed to verify no results message "${message}":`, error.message);
        throw new Error(`No results message verification failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('user should see search results in mobile-friendly format', async function () {
    try {
        console.log('Verifying search results are displayed in mobile-friendly format...');
        const searchResultsPage = new SearchResultsPage_1.default(this.web);
        await searchResultsPage.verifyMobileResultsDisplay();
        console.log('Successfully verified mobile-friendly search results format');
    }
    catch (error) {
        console.error('Failed to verify mobile-friendly search results format:', error.message);
        throw new Error(`Mobile results format verification failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('user should see {int} or more search results', async function (expectedCount) {
    try {
        console.log(`Verifying at least ${expectedCount} search results are displayed...`);
        const searchResultsPage = new SearchResultsPage_1.default(this.web);
        const actualCount = await searchResultsPage.getSearchResultsCount();
        if (actualCount < expectedCount) {
            throw new Error(`Expected at least ${expectedCount} results, but found ${actualCount}`);
        }
        console.log(`Successfully verified ${actualCount} search results (expected at least ${expectedCount})`);
    }
    catch (error) {
        console.error(`Failed to verify search results count:`, error.message);
        throw new Error(`Search results count verification failed: ${error.message}`);
    }
});
// Mobile-specific step definitions
(0, cucumber_1.When)('the user opens mobile navigation menu', async function () {
    try {
        console.log('Opening mobile navigation menu...');
        await new CommonPage_1.default(this.web).toggleMobileMenu();
        console.log('Successfully opened mobile navigation menu');
    }
    catch (error) {
        console.error('Failed to open mobile navigation menu:', error.message);
        throw new Error(`Mobile navigation failed: ${error.message}`);
    }
});
(0, cucumber_1.Then)('the search should complete within {int} seconds', async function (timeoutSeconds) {
    try {
        console.log(`Verifying search completes within ${timeoutSeconds} seconds...`);
        const startTime = Date.now();
        // Wait for loading to complete with custom timeout
        await new CommonPage_1.default(this.web).waitForLoadingComplete();
        const endTime = Date.now();
        const actualTime = (endTime - startTime) / 1000;
        if (actualTime > timeoutSeconds) {
            throw new Error(`Search took ${actualTime} seconds, expected within ${timeoutSeconds} seconds`);
        }
        console.log(`Search completed in ${actualTime} seconds (within ${timeoutSeconds} second limit)`);
    }
    catch (error) {
        console.error(`Search timeout verification failed:`, error.message);
        throw new Error(`Search performance verification failed: ${error.message}`);
    }
});
// Error handling and retry step definitions
(0, cucumber_1.When)('the user retries searching for ticket {string}', async function (ticket) {
    try {
        console.log(`Retrying search for ticket: "${ticket}"`);
        const commonPage = new CommonPage_1.default(this.web);
        // Wait a moment before retry
        await this.web.getPage().waitForTimeout(1000);
        // Clear any existing search and retry
        await commonPage.searchTicket(ticket);
        console.log(`Successfully retried search for ticket: "${ticket}"`);
    }
    catch (error) {
        console.error(`Failed to retry search for ticket "${ticket}":`, error.message);
        throw new Error(`Search retry failed: ${error.message}`);
    }
});
// Viewport-specific verification steps
(0, cucumber_1.Then)('the search interface should be responsive', async function () {
    try {
        console.log('Verifying search interface responsiveness...');
        const homePage = new HomePage_1.default(this.web);
        await homePage.verifyResponsiveDesign();
        console.log('Successfully verified search interface responsiveness');
    }
    catch (error) {
        console.error('Failed to verify search interface responsiveness:', error.message);
        throw new Error(`Responsive design verification failed: ${error.message}`);
    }
});
//# sourceMappingURL=SearchTicketsSteps.js.map