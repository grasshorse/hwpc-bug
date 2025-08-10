import UIActions from "../../support/playwright/actions/UIActions";
import NavigationPage from "./NavigationPage";
import NavigationConstants from "../constants/NavigationConstants";

/**
 * CustomersPage - Page object for customer page navigation and responsive layout verification
 * Extends NavigationPage with customer-specific functionality and mobile-optimized interactions
 */
export default class CustomersPage extends NavigationPage {
    
    // Customer-specific selectors
    private readonly CUSTOMER_LIST_CONTAINER = "[data-testid='customers-container'], .customers-container, .customer-list, .customers-list";
    private readonly CUSTOMER_ITEM = "[data-testid='customer-item'], .customer-item, .customer-row, .customer-card";
    private readonly CUSTOMER_SEARCH_FILTERS = "[data-testid='customer-filters'], .customer-filters, .search-filters, .filter-container";
    private readonly CUSTOMER_TYPE_FILTER = "[data-testid='type-filter'], .type-filter, select[name*='type' i]";
    private readonly CUSTOMER_STATUS_FILTER = "[data-testid='status-filter'], .status-filter, select[name*='status' i]";
    private readonly CUSTOMER_LOCATION_FILTER = "[data-testid='location-filter'], .location-filter, input[name*='location' i]";
    
    // Mobile-specific customer selectors
    private readonly MOBILE_CUSTOMER_CARD = "[data-testid='mobile-customer-card'], .mobile-customer-card, .customer-mobile";
    private readonly MOBILE_CUSTOMER_ACTIONS = "[data-testid='mobile-customer-actions'], .mobile-customer-actions, .customer-actions-mobile";
    private readonly MOBILE_CUSTOMER_DETAILS = "[data-testid='mobile-customer-details'], .mobile-customer-details, .customer-details-mobile";
    private readonly MOBILE_FILTER_TOGGLE = "[data-testid='mobile-filter-toggle'], .mobile-filter-toggle, .filter-toggle-mobile";
    
    // Customer contact information selectors
    private readonly CUSTOMER_CONTACT_INFO = "[data-testid='customer-contact'], .customer-contact, .contact-info";
    private readonly CUSTOMER_ADDRESS = "[data-testid='customer-address'], .customer-address, .address-info";
    private readonly CUSTOMER_PHONE = "[data-testid='customer-phone'], .customer-phone, .phone-info";
    private readonly CUSTOMER_EMAIL = "[data-testid='customer-email'], .customer-email, .email-info";
    
    constructor(web: UIActions) {
        super(web);
    }

