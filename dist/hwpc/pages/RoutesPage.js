"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NavigationPage_1 = __importDefault(require("./NavigationPage"));
const NavigationConstants_1 = __importDefault(require("../constants/NavigationConstants"));
/**
 * RoutesPage - Page object for route page navigation and mobile-optimized interface validation
 * Extends NavigationPage with route-specific functionality and map responsiveness validation
 */
class RoutesPage extends NavigationPage_1.default {
    constructor(web) {
        super(web);
        // Route-specific selectors
        this.ROUTE_LIST_CONTAINER = "[data-testid='routes-container'], .routes-container, .route-list, .routes-list";
        this.ROUTE_ITEM = "[data-testid='route-item'], .route-item, .route-row, .route-card";
        this.ROUTE_MAP_CONTAINER = "[data-testid='route-map'], .route-map, .map-container, #map";
        this.ROUTE_SEARCH_FILTERS = "[data-testid='route-filters'], .route-filters, .search-filters, .filter-container";
        this.ROUTE_DATE_FILTER = "[data-testid='date-filter'], .date-filter, input[type='date'], input[name*='date' i]";
        this.ROUTE_DRIVER_FILTER = "[data-testid='driver-filter'], .driver-filter, select[name*='driver' i]";
        this.ROUTE_STATUS_FILTER = "[data-testid='status-filter'], .status-filter, select[name*='status' i]";
        // Mobile-specific route selectors
        this.MOBILE_ROUTE_CARD = "[data-testid='mobile-route-card'], .mobile-route-card, .route-mobile";
        this.MOBILE_ROUTE_ACTIONS = "[data-testid='mobile-route-actions'], .mobile-route-actions, .route-actions-mobile";
        this.MOBILE_MAP_TOGGLE = "[data-testid='mobile-map-toggle'], .mobile-map-toggle, .map-toggle-mobile";
        this.MOBILE_FILTER_TOGGLE = "[data-testid='mobile-filter-toggle'], .mobile-filter-toggle, .filter-toggle-mobile";
        this.MOBILE_ROUTE_DETAILS = "[data-testid='mobile-route-details'], .mobile-route-details, .route-details-mobile";
        // Map-specific selectors
        this.MAP_CONTROLS = "[data-testid='map-controls'], .map-controls, .leaflet-control-container, .mapboxgl-ctrl-group";
        this.MAP_ZOOM_IN = "[data-testid='zoom-in'], .zoom-in, .leaflet-control-zoom-in, .mapboxgl-ctrl-zoom-in";
        this.MAP_ZOOM_OUT = "[data-testid='zoom-out'], .zoom-out, .leaflet-control-zoom-out, .mapboxgl-ctrl-zoom-out";
        this.MAP_MARKERS = "[data-testid='map-marker'], .map-marker, .leaflet-marker-icon, .mapboxgl-marker";
        // Route planning selectors
        this.ROUTE_PLANNING_PANEL = "[data-testid='route-planning'], .route-planning, .planning-panel";
        this.ADD_STOP_BUTTON = "[data-testid='add-stop'], .add-stop, .btn-add-stop";
        this.OPTIMIZE_ROUTE_BUTTON = "[data-testid='optimize-route'], .optimize-route, .btn-optimize";
    }
    /**
     * Initialize the routes page with route-specific validation
     */
    async initialize() {
        try {
            console.log("Initializing RoutesPage...");
            // Call parent initialization
            await super.initialize();
            // Verify route-specific elements
            await this.validateRoutePageElements();
            console.log("RoutesPage initialized successfully");
        }
        catch (error) {
            console.log(`RoutesPage initialization failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Validate route page elements are present and responsive
     */
    async validatePageElements() {
        try {
            await this.validateRoutePageElements();
        }
        catch (error) {
            console.log(`Route page element validation failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Validate route-specific page elements
     */
    async validateRoutePageElements() {
        try {
            console.log("Validating route page elements...");
            // Verify route list container
            const isRouteListVisible = await this.web.element(this.ROUTE_LIST_CONTAINER, "Route List Container").isVisible(3);
            if (!isRouteListVisible) {
                console.log("Warning: Route list container not found");
            }
            // Verify search interface
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('routes', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Route Search Interface").isVisible(3);
            if (!isSearchVisible) {
                console.log("Warning: Route search interface not found");
            }
            // Verify map container (may take longer to load)
            const isMapVisible = await this.web.element(this.ROUTE_MAP_CONTAINER, "Route Map Container").isVisible(5);
            if (isMapVisible) {
                console.log("Route map container found");
            }
            else {
                console.log("Warning: Route map container not found");
            }
            // Verify mobile-specific elements if on mobile
            if (this.isMobile) {
                await this.validateMobileRouteElements();
            }
            console.log("Route page elements validated successfully");
        }
        catch (error) {
            console.log(`Route page element validation failed: ${error.message}`);
        }
    }
    /**
     * Validate mobile-specific route elements
     */
    async validateMobileRouteElements() {
        try {
            console.log("Validating mobile route elements...");
            // Check for mobile route cards
            const isMobileCardVisible = await this.web.element(this.MOBILE_ROUTE_CARD, "Mobile Route Card").isVisible(2);
            if (isMobileCardVisible) {
                console.log("Mobile route cards found");
            }
            // Check for mobile map toggle
            const isMapToggleVisible = await this.web.element(this.MOBILE_MAP_TOGGLE, "Mobile Map Toggle").isVisible(2);
            if (isMapToggleVisible) {
                console.log("Mobile map toggle found");
            }
            // Check for mobile filter toggle
            const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            if (isFilterToggleVisible) {
                console.log("Mobile filter toggle found");
            }
        }
        catch (error) {
            console.log(`Mobile route element validation failed: ${error.message}`);
        }
    }
    /**
     * Perform route search with mobile-optimized interface
     * @param searchTerm - The term to search for
     */
    async searchRoutes(searchTerm) {
        try {
            console.log(`Searching for routes with term: "${searchTerm}"`);
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('routes', this.isMobile);
            const searchInput = this.web.editBox(searchSelector, "Route Search Input");
            // Ensure search input is visible
            await searchInput.waitTillVisible();
            if (this.isMobile) {
                // Mobile-specific search interaction
                await this.touchFriendlyClick(searchSelector, "Route Search Input");
                await this.page.waitForTimeout(500); // Wait for mobile keyboard
            }
            // Clear and type search term
            await searchInput.fill(searchTerm);
            // Submit search
            await searchInput.keyPress('Enter');
            // Wait for search results
            await this.waitForRouteSearchResults();
            console.log(`Route search completed for: "${searchTerm}"`);
        }
        catch (error) {
            console.log(`Route search failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Wait for route search results to load
     */
    async waitForRouteSearchResults() {
        try {
            // Wait for loading to complete
            await this.waitForLoadingComplete();
            // Wait for route list to update
            await this.page.waitForTimeout(1000);
            // Verify results are displayed
            const isResultsVisible = await this.web.element(this.ROUTE_LIST_CONTAINER, "Route Results").isVisible(3);
            if (isResultsVisible) {
                console.log("Route search results loaded successfully");
            }
        }
        catch (error) {
            console.log(`Waiting for route search results failed: ${error.message}`);
        }
    }
    /**
     * Verify route search interface responsiveness
     */
    async verifyRouteSearchResponsiveness() {
        try {
            console.log("Verifying route search interface responsiveness...");
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('routes', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Route Search").isVisible(3);
            if (!isSearchVisible) {
                console.log("Route search interface not visible");
                return false;
            }
            // Verify search interface adapts to viewport
            if (this.isMobile) {
                return await this.verifyMobileRouteSearchInterface();
            }
            else {
                return await this.verifyDesktopRouteSearchInterface();
            }
        }
        catch (error) {
            console.log(`Route search responsiveness verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify mobile route search interface
     */
    async verifyMobileRouteSearchInterface() {
        try {
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('routes', true);
            const searchElement = this.web.element(searchSelector, "Mobile Route Search");
            // Check if search input is touch-friendly
            const boundingBox = await searchElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile route search input is not touch-friendly");
                    return false;
                }
            }
            // Check for mobile-specific search features
            const isMobileFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            console.log("Mobile route search interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile route search interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify desktop route search interface
     */
    async verifyDesktopRouteSearchInterface() {
        try {
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('routes', false);
            const isSearchVisible = await this.web.element(searchSelector, "Desktop Route Search").isVisible(3);
            if (!isSearchVisible) {
                console.log("Desktop route search interface not visible");
                return false;
            }
            // Check for desktop-specific search filters
            const isFiltersVisible = await this.web.element(this.ROUTE_SEARCH_FILTERS, "Route Search Filters").isVisible(2);
            console.log("Desktop route search interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Desktop route search interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify map responsiveness across different viewports
     */
    async verifyMapResponsiveness() {
        try {
            console.log("Verifying map responsiveness...");
            const isMapVisible = await this.web.element(this.ROUTE_MAP_CONTAINER, "Route Map").isVisible(5);
            if (!isMapVisible) {
                console.log("Route map not visible");
                return false;
            }
            const viewportCategory = await this.getCurrentViewportCategory();
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileMapInterface();
                case 'tablet':
                    return await this.verifyTabletMapInterface();
                case 'desktop':
                    return await this.verifyDesktopMapInterface();
                default:
                    return false;
            }
        }
        catch (error) {
            console.log(`Map responsiveness verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify mobile map interface
     */
    async verifyMobileMapInterface() {
        try {
            console.log("Verifying mobile map interface...");
            // Check for mobile map toggle
            const isMapToggleVisible = await this.web.element(this.MOBILE_MAP_TOGGLE, "Mobile Map Toggle").isVisible(2);
            if (!isMapToggleVisible) {
                console.log("Mobile map toggle not found");
                return false;
            }
            // Verify map toggle is touch-friendly
            const mapToggleElement = this.web.element(this.MOBILE_MAP_TOGGLE, "Mobile Map Toggle");
            const boundingBox = await mapToggleElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile map toggle is not touch-friendly");
                    return false;
                }
            }
            // Test map toggle functionality
            await this.touchFriendlyClick(this.MOBILE_MAP_TOGGLE, "Mobile Map Toggle");
            await this.page.waitForTimeout(500); // Wait for map to show/hide
            console.log("Mobile map interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile map interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify tablet map interface
     */
    async verifyTabletMapInterface() {
        try {
            console.log("Verifying tablet map interface...");
            // Check for map controls
            const isControlsVisible = await this.web.element(this.MAP_CONTROLS, "Map Controls").isVisible(3);
            if (!isControlsVisible) {
                console.log("Map controls not visible on tablet");
                return false;
            }
            // Verify map container size is appropriate for tablet
            const mapElement = this.web.element(this.ROUTE_MAP_CONTAINER, "Route Map");
            const boundingBox = await mapElement.getLocator().boundingBox();
            if (boundingBox && boundingBox.width < 400) {
                console.log("Map may be too small for tablet view");
                return false;
            }
            console.log("Tablet map interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Tablet map interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify desktop map interface
     */
    async verifyDesktopMapInterface() {
        try {
            console.log("Verifying desktop map interface...");
            // Check for map controls
            const isControlsVisible = await this.web.element(this.MAP_CONTROLS, "Map Controls").isVisible(3);
            if (!isControlsVisible) {
                console.log("Map controls not visible on desktop");
                return false;
            }
            // Check for route planning panel
            const isPlanningPanelVisible = await this.web.element(this.ROUTE_PLANNING_PANEL, "Route Planning Panel").isVisible(2);
            console.log("Desktop map interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Desktop map interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Apply route filters with mobile-first approach
     * @param filters - Object containing filter criteria
     */
    async applyRouteFilters(filters) {
        try {
            console.log("Applying route filters...", filters);
            if (this.isMobile) {
                // Open mobile filter panel
                const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
                if (isFilterToggleVisible) {
                    await this.touchFriendlyClick(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle");
                    await this.page.waitForTimeout(300); // Wait for filter panel to open
                }
            }
            // Apply date filter
            if (filters.date) {
                await this.applyDateFilter(filters.date);
            }
            // Apply driver filter
            if (filters.driver) {
                await this.applyDriverFilter(filters.driver);
            }
            // Apply status filter
            if (filters.status) {
                await this.applyStatusFilter(filters.status);
            }
            // Wait for filters to be applied
            await this.waitForRouteSearchResults();
            console.log("Route filters applied successfully");
        }
        catch (error) {
            console.log(`Applying route filters failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Apply date filter
     */
    async applyDateFilter(date) {
        try {
            const dateFilter = this.web.editBox(this.ROUTE_DATE_FILTER, "Date Filter");
            const isFilterVisible = await dateFilter.isVisible(2);
            if (isFilterVisible) {
                await dateFilter.fill(date);
                console.log(`Date filter applied: ${date}`);
            }
        }
        catch (error) {
            console.log(`Date filter application failed: ${error.message}`);
        }
    }
    /**
     * Apply driver filter
     */
    async applyDriverFilter(driver) {
        try {
            const driverFilter = this.web.dropdown(this.ROUTE_DRIVER_FILTER, "Driver Filter");
            const isFilterVisible = await this.web.element(this.ROUTE_DRIVER_FILTER, "Driver Filter").isVisible(2);
            if (isFilterVisible) {
                await driverFilter.selectByVisibleText(driver);
                console.log(`Driver filter applied: ${driver}`);
            }
        }
        catch (error) {
            console.log(`Driver filter application failed: ${error.message}`);
        }
    }
    /**
     * Apply status filter
     */
    async applyStatusFilter(status) {
        try {
            const statusFilter = this.web.dropdown(this.ROUTE_STATUS_FILTER, "Status Filter");
            const isFilterVisible = await this.web.element(this.ROUTE_STATUS_FILTER, "Status Filter").isVisible(2);
            if (isFilterVisible) {
                await statusFilter.selectByVisibleText(status);
                console.log(`Status filter applied: ${status}`);
            }
        }
        catch (error) {
            console.log(`Status filter application failed: ${error.message}`);
        }
    }
    /**
     * Interact with map controls (zoom, pan)
     * @param action - The map action to perform ('zoom-in', 'zoom-out')
     */
    async interactWithMapControls(action) {
        try {
            console.log(`Performing map action: ${action}`);
            let controlSelector;
            switch (action) {
                case 'zoom-in':
                    controlSelector = this.MAP_ZOOM_IN;
                    break;
                case 'zoom-out':
                    controlSelector = this.MAP_ZOOM_OUT;
                    break;
                default:
                    throw new Error(`Unknown map action: ${action}`);
            }
            const isControlVisible = await this.web.element(controlSelector, `Map ${action}`).isVisible(3);
            if (!isControlVisible) {
                console.log(`Map control ${action} not visible`);
                return;
            }
            if (this.isMobile) {
                await this.touchFriendlyClick(controlSelector, `Map ${action}`);
            }
            else {
                await this.web.element(controlSelector, `Map ${action}`).click();
            }
            // Wait for map to update
            await this.page.waitForTimeout(500);
            console.log(`Map ${action} completed successfully`);
        }
        catch (error) {
            console.log(`Map control interaction failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get route count from the page
     */
    async getRouteCount() {
        try {
            const routeItems = await this.page.locator(this.ROUTE_ITEM).count();
            console.log(`Found ${routeItems} routes on the page`);
            return routeItems;
        }
        catch (error) {
            console.log(`Getting route count failed: ${error.message}`);
            return 0;
        }
    }
    /**
     * Verify mobile route management interface
     */
    async verifyMobileRouteManagement() {
        try {
            if (!this.isMobile) {
                console.log("Not on mobile viewport, skipping mobile route management verification");
                return true;
            }
            console.log("Verifying mobile route management interface...");
            // Check for mobile route cards
            const mobileCards = await this.page.locator(this.MOBILE_ROUTE_CARD).count();
            if (mobileCards === 0) {
                console.log("No mobile route cards found");
                return false;
            }
            // Verify first card is touch-friendly
            const firstCard = this.page.locator(this.MOBILE_ROUTE_CARD).first();
            const boundingBox = await firstCard.boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile route cards are not touch-friendly");
                    return false;
                }
            }
            // Check for mobile route actions
            const isActionsVisible = await this.web.element(this.MOBILE_ROUTE_ACTIONS, "Mobile Route Actions").isVisible(2);
            console.log("Mobile route management interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile route management verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * View route details with mobile-optimized interaction
     * @param routeIndex - Index of the route to view (0-based)
     */
    async viewRouteDetails(routeIndex = 0) {
        try {
            console.log(`Viewing route details for route at index ${routeIndex}`);
            const routeSelector = this.isMobile ? this.MOBILE_ROUTE_CARD : this.ROUTE_ITEM;
            const routeItems = await this.page.locator(routeSelector).count();
            if (routeIndex >= routeItems) {
                throw new Error(`Route index ${routeIndex} is out of range. Found ${routeItems} routes.`);
            }
            const routeElement = this.page.locator(routeSelector).nth(routeIndex);
            if (this.isMobile) {
                // Mobile interaction - tap to expand details
                await this.touchFriendlyClick(routeSelector, `Route ${routeIndex}`);
                await this.page.waitForTimeout(300); // Wait for details to expand
            }
            else {
                // Desktop interaction - click to view details
                await routeElement.click();
            }
            // Verify route details are visible
            const isDetailsVisible = await this.web.element(this.MOBILE_ROUTE_DETAILS, "Route Details").isVisible(3);
            if (isDetailsVisible) {
                console.log(`Route details displayed successfully for route ${routeIndex}`);
            }
        }
        catch (error) {
            console.log(`Viewing route details failed: ${error.message}`);
            throw error;
        }
    }
}
exports.default = RoutesPage;
//# sourceMappingURL=RoutesPage.js.map