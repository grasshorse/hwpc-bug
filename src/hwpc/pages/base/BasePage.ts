import { Page, ViewportSize } from '@playwright/test';
import UIActions from "../../../support/playwright/actions/UIActions";
import Constants from "../../constants/Constants";

/**
 * Enhanced BasePage with mobile-first approach and business workflow support
 * Provides consistent mobile-first page object patterns for HWPC testing
 */
export default abstract class BasePage {
    protected web: UIActions;
    protected page: Page;
    protected isMobile: boolean;
    protected isTablet: boolean;
    protected viewport: ViewportSize | null;
    
    constructor(web: UIActions) {
        this.web = web;
        this.page = web.getPage();
        this.detectViewportCategory();
    }

    // ===== VIEWPORT DETECTION AND MANAGEMENT =====

    /**
     * Detect current viewport category and set flags
     */
    protected detectViewportCategory(): void {
        this.viewport = this.page.viewportSize();
        
        if (this.viewport) {
            this.isMobile = this.viewport.width < Constants.RESPONSIVE_BREAKPOINT_MOBILE;
            this.isTablet = this.viewport.width >= Constants.RESPONSIVE_BREAKPOINT_MOBILE && 
                           this.viewport.width < Constants.RESPONSIVE_BREAKPOINT_TABLET;
        } else {
            this.isMobile = false;
            this.isTablet = false;
        }
    }

