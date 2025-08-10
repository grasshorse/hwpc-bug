import UIActions from "../../support/playwright/actions/UIActions";
import NavigationPage from "./NavigationPage";
import NavigationConstants from "../constants/NavigationConstants";

/**
 * TicketsPage - Page object for ticket-specific navigation and search interface validation
 * Extends NavigationPage with ticket-specific functionality and responsive layout verification
 */
export default class TicketsPage extends NavigationPage {
    
    // Ticket-specific selectors
    private readonly TICKET_LIST_CONTAINER = "[data-testid='tickets-container'], .tickets-container, .ticket-list, .tickets-list";
    private readonly TICKET_ITEM = "[data-testid='ticket-item'], .ticket-item, .ticket-row, .ticket-card";
    private readonly TICKET_SEARCH_FILTERS = "[data-testid='ticket-filters'], .ticket-filters, .search-filters, .filter-container";
    private readonly TICKET_STATUS_FILTER = "[data-testid='status-filter'], .status-filter, select[name*='status' i]";
    private readonly TICKET_PRIORITY_FILTER = "[data-testid='priority-filter'], .priority-filter, select[name*='priority' i]";
    private readonly TICKET_DATE_FILTER = "[data-testid='date-filter'], .date-filter, input[type='date'], input[name*='date' i]";
    
    // Mobile-specific ticket selectors
    private readonly MOBILE_TICKET_CARD = "[data-testid='mobile-ticket-card'], .mobile-ticket-card, .ticket-mobile";
    private readonly MOBILE_TICKET_ACTIONS = "[data-testid='mobile-ticket-actions'], .mobile-ticket-actions, .ticket-actions-mobile";
    private readonly MOBILE_FILTER_TOGGLE = "[data-testid='mobile-filter-toggle'], .mobile-filter-toggle, .filter-toggle-mobile";
    
    constructor(web: UIActions) {
        super(web);
    }

