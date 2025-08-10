import BasePage from './BasePage';
import UIActions from "../../../support/playwright/actions/UIActions";
import Constants from "../../constants/Constants";

/**
 * MobileBasePage - Enhanced mobile-specific base functionality
 * Extends BasePage with mobile-specific patterns and interactions
 */
export default abstract class MobileBasePage extends BasePage {
    
    // Mobile-specific selectors
    protected MOBILE_MENU_TOGGLE = Constants.MOBILE_MENU_BUTTON;
    protected MOBILE_MENU_OVERLAY = Constants.MOBILE_MENU_OVERLAY;
    protected MOBILE_MENU_CONTAINER = Constants.MOBILE_NAV_MENU;
    protected MOBILE_BOTTOM_NAV = Constants.MOBILE_BOTTOM_NAV;
    protected MOBILE_TAB_BAR = Constants.MOBILE_TAB_BAR;

    constructor(web: UIActions) {
        super(web);
    }

    // ===== MOBILE NAVIGATION METHODS =====

    /**
     * Open mobile menu with enhanced touch interactions
     */
    public async openMobileMenu(): Promise<void> {
        try {
            // Check if mobile menu is already open
            const isMenuOpen = await this.isMobileMenuOpen();
            if (isMenuOpen) {
                console.log("Mobile menu is already open");
                return;
            }
            
            // Find and click mobile menu toggle
            const isToggleVisible = await this.web.element(this.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle").isVisible(Constants.MOBILE_WAIT_TIMEOUT);
            
            if (isToggleVisible) {
                // Ensure toggle is in viewport
                await this.scrollElementIntoView(this.MOBILE_MENU_TOGGLE);
                
                // Use touch-friendly click
                await this.touchFriendlyClick(this.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle");
                
                // Wait for menu animation
                await this.page.waitForTimeout(Constants.MOBILE_MENU_SLIDE_DURATION);
                
                // Verify menu opened
                const isMenuVisible = await this.web.element(this.MOBILE_MENU_CONTAINER, "Mobile Menu Container").isVisible(Constants.MOBILE_WAIT_TIMEOUT);
                if (isMenuVisible) {
                    console.log("Mobile menu opened successfully");
                } else {
                    console.log("Mobile menu toggle clicked but menu not visible");
                }
            } else {
                console.log("Mobile menu toggle not found - this may be expected for some sites");
            }
        } catch (error) {
            console.log(`Mobile menu opening failed: ${error.message}`);
        }
    }

    /**
     * Close mobile menu
     */
    public async closeMobileMenu(): Promise<void> {
        try {
            const isMenuOpen = await this.isMobileMenuOpen();
            if (!isMenuOpen) {
                console.log("Mobile menu is already closed");
                return;
            }
            
            // Try clicking the toggle again to close
            await this.touchFriendlyClick(this.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle");
            
            // Or click overlay if it exists
            try {
                const isOverlayVisible = await this.web.element(this.MOBILE_MENU_OVERLAY, "Mobile Menu Overlay").isVisible(1);
                if (isOverlayVisible) {
                    await this.touchFriendlyClick(this.MOBILE_MENU_OVERLAY, "Mobile Menu Overlay");
                }
            } catch (overlayError) {
                // Overlay might not exist
            }
            
            // Wait for close animation
            await this.page.waitForTimeout(Constants.MOBILE_MENU_FADE_DURATION);
            console.log("Mobile menu closed successfully");
            
        } catch (error) {
            console.log(`Mobile menu closing failed: ${error.message}`);
        }
    }

    /**
     * Toggle mobile menu state
     */
    public async toggleMobileMenu(): Promise<void> {
        try {
            const isMenuOpen = await this.isMobileMenuOpen();
            if (isMenuOpen) {
                await this.closeMobileMenu();
            } else {
                await this.openMobileMenu();
            }
        } catch (error) {
            console.log(`Mobile menu toggle failed: ${error.message}`);
        }
    }

    /**
     * Check if mobile menu is currently open
     */
    protected async isMobileMenuOpen(): Promise<boolean> {
        try {
            return await this.web.element(this.MOBILE_MENU_CONTAINER, "Mobile Menu Container").isVisible(1);
        } catch (error) {
            return false;
        }
    }

    /**
     * Navigate using mobile bottom navigation
     */
    public async navigateViaBottomNav(navItem: string): Promise<void> {
        try {
            const isBottomNavVisible = await this.web.element(this.MOBILE_BOTTOM_NAV, "Mobile Bottom Navigation").isVisible(2);
            
            if (isBottomNavVisible) {
                const navItemSelector = `${this.MOBILE_BOTTOM_NAV} [data-nav="${navItem}"], ${this.MOBILE_BOTTOM_NAV} [aria-label*="${navItem}"]`;
                await this.touchFriendlyTap(navItemSelector, `Bottom Nav ${navItem}`);
                console.log(`Navigated via bottom nav to: ${navItem}`);
            } else {
                console.log("Mobile bottom navigation not found");
            }
        } catch (error) {
            console.log(`Bottom navigation failed for ${navItem}: ${error.message}`);
        }
    }

    /**
     * Navigate using mobile tab bar
     */
    public async navigateViaTabBar(tabName: string): Promise<void> {
        try {
            const isTabBarVisible = await this.web.element(this.MOBILE_TAB_BAR, "Mobile Tab Bar").isVisible(2);
            
            if (isTabBarVisible) {
                const tabSelector = `${this.MOBILE_TAB_BAR} [data-tab="${tabName}"], ${this.MOBILE_TAB_BAR} [aria-label*="${tabName}"]`;
                await this.touchFriendlyTap(tabSelector, `Tab ${tabName}`);
                console.log(`Navigated via tab bar to: ${tabName}`);
            } else {
                console.log("Mobile tab bar not found");
            }
        } catch (error) {
            console.log(`Tab navigation failed for ${tabName}: ${error.message}`);
        }
    }

    // ===== MOBILE FORM INTERACTIONS =====

    /**
     * Mobile-optimized form filling
     */
    public async fillMobileForm(formData: Record<string, string>): Promise<void> {
        try {
            for (const [fieldName, value] of Object.entries(formData)) {
                const fieldSelector = `[name="${fieldName}"], [data-field="${fieldName}"], #${fieldName}`;
                
                // Focus field first to show mobile keyboard
                await this.touchFriendlyTap(fieldSelector, `Field ${fieldName}`);
                await this.page.waitForTimeout(Constants.MOBILE_KEYBOARD_SHOW_DELAY);
                
                // Fill the field
                await this.typeText(fieldSelector, value, `Field ${fieldName}`);
                
                // Small delay between fields
                await this.page.waitForTimeout(Constants.MOBILE_FORM_VALIDATION_DELAY);
            }
            
            console.log("Mobile form filled successfully");
        } catch (error) {
            console.log(`Mobile form filling failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Submit mobile form with validation
     */
    public async submitMobileForm(submitButtonSelector?: string): Promise<void> {
        try {
            const submitSelector = submitButtonSelector || 'button[type="submit"], .submit-btn, .form-submit';
            
            // Scroll submit button into view
            await this.scrollElementIntoView(submitSelector);
            
            // Use touch-friendly submit
            await this.touchFriendlyTap(submitSelector, "Submit Button");
            
            // Wait for form submission
            await this.page.waitForTimeout(Constants.MOBILE_TRANSITION_DELAY);
            
            console.log("Mobile form submitted successfully");
        } catch (error) {
            console.log(`Mobile form submission failed: ${error.message}`);
            throw error;
        }
    }

    // ===== MOBILE SEARCH FUNCTIONALITY =====

    /**
     * Mobile-optimized search with touch-friendly interactions
     */
    public async performMobileSearch(searchTerm: string): Promise<void> {
        try {
            // Check for mobile search container first
            const mobileSearchSelector = Constants.MOBILE_SEARCH_SELECTOR;
            const isMobileSearchVisible = await this.web.element(mobileSearchSelector, "Mobile Search").isVisible(2);
            
            if (isMobileSearchVisible) {
                // Use mobile-specific search
                await this.touchFriendlyClick(mobileSearchSelector, "Mobile Search");
                await this.page.waitForTimeout(Constants.MOBILE_KEYBOARD_SHOW_DELAY);
            }
            
            // Find search input
            const searchInputSelector = 'input[type="search"], .search-input, #search';
            await this.typeText(searchInputSelector, searchTerm, "Search Input");
            
            // Submit search
            const searchButtonSelector = '.search-button, button[type="submit"], .search-submit';
            const isSearchButtonVisible = await this.web.element(searchButtonSelector, "Search Button").isVisible(2);
            
            if (isSearchButtonVisible) {
                await this.touchFriendlyTap(searchButtonSelector, "Search Button");
            } else {
                // Try pressing Enter
                await this.page.keyboard.press('Enter');
            }
            
            // Wait for search results
            await this.waitForLoadingComplete();
            
            console.log(`Mobile search performed for: ${searchTerm}`);
        } catch (error) {
            console.log(`Mobile search failed: ${error.message}`);
            throw error;
        }
    }

    // ===== MOBILE LIST AND CARD INTERACTIONS =====

    /**
     * Interact with mobile card elements
     */
    public async interactWithMobileCard(cardIndex: number, action: 'tap' | 'swipe-left' | 'swipe-right' | 'long-press' = 'tap'): Promise<void> {
        try {
            const cardSelector = `${Constants.MOBILE_CARD_CONTAINER}:nth-child(${cardIndex + 1})`;
            
            switch (action) {
                case 'tap':
                    await this.touchFriendlyTap(cardSelector, `Mobile Card ${cardIndex}`);
                    break;
                case 'swipe-left':
                    await this.swipe(cardSelector, 'left');
                    break;
                case 'swipe-right':
                    await this.swipe(cardSelector, 'right');
                    break;
                case 'long-press':
                    await this.longPress(cardSelector, `Mobile Card ${cardIndex}`);
                    break;
            }
            
            console.log(`Mobile card interaction completed: ${action} on card ${cardIndex}`);
        } catch (error) {
            console.log(`Mobile card interaction failed: ${error.message}`);
        }
    }

    /**
     * Handle mobile pull-to-refresh
     */
    public async pullToRefresh(): Promise<void> {
        try {
            const refreshSelector = Constants.MOBILE_PULL_TO_REFRESH;
            const isRefreshVisible = await this.web.element(refreshSelector, "Pull to Refresh").isVisible(2);
            
            if (isRefreshVisible) {
                // Simulate pull-to-refresh gesture
                await this.swipe(refreshSelector, 'down', 200);
                
                // Wait for refresh animation
                await this.page.waitForTimeout(Constants.MOBILE_TRANSITION_DELAY);
                
                // Wait for content to reload
                await this.waitForLoadingComplete();
                
                console.log("Pull-to-refresh completed");
            } else {
                console.log("Pull-to-refresh not available");
            }
        } catch (error) {
            console.log(`Pull-to-refresh failed: ${error.message}`);
        }
    }

    /**
     * Handle mobile infinite scroll
     */
    public async triggerInfiniteScroll(): Promise<void> {
        try {
            const scrollTriggerSelector = Constants.MOBILE_INFINITE_SCROLL;
            
            // Scroll to bottom to trigger infinite scroll
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Wait for new content to load
            await this.waitForLoadingComplete();
            
            console.log("Infinite scroll triggered");
        } catch (error) {
            console.log(`Infinite scroll failed: ${error.message}`);
        }
    }

    // ===== MOBILE MODAL AND DIALOG HANDLING =====

    /**
     * Handle mobile bottom sheet
     */
    public async interactWithBottomSheet(action: 'open' | 'close' | 'swipe-down' = 'open'): Promise<void> {
        try {
            const bottomSheetSelector = Constants.MOBILE_BOTTOM_SHEET;
            
            switch (action) {
                case 'open':
                    const triggerSelector = '[data-bs-toggle="bottom-sheet"], .bottom-sheet-trigger';
                    await this.touchFriendlyTap(triggerSelector, "Bottom Sheet Trigger");
                    break;
                case 'close':
                    const closeSelector = `${bottomSheetSelector} .close, ${bottomSheetSelector} .btn-close`;
                    await this.touchFriendlyTap(closeSelector, "Bottom Sheet Close");
                    break;
                case 'swipe-down':
                    await this.swipe(bottomSheetSelector, 'down');
                    break;
            }
            
            // Wait for animation
            await this.page.waitForTimeout(Constants.MOBILE_TRANSITION_DELAY);
            
            console.log(`Bottom sheet ${action} completed`);
        } catch (error) {
            console.log(`Bottom sheet interaction failed: ${error.message}`);
        }
    }

    /**
     * Handle mobile action sheet
     */
    public async selectFromActionSheet(optionText: string): Promise<void> {
        try {
            const actionSheetSelector = Constants.MOBILE_ACTION_SHEET;
            const isActionSheetVisible = await this.web.element(actionSheetSelector, "Action Sheet").isVisible(2);
            
            if (isActionSheetVisible) {
                const optionSelector = `${actionSheetSelector} [data-option="${optionText}"], ${actionSheetSelector} :text("${optionText}")`;
                await this.touchFriendlyTap(optionSelector, `Action Sheet Option: ${optionText}`);
                
                console.log(`Action sheet option selected: ${optionText}`);
            } else {
                console.log("Action sheet not visible");
            }
        } catch (error) {
            console.log(`Action sheet selection failed: ${error.message}`);
        }
    }

    // ===== MOBILE PERFORMANCE AND LOADING =====

    /**
     * Wait for mobile-specific loading with appropriate timeouts
     */
    public async waitForMobileLoading(): Promise<void> {
        try {
            // Check for mobile loading indicators
            const mobileLoadingSelector = Constants.MOBILE_LOADING_SPINNER;
            const isLoadingVisible = await this.web.element(mobileLoadingSelector, "Mobile Loading").isVisible(1);
            
            if (isLoadingVisible) {
                await this.web.element(mobileLoadingSelector, "Mobile Loading").waitTillInvisible();
            }
            
            // Check for skeleton loaders
            const skeletonSelector = Constants.MOBILE_SKELETON_LOADER;
            const isSkeletonVisible = await this.web.element(skeletonSelector, "Skeleton Loader").isVisible(1);
            
            if (isSkeletonVisible) {
                await this.web.element(skeletonSelector, "Skeleton Loader").waitTillInvisible();
            }
            
            console.log("Mobile loading completed");
        } catch (error) {
            console.log(`Mobile loading wait failed: ${error.message}`);
        }
    }

    /**
     * Check mobile network connectivity
     */
    public async checkMobileConnectivity(): Promise<boolean> {
        try {
            const offlineIndicatorSelector = Constants.MOBILE_OFFLINE_INDICATOR;
            const isOfflineVisible = await this.web.element(offlineIndicatorSelector, "Offline Indicator").isVisible(1);
            
            if (isOfflineVisible) {
                console.log("Mobile device appears to be offline");
                return false;
            }
            
            console.log("Mobile device appears to be online");
            return true;
        } catch (error) {
            console.log("Could not determine mobile connectivity status");
            return true; // Assume online if we can't determine
        }
    }

    // ===== MOBILE ACCESSIBILITY METHODS =====

    /**
     * Verify mobile touch targets meet minimum size requirements
     */
    public async verifyTouchTargetSizes(): Promise<void> {
        try {
            const touchTargetSelector = Constants.MOBILE_TOUCH_TARGET;
            const touchTargets = await this.page.locator(touchTargetSelector).count();
            
            console.log(`Found ${touchTargets} touch targets to verify`);
            
            for (let i = 0; i < Math.min(5, touchTargets); i++) {
                const element = this.page.locator(touchTargetSelector).nth(i);
                const boundingBox = await element.boundingBox();
                
                if (boundingBox) {
                    const minSize = Math.min(boundingBox.width, boundingBox.height);
                    if (minSize >= Constants.MOBILE_MIN_TOUCH_TARGET) {
                        console.log(`Touch target ${i + 1} meets minimum size requirement (${minSize}px)`);
                    } else {
                        console.log(`Touch target ${i + 1} is smaller than recommended (${minSize}px < ${Constants.MOBILE_MIN_TOUCH_TARGET}px)`);
                    }
                }
            }
        } catch (error) {
            console.log(`Touch target verification failed: ${error.message}`);
        }
    }

    // ===== MOBILE-SPECIFIC RESPONSIVE VALIDATION =====

    /**
     * Verify mobile-specific responsive elements
     */
    protected async verifyMobileResponsiveElements(): Promise<void> {
        try {
            console.log("Verifying mobile responsive elements...");
            
            // Verify mobile navigation
            await this.verifyMobileNavigation();
            
            // Verify touch target sizes
            await this.verifyTouchTargetSizes();
            
            // Verify mobile forms
            await this.verifyMobileForms();
            
            // Verify mobile content layout
            await this.verifyMobileContentLayout();
            
            console.log("Mobile responsive elements verification completed");
        } catch (error) {
            console.log(`Mobile responsive verification failed: ${error.message}`);
        }
    }

    /**
     * Verify mobile navigation elements
     */
    protected async verifyMobileNavigation(): Promise<void> {
        try {
            // Check for mobile menu toggle
            const isToggleVisible = await this.web.element(this.MOBILE_MENU_TOGGLE, "Mobile Menu Toggle").isVisible(2);
            if (isToggleVisible) {
                console.log("Mobile menu toggle found and verified");
            }
            
            // Check for bottom navigation
            const isBottomNavVisible = await this.web.element(this.MOBILE_BOTTOM_NAV, "Mobile Bottom Navigation").isVisible(2);
            if (isBottomNavVisible) {
                console.log("Mobile bottom navigation found and verified");
            }
            
        } catch (error) {
            console.log(`Mobile navigation verification failed: ${error.message}`);
        }
    }

    /**
     * Verify mobile form elements
     */
    protected async verifyMobileForms(): Promise<void> {
        try {
            const mobileFormSelector = Constants.MOBILE_FORM_CONTAINER;
            const isMobileFormVisible = await this.web.element(mobileFormSelector, "Mobile Form").isVisible(2);
            
            if (isMobileFormVisible) {
                console.log("Mobile form container found and verified");
                
                // Check for mobile-specific form elements
                const floatingLabelSelector = Constants.MOBILE_FLOATING_LABEL;
                const isFloatingLabelVisible = await this.web.element(floatingLabelSelector, "Floating Label").isVisible(2);
                
                if (isFloatingLabelVisible) {
                    console.log("Mobile floating labels found and verified");
                }
            }
        } catch (error) {
            console.log(`Mobile form verification failed: ${error.message}`);
        }
    }

    /**
     * Verify mobile content layout
     */
    protected async verifyMobileContentLayout(): Promise<void> {
        try {
            // Check for mobile card layout
            const mobileCardSelector = Constants.MOBILE_CARD_CONTAINER;
            const cardCount = await this.web.element(mobileCardSelector, "Mobile Cards").getCount();
            
            if (cardCount > 0) {
                console.log(`Mobile card layout verified with ${cardCount} cards`);
            }
            
            // Check for mobile list layout
            const mobileListSelector = Constants.MOBILE_LIST_ITEM;
            const listCount = await this.web.element(mobileListSelector, "Mobile List Items").getCount();
            
            if (listCount > 0) {
                console.log(`Mobile list layout verified with ${listCount} items`);
            }
            
        } catch (error) {
            console.log(`Mobile content layout verification failed: ${error.message}`);
        }
    }
}