    /**
     * Get current viewport category
     */
    public async getCurrentViewportCategory(): Promise<'mobile' | 'tablet' | 'desktop'> {
        this.detectViewportCategory();
        
        if (this.isMobile) {
            return 'mobile';
        } else if (this.isTablet) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Set viewport for mobile testing
     */
    public async setMobileViewport(): Promise<void> {
        await this.page.setViewportSize(Constants.MOBILE_VIEWPORT);
        this.detectViewportCategory();
    }

    /**
     * Set viewport for tablet testing
     */
    public async setTabletViewport(): Promise<void> {
        await this.page.setViewportSize(Constants.TABLET_VIEWPORT);
        this.detectViewportCategory();
    }

    /**
     * Set viewport for desktop testing
     */
    public async setDesktopViewport(): Promise<void> {
        await this.page.setViewportSize(Constants.DESKTOP_VIEWPORT);
        this.detectViewportCategory();
    }

    // ===== MOBILE-FIRST INTERACTION METHODS =====

    /**
     * Mobile-aware click that handles different screen sizes
     */
    public async clickElement(selector: string, elementName: string): Promise<void> {
        try {
            const element = this.web.element(selector, elementName);
            
            // Ensure element is visible and interactable
            await element.waitTillVisible();
            
            if (this.isMobile) {
                await this.touchFriendlyClick(selector, elementName);
            } else {
                await element.click();
            }
            
        } catch (error) {
            console.log(`Click failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Mobile-aware text input with proper timing
     */
    public async typeText(selector: string, text: string, elementName: string): Promise<void> {
        try {
            const element = this.web.editBox(selector, elementName);
            
            await element.waitTillVisible();
            
            if (this.isMobile) {
                // Mobile-specific typing with delays
                await element.click(); // Focus first
                await this.page.waitForTimeout(Constants.MOBILE_KEYBOARD_SHOW_DELAY);
                await element.fill(text);
                await this.page.waitForTimeout(Constants.MOBILE_TYPE_DELAY);
            } else {
                await element.fill(text);
            }
            
        } catch (error) {
            console.log(`Type text failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for element with mobile-appropriate timeout
     */
    public async waitForElement(selector: string, elementName: string): Promise<void> {
        try {
            await this.web.element(selector, elementName).waitTillVisible();
        } catch (error) {
            console.log(`Wait for element failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Scroll element into view with mobile-friendly behavior
     */
    public async scrollElementIntoView(selector: string): Promise<void> {
        try {
            const element = this.web.element(selector, "Scroll Target");
            
            // Use mobile-friendly scroll behavior
            await element.getLocator().scrollIntoViewIfNeeded();
            
            // Additional wait for mobile scroll completion
            if (this.isMobile) {
                await this.page.waitForTimeout(Constants.MOBILE_SCROLL_DELAY);
            }
            
            // Verify element is now in viewport
            const isInViewport = await this.isElementInViewport(selector);
            if (!isInViewport) {
                // Fallback scroll method
                await this.page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center', 
                            inline: 'nearest' 
                        });
                    }
                }, selector);
                
                await this.page.waitForTimeout(Constants.MOBILE_SCROLL_TIMEOUT);
            }
            
        } catch (error) {
            console.log(`Scroll into view failed for ${selector}: ${error.message}`);
        }
    }

    // ===== TOUCH-FRIENDLY INTERACTION METHODS =====

    /**
     * Touch-friendly click with proper timing and error handling
     */
    public async touchFriendlyClick(selector: string, elementName: string): Promise<void> {
        try {
            const element = this.web.element(selector, elementName);
            
            // Ensure element is visible and interactable
            await element.waitTillVisible();
            await this.page.waitForTimeout(Constants.MOBILE_CLICK_DELAY);
            
            // Check if element is still in viewport
            const isInViewport = await this.isElementInViewport(selector);
            if (!isInViewport) {
                await this.scrollElementIntoView(selector);
            }
            
            // Perform touch-friendly click
            await element.click();
            
            // Small delay to ensure click is registered
            await this.page.waitForTimeout(Constants.TAP_DURATION);
            
        } catch (error) {
            console.log(`Touch-friendly click failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Touch-friendly tap with custom duration
     */
    public async touchFriendlyTap(selector: string, elementName: string, duration: number = Constants.TAP_DURATION): Promise<void> {
        try {
            const element = this.web.element(selector, elementName);
            await element.waitTillVisible();
            
            // Get element bounding box for precise tap
            const boundingBox = await element.getLocator().boundingBox();
            if (boundingBox) {
                const centerX = boundingBox.x + boundingBox.width / 2;
                const centerY = boundingBox.y + boundingBox.height / 2;
                
                // Perform tap gesture
                await this.page.touchscreen.tap(centerX, centerY);
                await this.page.waitForTimeout(duration);
            } else {
                // Fallback to regular click
                await element.click();
            }
            
        } catch (error) {
            console.log(`Touch-friendly tap failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Long press interaction for mobile
     */
    public async longPress(selector: string, elementName: string, duration: number = Constants.LONG_PRESS_DURATION): Promise<void> {
        try {
            const element = this.web.element(selector, elementName);
            await element.waitTillVisible();
            
            const boundingBox = await element.getLocator().boundingBox();
            if (boundingBox) {
                const centerX = boundingBox.x + boundingBox.width / 2;
                const centerY = boundingBox.y + boundingBox.height / 2;
                
                // Perform long press
                await this.page.mouse.move(centerX, centerY);
                await this.page.mouse.down();
                await this.page.waitForTimeout(duration);
                await this.page.mouse.up();
            }
            
        } catch (error) {
            console.log(`Long press failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Swipe gesture for mobile interactions
     */
    public async swipe(startSelector: string, direction: 'left' | 'right' | 'up' | 'down', distance: number = Constants.SWIPE_DISTANCE): Promise<void> {
        try {
            const element = this.web.element(startSelector, `Swipe ${direction}`);
            await element.waitTillVisible();
            
            const boundingBox = await element.getLocator().boundingBox();
            if (boundingBox) {
                const startX = boundingBox.x + boundingBox.width / 2;
                const startY = boundingBox.y + boundingBox.height / 2;
                
                let endX = startX;
                let endY = startY;
                
                switch (direction) {
                    case 'left':
                        endX = startX - distance;
                        break;
                    case 'right':
                        endX = startX + distance;
                        break;
                    case 'up':
                        endY = startY - distance;
                        break;
                    case 'down':
                        endY = startY + distance;
                        break;
                }
                
                // Perform swipe gesture
                await this.page.mouse.move(startX, startY);
                await this.page.mouse.down();
                await this.page.mouse.move(endX, endY, { steps: 10 });
                await this.page.mouse.up();
                
                await this.page.waitForTimeout(Constants.SWIPE_DURATION);
            }
            
        } catch (error) {
            console.log(`Swipe ${direction} failed: ${error.message}`);
            throw error;
        }
    }

    // ===== VIEWPORT-AWARE ELEMENT INTERACTION METHODS =====

    /**
     * Check if element is currently in viewport
     */
    public async isElementInViewport(selector: string): Promise<boolean> {
        try {
            const element = this.web.element(selector, "Viewport Check");
            const boundingBox = await element.getLocator().boundingBox();
            
            if (!boundingBox) return false;
            
            const viewport = this.page.viewportSize();
            if (!viewport) return false;
            
            return (
                boundingBox.x >= 0 &&
                boundingBox.y >= 0 &&
                boundingBox.x + boundingBox.width <= viewport.width &&
                boundingBox.y + boundingBox.height <= viewport.height
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Viewport-aware click that handles different screen sizes
     */
    public async viewportAwareClick(selector: string, elementName: string): Promise<void> {
        try {
            if (this.isMobile) {
                // Mobile interaction
                await this.touchFriendlyClick(selector, elementName);
            } else if (this.isTablet) {
                // Tablet interaction
                await this.touchFriendlyTap(selector, elementName);
            } else {
                // Desktop interaction
                await this.web.element(selector, elementName).click();
            }
        } catch (error) {
            console.log(`Viewport-aware click failed for ${elementName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Viewport-aware hover that handles touch devices
     */
    public async viewportAwareHover(selector: string, elementName: string): Promise<void> {
        try {
            if (this.isMobile || this.isTablet) {
                // Touch devices - use tap instead of hover
                await this.touchFriendlyTap(selector, elementName);
            } else {
                // Desktop - use hover
                await this.web.element(selector, elementName).hover();
            }
        } catch (error) {
            console.log(`Viewport-aware hover failed for ${elementName}: ${error.message}`);
        }
    }

    // ===== LOADING AND WAITING METHODS =====

    /**
     * Wait for page loading with mobile considerations
     */
    public async waitForPageLoad(): Promise<void> {
        try {
            if (this.isMobile) {
                // Use longer timeout for mobile networks
                await this.page.waitForLoadState('networkidle', { 
                    timeout: Constants.MOBILE_NETWORK_TIMEOUT 
                });
            } else {
                // Standard timeout for desktop
                await this.page.waitForLoadState('networkidle');
            }
        } catch (error) {
            console.log(`Page load wait failed: ${error.message}`);
        }
    }

    /**
     * Wait for loading indicators to disappear
     */
    public async waitForLoadingComplete(): Promise<void> {
        try {
            // Wait for loading indicator to appear and then disappear
            const loadingSelector = Constants.MOBILE_LOADING_SPINNER;
            const isLoadingVisible = await this.web.element(loadingSelector, "Loading Indicator").isVisible(1);
            
            if (isLoadingVisible) {
                await this.web.element(loadingSelector, "Loading Indicator").waitTillInvisible();
            }
        } catch (error) {
            // Loading indicator might not be present, continue
            console.log("No loading indicator found or already hidden");
        }
    }

    // ===== RESPONSIVE DESIGN VALIDATION =====

    /**
     * Verify responsive design elements
     */
    public async verifyResponsiveDesign(): Promise<void> {
        try {
            const viewportCategory = await this.getCurrentViewportCategory();
            
            switch (viewportCategory) {
                case 'mobile':
                    await this.verifyMobileResponsiveElements();
                    break;
                case 'tablet':
                    await this.verifyTabletResponsiveElements();
                    break;
                case 'desktop':
                    await this.verifyDesktopResponsiveElements();
                    break;
            }
            
        } catch (error) {
            console.log(`Responsive design verification failed: ${error.message}`);
        }
    }

    /**
     * Verify mobile-specific responsive elements
     */
    protected async verifyMobileResponsiveElements(): Promise<void> {
        console.log("Verifying mobile responsive elements...");
        // To be implemented by subclasses
    }

    /**
     * Verify tablet-specific responsive elements
     */
    protected async verifyTabletResponsiveElements(): Promise<void> {
        console.log("Verifying tablet responsive elements...");
        // To be implemented by subclasses
    }

    /**
     * Verify desktop-specific responsive elements
     */
    protected async verifyDesktopResponsiveElements(): Promise<void> {
        console.log("Verifying desktop responsive elements...");
        // To be implemented by subclasses
    }

    // ===== BUSINESS WORKFLOW SUPPORT METHODS =====

    /**
     * Navigate to a specific page with mobile-first approach
     */
    public async navigateToPage(url: string, pageName: string): Promise<void> {
        try {
            await this.web.goto(url, pageName);
            await this.waitForPageLoad();
        } catch (error) {
            console.log(`Navigation to ${pageName} failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify page title with mobile considerations
     */
    public async verifyPageTitle(expectedTitle: string): Promise<void> {
        try {
            const actualTitle = await this.page.title();
            if (actualTitle !== expectedTitle) {
                console.log(`Page title mismatch. Expected: "${expectedTitle}", Actual: "${actualTitle}"`);
            } else {
                console.log(`Page title verified: "${actualTitle}"`);
            }
        } catch (error) {
            console.log(`Page title verification failed: ${error.message}`);
        }
    }

    /**
     * Take screenshot with viewport-specific naming
     */
    public async takeScreenshot(name: string): Promise<void> {
        try {
            const viewportCategory = await this.getCurrentViewportCategory();
            const screenshotName = `${name}_${viewportCategory}`;
            await this.page.screenshot({ path: `screenshots/${screenshotName}.png` });
            console.log(`Screenshot taken: ${screenshotName}.png`);
        } catch (error) {
            console.log(`Screenshot failed: ${error.message}`);
        }
    }

    // ===== ABSTRACT METHODS FOR SUBCLASSES =====

    /**
     * Abstract method for page-specific initialization
     */
    public abstract initialize(): Promise<void>;

    /**
     * Abstract method for page-specific validation
     */
    public abstract validatePageElements(): Promise<void>;
}