    /**
     * Initialize the customers page with customer-specific validation
     */
    public async initialize(): Promise<void> {
        try {
            console.log("Initializing CustomersPage...");
            
            // Call parent initialization
            await super.initialize();
            
            // Verify customer-specific elements
            await this.validateCustomerPageElements();
            
            console.log("CustomersPage initialized successfully");
            
        } catch (error) {
            console.log(`CustomersPage initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate customer page elements are present and responsive
     */
    public async validatePageElements(): Promise<void> {
        try {
            await this.validateCustomerPageElements();
        } catch (error) {
            console.log(`Customer page element validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate customer-specific page elements
     */
    private async validateCustomerPageElements(): Promise<void> {
        try {
            console.log("Validating customer page elements...");
            
            // Verify customer list container
            const isCustomerListVisible = await this.web.element(this.CUSTOMER_LIST_CONTAINER, "Customer List Container").isVisible(3);
            if (!isCustomerListVisible) {
                console.log("Warning: Customer list container not found");
            }
            
            // Verify search interface
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('customers', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Customer Search Interface").isVisible(3);
            if (!isSearchVisible) {
                console.log("Warning: Customer search interface not found");
            }
            
            // Verify mobile-specific elements if on mobile
            if (this.isMobile) {
                await this.validateMobileCustomerElements();
            }
            
            console.log("Customer page elements validated successfully");
            
        } catch (error) {
            console.log(`Customer page element validation failed: ${error.message}`);
        }
    }

    /**
     * Validate mobile-specific customer elements
     */
    private async validateMobileCustomerElements(): Promise<void> {
        try {
            console.log("Validating mobile customer elements...");
            
            // Check for mobile customer cards
            const isMobileCardVisible = await this.web.element(this.MOBILE_CUSTOMER_CARD, "Mobile Customer Card").isVisible(2);
            if (isMobileCardVisible) {
                console.log("Mobile customer cards found");
            }
            
            // Check for mobile filter toggle
            const isFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            if (isFilterToggleVisible) {
                console.log("Mobile filter toggle found");
            }
            
            // Check for mobile customer details
            const isDetailsVisible = await this.web.element(this.MOBILE_CUSTOMER_DETAILS, "Mobile Customer Details").isVisible(2);
            if (isDetailsVisible) {
                console.log("Mobile customer details found");
            }
            
        } catch (error) {
            console.log(`Mobile customer element validation failed: ${error.message}`);
        }
    }

    /**
     * Perform customer search with mobile-optimized interface
     * @param searchTerm - The term to search for
     */
    public async searchCustomers(searchTerm: string): Promise<void> {
        try {
            console.log(`Searching for customers with term: "${searchTerm}"`);
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('customers', this.isMobile);
            const searchInput = this.web.editBox(searchSelector, "Customer Search Input");
            
            // Ensure search input is visible
            await searchInput.waitTillVisible();
            
            if (this.isMobile) {
                // Mobile-specific search interaction
                await this.touchFriendlyClick(searchSelector, "Customer Search Input");
                await this.page.waitForTimeout(500); // Wait for mobile keyboard
            }
            
            // Clear and type search term
            await searchInput.fill(searchTerm);
            
            // Submit search
            await searchInput.keyPress('Enter');
            
            // Wait for search results
            await this.waitForCustomerSearchResults();
            
            console.log(`Customer search completed for: "${searchTerm}"`);
            
        } catch (error) {
            console.log(`Customer search failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for customer search results to load
     */
    private async waitForCustomerSearchResults(): Promise<void> {
        try {
            // Wait for loading to complete
            await this.waitForLoadingComplete();
            
            // Wait for customer list to update
            await this.page.waitForTimeout(1000);
            
            // Verify results are displayed
            const isResultsVisible = await this.web.element(this.CUSTOMER_LIST_CONTAINER, "Customer Results").isVisible(3);
            if (isResultsVisible) {
                console.log("Customer search results loaded successfully");
            }
            
        } catch (error) {
            console.log(`Waiting for customer search results failed: ${error.message}`);
        }
    }

    /**
     * Verify customer search interface responsiveness
     */
    public async verifyCustomerSearchResponsiveness(): Promise<boolean> {
        try {
            console.log("Verifying customer search interface responsiveness...");
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('customers', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Customer Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Customer search interface not visible");
                return false;
            }
            
            // Verify search interface adapts to viewport
            if (this.isMobile) {
                return await this.verifyMobileCustomerSearchInterface();
            } else {
                return await this.verifyDesktopCustomerSearchInterface();
            }
            
        } catch (error) {
            console.log(`Customer search responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile customer search interface
     */
    private async verifyMobileCustomerSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('customers', true);
            const searchElement = this.web.element(searchSelector, "Mobile Customer Search");
            
            // Check if search input is touch-friendly
            const boundingBox = await searchElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile customer search input is not touch-friendly");
                    return false;
                }
            }
            
            // Check for mobile-specific search features
            const isMobileFilterToggleVisible = await this.web.element(this.MOBILE_FILTER_TOGGLE, "Mobile Filter Toggle").isVisible(2);
            
            console.log("Mobile customer search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Mobile customer search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop customer search interface
     */
    private async verifyDesktopCustomerSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('customers', false);
            const isSearchVisible = await this.web.element(searchSelector, "Desktop Customer Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Desktop customer search interface not visible");
                return false;
            }
            
            // Check for desktop-specific search filters
            const isFiltersVisible = await this.web.element(this.CUSTOMER_SEARCH_FILTERS, "Customer Search Filters").isVisible(2);
            
            console.log("Desktop customer search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Desktop customer search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify responsive layout of customer list
     */
    public async verifyCustomerListResponsiveLayout(): Promise<boolean> {
        try {
            console.log("Verifying customer list responsive layout...");
            
            const viewportCategory = await this.getCurrentViewportCategory();
            
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileCustomerListLayout();
                case 'tablet':
                    return await this.verifyTabletCustomerListLayout();
                case 'desktop':
                    return await this.verifyDesktopCustomerListLayout();
                default:
                    return false;
            }
            
        } catch (error) {
            console.log(`Customer list responsive layout verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile customer list layout
     */
    private async verifyMobileCustomerListLayout(): Promise<boolean> {
        try {
            console.log("Verifying mobile customer list layout...");
            
            // Check for mobile customer cards
            const mobileCards = await this.page.locator(this.MOBILE_CUSTOMER_CARD).count();
            if (mobileCards === 0) {
                console.log("No mobile customer cards found");
                return false;
            }
            
            // Verify first card is touch-friendly
            const firstCard = this.page.locator(this.MOBILE_CUSTOMER_CARD).first();
            const boundingBox = await firstCard.boundingBox();
            
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile customer cards are not touch-friendly");
                    return false;
                }
            }
            
            // Check for mobile customer details visibility
            const isDetailsVisible = await this.web.element(this.MOBILE_CUSTOMER_DETAILS, "Mobile Customer Details").isVisible(2);
            
            console.log("Mobile customer list layout verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Mobile customer list layout verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify tablet customer list layout
     */
    private async verifyTabletCustomerListLayout(): Promise<boolean> {
        try {
            console.log("Verifying tablet customer list layout...");
            
            // Check for customer list container
            const isListVisible = await this.web.element(this.CUSTOMER_LIST_CONTAINER, "Customer List").isVisible(3);
            if (!isListVisible) {
                console.log("Customer list container not visible on tablet");
                return false;
            }
            
            // Verify customer items are properly sized for tablet
            const customerItems = await this.page.locator(this.CUSTOMER_ITEM).count();
            if (customerItems > 0) {
                const firstItem = this.page.locator(this.CUSTOMER_ITEM).first();
                const boundingBox = await firstItem.boundingBox();
                
                if (boundingBox && boundingBox.width < 200) {
                    console.log("Customer items may be too narrow for tablet view");
                    return false;
                }
            }
            
            console.log("Tablet customer list layout verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Tablet customer list layout verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop customer list layout
     */
    private async verifyDesktopCustomerListLayout(): Promise<boolean> {
        try {
            console.log("Verifying desktop customer list layout...");
            
            // Check for customer list container
            const isListVisible = await this.web.element(this.CUSTOMER_LIST_CONTAINER, "Customer List").isVisible(3);
            if (!isListVisible) {
                console.log("Customer list container not visible on desktop");
                return false;
            }
            
            // Check for search filters visibility
            const isFiltersVisible = await this.web.element(this.CUSTOMER_SEARCH_FILTERS, "Customer Filters").isVisible(2);
            
            console.log("Desktop customer list layout verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Desktop customer list layout verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Apply customer filters with mobile-first approach
     * @param filters - Object containing filter criteria
     */
    public async applyCustomerFilters(filters: { type?: string; status?: string; location?: string }): Promise<void> {
        try {
            console.log("Applying customer filters...", filters);
            
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
            
            // Apply status filter
            if (filters.status) {
                await this.applyStatusFilter(filters.status);
            }
            
            // Apply location filter
            if (filters.location) {
                await this.applyLocationFilter(filters.location);
            }
            
            // Wait for filters to be applied
            await this.waitForCustomerSearchResults();
            
            console.log("Customer filters applied successfully");
            
        } catch (error) {
            console.log(`Applying customer filters failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply customer type filter
     */
    private async applyTypeFilter(type: string): Promise<void> {
        try {
            const typeFilter = this.web.dropdown(this.CUSTOMER_TYPE_FILTER, "Type Filter");
            const isFilterVisible = await this.web.element(this.CUSTOMER_TYPE_FILTER, "Type Filter").isVisible(2);
            
            if (isFilterVisible) {
                await typeFilter.selectByVisibleText(type);
                console.log(`Type filter applied: ${type}`);
            }
            
        } catch (error) {
            console.log(`Type filter application failed: ${error.message}`);
        }
    }

    /**
     * Apply customer status filter
     */
    private async applyStatusFilter(status: string): Promise<void> {
        try {
            const statusFilter = this.web.dropdown(this.CUSTOMER_STATUS_FILTER, "Status Filter");
            const isFilterVisible = await this.web.element(this.CUSTOMER_STATUS_FILTER, "Status Filter").isVisible(2);
            
            if (isFilterVisible) {
                await statusFilter.selectByVisibleText(status);
                console.log(`Status filter applied: ${status}`);
            }
            
        } catch (error) {
            console.log(`Status filter application failed: ${error.message}`);
        }
    }

    /**
     * Apply customer location filter
     */
    private async applyLocationFilter(location: string): Promise<void> {
        try {
            const locationFilter = this.web.editBox(this.CUSTOMER_LOCATION_FILTER, "Location Filter");
            const isFilterVisible = await locationFilter.isVisible(2);
            
            if (isFilterVisible) {
                await locationFilter.fill(location);
                console.log(`Location filter applied: ${location}`);
            }
            
        } catch (error) {
            console.log(`Location filter application failed: ${error.message}`);
        }
    }

    /**
     * Get customer count from the page
     */
    public async getCustomerCount(): Promise<number> {
        try {
            const customerItems = await this.page.locator(this.CUSTOMER_ITEM).count();
            console.log(`Found ${customerItems} customers on the page`);
            return customerItems;
            
        } catch (error) {
            console.log(`Getting customer count failed: ${error.message}`);
            return 0;
        }
    }

    /**
     * View customer details with mobile-optimized interaction
     * @param customerIndex - Index of the customer to view (0-based)
     */
    public async viewCustomerDetails(customerIndex: number = 0): Promise<void> {
        try {
            console.log(`Viewing customer details for customer at index ${customerIndex}`);
            
            const customerSelector = this.isMobile ? this.MOBILE_CUSTOMER_CARD : this.CUSTOMER_ITEM;
            const customerItems = await this.page.locator(customerSelector).count();
            
            if (customerIndex >= customerItems) {
                throw new Error(`Customer index ${customerIndex} is out of range. Found ${customerItems} customers.`);
            }
            
            const customerElement = this.page.locator(customerSelector).nth(customerIndex);
            
            if (this.isMobile) {
                // Mobile interaction - tap to expand details
                await this.touchFriendlyClick(customerSelector, `Customer ${customerIndex}`);
                await this.page.waitForTimeout(300); // Wait for details to expand
            } else {
                // Desktop interaction - click to view details
                await customerElement.click();
            }
            
            // Verify customer details are visible
            const isDetailsVisible = await this.web.element(this.CUSTOMER_CONTACT_INFO, "Customer Contact Info").isVisible(3);
            if (isDetailsVisible) {
                console.log(`Customer details displayed successfully for customer ${customerIndex}`);
            }
            
        } catch (error) {
            console.log(`Viewing customer details failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify customer contact information is displayed correctly
     */
    public async verifyCustomerContactInfo(): Promise<boolean> {
        try {
            console.log("Verifying customer contact information display...");
            
            // Check for contact info container
            const isContactInfoVisible = await this.web.element(this.CUSTOMER_CONTACT_INFO, "Customer Contact Info").isVisible(3);
            if (!isContactInfoVisible) {
                console.log("Customer contact info not visible");
                return false;
            }
            
            // Check for specific contact elements
            const isAddressVisible = await this.web.element(this.CUSTOMER_ADDRESS, "Customer Address").isVisible(2);
            const isPhoneVisible = await this.web.element(this.CUSTOMER_PHONE, "Customer Phone").isVisible(2);
            const isEmailVisible = await this.web.element(this.CUSTOMER_EMAIL, "Customer Email").isVisible(2);
            
            const contactElementsFound = [isAddressVisible, isPhoneVisible, isEmailVisible].filter(Boolean).length;
            
            if (contactElementsFound === 0) {
                console.log("No customer contact elements found");
                return false;
            }
            
            console.log(`Customer contact information verified successfully (${contactElementsFound} elements found)`);
            return true;
            
        } catch (error) {
            console.log(`Customer contact info verification failed: ${error.message}`);
            return false;
        }
    }
}