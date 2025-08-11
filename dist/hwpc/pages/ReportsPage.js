"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NavigationPage_1 = __importDefault(require("./NavigationPage"));
const NavigationConstants_1 = __importDefault(require("../constants/NavigationConstants"));
/**
 * ReportsPage - Page object for reports page navigation and responsive chart/display validation
 * Extends NavigationPage with report-specific functionality and mobile-optimized chart interactions
 */
class ReportsPage extends NavigationPage_1.default {
    constructor(web) {
        super(web);
        // Report-specific selectors
        this.REPORT_LIST_CONTAINER = "[data-testid='reports-container'], .reports-container, .report-list, .reports-list";
        this.REPORT_ITEM = "[data-testid='report-item'], .report-item, .report-row, .report-card";
        this.REPORT_CHART_CONTAINER = "[data-testid='report-chart'], .report-chart, .chart-container, .chart-wrapper";
        this.REPORT_SEARCH_FILTERS = "[data-testid='report-filters'], .report-filters, .search-filters, .filter-container";
        this.REPORT_TYPE_FILTER = "[data-testid='type-filter'], .type-filter, select[name*='type' i]";
        this.REPORT_DATE_RANGE_FILTER = "[data-testid='date-range-filter'], .date-range-filter, .date-range";
        this.REPORT_CATEGORY_FILTER = "[data-testid='category-filter'], .category-filter, select[name*='category' i]";
        // Mobile-specific report selectors
        this.MOBILE_REPORT_CARD = "[data-testid='mobile-report-card'], .mobile-report-card, .report-mobile";
        this.MOBILE_REPORT_ACTIONS = "[data-testid='mobile-report-actions'], .mobile-report-actions, .report-actions-mobile";
        this.MOBILE_CHART_TOGGLE = "[data-testid='mobile-chart-toggle'], .mobile-chart-toggle, .chart-toggle-mobile";
        this.MOBILE_FILTER_TOGGLE = "[data-testid='mobile-filter-toggle'], .mobile-filter-toggle, .filter-toggle-mobile";
        this.MOBILE_REPORT_DETAILS = "[data-testid='mobile-report-details'], .mobile-report-details, .report-details-mobile";
        // Chart-specific selectors
        this.CHART_CANVAS = "[data-testid='chart-canvas'], .chart-canvas, canvas, svg";
        this.CHART_LEGEND = "[data-testid='chart-legend'], .chart-legend, .legend";
        this.CHART_CONTROLS = "[data-testid='chart-controls'], .chart-controls, .chart-toolbar";
        this.CHART_EXPORT_BUTTON = "[data-testid='export-chart'], .export-chart, .btn-export";
        this.CHART_FULLSCREEN_BUTTON = "[data-testid='fullscreen-chart'], .fullscreen-chart, .btn-fullscreen";
        // Report generation selectors
        this.GENERATE_REPORT_BUTTON = "[data-testid='generate-report'], .generate-report, .btn-generate";
        this.REPORT_PROGRESS = "[data-testid='report-progress'], .report-progress, .progress-bar";
        this.DOWNLOAD_REPORT_BUTTON = "[data-testid='download-report'], .download-report, .btn-download";
    }
    /**
     * Initialize the reports page with report-specific validation
     */
    async initialize() {
        try {
            console.log("Initializing ReportsPage...");
            // Call parent initialization
            await super.initialize();
            // Verify report-specific elements
            await this.validateReportPageElements();
            console.log("ReportsPage initialized successfully");
        }
        catch (error) {
            console.log(`ReportsPage initialization failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Validate report page elements are present and responsive
     */
    async validatePageElements() {
        try {
            await this.validateReportPageElements();
        }
        catch (error) {
            console.log(`Report page element validation failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Validate report-specific page elements
     */
    async validateReportPageElements() {
        try {
            console.log("Validating report page elements...");
            // Verify report list container
            const isReportListVisible = await this.web.element(this.REPORT_LIST_CONTAINER, "Report List Container").isVisible(3);
            if (!isReportListVisible) {
                console.log("Warning: Report list container not found");
            }
            // Verify search interface
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('reports', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Report Search Interface").isVisible(3);
            if (!isSearchVisible) {
                console.log("Warning: Report search interface not found");
            }
            // Verify chart container (may take longer to load)
            const isChartVisible = await this.web.element(this.REPORT_CHART_CONTAINER, "Report Chart Container").isVisible(5);
            if (isChartVisible) {
                console.log("Report chart container found");
            }
            else {
                console.log("Warning: Report chart container not found");
            }
            // Verify mobile-specific elements if on mobile
            if (this.isMobile) {
                await this.validateMobileReportElements();
            }
            console.log("Report page elements validated successfully");
        }
        catch (error) {
            console.log(`Report page element validation failed: ${error.message}`);
        }
    }
    /**
     * Validate mobile-specific report elements
     */
    async validateMobileReportElements() {
        try {
            console.log("Validating mobile report elements...");
            // Check for mobile report cards
            const isMobileCardVisible = await this.web.element(this.MOBILE_REPORT_CARD, "Mobile Report Card").isVisible(2);
            if (isMobileCardVisible) {
                console.log("Mobile report cards found");
            }
            // Check for mobile chart toggle
            const isChartToggleVisible = await this.web.element(this.MOBILE_CHART_TOGGLE, "Mobile Chart Toggle").isVisible(2);
            if (isChartToggleVisible) {
                console.log("Mobile chart toggle found");
            }
            // Check for mobile filter toggle
            const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            if (isFilterToggleVisible) {
                console.log("Mobile filter toggle found");
            }
        }
        catch (error) {
            console.log(`Mobile report element validation failed: ${error.message}`);
        }
    }
    /**
     * Perform report search with mobile-optimized interface
     * @param searchTerm - The term to search for
     */
    async searchReports(searchTerm) {
        try {
            console.log(`Searching for reports with term: "${searchTerm}"`);
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('reports', this.isMobile);
            const searchInput = this.web.editBox(searchSelector, "Report Search Input");
            // Ensure search input is visible
            await searchInput.waitTillVisible();
            if (this.isMobile) {
                // Mobile-specific search interaction
                await this.touchFriendlyClick(searchSelector, "Report Search Input");
                await this.page.waitForTimeout(500); // Wait for mobile keyboard
            }
            // Clear and type search term
            await searchInput.fill(searchTerm);
            // Submit search
            await searchInput.keyPress('Enter');
            // Wait for search results
            await this.waitForReportSearchResults();
            console.log(`Report search completed for: "${searchTerm}"`);
        }
        catch (error) {
            console.log(`Report search failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Wait for report search results to load
     */
    async waitForReportSearchResults() {
        try {
            // Wait for loading to complete
            await this.waitForLoadingComplete();
            // Wait for report list to update
            await this.page.waitForTimeout(1000);
            // Verify results are displayed
            const isResultsVisible = await this.web.element(this.REPORT_LIST_CONTAINER, "Report Results").isVisible(3);
            if (isResultsVisible) {
                console.log("Report search results loaded successfully");
            }
        }
        catch (error) {
            console.log(`Waiting for report search results failed: ${error.message}`);
        }
    }
    /**
     * Verify report search interface responsiveness
     */
    async verifyReportSearchResponsiveness() {
        try {
            console.log("Verifying report search interface responsiveness...");
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('reports', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Report Search").isVisible(3);
            if (!isSearchVisible) {
                console.log("Report search interface not visible");
                return false;
            }
            // Verify search interface adapts to viewport
            if (this.isMobile) {
                return await this.verifyMobileReportSearchInterface();
            }
            else {
                return await this.verifyDesktopReportSearchInterface();
            }
        }
        catch (error) {
            console.log(`Report search responsiveness verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify mobile report search interface
     */
    async verifyMobileReportSearchInterface() {
        try {
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('reports', true);
            const searchElement = this.web.element(searchSelector, "Mobile Report Search");
            // Check if search input is touch-friendly
            const boundingBox = await searchElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile report search input is not touch-friendly");
                    return false;
                }
            }
            // Check for mobile-specific search features
            const isMobileFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            console.log("Mobile report search interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile report search interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify desktop report search interface
     */
    async verifyDesktopReportSearchInterface() {
        try {
            const searchSelector = NavigationConstants_1.default.getSearchInterfaceSelector('reports', false);
            const isSearchVisible = await this.web.element(searchSelector, "Desktop Report Search").isVisible(3);
            if (!isSearchVisible) {
                console.log("Desktop report search interface not visible");
                return false;
            }
            // Check for desktop-specific search filters
            const isFiltersVisible = await this.web.element(this.REPORT_SEARCH_FILTERS, "Report Search Filters").isVisible(2);
            console.log("Desktop report search interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Desktop report search interface verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify chart responsiveness across different viewports
     */
    async verifyChartResponsiveness() {
        try {
            console.log("Verifying chart responsiveness...");
            const isChartVisible = await this.web.element(this.REPORT_CHART_CONTAINER, "Report Chart").isVisible(5);
            if (!isChartVisible) {
                console.log("Report chart not visible");
                return false;
            }
            const viewportCategory = await this.getCurrentViewportCategory();
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileChartDisplay();
                case 'tablet':
                    return await this.verifyTabletChartDisplay();
                case 'desktop':
                    return await this.verifyDesktopChartDisplay();
                default:
                    return false;
            }
        }
        catch (error) {
            console.log(`Chart responsiveness verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify mobile chart display
     */
    async verifyMobileChartDisplay() {
        try {
            console.log("Verifying mobile chart display...");
            // Check for mobile chart toggle
            const isChartToggleVisible = await this.web.element(this.MOBILE_CHART_TOGGLE, "Mobile Chart Toggle").isVisible(2);
            if (!isChartToggleVisible) {
                console.log("Mobile chart toggle not found");
                return false;
            }
            // Verify chart toggle is touch-friendly
            const chartToggleElement = this.web.element(this.MOBILE_CHART_TOGGLE, "Mobile Chart Toggle");
            const boundingBox = await chartToggleElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile chart toggle is not touch-friendly");
                    return false;
                }
            }
            // Test chart toggle functionality
            await this.touchFriendlyClick(this.MOBILE_CHART_TOGGLE, "Mobile Chart Toggle");
            await this.page.waitForTimeout(500); // Wait for chart to show/hide
            // Verify chart container adapts to mobile viewport
            const chartElement = this.web.element(this.REPORT_CHART_CONTAINER, "Report Chart");
            const chartBoundingBox = await chartElement.getLocator().boundingBox();
            if (chartBoundingBox && chartBoundingBox.width > this.viewport.width) {
                console.log("Chart may be too wide for mobile viewport");
                return false;
            }
            console.log("Mobile chart display verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile chart display verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify tablet chart display
     */
    async verifyTabletChartDisplay() {
        try {
            console.log("Verifying tablet chart display...");
            // Check for chart controls
            const isControlsVisible = await this.web.element(this.CHART_CONTROLS, "Chart Controls").isVisible(3);
            if (!isControlsVisible) {
                console.log("Chart controls not visible on tablet");
                return false;
            }
            // Verify chart container size is appropriate for tablet
            const chartElement = this.web.element(this.REPORT_CHART_CONTAINER, "Report Chart");
            const boundingBox = await chartElement.getLocator().boundingBox();
            if (boundingBox && boundingBox.width < 400) {
                console.log("Chart may be too small for tablet view");
                return false;
            }
            // Check for chart legend visibility
            const isLegendVisible = await this.web.element(this.CHART_LEGEND, "Chart Legend").isVisible(2);
            console.log("Tablet chart display verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Tablet chart display verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Verify desktop chart display
     */
    async verifyDesktopChartDisplay() {
        try {
            console.log("Verifying desktop chart display...");
            // Check for chart controls
            const isControlsVisible = await this.web.element(this.CHART_CONTROLS, "Chart Controls").isVisible(3);
            if (!isControlsVisible) {
                console.log("Chart controls not visible on desktop");
                return false;
            }
            // Check for chart export functionality
            const isExportVisible = await this.web.element(this.CHART_EXPORT_BUTTON, "Chart Export").isVisible(2);
            // Check for fullscreen functionality
            const isFullscreenVisible = await this.web.element(this.CHART_FULLSCREEN_BUTTON, "Chart Fullscreen").isVisible(2);
            console.log("Desktop chart display verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Desktop chart display verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Apply report filters with mobile-first approach
     * @param filters - Object containing filter criteria
     */
    async applyReportFilters(filters) {
        try {
            console.log("Applying report filters...", filters);
            if (this.isMobile) {
                // Open mobile filter panel
                const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
                if (isFilterToggleVisible) {
                    await this.touchFriendlyClick(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle");
                    await this.page.waitForTimeout(300); // Wait for filter panel to open
                }
            }
            // Apply type filter
            if (filters.type) {
                await this.applyTypeFilter(filters.type);
            }
            // Apply date range filter
            if (filters.dateRange) {
                await this.applyDateRangeFilter(filters.dateRange);
            }
            // Apply category filter
            if (filters.category) {
                await this.applyCategoryFilter(filters.category);
            }
            // Wait for filters to be applied
            await this.waitForReportSearchResults();
            console.log("Report filters applied successfully");
        }
        catch (error) {
            console.log(`Applying report filters failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Apply report type filter
     */
    async applyTypeFilter(type) {
        try {
            const typeFilter = this.web.dropdown(this.REPORT_TYPE_FILTER, "Type Filter");
            const isFilterVisible = await this.web.element(this.REPORT_TYPE_FILTER, "Type Filter").isVisible(2);
            if (isFilterVisible) {
                await typeFilter.selectByVisibleText(type);
                console.log(`Type filter applied: ${type}`);
            }
        }
        catch (error) {
            console.log(`Type filter application failed: ${error.message}`);
        }
    }
    /**
     * Apply date range filter
     */
    async applyDateRangeFilter(dateRange) {
        try {
            const dateRangeFilter = this.web.editBox(this.REPORT_DATE_RANGE_FILTER, "Date Range Filter");
            const isFilterVisible = await dateRangeFilter.isVisible(2);
            if (isFilterVisible) {
                await dateRangeFilter.fill(dateRange);
                console.log(`Date range filter applied: ${dateRange}`);
            }
        }
        catch (error) {
            console.log(`Date range filter application failed: ${error.message}`);
        }
    }
    /**
     * Apply category filter
     */
    async applyCategoryFilter(category) {
        try {
            const categoryFilter = this.web.dropdown(this.REPORT_CATEGORY_FILTER, "Category Filter");
            const isFilterVisible = await this.web.element(this.REPORT_CATEGORY_FILTER, "Category Filter").isVisible(2);
            if (isFilterVisible) {
                await categoryFilter.selectByVisibleText(category);
                console.log(`Category filter applied: ${category}`);
            }
        }
        catch (error) {
            console.log(`Category filter application failed: ${error.message}`);
        }
    }
    /**
     * Generate a report with mobile-optimized interaction
     * @param reportType - Type of report to generate
     */
    async generateReport(reportType) {
        try {
            console.log(`Generating report of type: ${reportType}`);
            // Apply report type filter first
            await this.applyTypeFilter(reportType);
            // Click generate report button
            const isGenerateButtonVisible = await this.web.element(this.GENERATE_REPORT_BUTTON, "Generate Report").isVisible(3);
            if (!isGenerateButtonVisible) {
                throw new Error("Generate report button not found");
            }
            if (this.isMobile) {
                await this.touchFriendlyClick(this.GENERATE_REPORT_BUTTON, "Generate Report");
            }
            else {
                await this.web.element(this.GENERATE_REPORT_BUTTON, "Generate Report").click();
            }
            // Wait for report generation to complete
            await this.waitForReportGeneration();
            console.log(`Report generation completed for type: ${reportType}`);
        }
        catch (error) {
            console.log(`Report generation failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Wait for report generation to complete
     */
    async waitForReportGeneration() {
        try {
            console.log("Waiting for report generation to complete...");
            // Check for progress indicator
            const isProgressVisible = await this.web.element(this.REPORT_PROGRESS, "Report Progress").isVisible(2);
            if (isProgressVisible) {
                // Wait for progress to complete
                await this.web.element(this.REPORT_PROGRESS, "Report Progress").waitTillInvisible();
            }
            // Wait for download button to appear
            const isDownloadVisible = await this.web.element(this.DOWNLOAD_REPORT_BUTTON, "Download Report").isVisible(10);
            if (isDownloadVisible) {
                console.log("Report generation completed successfully");
            }
            else {
                console.log("Warning: Download button not found after report generation");
            }
        }
        catch (error) {
            console.log(`Waiting for report generation failed: ${error.message}`);
        }
    }
    /**
     * Get report count from the page
     */
    async getReportCount() {
        try {
            const reportItems = await this.page.locator(this.REPORT_ITEM).count();
            console.log(`Found ${reportItems} reports on the page`);
            return reportItems;
        }
        catch (error) {
            console.log(`Getting report count failed: ${error.message}`);
            return 0;
        }
    }
    /**
     * Verify mobile report viewing interface
     */
    async verifyMobileReportViewing() {
        try {
            if (!this.isMobile) {
                console.log("Not on mobile viewport, skipping mobile report viewing verification");
                return true;
            }
            console.log("Verifying mobile report viewing interface...");
            // Check for mobile report cards
            const mobileCards = await this.page.locator(this.MOBILE_REPORT_CARD).count();
            if (mobileCards === 0) {
                console.log("No mobile report cards found");
                return false;
            }
            // Verify first card is touch-friendly
            const firstCard = this.page.locator(this.MOBILE_REPORT_CARD).first();
            const boundingBox = await firstCard.boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants_1.default.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile report cards are not touch-friendly");
                    return false;
                }
            }
            // Check for mobile report actions
            const isActionsVisible = await this.web.element(this.MOBILE_REPORT_ACTIONS, "Mobile Report Actions").isVisible(2);
            console.log("Mobile report viewing interface verified successfully");
            return true;
        }
        catch (error) {
            console.log(`Mobile report viewing verification failed: ${error.message}`);
            return false;
        }
    }
    /**
     * View report details with mobile-optimized interaction
     * @param reportIndex - Index of the report to view (0-based)
     */
    async viewReportDetails(reportIndex = 0) {
        try {
            console.log(`Viewing report details for report at index ${reportIndex}`);
            const reportSelector = this.isMobile ? this.MOBILE_REPORT_CARD : this.REPORT_ITEM;
            const reportItems = await this.page.locator(reportSelector).count();
            if (reportIndex >= reportItems) {
                throw new Error(`Report index ${reportIndex} is out of range. Found ${reportItems} reports.`);
            }
            const reportElement = this.page.locator(reportSelector).nth(reportIndex);
            if (this.isMobile) {
                // Mobile interaction - tap to expand details
                await this.touchFriendlyClick(reportSelector, `Report ${reportIndex}`);
                await this.page.waitForTimeout(300); // Wait for details to expand
            }
            else {
                // Desktop interaction - click to view details
                await reportElement.click();
            }
            // Verify report details are visible
            const isDetailsVisible = await this.web.element(this.MOBILE_REPORT_DETAILS, "Report Details").isVisible(3);
            if (isDetailsVisible) {
                console.log(`Report details displayed successfully for report ${reportIndex}`);
            }
        }
        catch (error) {
            console.log(`Viewing report details failed: ${error.message}`);
            throw error;
        }
    }
}
exports.default = ReportsPage;
//# sourceMappingURL=ReportsPage.js.map