    /**
     * Initialize the tickets page with ticket-specific validation
     */
    public async initialize(): Promise<void> {
        try {
            console.log("Initializing TicketsPage...");
            
            // Call parent initialization
            await super.initialize();
            
            // Verify ticket-specific elements
            await this.validateTicketPageElements();
            
            console.log("TicketsPage initialized successfully");
            
        } catch (error) {
            console.log(`TicketsPage initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate ticket page elements are present and responsive
     */
    public async validatePageElements(): Promise<void> {
        try {
            await this.validateTicketPageElements();
        } catch (error) {
            console.log(`Ticket page element validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate ticket-specific page elements
     */
    private async validateTicketPageElements(): Promise<void> {
        try {
            console.log("Validating ticket page elements...");
            
            // Verify ticket list container
            const isTicketListVisible = await this.web.element(this.TICKET_LIST_CONTAINER, "Ticket List Container").isVisible(3);
            if (!isTicketListVisible) {
                console.log("Warning: Ticket list container not found");
            }
            
            // Verify search interface
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('tickets', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Ticket Search Interface").isVisible(3);
            if (!isSearchVisible) {
                console.log("Warning: Ticket search interface not found");
            }
            
            // Verify mobile-specific elements if on mobile
            if (this.isMobile) {
                await this.validateMobileTicketElements();
            }
            
            console.log("Ticket page elements validated successfully");
            
        } catch (error) {
            console.log(`Ticket page element validation failed: ${error.message}`);
        }
    }

    /**
     * Validate mobile-specific ticket elements
     */
    private async validateMobileTicketElements(): Promise<void> {
        try {
            console.log("Validating mobile ticket elements...");
            
            // Check for mobile ticket cards
            const isMobileCardVisible = await this.web.element(this.MOBILE_TICKET_CARD, "Mobile Ticket Card").isVisible(2);
            if (isMobileCardVisible) {
                console.log("Mobile ticket cards found");
            }
            
            // Check for mobile filter toggle
            const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            if (isFilterToggleVisible) {
                console.log("Mobile filter toggle found");
            }
            
        } catch (error) {
            console.log(`Mobile ticket element validation failed: ${error.message}`);
        }
    }

    /**
     * Perform ticket search with mobile-optimized interface
     * @param searchTerm - The term to search for
     */
    public async searchTickets(searchTerm: string): Promise<void> {
        try {
            console.log(`Searching for tickets with term: "${searchTerm}"`);
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('tickets', this.isMobile);
            const searchInput = this.web.editBox(searchSelector, "Ticket Search Input");
            
            // Ensure search input is visible
            await searchInput.waitTillVisible();
            
            if (this.isMobile) {
                // Mobile-specific search interaction
                await this.touchFriendlyClick(searchSelector, "Ticket Search Input");
                await this.page.waitForTimeout(500); // Wait for mobile keyboard
            }
            
            // Clear and type search term
            await searchInput.fill(searchTerm);
            
            // Submit search
            await searchInput.keyPress('Enter');
            
            // Wait for search results
            await this.waitForTicketSearchResults();
            
            console.log(`Ticket search completed for: "${searchTerm}"`);
            
        } catch (error) {
            console.log(`Ticket search failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for ticket search results to load
     */
    private async waitForTicketSearchResults(): Promise<void> {
        try {
            // Wait for loading to complete
            await this.waitForLoadingComplete();
            
            // Wait for ticket list to update
            await this.page.waitForTimeout(1000);
            
            // Verify results are displayed
            const isResultsVisible = await this.web.element(this.TICKET_LIST_CONTAINER, "Ticket Results").isVisible(3);
            if (isResultsVisible) {
                console.log("Ticket search results loaded successfully");
            }
            
        } catch (error) {
            console.log(`Waiting for ticket search results failed: ${error.message}`);
        }
    }

    /**
     * Verify ticket search interface responsiveness
     */
    public async verifyTicketSearchResponsiveness(): Promise<boolean> {
        try {
            console.log("Verifying ticket search interface responsiveness...");
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('tickets', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Ticket Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Ticket search interface not visible");
                return false;
            }
            
            // Verify search interface adapts to viewport
            if (this.isMobile) {
                return await this.verifyMobileTicketSearchInterface();
            } else {
                return await this.verifyDesktopTicketSearchInterface();
            }
            
        } catch (error) {
            console.log(`Ticket search responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile ticket search interface
     */
    private async verifyMobileTicketSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('tickets', true);
            const searchElement = this.web.element(searchSelector, "Mobile Ticket Search");
            
            // Check if search input is touch-friendly
            const boundingBox = await searchElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile ticket search input is not touch-friendly");
                    return false;
                }
            }
            
            // Check for mobile-specific search features
            const isMobileFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            
            console.log("Mobile ticket search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Mobile ticket search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop ticket search interface
     */
    private async verifyDesktopTicketSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('tickets', false);
            const isSearchVisible = await this.web.element(searchSelector, "Desktop Ticket Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Desktop ticket search interface not visible");
                return false;
            }
            
            // Check for desktop-specific search filters
            const isFiltersVisible = await this.web.element(this.TICKET_SEARCH_FILTERS, "Ticket Search Filters").isVisible(2);
            
            console.log("Desktop ticket search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Desktop ticket search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Apply ticket filters with mobile-first approach
     * @param filters - Object containing filter criteria
     */
    public async applyTicketFilters(filters: { status?: string; priority?: string; date?: string }): Promise<void> {
        try {
            console.log("Applying ticket filters...", filters);
            
            if (this.isMobile) {
                // Open mobile filter panel
                const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
                if (isFilterToggleVisible) {
                    await this.touchFriendlyClick(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle");
                    await this.page.waitForTimeout(300); // Wait for filter panel to open
                }
            }
            
            // Apply status filter
            if (filters.status) {
                await this.applyStatusFilter(filters.status);
            }
            
            // Apply priority filter
            if (filters.priority) {
                await this.applyPriorityFilter(filters.priority);
            }
            
            // Apply date filter
            if (filters.date) {
                await this.applyDateFilter(filters.date);
            }
            
            // Wait for filters to be applied
            await this.waitForTicketSearchResults();
            
            console.log("Ticket filters applied successfully");
            
        } catch (error) {
            console.log(`Applying ticket filters failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply status filter
     */
    private async applyStatusFilter(status: string): Promise<void> {
        try {
            const statusFilter = this.web.dropdown(this.TICKET_STATUS_FILTER, "Status Filter");
            const isFilterVisible = await this.web.element(this.TICKET_STATUS_FILTER, "Status Filter").isVisible(2);
            
            if (isFilterVisible) {
                await statusFilter.selectByVisibleText(status);
                console.log(`Status filter applied: ${status}`);
            }
            
        } catch (error) {
            console.log(`Status filter application failed: ${error.message}`);
        }
    }

    /**
     * Apply priority filter
     */
    private async applyPriorityFilter(priority: string): Promise<void> {
        try {
            const priorityFilter = this.web.dropdown(this.TICKET_PRIORITY_FILTER, "Priority Filter");
            const isFilterVisible = await this.web.element(this.TICKET_PRIORITY_FILTER, "Priority Filter").isVisible(2);
            
            if (isFilterVisible) {
                await priorityFilter.selectByVisibleText(priority);
                console.log(`Priority filter applied: ${priority}`);
            }
            
        } catch (error) {
            console.log(`Priority filter application failed: ${error.message}`);
        }
    }

    /**
     * Apply date filter
     */
    private async applyDateFilter(date: string): Promise<void> {
        try {
            const dateFilter = this.web.editBox(this.TICKET_DATE_FILTER, "Date Filter");
            const isFilterVisible = await dateFilter.isVisible(2);
            
            if (isFilterVisible) {
                await dateFilter.fill(date);
                console.log(`Date filter applied: ${date}`);
            }
            
        } catch (error) {
            console.log(`Date filter application failed: ${error.message}`);
        }
    }

    /**
     * Get ticket count from the page
     */
    public async getTicketCount(): Promise<number> {
        try {
            const ticketItems = await this.page.locator(this.TICKET_ITEM).count();
            console.log(`Found ${ticketItems} tickets on the page`);
            return ticketItems;
            
        } catch (error) {
            console.log(`Getting ticket count failed: ${error.message}`);
            return 0;
        }
    }

    /**
     * Verify ticket list displays correctly on mobile
     */
    public async verifyMobileTicketListDisplay(): Promise<boolean> {
        try {
            if (!this.isMobile) {
                console.log("Not on mobile viewport, skipping mobile ticket list verification");
                return true;
            }
            
            console.log("Verifying mobile ticket list display...");
            
            // Check for mobile ticket cards
            const mobileCards = await this.page.locator(this.MOBILE_TICKET_CARD).count();
            if (mobileCards > 0) {
                console.log(`Found ${mobileCards} mobile ticket cards`);
                
                // Verify first card is touch-friendly
                const firstCard = this.page.locator(this.MOBILE_TICKET_CARD).first();
                const boundingBox = await firstCard.boundingBox();
                
                if (boundingBox) {
                    const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                    if (!isTouchFriendly) {
                        console.log("Mobile ticket cards are not touch-friendly");
                        return false;
                    }
                }
                
                console.log("Mobile ticket list display verified successfully");
                return true;
            } else {
                console.log("No mobile ticket cards found");
                return false;
            }
            
        } catch (error) {
            console.log(`Mobile ticket list display verification failed: ${error.message}`);
            return false;
        }
    }
}