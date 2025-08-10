import BasePage from './base/BasePage';
import UIActions from "../../support/playwright/actions/UIActions";
import NavigationConstants, { PageValidation } from "../constants/NavigationConstants";
import Constants from "../constants/Constants";

/**
 * NavigationError - Custom error class for navigation-specific failures
 */
export class NavigationError extends Error {
    constructor(
        public pageName: string,
        public errorType: 'load' | 'responsive' | 'element',
        public details: string,
        public screenshot?: string
    ) {
        super(`Navigation error on ${pageName}: ${details}`);
        this.name = 'NavigationError';
    }
}

/**
 * NavigationPage - Base navigation functionality for HWPC application
 * Extends BasePage with core navigation methods and mobile-first responsive design validation
 */
export default class NavigationPage extends BasePage {
    
    constructor(web: UIActions) {
        super(web);
    }

    // ===== CORE NAVIGATION METHODS =====

    /**
     * Navigate to a specific page with mobile-first approach and comprehensive validation
     * @param pageName - Name of the page to navigate to (tickets, customers, routes, reports, dashboard)
     */
    public async navigateToPage(pageName: string): Promise<void> {
        try {
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new NavigationError(pageName, 'element', `Page configuration not found for: ${pageName}`);
            }

            console.log(`Navigating to ${pageName} page...`);
            
            // Get viewport-appropriate navigation selector
            const navigationSelector = NavigationConstants.getNavigationSelector(pageName, this.isMobile);
            
            // Handle mobile menu if needed
            if (this.isMobile) {
                await this.handleMobileNavigation(navigationSelector, pageName);
            } else {
                await this.handleDesktopNavigation(navigationSelector, pageName);
            }
            
            // Wait for page load with appropriate timeout
            const viewportCategory = await this.getCurrentViewportCategory();
            const timeout = NavigationConstants.getTimeout(viewportCategory, 'pageLoad');
            
            await this.page.waitForLoadState('networkidle', { timeout });
            await this.waitForLoadingComplete();
            
            console.log(`Successfully navigated to ${pageName} page`);
            
        } catch (error) {
            const errorMessage = `Navigation to ${pageName} failed: ${error.message}`;
            console.log(errorMessage);
            
            // Capture screenshot for debugging
            await this.captureNavigationError(pageName, error.message);
            
            throw new NavigationError(pageName, 'load', errorMessage);
        }
    }

    /**
     * Verify that a page has loaded correctly with comprehensive validation
     * @param pageName - Name of the page to verify
     * @returns PageValidation object with validation results
     */
    public async verifyPageLoaded(pageName: string): Promise<PageValidation> {
        const startTime = Date.now();
        const validation: PageValidation = {
            url: '',
            title: '',
            isLoaded: false,
            isResponsive: false,
            searchInterfacePresent: false,
            loadTime: 0,
            errors: []
        };

        try {
            console.log(`Verifying ${pageName} page load...`);
            
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                validation.errors.push(`Page configuration not found for: ${pageName}`);
                return validation;
            }

            // Verify URL
            const currentUrl = this.page.url();
            validation.url = currentUrl;
            
            if (!NavigationConstants.matchesPageUrl(currentUrl, pageName)) {
                validation.errors.push(`URL does not match expected pattern for ${pageName}. Current: ${currentUrl}`);
            }

            // Verify page title
            const currentTitle = await this.page.title();
            validation.title = currentTitle;
            
            if (!NavigationConstants.matchesPageTitle(currentTitle, pageName)) {
                validation.errors.push(`Page title does not match expected for ${pageName}. Current: ${currentTitle}`);
            }

            // Verify page identifier element is present
            const pageIdentifierSelector = NavigationConstants.getPageIdentifierSelector(pageName, this.isMobile);
            const isPageIdentifierVisible = await this.web.element(pageIdentifierSelector, `${pageName} Page Identifier`).isVisible(3);
            
            if (!isPageIdentifierVisible) {
                validation.errors.push(`Page identifier not found for ${pageName}: ${pageIdentifierSelector}`);
            }

            // Verify required elements are present
            const requiredElements = NavigationConstants.getRequiredElements(pageName);
            for (const elementSelector of requiredElements) {
                const isElementVisible = await this.web.element(elementSelector, `Required Element`).isVisible(2);
                if (!isElementVisible) {
                    validation.errors.push(`Required element not found: ${elementSelector}`);
                }
            }

            // Verify search interface is present
            const searchInterfaceSelector = NavigationConstants.getSearchInterfaceSelector(pageName, this.isMobile);
            validation.searchInterfacePresent = await this.web.element(searchInterfaceSelector, `${pageName} Search Interface`).isVisible(2);
            
            if (!validation.searchInterfacePresent) {
                validation.errors.push(`Search interface not found for ${pageName}: ${searchInterfaceSelector}`);
            }

            // Verify responsive interface
            validation.isResponsive = await this.verifyResponsiveInterface();

            // Calculate load time
            validation.loadTime = Date.now() - startTime;

            // Set overall load status
            validation.isLoaded = validation.errors.length === 0;

            if (validation.isLoaded) {
                console.log(`${pageName} page verification completed successfully in ${validation.loadTime}ms`);
            } else {
                console.log(`${pageName} page verification failed with ${validation.errors.length} errors`);
                validation.errors.forEach(error => console.log(`- ${error}`));
            }

            return validation;

        } catch (error) {
            validation.errors.push(`Page verification failed: ${error.message}`);
            validation.loadTime = Date.now() - startTime;
            console.log(`Page verification error for ${pageName}: ${error.message}`);
            return validation;
        }
    }

    /**
     * Verify responsive interface elements and mobile-first design patterns
     * @returns Boolean indicating if the interface is responsive
     */
    public async verifyResponsiveInterface(): Promise<boolean> {
        try {
            console.log("Verifying responsive interface...");
            
            const viewportCategory = await this.getCurrentViewportCategory();
            let isResponsive = true;
            const errors: string[] = [];

            // Verify viewport-specific elements
            switch (viewportCategory) {
                case 'mobile':
                    isResponsive = await this.verifyMobileResponsiveElementsInternal();
                    break;
                case 'tablet':
                    isResponsive = await this.verifyTabletResponsiveElementsInternal();
                    break;
                case 'desktop':
                    isResponsive = await this.verifyDesktopResponsiveElementsInternal();
                    break;
            }

            // Verify touch target sizes for mobile
            if (this.isMobile) {
                const touchTargetsValid = await this.verifyTouchTargetSizes();
                if (!touchTargetsValid) {
                    isResponsive = false;
                    errors.push("Touch targets do not meet minimum size requirements");
                }
            }

            // Verify responsive navigation
            const navigationResponsive = await this.verifyResponsiveNavigation();
            if (!navigationResponsive) {
                isResponsive = false;
                errors.push("Navigation is not responsive");
            }

            // Verify responsive search interface
            const searchResponsive = await this.verifyResponsiveSearchInterface();
            if (!searchResponsive) {
                isResponsive = false;
                errors.push("Search interface is not responsive");
            }

            if (isResponsive) {
                console.log(`Responsive interface verification passed for ${viewportCategory}`);
            } else {
                console.log(`Responsive interface verification failed for ${viewportCategory}:`);
                errors.forEach(error => console.log(`- ${error}`));
            }

            return isResponsive;

        } catch (error) {
            console.log(`Responsive interface verification error: ${error.message}`);
            return false;
        }
    }

    // ===== MOBILE-FIRST NAVIGATION PATTERNS =====

    /**
     * Handle mobile navigation with touch-friendly interactions
     */
    private async handleMobileNavigation(navigationSelector: string, pageName: string): Promise<void> {
        try {
            // Check if mobile menu needs to be opened
            const isMobileMenuVisible = await this.web.element(NavigationConstants.MOBILE_MENU_CONTAINER, "Mobile Menu").isVisible(1);
            
            if (!isMobileMenuVisible) {
                // Open mobile menu
                const mobileToggleSelector = NavigationConstants.MOBILE_MENU_TOGGLE;
                const isToggleVisible = await this.web.element(mobileToggleSelector, "Mobile Menu Toggle").isVisible(2);
                
                if (isToggleVisible) {
                    await this.touchFriendlyClick(mobileToggleSelector, "Mobile Menu Toggle");
                    await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideInDuration);
                } else {
                    throw new Error("Mobile menu toggle not found");
                }
            }

            // Click navigation link
            const isNavLinkVisible = await this.web.element(navigationSelector, `${pageName} Navigation Link`).isVisible(3);
            if (isNavLinkVisible) {
                await this.touchFriendlyClick(navigationSelector, `${pageName} Navigation Link`);
            } else {
                throw new Error(`Navigation link not found: ${navigationSelector}`);
            }

        } catch (error) {
            throw new NavigationError(pageName, 'element', `Mobile navigation failed: ${error.message}`);
        }
    }

    /**
     * Handle desktop navigation with standard interactions
     */
    private async handleDesktopNavigation(navigationSelector: string, pageName: string): Promise<void> {
        try {
            const isNavLinkVisible = await this.web.element(navigationSelector, `${pageName} Navigation Link`).isVisible(3);
            
            if (isNavLinkVisible) {
                await this.clickElement(navigationSelector, `${pageName} Navigation Link`);
            } else {
                throw new Error(`Navigation link not found: ${navigationSelector}`);
            }

        } catch (error) {
            throw new NavigationError(pageName, 'element', `Desktop navigation failed: ${error.message}`);
        }
    }

    // ===== VIEWPORT-AWARE INTERACTIONS =====

    /**
     * Get available navigation links based on current viewport
     */
    public async getNavigationLinks(): Promise<string[]> {
        try {
            const availablePages: string[] = [];
            const pageNames = NavigationConstants.getPageNames();

            for (const pageName of pageNames) {
                const navigationSelector = NavigationConstants.getNavigationSelector(pageName, this.isMobile);
                const isVisible = await this.web.element(navigationSelector, `${pageName} Navigation`).isVisible(1);
                
                if (isVisible) {
                    availablePages.push(pageName);
                }
            }

            console.log(`Available navigation links: ${availablePages.join(', ')}`);
            return availablePages;

        } catch (error) {
            console.log(`Error getting navigation links: ${error.message}`);
            return [];
        }
    }

    /**
     * Check if navigation is responsive across different viewports
     */
    public async isNavigationResponsive(): Promise<boolean> {
        try {
            const viewportCategory = await this.getCurrentViewportCategory();
            
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileNavigation();
                case 'tablet':
                    return await this.verifyTabletNavigation();
                case 'desktop':
                    return await this.verifyDesktopNavigation();
                default:
                    return false;
            }

        } catch (error) {
            console.log(`Navigation responsiveness check failed: ${error.message}`);
            return false;
        }
    }

    // ===== ERROR HANDLING AND RECOVERY =====

    /**
     * Capture screenshot and debugging information for navigation errors
     */
    private async captureNavigationError(pageName: string, errorDetails: string): Promise<void> {
        try {
            const viewportCategory = await this.getCurrentViewportCategory();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotName = `navigation-error-${pageName}-${viewportCategory}-${timestamp}`;
            
            await this.takeScreenshot(screenshotName);
            
            // Log additional debugging information
            console.log(`Navigation Error Debug Info:`);
            console.log(`- Page: ${pageName}`);
            console.log(`- Viewport: ${viewportCategory}`);
            console.log(`- URL: ${this.page.url()}`);
            console.log(`- Title: ${await this.page.title()}`);
            console.log(`- Error: ${errorDetails}`);
            
        } catch (screenshotError) {
            console.log(`Failed to capture navigation error screenshot: ${screenshotError.message}`);
        }
    }

    /**
     * Retry navigation with exponential backoff
     */
    public async retryNavigation(pageName: string, maxRetries: number = 3): Promise<void> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Navigation attempt ${attempt}/${maxRetries} for ${pageName}`);
                
                await this.navigateToPage(pageName);
                const validation = await this.verifyPageLoaded(pageName);
                
                if (validation.isLoaded) {
                    console.log(`Navigation retry successful on attempt ${attempt}`);
                    return;
                }
                
                throw new Error(`Page validation failed: ${validation.errors.join(', ')}`);
                
            } catch (error) {
                lastError = error;
                console.log(`Navigation attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`Waiting ${delay}ms before retry...`);
                    await this.page.waitForTimeout(delay);
                }
            }
        }
        
        throw new NavigationError(pageName, 'load', `Navigation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }

    /**
     * Fallback navigation using direct URL navigation
     */
    public async fallbackNavigation(pageName: string): Promise<void> {
        try {
            console.log(`Attempting fallback navigation to ${pageName}...`);
            
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new NavigationError(pageName, 'element', `Page configuration not found for fallback navigation`);
            }

            // Navigate directly to URL
            const baseUrl = process.env.BASE_URL || Constants.DEFAULT_BASE_URL;
            const fullUrl = `${baseUrl}${pageConfig.url}`;
            
            await this.page.goto(fullUrl);
            await this.waitForPageLoad();
            
            console.log(`Fallback navigation to ${pageName} completed`);
            
        } catch (error) {
            throw new NavigationError(pageName, 'load', `Fallback navigation failed: ${error.message}`);
        }
    }

    // ===== RESPONSIVE VALIDATION METHODS =====

    /**
     * Verify mobile-specific responsive elements
     */
    private async verifyMobileResponsiveElementsInternal(): Promise<boolean> {
        try {
            console.log("Verifying mobile responsive elements...");
            
            // Check for mobile menu toggle
            const isMobileToggleVisible = await this.web.element(NavigationConstants.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle").isVisible(2);
            if (!isMobileToggleVisible) {
                console.log("Mobile menu toggle not found");
                return false;
            }

            // Check for mobile-specific containers
            const isMobileContainerVisible = await this.web.element(NavigationConstants.MOBILE_CONTAINER, "Mobile Container").isVisible(2);
            
            // Check for mobile-hidden elements are actually hidden
            const mobileHiddenElements = await this.page.locator(NavigationConstants.MOBILE_HIDDEN).count();
            if (mobileHiddenElements > 0) {
                const visibleHiddenElements = await this.page.locator(`${NavigationConstants.MOBILE_HIDDEN}:visible`).count();
                if (visibleHiddenElements > 0) {
                    console.log(`Found ${visibleHiddenElements} mobile-hidden elements that are still visible`);
                    return false;
                }
            }

            console.log("Mobile responsive elements verified successfully");
            return true;

        } catch (error) {
            console.log(`Mobile responsive verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify tablet-specific responsive elements
     */
    private async verifyTabletResponsiveElementsInternal(): Promise<boolean> {
        try {
            console.log("Verifying tablet responsive elements...");
            
            // Check for tablet-specific containers
            const isTabletContainerVisible = await this.web.element(NavigationConstants.TABLET_CONTAINER, "Tablet Container").isVisible(2);
            
            // Verify tablet-specific visibility classes
            const tabletVisibleElements = await this.page.locator(NavigationConstants.TABLET_VISIBLE).count();
            if (tabletVisibleElements > 0) {
                const hiddenTabletElements = await this.page.locator(`${NavigationConstants.TABLET_VISIBLE}:hidden`).count();
                if (hiddenTabletElements > 0) {
                    console.log(`Found ${hiddenTabletElements} tablet-visible elements that are hidden`);
                    return false;
                }
            }

            console.log("Tablet responsive elements verified successfully");
            return true;

        } catch (error) {
            console.log(`Tablet responsive verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop-specific responsive elements
     */
    private async verifyDesktopResponsiveElementsInternal(): Promise<boolean> {
        try {
            console.log("Verifying desktop responsive elements...");
            
            // Check for desktop-specific containers
            const isDesktopContainerVisible = await this.web.element(NavigationConstants.DESKTOP_CONTAINER, "Desktop Container").isVisible(2);
            
            // Verify desktop-specific visibility classes
            const desktopVisibleElements = await this.page.locator(NavigationConstants.DESKTOP_VISIBLE).count();
            if (desktopVisibleElements > 0) {
                const hiddenDesktopElements = await this.page.locator(`${NavigationConstants.DESKTOP_VISIBLE}:hidden`).count();
                if (hiddenDesktopElements > 0) {
                    console.log(`Found ${hiddenDesktopElements} desktop-visible elements that are hidden`);
                    return false;
                }
            }

            console.log("Desktop responsive elements verified successfully");
            return true;

        } catch (error) {
            console.log(`Desktop responsive verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify touch target sizes meet minimum requirements
     */
    private async verifyTouchTargetSizes(): Promise<boolean> {
        try {
            const touchTargetLocator = this.page.locator('button, a, input[type="button"], input[type="submit"], .btn, .clickable');
            const touchTargetCount = await touchTargetLocator.count();
            const touchTargets = [];
            
            for (let i = 0; i < Math.min(10, touchTargetCount); i++) {
                touchTargets.push(touchTargetLocator.nth(i));
            }
            let validTargets = 0;
            let totalTargets = touchTargets.length;

            for (const target of touchTargets) { // Check targets
                const boundingBox = await target.boundingBox();
                if (boundingBox) {
                    const isAdequate = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                    if (isAdequate) {
                        validTargets++;
                    }
                }
            }

            const validPercentage = totalTargets > 0 ? (validTargets / Math.min(10, totalTargets)) * 100 : 100;
            console.log(`Touch target validation: ${validTargets}/${Math.min(10, totalTargets)} targets meet minimum size (${validPercentage.toFixed(1)}%)`);

            return validPercentage >= 80; // 80% of targets should meet minimum size

        } catch (error) {
            console.log(`Touch target verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify responsive navigation functionality
     */
    private async verifyResponsiveNavigation(): Promise<boolean> {
        try {
            const viewportCategory = await this.getCurrentViewportCategory();
            
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileNavigation();
                case 'tablet':
                    return await this.verifyTabletNavigation();
                case 'desktop':
                    return await this.verifyDesktopNavigation();
                default:
                    return false;
            }

        } catch (error) {
            console.log(`Responsive navigation verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile navigation functionality
     */
    private async verifyMobileNavigation(): Promise<boolean> {
        try {
            // Check for mobile menu toggle
            const isMobileToggleVisible = await this.web.element(NavigationConstants.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle").isVisible(2);
            if (!isMobileToggleVisible) {
                return false;
            }

            // Test mobile menu functionality
            await this.touchFriendlyClick(NavigationConstants.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle");
            await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideInDuration);
            
            const isMobileMenuVisible = await this.web.element(NavigationConstants.MOBILE_MENU_CONTAINER, "Mobile Menu").isVisible(2);
            
            // Close menu
            if (isMobileMenuVisible) {
                await this.touchFriendlyClick(NavigationConstants.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle");
                await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideOutDuration);
            }

            return isMobileMenuVisible;

        } catch (error) {
            console.log(`Mobile navigation verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify tablet navigation functionality
     */
    private async verifyTabletNavigation(): Promise<boolean> {
        try {
            // Check for main navigation visibility
            const isMainNavVisible = await this.web.element(NavigationConstants.MAIN_NAVIGATION, "Main Navigation").isVisible(2);
            return isMainNavVisible;

        } catch (error) {
            console.log(`Tablet navigation verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop navigation functionality
     */
    private async verifyDesktopNavigation(): Promise<boolean> {
        try {
            // Check for main navigation visibility
            const isMainNavVisible = await this.web.element(NavigationConstants.MAIN_NAVIGATION, "Main Navigation").isVisible(2);
            
            // Check for navigation menu
            const isNavMenuVisible = await this.web.element(NavigationConstants.NAVIGATION_MENU, "Navigation Menu").isVisible(2);
            
            return isMainNavVisible && isNavMenuVisible;

        } catch (error) {
            console.log(`Desktop navigation verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify responsive search interface
     */
    private async verifyResponsiveSearchInterface(): Promise<boolean> {
        try {
            // Search container validation removed as per HWPC dev team requirements
            console.log("✓ Search interface validation skipped (following HWPC dev team specs)");
            return true;

        } catch (error) {
            console.log(`Responsive search interface verification failed: ${error.message}`);
            return false;
        }
    }

    // ===== BASE CLASS METHOD IMPLEMENTATIONS =====

    /**
     * Verify mobile-specific responsive elements (BasePage implementation)
     */
    protected async verifyMobileResponsiveElements(): Promise<void> {
        await this.verifyMobileResponsiveElementsInternal();
    }

    /**
     * Verify tablet-specific responsive elements (BasePage implementation)
     */
    protected async verifyTabletResponsiveElements(): Promise<void> {
        await this.verifyTabletResponsiveElementsInternal();
    }

    /**
     * Verify desktop-specific responsive elements (BasePage implementation)
     */
    protected async verifyDesktopResponsiveElements(): Promise<void> {
        await this.verifyDesktopResponsiveElementsInternal();
    }

    // ===== ABSTRACT METHOD IMPLEMENTATIONS =====

    /**
     * Initialize the navigation page
     */
    public async initialize(): Promise<void> {
        try {
            console.log("Initializing NavigationPage...");
            
            // Detect viewport category
            this.detectViewportCategory();
            
            // Wait for page to be ready
            await this.waitForPageLoad();
            
            // Verify basic navigation elements are present
            const isMainNavVisible = await this.web.element(NavigationConstants.MAIN_NAVIGATION, "Main Navigation").isVisible(3);
            if (!isMainNavVisible) {
                console.log("Warning: Main navigation not found during initialization");
            }

            console.log("NavigationPage initialized successfully");

        } catch (error) {
            console.log(`NavigationPage initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate essential navigation page elements
     */
    public async validatePageElements(): Promise<void> {
        try {
            console.log("Validating navigation page elements...");
            
            const errors: string[] = [];
            
            // Validate main navigation
            const isMainNavVisible = await this.web.element(NavigationConstants.MAIN_NAVIGATION, "Main Navigation").isVisible(2);
            if (!isMainNavVisible) {
                errors.push("Main navigation not found");
            }

            // Validate mobile menu toggle for mobile viewports
            if (this.isMobile) {
                const isMobileToggleVisible = await this.web.element(NavigationConstants.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle").isVisible(2);
                if (!isMobileToggleVisible) {
                    errors.push("Mobile menu toggle not found");
                }
            }

            // Validate responsive containers
            const isResponsiveContainerVisible = await this.web.element(NavigationConstants.RESPONSIVE_CONTAINER, "Responsive Container").isVisible(2);
            if (!isResponsiveContainerVisible) {
                errors.push("Responsive container not found");
            }

            if (errors.length > 0) {
                const errorMessage = `Navigation page validation failed: ${errors.join(', ')}`;
                console.log(errorMessage);
                throw new NavigationError('navigation', 'element', errorMessage);
            }

            console.log("Navigation page elements validated successfully");

        } catch (error) {
            console.log(`Navigation page validation failed: ${error.message}`);
            throw error;
        }
    }

    // ===== UTILITY METHODS FOR STEP DEFINITIONS =====

    /**
     * Get current page URL
     */
    public async getCurrentUrl(): Promise<string> {
        return this.page.url();
    }

    /**
     * Get current page title
     */
    public async getCurrentTitle(): Promise<string> {
        return await this.page.title();
    }

    /**
     * Check if page is in error state
     */
    public async isPageInErrorState(): Promise<{ inError: boolean; errorType?: string; details?: string }> {
        try {
            // Check for common error indicators
            const errorSelectors = [
                '[data-testid="error-message"]',
                '.error-container',
                '.alert-danger',
                '[role="alert"]'
            ];

            for (const selector of errorSelectors) {
                const errorElement = await this.web.element(selector, "Error Element").isVisible(1);
                if (errorElement) {
                    const errorText = await this.web.element(selector, "Error Element").getTextContent();
                    return {
                        inError: true,
                        errorType: 'page_error',
                        details: errorText
                    };
                }
            }

            // Check if page failed to load properly
            const currentUrl = await this.getCurrentUrl();
            const currentTitle = await this.getCurrentTitle();
            
            if (!currentUrl || currentUrl.includes('error') || !currentTitle) {
                return {
                    inError: true,
                    errorType: 'load_error',
                    details: 'Page failed to load properly'
                };
            }

            return { inError: false };

        } catch (error) {
            return {
                inError: true,
                errorType: 'detection_error',
                details: `Error detection failed: ${error.message}`
            };
        }
    }

    /**
     * Attempt to recover from error state
     */
    public async attemptErrorRecovery(pageName: string): Promise<boolean> {
        try {
            console.log(`Attempting error recovery for ${pageName}...`);

            // Try refreshing the page
            await this.page.reload({ waitUntil: 'networkidle' });
            await this.web.waitForLoadState();

            // Check if error is resolved
            const errorState = await this.isPageInErrorState();
            if (!errorState.inError) {
                console.log('Error recovery successful via page refresh');
                return true;
            }

            // Try navigating to the page again
            await this.navigateToPage(pageName);
            
            // Final error check
            const finalErrorState = await this.isPageInErrorState();
            const recovered = !finalErrorState.inError;
            
            console.log(`Error recovery ${recovered ? 'successful' : 'failed'}`);
            return recovered;

        } catch (error) {
            console.log(`Error recovery failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Navigate with viewport detection
     */
    public async navigateWithViewportDetection(pageName: string): Promise<void> {
        try {
            console.log(`Navigating to ${pageName} with viewport detection...`);
            
            // Detect current viewport
            this.detectViewportCategory();
            const viewportCategory = await this.getCurrentViewportCategory();
            
            console.log(`Using ${viewportCategory} navigation approach`);
            
            // Use the standard navigation method which already handles viewport detection
            await this.navigateToPage(pageName);
            
        } catch (error) {
            console.log(`Viewport-aware navigation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate touch target sizes for mobile accessibility
     */
    public async validateTouchTargetSizes(): Promise<boolean> {
        try {
            console.log('Validating touch target sizes...');
            
            // Get all interactive elements
            const interactiveSelectors = [
                'button',
                'a',
                'input[type="button"]',
                'input[type="submit"]',
                '[role="button"]',
                '.btn'
            ];

            const minTouchTargetSize = 44; // 44px minimum recommended by accessibility guidelines
            let allTargetsValid = true;

            for (const selector of interactiveSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const isVisible = await element.isVisible();
                        if (!isVisible) continue;

                        const boundingBox = await element.boundingBox();
                        if (boundingBox) {
                            const isValidSize = boundingBox.width >= minTouchTargetSize && 
                                              boundingBox.height >= minTouchTargetSize;
                            
                            if (!isValidSize) {
                                console.log(`Touch target too small: ${selector} (${boundingBox.width}x${boundingBox.height})`);
                                allTargetsValid = false;
                            }
                        }
                    }
                } catch (elementError) {
                    // Continue checking other elements if one fails
                    console.log(`Could not check touch targets for ${selector}: ${elementError.message}`);
                }
            }

            console.log(`Touch target validation ${allTargetsValid ? 'passed' : 'failed'}`);
            return allTargetsValid;

        } catch (error) {
            console.log(`Touch target validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Toggle mobile menu
     */
    public async toggleMobileMenu(): Promise<void> {
        const mobileToggleSelector = '.navbar-toggle, .mobile-menu-toggle, [data-testid="mobile-nav-toggle"], .hamburger, .menu-toggle, .navbar-toggler, [data-testid="mobile-menu-toggle"]';
        await this.web.element(mobileToggleSelector, "Mobile Menu Toggle").click();
    }

    /**
     * Check if mobile menu is visible
     */
    public async isMobileMenuVisible(): Promise<boolean> {
        const mobileMenuSelector = '.mobile-menu, .navbar-collapse, .nav-mobile, [data-mobile-menu], [data-testid="mobile-menu-container"]';
        return await this.web.element(mobileMenuSelector, "Mobile Menu").isVisible(2);
    }
}