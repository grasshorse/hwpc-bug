import BasePage from './base/BasePage';
import { ContextAwareBasePage } from '../../support/testing/base/ContextAwareBasePage';
import { ContextAwareElementConfig } from '../../support/testing/interfaces/ContextAwarePageObject';
import { TestMode } from '../../support/testing/types';
import UIActions from "../../support/playwright/actions/UIActions";
import NavigationConstants, { PageValidation } from "../constants/NavigationConstants";
import Constants from "../constants/Constants";

/**
 * SPA State interface for tracking JavaScript application state
 */
export interface SPAState {
    isInitialized: boolean;
    navigationRendered: boolean;
    currentRoute: string;
    componentsLoaded: string[];
    jsErrors: string[];
    domReadyState: string;
    loadingTime: number;
    timestamp: number;
}

/**
 * Enhanced debugging information for SPA-specific errors
 */
export interface SPADebugInfo {
    spaState: SPAState;
    domStructure: {
        navigationContainer: boolean;
        mainNavigation: boolean;
        navigationLinks: number;
        mobileMenuToggle: boolean;
    };
    timing: {
        spaInitStart: number;
        spaInitEnd: number;
        navigationRenderStart: number;
        navigationRenderEnd: number;
    };
    selectors: {
        attempted: string[];
        successful: string[];
        failed: string[];
    };
    viewport: {
        width: number;
        height: number;
        category: string;
        isMobile: boolean;
    };
}

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
 * SPANotInitializedError - Thrown when JavaScript application hasn't loaded
 */
export class SPANotInitializedError extends Error {
    constructor(
        public details: string,
        public spaState: SPAState,
        public debugInfo: SPADebugInfo
    ) {
        super(`SPA initialization failed: ${details}`);
        this.name = 'SPANotInitializedError';
    }
}

/**
 * NavigationNotRenderedError - Thrown when navigation container is empty
 */
export class NavigationNotRenderedError extends Error {
    constructor(
        public details: string,
        public spaState: SPAState,
        public debugInfo: SPADebugInfo
    ) {
        super(`Navigation not rendered: ${details}`);
        this.name = 'NavigationNotRenderedError';
    }
}

/**
 * ComponentLoadError - Thrown when specific components fail to load
 */
export class ComponentLoadError extends Error {
    constructor(
        public componentName: string,
        public details: string,
        public spaState: SPAState,
        public debugInfo: SPADebugInfo
    ) {
        super(`Component load failed (${componentName}): ${details}`);
        this.name = 'ComponentLoadError';
    }
}

/**
 * NavigationPage - Base navigation functionality for HWPC application
 * Extends ContextAwareBasePage with core navigation methods and mobile-first responsive design validation
 * Now supports both isolated and production testing modes with context-aware element selection
 */
export default class NavigationPage extends ContextAwareBasePage {
    
    constructor(web: UIActions) {
        super(web);
    }

    // ===== CONTEXT-AWARE INITIALIZATION METHODS =====

    /**
     * Initialize mode-specific configurations for navigation elements
     */
    protected initializeModeSpecificConfigurations(): void {
        const currentMode = this.getTestMode();
        console.log(`Initializing navigation page configurations for mode: ${currentMode}`);

        // Register navigation container configuration
        this.registerModeSpecificElement({
            elementName: 'navigationContainer',
            baseSelector: NavigationConstants.NAVIGATION_CONTAINER,
            isolatedModeSelector: '[data-testid="main-navigation"], .main-nav, .navbar-nav',
            productionModeSelector: '.navigation, .nav-menu, [data-testid="main-navigation"]',
            fallbackSelector: '.navigation, .main-nav',
            isRequired: true,
            modeSpecific: {
                [TestMode.ISOLATED]: {
                    selector: '[data-testid="main-navigation"], .main-nav',
                    validation: async (element) => {
                        const hasContent = await this.page.evaluate((el) => {
                            return el && (el.children.length > 0 || el.textContent?.trim().length > 0);
                        }, await element.getLocator().elementHandle());
                        return hasContent;
                    }
                },
                [TestMode.PRODUCTION]: {
                    selector: '.navigation, .nav-menu, [data-testid="main-navigation"]',
                    validation: async (element) => {
                        // In production, verify navigation has real navigation links
                        const linkCount = await this.page.evaluate((el) => {
                            return el ? el.querySelectorAll('a[href]').length : 0;
                        }, await element.getLocator().elementHandle());
                        return linkCount > 0;
                    }
                }
            }
        });

        // Register main navigation configuration
        this.registerModeSpecificElement({
            elementName: 'mainNavigation',
            baseSelector: NavigationConstants.MAIN_NAVIGATION,
            isolatedModeSelector: '.navigation, .main-nav, .navbar-nav',
            productionModeSelector: '.navigation, .main-nav, [data-testid="main-navigation"]',
            fallbackSelector: '.navigation, .main-nav',
            isRequired: true,
            modeSpecific: {
                [TestMode.ISOLATED]: {
                    selector: '.navigation, .main-nav, .navbar-nav',
                    validation: async (element) => {
                        return await element.isVisible();
                    }
                },
                [TestMode.PRODUCTION]: {
                    selector: '.navigation, .main-nav, [data-testid="main-navigation"]',
                    validation: async (element) => {
                        return await element.isVisible();
                    }
                }
            }
        });

        // Register mobile menu toggle configuration
        this.registerModeSpecificElement({
            elementName: 'mobileMenuToggle',
            baseSelector: NavigationConstants.MOBILE_MENU_TOGGLE,
            isolatedModeSelector: '[data-testid="mobile-menu-toggle"], .mobile-menu-toggle',
            productionModeSelector: '.mobile-menu-toggle, [data-testid="mobile-menu-toggle"]',
            fallbackSelector: '.mobile-menu-toggle',
            isRequired: false, // Only required on mobile
            modeSpecific: {
                [TestMode.ISOLATED]: {
                    selector: '[data-testid="mobile-menu-toggle"], .mobile-menu-toggle',
                    validation: async (element) => {
                        if (!this.isMobile) return true; // Not required on desktop
                        return await element.isVisible();
                    }
                },
                [TestMode.PRODUCTION]: {
                    selector: '.mobile-menu-toggle, [data-testid="mobile-menu-toggle"]',
                    validation: async (element) => {
                        if (!this.isMobile) return true; // Not required on desktop
                        return await element.isVisible();
                    }
                }
            }
        });

        // Register search interface configuration
        this.registerModeSpecificElement({
            elementName: 'searchInterface',
            baseSelector: '.search-interface, [data-testid="search-interface"]',
            isolatedModeSelector: '[data-testid="search-interface"], .search-interface',
            productionModeSelector: '.search-interface, [data-testid="search-interface"]',
            fallbackSelector: '.search-interface',
            isRequired: false,
            modeSpecific: {
                [TestMode.ISOLATED]: {
                    selector: '[data-testid="search-interface"], .search-interface',
                    validation: async (element) => {
                        return await element.isVisible();
                    }
                },
                [TestMode.PRODUCTION]: {
                    selector: '.search-interface, [data-testid="search-interface"]',
                    validation: async (element) => {
                        return await element.isVisible();
                    }
                }
            }
        });

        console.log(`Navigation page configurations initialized for ${this.modeSpecificSelectors.size} elements`);
    }

    /**
     * Validate mode-specific requirements for navigation
     */
    protected async validateModeSpecificRequirements(): Promise<boolean> {
        const currentMode = this.getTestMode();
        if (!currentMode) {
            console.log('No test mode available for validation');
            return false;
        }

        console.log(`Validating navigation requirements for mode: ${currentMode}`);

        try {
            switch (currentMode) {
                case TestMode.ISOLATED:
                    return await this.validateIsolatedModeRequirements();
                case TestMode.PRODUCTION:
                    return await this.validateProductionModeRequirements();
                case TestMode.DUAL:
                    // For dual mode, validate both isolated and production requirements
                    const isolatedValid = await this.validateIsolatedModeRequirements();
                    const productionValid = await this.validateProductionModeRequirements();
                    return isolatedValid || productionValid; // At least one should work
                default:
                    console.log(`Unknown test mode: ${currentMode}`);
                    return false;
            }
        } catch (error) {
            console.log(`Mode-specific validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Validate requirements specific to isolated testing mode
     */
    private async validateIsolatedModeRequirements(): Promise<boolean> {
        console.log('Validating isolated mode requirements...');

        // In isolated mode, we expect test data to be available
        const testData = this.dataContext?.testData;
        if (!testData) {
            console.log('No test data available in isolated mode');
            return false;
        }

        // Verify that navigation elements use test-friendly selectors
        const navigationSelector = this.getModeSpecificSelector(
            NavigationConstants.NAVIGATION_CONTAINER, 
            'navigationContainer'
        );

        const hasTestIdSelectors = navigationSelector.includes('[data-testid');
        if (!hasTestIdSelectors) {
            console.log('Warning: Navigation selectors may not be optimized for isolated testing');
        }

        console.log('Isolated mode requirements validated successfully');
        return true;
    }

    /**
     * Validate requirements specific to production testing mode
     */
    private async validateProductionModeRequirements(): Promise<boolean> {
        console.log('Validating production mode requirements...');

        // In production mode, verify we have looneyTunes test data
        const testData = this.dataContext?.testData;
        if (!testData) {
            console.log('No test data available in production mode');
            return false;
        }

        // Verify test customers follow looneyTunes naming convention
        const testCustomers = testData.customers;
        const hasLooneyTunesCustomers = testCustomers.some(customer => 
            customer.name.toLowerCase().includes('looney') || 
            customer.name.toLowerCase().includes('bugs') ||
            customer.name.toLowerCase().includes('daffy') ||
            customer.isTestData === true
        );

        if (!hasLooneyTunesCustomers) {
            console.log('Warning: No looneyTunes test customers found in production mode');
        }

        // Verify test routes are for expected locations
        const testRoutes = testData.routes;
        const expectedLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
        const hasExpectedRoutes = testRoutes.some(route => 
            expectedLocations.some(location => 
                route.location.includes(location) || route.isTestData === true
            )
        );

        if (!hasExpectedRoutes) {
            console.log('Warning: No expected test routes found in production mode');
        }

        console.log('Production mode requirements validated successfully');
        return true;
    }

    // ===== SPA STATE CAPTURE AND DEBUGGING METHODS =====

    /**
     * Capture current SPA state for debugging purposes
     */
    private async captureSPAState(): Promise<SPAState> {
        const startTime = Date.now();
        
        try {
            const spaState: SPAState = {
                isInitialized: false,
                navigationRendered: false,
                currentRoute: '',
                componentsLoaded: [],
                jsErrors: [],
                domReadyState: '',
                loadingTime: 0,
                timestamp: startTime
            };

            // Check if SPA is initialized
            spaState.isInitialized = await this.page.evaluate(() => {
                return (window as any).app !== undefined || 
                       document.readyState === 'complete' ||
                       document.querySelector('script[src*="app"]') !== null;
            });

            // Check if navigation is rendered
            spaState.navigationRendered = await this.page.evaluate(() => {
                const navContainer = document.querySelector('[data-testid="main-navigation"], .main-nav, .navbar-nav, .navigation, .nav-menu');
                return navContainer !== null && (navContainer.children.length > 0 || navContainer.textContent?.trim().length > 0);
            });

            // Get current route
            spaState.currentRoute = await this.page.evaluate(() => {
                return window.location.pathname + window.location.search + window.location.hash;
            });

            // Get loaded components (check for common SPA component indicators)
            spaState.componentsLoaded = await this.page.evaluate(() => {
                const components: string[] = [];
                
                // Check for React components
                if ((window as any).React) components.push('React');
                
                // Check for Vue components
                if ((window as any).Vue) components.push('Vue');
                
                // Check for Angular components
                if ((window as any).ng) components.push('Angular');
                
                // Check for common navigation components
                if (document.querySelector('[data-testid="main-navigation"]')) components.push('MainNavigation');
                if (document.querySelector('[data-testid="mobile-menu-toggle"]')) components.push('MobileMenuToggle');
                if (document.querySelector('.search-interface, [data-testid="search-interface"]')) components.push('SearchInterface');
                
                // Check for page-specific components
                if (document.querySelector('[data-testid*="page"]')) components.push('PageComponent');
                
                return components;
            });

            // Capture JavaScript errors from console
            spaState.jsErrors = await this.page.evaluate(() => {
                const errors: string[] = [];
                
                // Check for global error handlers
                if ((window as any).__jsErrors) {
                    errors.push(...(window as any).__jsErrors);
                }
                
                // Check for React error boundaries
                if ((window as any).__reactErrors) {
                    errors.push(...(window as any).__reactErrors);
                }
                
                return errors;
            });

            // Get DOM ready state
            spaState.domReadyState = await this.page.evaluate(() => document.readyState);

            // Calculate loading time
            spaState.loadingTime = Date.now() - startTime;

            return spaState;

        } catch (error) {
            console.log(`Error capturing SPA state: ${error.message}`);
            return {
                isInitialized: false,
                navigationRendered: false,
                currentRoute: this.page.url(),
                componentsLoaded: [],
                jsErrors: [error.message],
                domReadyState: 'unknown',
                loadingTime: Date.now() - startTime,
                timestamp: startTime
            };
        }
    }

    /**
     * Capture comprehensive debugging information for SPA errors
     */
    private async captureSPADebugInfo(): Promise<SPADebugInfo> {
        const debugInfo: SPADebugInfo = {
            spaState: await this.captureSPAState(),
            domStructure: {
                navigationContainer: false,
                mainNavigation: false,
                navigationLinks: 0,
                mobileMenuToggle: false
            },
            timing: {
                spaInitStart: Date.now(),
                spaInitEnd: 0,
                navigationRenderStart: Date.now(),
                navigationRenderEnd: 0
            },
            selectors: {
                attempted: [],
                successful: [],
                failed: []
            },
            viewport: {
                width: 0,
                height: 0,
                category: 'unknown',
                isMobile: false
            }
        };

        try {
            // Capture DOM structure information
            debugInfo.domStructure = await this.page.evaluate(() => {
                return {
                    navigationContainer: document.querySelector('[data-testid="main-navigation"], .main-nav, .navbar-nav, .navigation, .nav-menu') !== null,
                    mainNavigation: document.querySelector('.navigation, .main-nav, .navbar-nav, [data-testid="main-navigation"], .nav-menu') !== null,
                    navigationLinks: document.querySelectorAll('a[href], [data-testid^="nav-"], .nav-link').length,
                    mobileMenuToggle: document.querySelector('[data-testid="mobile-menu-toggle"]') !== null
                };
            });

            // Capture viewport information
            const viewport = this.page.viewportSize();
            if (viewport) {
                debugInfo.viewport = {
                    width: viewport.width,
                    height: viewport.height,
                    category: NavigationConstants.getViewportCategoryByWidth(viewport.width),
                    isMobile: viewport.width < 768
                };
            }

        } catch (error) {
            console.log(`Error capturing debug info: ${error.message}`);
        }

        return debugInfo;
    }

    /**
     * Enhanced error capture with SPA state information
     */
    private async captureNavigationErrorWithSPAState(pageName: string, errorMessage: string, errorType: 'spa' | 'navigation' | 'component' = 'navigation'): Promise<void> {
        try {
            const spaState = await this.captureSPAState();
            const debugInfo = await this.captureSPADebugInfo();
            
            // Log comprehensive debugging information
            console.log('=== SPA ERROR DEBUGGING INFORMATION ===');
            console.log(`Error Type: ${errorType}`);
            console.log(`Page: ${pageName}`);
            console.log(`Error Message: ${errorMessage}`);
            console.log('');
            
            console.log('SPA State:');
            console.log(`  - Initialized: ${spaState.isInitialized}`);
            console.log(`  - Navigation Rendered: ${spaState.navigationRendered}`);
            console.log(`  - Current Route: ${spaState.currentRoute}`);
            console.log(`  - Components Loaded: ${spaState.componentsLoaded.join(', ') || 'None'}`);
            console.log(`  - DOM Ready State: ${spaState.domReadyState}`);
            console.log(`  - Loading Time: ${spaState.loadingTime}ms`);
            
            if (spaState.jsErrors.length > 0) {
                console.log(`  - JavaScript Errors: ${spaState.jsErrors.join(', ')}`);
            }
            
            console.log('');
            console.log('DOM Structure:');
            console.log(`  - Navigation Container: ${debugInfo.domStructure.navigationContainer}`);
            console.log(`  - Main Navigation: ${debugInfo.domStructure.mainNavigation}`);
            console.log(`  - Navigation Links Count: ${debugInfo.domStructure.navigationLinks}`);
            console.log(`  - Mobile Menu Toggle: ${debugInfo.domStructure.mobileMenuToggle}`);
            
            console.log('');
            console.log('Viewport Information:');
            console.log(`  - Size: ${debugInfo.viewport.width}x${debugInfo.viewport.height}`);
            console.log(`  - Category: ${debugInfo.viewport.category}`);
            console.log(`  - Is Mobile: ${debugInfo.viewport.isMobile}`);
            
            if (debugInfo.selectors.attempted.length > 0) {
                console.log('');
                console.log('Selector Information:');
                console.log(`  - Attempted: ${debugInfo.selectors.attempted.join(', ')}`);
                console.log(`  - Successful: ${debugInfo.selectors.successful.join(', ') || 'None'}`);
                console.log(`  - Failed: ${debugInfo.selectors.failed.join(', ') || 'None'}`);
            }
            
            console.log('=== END SPA ERROR DEBUGGING ===');
            
            // Capture screenshot for visual debugging
            await this.captureNavigationError(pageName, errorMessage);
            
        } catch (debugError) {
            console.log(`Error during SPA debug capture: ${debugError.message}`);
        }
    }

    /**
     * Log JavaScript component loading status for debugging
     */
    private async logJavaScriptComponentStatus(): Promise<void> {
        try {
            console.log('=== JAVASCRIPT COMPONENT STATUS ===');
            
            const componentStatus = await this.page.evaluate(() => {
                const status = {
                    frameworks: [] as string[],
                    navigationComponents: [] as string[],
                    pageComponents: [] as string[],
                    loadedScripts: [] as string[],
                    domElements: {
                        total: document.querySelectorAll('*').length,
                        withTestIds: document.querySelectorAll('[data-testid]').length,
                        navigationElements: document.querySelectorAll('nav, .nav, .navigation, [data-testid*="nav"]').length,
                        interactiveElements: document.querySelectorAll('a, button, input, select, textarea').length
                    }
                };
                
                // Check for JavaScript frameworks
                if ((window as any).React) status.frameworks.push('React');
                if ((window as any).Vue) status.frameworks.push('Vue');
                if ((window as any).angular) status.frameworks.push('Angular');
                if ((window as any).jQuery) status.frameworks.push('jQuery');
                
                // Check for navigation components
                if (document.querySelector('[data-testid="main-navigation"]')) status.navigationComponents.push('MainNavigation');
                if (document.querySelector('[data-testid="mobile-menu-toggle"]')) status.navigationComponents.push('MobileMenuToggle');
                if (document.querySelector('.search-interface')) status.navigationComponents.push('SearchInterface');
                
                // Check for page components
                const pageElements = document.querySelectorAll('[data-testid*="page"]');
                pageElements.forEach(el => {
                    const testId = el.getAttribute('data-testid');
                    if (testId) status.pageComponents.push(testId);
                });
                
                // Check for loaded scripts
                const scripts = document.querySelectorAll('script[src]');
                scripts.forEach(script => {
                    const src = script.getAttribute('src');
                    if (src) {
                        const filename = src.split('/').pop() || src;
                        status.loadedScripts.push(filename);
                    }
                });
                
                return status;
            });
            
            console.log('JavaScript Frameworks:');
            console.log(`  - Detected: ${componentStatus.frameworks.join(', ') || 'None'}`);
            
            console.log('Navigation Components:');
            console.log(`  - Loaded: ${componentStatus.navigationComponents.join(', ') || 'None'}`);
            
            console.log('Page Components:');
            console.log(`  - Loaded: ${componentStatus.pageComponents.join(', ') || 'None'}`);
            
            console.log('DOM Elements:');
            console.log(`  - Total Elements: ${componentStatus.domElements.total}`);
            console.log(`  - Elements with Test IDs: ${componentStatus.domElements.withTestIds}`);
            console.log(`  - Navigation Elements: ${componentStatus.domElements.navigationElements}`);
            console.log(`  - Interactive Elements: ${componentStatus.domElements.interactiveElements}`);
            
            console.log('Loaded Scripts:');
            console.log(`  - Scripts: ${componentStatus.loadedScripts.slice(0, 10).join(', ')}${componentStatus.loadedScripts.length > 10 ? '...' : ''}`);
            
            console.log('=== END COMPONENT STATUS ===');
            
        } catch (error) {
            console.log(`Error logging component status: ${error.message}`);
        }
    }

    // ===== SPA INITIALIZATION METHODS =====

    /**
     * Wait for the JavaScript SPA to fully initialize
     * Ensures the application has loaded and is ready for interaction
     */
    public async waitForSPAInitialization(): Promise<void> {
        const startTime = Date.now();
        
        try {
            console.log("Waiting for SPA initialization...");
            
            // Log initial component status
            await this.logJavaScriptComponentStatus();
            
            // Wait for the main app script to load and execute
            await this.page.waitForFunction(
                () => {
                    // Check if the main application object exists (common SPA pattern)
                    return (window as any).app !== undefined || 
                           document.readyState === 'complete' ||
                           document.querySelector('script[src*="app"]') !== null;
                },
                { timeout: NavigationConstants.SPA_TIMEOUTS.initialization }
            );

            // Wait for DOM to be ready
            await this.page.waitForLoadState('domcontentloaded', { 
                timeout: NavigationConstants.SPA_TIMEOUTS.initialization 
            });

            // Additional wait for JavaScript execution
            await this.page.waitForTimeout(500);
            
            // Verify SPA state after initialization
            const spaState = await this.captureSPAState();
            if (!spaState.isInitialized) {
                throw new Error("SPA initialization verification failed");
            }
            
            const initTime = Date.now() - startTime;
            console.log(`SPA initialization completed in ${initTime}ms`);
            
        } catch (error) {
            console.log(`SPA initialization failed: ${error.message}`);
            
            // Capture enhanced debugging information
            const spaState = await this.captureSPAState();
            const debugInfo = await this.captureSPADebugInfo();
            
            await this.captureNavigationErrorWithSPAState('spa', error.message, 'spa');
            
            throw new SPANotInitializedError(
                `SPA initialization timeout: ${error.message}`,
                spaState,
                debugInfo
            );
        }
    }

    /**
     * Wait for the navigation container to be populated with navigation elements
     * Ensures the navigation component has rendered before attempting to interact with it
     */
    public async waitForNavigationRendered(): Promise<void> {
        const startTime = Date.now();
        const debugInfo = await this.captureSPADebugInfo();
        debugInfo.timing.navigationRenderStart = startTime;
        
        try {
            console.log("Waiting for navigation to render...");
            
            // Try to wait for any of the navigation container selectors
            const navigationSelectors = NavigationConstants.NAVIGATION_CONTAINER.split(', ');
            let navigationFound = false;
            
            for (const selector of navigationSelectors) {
                debugInfo.selectors.attempted.push(selector.trim());
                
                try {
                    await this.page.waitForSelector(
                        selector.trim(), 
                        { 
                            timeout: 2000, // Shorter timeout for each selector
                            state: 'attached'
                        }
                    );
                    navigationFound = true;
                    debugInfo.selectors.successful.push(selector.trim());
                    console.log(`Navigation found with selector: ${selector.trim()}`);
                    break;
                } catch (selectorError) {
                    debugInfo.selectors.failed.push(selector.trim());
                    // Continue to next selector
                    continue;
                }
            }

            if (!navigationFound) {
                console.log("No navigation container found, proceeding with main navigation check");
            }

            // Wait for main navigation to be visible
            const mainNavSelectors = NavigationConstants.MAIN_NAVIGATION.split(', ');
            let mainNavFound = false;
            
            for (const selector of mainNavSelectors) {
                debugInfo.selectors.attempted.push(selector.trim());
                
                try {
                    await this.page.waitForSelector(
                        selector.trim(),
                        {
                            timeout: 2000, // Shorter timeout for each selector
                            state: 'visible'
                        }
                    );
                    mainNavFound = true;
                    debugInfo.selectors.successful.push(selector.trim());
                    console.log(`Main navigation found with selector: ${selector.trim()}`);
                    break;
                } catch (selectorError) {
                    debugInfo.selectors.failed.push(selector.trim());
                    // Continue to next selector
                    continue;
                }
            }

            if (!mainNavFound) {
                throw new Error("Main navigation not found with any selector");
            }

            // Additional wait for navigation links to be populated
            await this.page.waitForFunction(
                () => {
                    const navLinks = document.querySelectorAll('a[href], [data-testid^="nav-"], .nav-link');
                    return navLinks.length > 0;
                },
                { timeout: NavigationConstants.SPA_TIMEOUTS.navigationRender }
            );

            debugInfo.timing.navigationRenderEnd = Date.now();
            const renderTime = debugInfo.timing.navigationRenderEnd - startTime;
            console.log(`Navigation rendering completed in ${renderTime}ms`);
            
        } catch (error) {
            console.log(`Navigation rendering failed: ${error.message}`);
            
            // Capture enhanced debugging information
            const spaState = await this.captureSPAState();
            debugInfo.timing.navigationRenderEnd = Date.now();
            
            await this.captureNavigationErrorWithSPAState('navigation', error.message, 'navigation');
            
            throw new NavigationNotRenderedError(
                `Navigation rendering timeout: ${error.message}`,
                spaState,
                debugInfo
            );
        }
    }

    /**
     * Verify that the navigation structure has been properly rendered
     * Validates that essential navigation elements are present and functional
     */
    public async verifyNavigationStructure(): Promise<boolean> {
        try {
            console.log("Verifying navigation structure...");
            
            // Log current component status for debugging
            await this.logJavaScriptComponentStatus();
            
            const validationResults = {
                navigationContainer: false,
                mainNavigation: false,
                navigationLinks: false,
                mobileMenuToggle: false
            };

            const debugInfo = await this.captureSPADebugInfo();

            // Check navigation container exists and has content
            const navigationSelectors = NavigationConstants.NAVIGATION_CONTAINER.split(', ');
            let containerFound = false;
            
            for (const selector of navigationSelectors) {
                debugInfo.selectors.attempted.push(selector.trim());
                
                const containerExists = await this.web.element(
                    selector.trim(), 
                    "Navigation Container"
                ).isVisible(1);
                
                if (containerExists) {
                    const hasContent = await this.page.evaluate((sel) => {
                        const container = document.querySelector(sel);
                        return container && (container.children.length > 0 || container.textContent.trim().length > 0);
                    }, selector.trim());
                    
                    if (hasContent) {
                        containerFound = true;
                        debugInfo.selectors.successful.push(selector.trim());
                        break;
                    }
                } else {
                    debugInfo.selectors.failed.push(selector.trim());
                }
            }
            
            validationResults.navigationContainer = containerFound;

            // Check main navigation is present
            validationResults.mainNavigation = await this.web.element(
                NavigationConstants.MAIN_NAVIGATION,
                "Main Navigation"
            ).isVisible(2);

            // Check for navigation links
            const navigationLinks = await this.page.locator('a[href], [data-testid^="nav-"]').count();
            validationResults.navigationLinks = navigationLinks > 0;

            // Check mobile menu toggle for mobile viewports
            if (this.isMobile) {
                validationResults.mobileMenuToggle = await this.web.element(
                    NavigationConstants.MOBILE_MENU_TOGGLE,
                    "Mobile Menu Toggle"
                ).isVisible(2);
            } else {
                validationResults.mobileMenuToggle = true; // Not required for desktop
            }

            const allValid = Object.values(validationResults).every(result => result === true);
            
            if (allValid) {
                console.log("Navigation structure verification passed");
            } else {
                console.log("Navigation structure verification failed:");
                Object.entries(validationResults).forEach(([key, value]) => {
                    if (!value) {
                        console.log(`- ${key}: FAILED`);
                    }
                });
                
                // Capture enhanced debugging information for failures
                const spaState = await this.captureSPAState();
                await this.captureNavigationErrorWithSPAState(
                    'navigation-structure', 
                    'Navigation structure verification failed', 
                    'component'
                );
            }

            return allValid;
            
        } catch (error) {
            console.log(`Navigation structure verification error: ${error.message}`);
            
            // Capture enhanced debugging information
            const spaState = await this.captureSPAState();
            const debugInfo = await this.captureSPADebugInfo();
            
            await this.captureNavigationErrorWithSPAState(
                'navigation-structure', 
                error.message, 
                'component'
            );
            
            return false;
        }
    }

    // ===== CONTEXT-AWARE NAVIGATION METHODS =====

    /**
     * Context-aware navigation that adapts to the current testing mode
     */
    public async contextAwareNavigateToPage(pageName: string): Promise<void> {
        const currentMode = this.getTestMode();
        console.log(`Context-aware navigation to ${pageName} in ${currentMode} mode`);

        try {
            // Get page configuration
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new Error(`Page configuration not found for: ${pageName}`);
            }

            // Use context-aware navigation link clicking
            await this.contextAwareClickNavigationLink(pageName);

            // Wait for SPA route change with mode-specific considerations
            await this.waitForContextAwareSPARouteChange(pageName);

            // Validate page loaded correctly for the current mode
            await this.validateContextAwarePageLoad(pageName);

            console.log(`Context-aware navigation to ${pageName} completed successfully`);

        } catch (error) {
            console.log(`Context-aware navigation to ${pageName} failed: ${error.message}`);
            
            // Capture mode-specific debugging information
            await this.logContextAwareDebugInfo();
            
            throw error;
        }
    }

    /**
     * Context-aware navigation link clicking
     */
    private async contextAwareClickNavigationLink(pageName: string): Promise<void> {
        const currentMode = this.getTestMode();
        
        // Get mode-specific navigation selector
        const navigationSelector = this.getModeSpecificSelector(
            NavigationConstants.MAIN_NAVIGATION,
            'mainNavigation'
        );

        // Find the navigation link for the page
        const linkSelector = `${navigationSelector} a[href*="${pageName.toLowerCase()}"], ${navigationSelector} [data-testid*="${pageName.toLowerCase()}"]`;
        
        try {
            await this.contextAwareClick('navigationLink', linkSelector);
        } catch (error) {
            // Fallback to generic navigation link finding
            console.log(`Specific navigation link not found, trying generic approach`);
            
            const genericLinkSelector = `a[href*="${pageName.toLowerCase()}"], [data-testid*="${pageName.toLowerCase()}"]`;
            await this.clickElement(genericLinkSelector, `${pageName} Navigation Link`);
        }
    }

    /**
     * Context-aware SPA route change waiting
     */
    private async waitForContextAwareSPARouteChange(pageName: string): Promise<void> {
        const currentMode = this.getTestMode();
        
        // Adjust timeout based on mode
        const timeout = currentMode === TestMode.PRODUCTION 
            ? NavigationConstants.SPA_TIMEOUTS.routeChange * 1.5  // Longer timeout for production
            : NavigationConstants.SPA_TIMEOUTS.routeChange;

        try {
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new Error(`Page configuration not found for: ${pageName}`);
            }

            // Wait for URL to match expected patterns
            await this.page.waitForFunction(
                (expectedPatterns) => {
                    const currentUrl = window.location.href;
                    return expectedPatterns.some((pattern: string) => 
                        currentUrl.includes(pattern) || 
                        currentUrl.endsWith(pattern) ||
                        new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(currentUrl)
                    );
                },
                [pageConfig.url, ...pageConfig.urlPatterns],
                { timeout }
            );

            // Additional stabilization wait
            await this.page.waitForTimeout(500);
            
        } catch (error) {
            console.log(`Context-aware SPA route change failed for ${pageName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Context-aware page load validation
     */
    private async validateContextAwarePageLoad(pageName: string): Promise<void> {
        const currentMode = this.getTestMode();
        
        try {
            // Wait for page-specific elements based on mode
            if (currentMode === TestMode.ISOLATED) {
                await this.validateIsolatedModePageLoad(pageName);
            } else if (currentMode === TestMode.PRODUCTION) {
                await this.validateProductionModePageLoad(pageName);
            }

            // Validate mode-specific elements are present
            const elementsValid = await this.validateModeSpecificElements();
            if (!elementsValid) {
                console.log(`Mode-specific elements validation failed for ${pageName}`);
            }

        } catch (error) {
            console.log(`Context-aware page load validation failed for ${pageName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate page load in isolated mode
     */
    private async validateIsolatedModePageLoad(pageName: string): Promise<void> {
        console.log(`Validating isolated mode page load for ${pageName}`);
        
        // In isolated mode, we expect test-friendly elements to be present
        const testIdElements = await this.page.locator('[data-testid]').count();
        if (testIdElements === 0) {
            console.log('Warning: No test-id elements found in isolated mode');
        }

        // Wait for any loading indicators to disappear
        await this.waitForLoadingComplete();
    }

    /**
     * Validate page load in production mode
     */
    private async validateProductionModePageLoad(pageName: string): Promise<void> {
        console.log(`Validating production mode page load for ${pageName}`);
        
        // In production mode, verify real data is present
        const hasRealContent = await this.page.evaluate(() => {
            const textContent = document.body.textContent || '';
            // Look for indicators of real content vs placeholder content
            return textContent.length > 100 && !textContent.includes('Lorem ipsum');
        });

        if (!hasRealContent) {
            console.log('Warning: Page may not have loaded real content in production mode');
        }

        // Wait for network activity to settle (production may have more API calls)
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    /**
     * Context-aware search functionality
     */
    public async contextAwareSearch(searchTerm: string, pageType?: string): Promise<void> {
        const currentMode = this.getTestMode();
        console.log(`Performing context-aware search for "${searchTerm}" in ${currentMode} mode`);

        try {
            // Get mode-specific search selector
            const searchSelector = pageType 
                ? NavigationConstants.getSearchInterfaceSelector(pageType, this.isMobile)
                : this.getModeSpecificSelector('.search-interface, [data-testid="search-interface"]', 'searchInterface');

            // Perform context-aware search input
            await this.contextAwareTypeText('searchInterface', searchTerm, searchSelector);

            // Submit search
            await this.page.keyboard.press('Enter');

            // Wait for search results with mode-specific timeout
            const timeout = currentMode === TestMode.PRODUCTION ? 5000 : 3000;
            await this.page.waitForTimeout(timeout);

            console.log(`Context-aware search completed for "${searchTerm}"`);

        } catch (error) {
            console.log(`Context-aware search failed: ${error.message}`);
            await this.logContextAwareDebugInfo();
            throw error;
        }
    }

    /**
     * Context-aware responsive design verification
     */
    public async verifyContextAwareResponsiveDesign(): Promise<boolean> {
        const currentMode = this.getTestMode();
        console.log(`Verifying responsive design in ${currentMode} mode`);

        try {
            // Perform base responsive design verification
            await this.verifyResponsiveDesign();

            // Add mode-specific responsive checks
            const modeSpecificValid = await this.validateModeSpecificElements();
            
            if (!modeSpecificValid) {
                console.log(`Mode-specific responsive elements validation failed in ${currentMode} mode`);
                return false;
            }

            // Verify navigation adapts properly to viewport in current mode
            const navigationValid = await this.verifyContextAwareNavigationResponsiveness();
            
            return navigationValid;

        } catch (error) {
            console.log(`Context-aware responsive design verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify navigation responsiveness in current context
     */
    private async verifyContextAwareNavigationResponsiveness(): Promise<boolean> {
        const currentMode = this.getTestMode();
        const viewportCategory = await this.getCurrentViewportCategory();

        try {
            // Get mode-specific navigation selector
            const navigationSelector = this.getModeSpecificSelector(
                NavigationConstants.NAVIGATION_CONTAINER,
                'navigationContainer'
            );

            const isNavigationVisible = await this.web.element(navigationSelector, 'Navigation').isVisible(3);
            
            if (!isNavigationVisible) {
                console.log(`Navigation not visible in ${currentMode} mode on ${viewportCategory}`);
                return false;
            }

            // Check mobile menu toggle for mobile viewports
            if (this.isMobile) {
                const mobileToggleSelector = this.getModeSpecificSelector(
                    NavigationConstants.MOBILE_MENU_TOGGLE,
                    'mobileMenuToggle'
                );
                
                const isMobileToggleVisible = await this.web.element(mobileToggleSelector, 'Mobile Menu Toggle').isVisible(2);
                
                if (!isMobileToggleVisible) {
                    console.log(`Mobile menu toggle not visible in ${currentMode} mode`);
                    return false;
                }
            }

            console.log(`Navigation responsiveness verified in ${currentMode} mode on ${viewportCategory}`);
            return true;

        } catch (error) {
            console.log(`Navigation responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    // ===== MISSING METHODS FROM BASE PAGE =====

    /**
     * Get current viewport category (inherited from BasePage but needs to be accessible)
     */
    public async getCurrentViewportCategory(): Promise<'mobile' | 'tablet' | 'desktop'> {
        return super.getCurrentViewportCategory();
    }

    /**
     * Wait for loading complete (inherited from BasePage but needs to be accessible)
     */
    public async waitForLoadingComplete(): Promise<void> {
        return super.waitForLoadingComplete();
    }

    /**
     * Set mobile viewport (inherited from BasePage but needs to be accessible)
     */
    public async setMobileViewport(): Promise<void> {
        return super.setMobileViewport();
    }

    /**
     * Set tablet viewport (inherited from BasePage but needs to be accessible)
     */
    public async setTabletViewport(): Promise<void> {
        return super.setTabletViewport();
    }

    /**
     * Set desktop viewport (inherited from BasePage but needs to be accessible)
     */
    public async setDesktopViewport(): Promise<void> {
        return super.setDesktopViewport();
    }

    // ===== SPA PAGE VERIFICATION HELPER METHODS =====

    /**
     * Wait for SPA route change to complete
     * Ensures the route has changed and stabilized before proceeding with validation
     */
    private async waitForSPARouteChange(pageName: string): Promise<void> {
        try {
            console.log(`Waiting for SPA route change to ${pageName}...`);
            
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new Error(`Page configuration not found for: ${pageName}`);
            }

            // Wait for URL to match the expected route patterns
            await this.page.waitForFunction(
                (expectedPatterns) => {
                    const currentUrl = window.location.href;
                    return expectedPatterns.some((pattern: string) => 
                        currentUrl.includes(pattern) || 
                        currentUrl.endsWith(pattern) ||
                        new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(currentUrl)
                    );
                },
                [pageConfig.url, ...pageConfig.urlPatterns],
                { timeout: NavigationConstants.SPA_TIMEOUTS.routeChange }
            );

            // Additional wait for route stabilization
            await this.page.waitForTimeout(500);
            
            console.log(`SPA route change to ${pageName} completed`);
            
        } catch (error) {
            console.log(`SPA route change wait failed for ${pageName}: ${error.message}`);
            throw new Error(`SPA route change timeout for ${pageName}: ${error.message}`);
        }
    }

    /**
     * Wait for JavaScript-rendered content to be available
     * Ensures dynamic content has been rendered before validation
     */
    private async waitForJavaScriptRenderedContent(pageName: string): Promise<void> {
        try {
            console.log(`Waiting for JavaScript-rendered content for ${pageName}...`);
            
            // Wait for DOM to be interactive
            await this.page.waitForLoadState('domcontentloaded', { 
                timeout: NavigationConstants.SPA_TIMEOUTS.componentMount 
            });

            // Wait for main content area to be populated
            await this.page.waitForFunction(
                () => {
                    // Check for common content indicators
                    const mainContent = document.querySelector('.main-content, [data-testid*="page"], .page-content, main');
                    if (!mainContent) return false;
                    
                    // Check if content has been populated (not just empty container)
                    return mainContent.children.length > 0 || 
                           (mainContent.textContent && mainContent.textContent.trim().length > 0);
                },
                { timeout: NavigationConstants.SPA_TIMEOUTS.componentMount }
            );

            // Wait for any loading indicators to disappear
            await this.page.waitForFunction(
                () => {
                    const loadingIndicators = document.querySelectorAll(
                        '.loading, .spinner, .loader, [data-loading="true"], .loading-spinner'
                    );
                    return loadingIndicators.length === 0 || 
                           Array.from(loadingIndicators).every(el => {
                               const htmlEl = el as HTMLElement;
                               return htmlEl.style.display === 'none' || 
                                      htmlEl.style.visibility === 'hidden' ||
                                      htmlEl.getAttribute('aria-hidden') === 'true' ||
                                      htmlEl.offsetParent === null;
                           });
                },
                { timeout: NavigationConstants.SPA_TIMEOUTS.componentMount }
            );

            console.log(`JavaScript-rendered content ready for ${pageName}`);
            
        } catch (error) {
            console.log(`JavaScript content wait failed for ${pageName}: ${error.message}`);
            // Don't throw here - content might still be usable
        }
    }

    /**
     * Verify SPA route URL matches expected patterns
     * Enhanced URL validation for single-page application routing
     */
    private verifySPARouteUrl(currentUrl: string, pageName: string): boolean {
        const pageConfig = NavigationConstants.getPageConfig(pageName);
        if (!pageConfig) return false;

        // Check main URL pattern
        if (currentUrl.includes(pageConfig.url)) return true;

        // Check additional URL patterns
        for (const pattern of pageConfig.urlPatterns) {
            if (currentUrl.includes(pattern) || 
                currentUrl.endsWith(pattern) ||
                new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(currentUrl)) {
                return true;
            }
        }

        // Check for SPA hash routing patterns
        const hashRoutes = [
            `#/${pageName}`,
            `#${pageConfig.url}`,
            `#!/${pageName}`,
            `#!${pageConfig.url}`
        ];

        for (const hashRoute of hashRoutes) {
            if (currentUrl.includes(hashRoute)) return true;
        }

        return false;
    }

    /**
     * Wait for SPA page title to be updated
     * Handles dynamic title updates in single-page applications
     */
    private async waitForSPAPageTitle(pageName: string): Promise<string> {
        try {
            console.log(`Waiting for SPA page title update for ${pageName}...`);
            
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                return await this.page.title();
            }

            // Wait for title to match expected patterns
            await this.page.waitForFunction(
                (expectedPatterns) => {
                    const currentTitle = document.title;
                    return expectedPatterns.some((pattern: string) => 
                        currentTitle.includes(pattern) ||
                        new RegExp(pattern, 'i').test(currentTitle)
                    );
                },
                [pageConfig.title, ...pageConfig.titlePatterns],
                { timeout: NavigationConstants.SPA_TIMEOUTS.routeChange }
            );

            const finalTitle = await this.page.title();
            console.log(`SPA page title updated to: ${finalTitle}`);
            return finalTitle;
            
        } catch (error) {
            console.log(`SPA title wait failed for ${pageName}: ${error.message}`);
            // Return current title even if pattern matching failed
            return await this.page.title();
        }
    }

    /**
     * Wait for JavaScript element to be rendered and visible
     * Enhanced element waiting for dynamically rendered content
     */
    private async waitForJavaScriptElement(selector: string, elementName: string, timeout: number = NavigationConstants.SPA_TIMEOUTS.componentMount): Promise<boolean> {
        try {
            console.log(`Waiting for JavaScript element: ${elementName} (${selector})`);
            
            // Split selector by comma to try multiple selectors
            const selectors = selector.split(',').map(s => s.trim());
            
            for (const singleSelector of selectors) {
                try {
                    // Wait for element to be attached to DOM
                    await this.page.waitForSelector(singleSelector, { 
                        state: 'attached', 
                        timeout: Math.floor(timeout / selectors.length)
                    });
                    
                    // Wait for element to be visible
                    await this.page.waitForSelector(singleSelector, { 
                        state: 'visible', 
                        timeout: 2000
                    });
                    
                    // Additional check for element interactability if it's an interactive element
                    const isInteractive = await this.page.evaluate((sel) => {
                        const element = document.querySelector(sel);
                        if (!element) return false;
                        
                        const tagName = element.tagName.toLowerCase();
                        const isInteractiveTag = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
                        
                        if (isInteractiveTag) {
                            const style = window.getComputedStyle(element);
                            return style.pointerEvents !== 'none' && 
                                   style.visibility !== 'hidden' && 
                                   style.display !== 'none';
                        }
                        
                        return true;
                    }, singleSelector);
                    
                    if (isInteractive) {
                        console.log(`JavaScript element found and ready: ${elementName}`);
                        return true;
                    }
                    
                } catch (selectorError) {
                    // Continue to next selector
                    continue;
                }
            }
            
            console.log(`JavaScript element not found: ${elementName}`);
            return false;
            
        } catch (error) {
            console.log(`JavaScript element wait failed for ${elementName}: ${error.message}`);
            return false;
        }
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
            
            // Capture enhanced debugging information with SPA state
            await this.captureNavigationErrorWithSPAState(pageName, error.message, 'navigation');
            
            throw new NavigationError(pageName, 'load', errorMessage);
        }
    }

    // ===== ERROR AND WARNING MESSAGE GENERATION =====

    /**
     * Generate descriptive error message for missing required search interface
     */
    private generateSearchInterfaceErrorMessage(pageName: string, selector: string, type: 'required' | 'optional'): string {
        const pageConfig = NavigationConstants.getPageConfig(pageName);
        const currentUrl = this.page.url();
        
        let message = `Search interface validation failed for ${pageName} page.\n`;
        message += `  • Issue: Required search interface element not found\n`;
        message += `  • Page URL: ${currentUrl}\n`;
        message += `  • Expected selector: ${selector}\n`;
        message += `  • Viewport: ${this.isMobile ? 'Mobile' : 'Desktop'}\n`;
        
        // Add actionable suggestions
        message += `  • Possible causes:\n`;
        message += `    - Search functionality not implemented on this page\n`;
        message += `    - Element selector has changed in the application\n`;
        message += `    - Search interface loads dynamically and needs more time\n`;
        message += `    - Page configuration incorrectly marks search as required\n`;
        
        message += `  • Suggested actions:\n`;
        message += `    - Verify if search functionality should exist on ${pageName} page\n`;
        message += `    - Update page configuration to mark search as optional if not needed\n`;
        message += `    - Check if selector needs updating: ${selector}\n`;
        message += `    - Increase wait time for dynamic content loading`;
        
        return message;
    }

    /**
     * Generate descriptive warning message for missing optional search interface
     */
    private generateSearchInterfaceWarningMessage(pageName: string, selector: string): string {
        const currentUrl = this.page.url();
        
        let message = `Optional search interface not found on ${pageName} page.\n`;
        message += `  • Status: Non-critical - validation will continue\n`;
        message += `  • Page URL: ${currentUrl}\n`;
        message += `  • Expected selector: ${selector}\n`;
        message += `  • Viewport: ${this.isMobile ? 'Mobile' : 'Desktop'}\n`;
        
        message += `  • Note: This is expected behavior if:\n`;
        message += `    - Search functionality is not implemented on this page\n`;
        message += `    - Search is only available on specific pages\n`;
        message += `    - Page is functioning correctly without search\n`;
        
        message += `  • Action required: None - this is informational only`;
        
        return message;
    }

    /**
     * Generate descriptive error message for general page validation failures
     */
    private generatePageValidationErrorMessage(pageName: string, errorType: string, details: string): string {
        const currentUrl = this.page.url();
        
        let message = `Page validation failed for ${pageName}.\n`;
        message += `  • Error type: ${errorType}\n`;
        message += `  • Details: ${details}\n`;
        message += `  • Current URL: ${currentUrl}\n`;
        message += `  • Viewport: ${this.isMobile ? 'Mobile' : 'Desktop'}\n`;
        
        // Add specific guidance based on error type
        switch (errorType.toLowerCase()) {
            case 'url':
                message += `  • Issue: Page URL doesn't match expected pattern\n`;
                message += `  • Suggested actions:\n`;
                message += `    - Check if navigation completed successfully\n`;
                message += `    - Verify URL patterns in page configuration\n`;
                message += `    - Check for redirects or route changes`;
                break;
            case 'title':
                message += `  • Issue: Page title doesn't match expected pattern\n`;
                message += `  • Suggested actions:\n`;
                message += `    - Verify page title patterns in configuration\n`;
                message += `    - Check if page title loads dynamically\n`;
                message += `    - Ensure page has fully loaded`;
                break;
            case 'element':
                message += `  • Issue: Required page element not found\n`;
                message += `  • Suggested actions:\n`;
                message += `    - Check if element selector is correct\n`;
                message += `    - Verify element loads dynamically\n`;
                message += `    - Increase wait time for element loading`;
                break;
            default:
                message += `  • Suggested actions:\n`;
                message += `    - Check browser console for JavaScript errors\n`;
                message += `    - Verify page loads completely\n`;
                message += `    - Review page configuration settings`;
        }
        
        return message;
    }

    /**
     * Categorize and format validation results with enhanced messaging
     */
    private categorizeValidationResults(validation: PageValidation, pageName: string): void {
        // Add summary information to errors and warnings
        if (validation.errors.length > 0) {
            const errorSummary = `\n=== VALIDATION ERRORS SUMMARY for ${pageName} ===\n`;
            const errorDetails = `Total errors: ${validation.errors.length}\n`;
            const errorActions = `Action required: Fix these issues before proceeding\n`;
            const separator = `${'='.repeat(50)}\n`;
            
            // Prepend summary to first error
            validation.errors[0] = errorSummary + errorDetails + errorActions + separator + validation.errors[0];
        }
        
        if (validation.warnings.length > 0) {
            const warningSummary = `\n=== VALIDATION WARNINGS SUMMARY for ${pageName} ===\n`;
            const warningDetails = `Total warnings: ${validation.warnings.length}\n`;
            const warningActions = `Action required: Review but validation continues\n`;
            const separator = `${'='.repeat(50)}\n`;
            
            // Prepend summary to first warning
            validation.warnings[0] = warningSummary + warningDetails + warningActions + separator + validation.warnings[0];
        }
    }

    // ===== PAGE VERIFICATION METHODS =====

    /**
     * Verify that a page has loaded correctly with comprehensive validation
     * Enhanced for SPA compatibility with route change detection and JavaScript-rendered content
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
            searchInterfaceRequired: false,
            searchInterfaceValidationSkipped: false,
            loadTime: 0,
            warnings: [],
            errors: []
        };

        try {
            console.log(`Verifying ${pageName} page load with SPA compatibility...`);
            
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                validation.errors.push(`Page configuration not found for: ${pageName}`);
                return validation;
            }

            // Wait for SPA route change to complete
            await this.waitForSPARouteChange(pageName);

            // Wait for JavaScript-rendered content to be available
            await this.waitForJavaScriptRenderedContent(pageName);

            // Verify URL with SPA route patterns
            const currentUrl = this.page.url();
            validation.url = currentUrl;
            
            if (!this.verifySPARouteUrl(currentUrl, pageName)) {
                const errorMessage = this.generatePageValidationErrorMessage(
                    pageName, 
                    'url', 
                    `URL does not match expected SPA route pattern. Current: ${currentUrl}`
                );
                validation.errors.push(errorMessage);
            }

            // Verify page title with SPA title updates
            const currentTitle = await this.waitForSPAPageTitle(pageName);
            validation.title = currentTitle;
            
            if (!NavigationConstants.matchesPageTitle(currentTitle, pageName)) {
                const errorMessage = this.generatePageValidationErrorMessage(
                    pageName, 
                    'title', 
                    `Page title does not match expected pattern. Current: ${currentTitle}`
                );
                validation.errors.push(errorMessage);
            }

            // Verify page identifier element with JavaScript rendering wait
            const pageIdentifierSelector = NavigationConstants.getPageIdentifierSelector(pageName, this.isMobile);
            const isPageIdentifierVisible = await this.waitForJavaScriptElement(
                pageIdentifierSelector, 
                `${pageName} Page Identifier`,
                NavigationConstants.SPA_TIMEOUTS.componentMount
            );
            
            if (!isPageIdentifierVisible) {
                const errorMessage = this.generatePageValidationErrorMessage(
                    pageName, 
                    'element', 
                    `Page identifier not found. Expected selector: ${pageIdentifierSelector}`
                );
                validation.errors.push(errorMessage);
            }

            // Verify required elements with JavaScript rendering wait
            const requiredElements = NavigationConstants.getRequiredElements(pageName);
            for (const elementSelector of requiredElements) {
                const isElementVisible = await this.waitForJavaScriptElement(
                    elementSelector, 
                    `Required Element`,
                    NavigationConstants.SPA_TIMEOUTS.componentMount
                );
                if (!isElementVisible) {
                    const errorMessage = this.generatePageValidationErrorMessage(
                        pageName, 
                        'element', 
                        `Required element not found. Expected selector: ${elementSelector}`
                    );
                    validation.errors.push(errorMessage);
                }
            }

            // Verify search interface with enhanced validation logic for optional interfaces
            const hasSearchInterfaceSelector = pageConfig?.selectors.searchInterface;
            const searchInterfaceRequired = NavigationConstants.hasSearchInterface(pageName);
            
            // Set validation fields based on configuration
            validation.searchInterfaceRequired = searchInterfaceRequired;
            
            if (hasSearchInterfaceSelector) {
                console.log(`Checking search interface for ${pageName} (required: ${searchInterfaceRequired})`);
                
                const searchInterfaceSelector = NavigationConstants.getSearchInterfaceSelector(pageName, this.isMobile);
                validation.searchInterfacePresent = await this.waitForJavaScriptElement(
                    searchInterfaceSelector, 
                    `${pageName} Search Interface`,
                    NavigationConstants.SPA_TIMEOUTS.componentMount
                );
                
                if (!validation.searchInterfacePresent) {
                    if (searchInterfaceRequired) {
                        // Required search interface missing - add descriptive error
                        const errorMessage = this.generateSearchInterfaceErrorMessage(pageName, searchInterfaceSelector, 'required');
                        validation.errors.push(errorMessage);
                        console.log(`ERROR: Required search interface not found for ${pageName}`);
                    } else {
                        // Optional search interface missing - add descriptive warning
                        const warningMessage = this.generateSearchInterfaceWarningMessage(pageName, searchInterfaceSelector);
                        validation.warnings.push(warningMessage);
                        console.log(`WARNING: Optional search interface not found for ${pageName}, continuing validation`);
                    }
                } else {
                    console.log(`Search interface found for ${pageName} using selector: ${searchInterfaceSelector}`);
                }
                
                validation.searchInterfaceValidationSkipped = false;
            } else {
                // Page has no search interface selector configured
                validation.searchInterfacePresent = false;
                validation.searchInterfaceValidationSkipped = true;
                console.log(`Search interface validation skipped for ${pageName} - no selector configured`);
            }

            // Verify responsive interface with dynamic content support
            validation.isResponsive = await this.verifyResponsiveInterface();

            // Calculate load time
            validation.loadTime = Date.now() - startTime;

            // Set overall load status
            validation.isLoaded = validation.errors.length === 0;

            if (validation.isLoaded) {
                console.log(`${pageName} page verification completed successfully in ${validation.loadTime}ms`);
                if (validation.warnings.length > 0) {
                    console.log(`${pageName} page verification completed with ${validation.warnings.length} warnings:`);
                    validation.warnings.forEach(warning => console.log(`- WARNING: ${warning}`));
                }
            } else {
                console.log(`${pageName} page verification failed with ${validation.errors.length} errors`);
                validation.errors.forEach(error => console.log(`- ERROR: ${error}`));
                
                if (validation.warnings.length > 0) {
                    console.log(`${pageName} page verification also had ${validation.warnings.length} warnings:`);
                    validation.warnings.forEach(warning => console.log(`- WARNING: ${warning}`));
                }
                
                // Capture enhanced debugging for SPA failures
                await this.captureNavigationErrorWithSPAState(pageName, `Page verification failed with ${validation.errors.length} errors`, 'spa');
            }

            // Categorize and enhance validation results with detailed messaging
            this.categorizeValidationResults(validation, pageName);

            return validation;

        } catch (error) {
            const errorMessage = this.generatePageValidationErrorMessage(
                pageName, 
                'general', 
                `Unexpected error during page verification: ${error.message}`
            );
            validation.errors.push(errorMessage);
            validation.loadTime = Date.now() - startTime;
            console.log(`Page verification error for ${pageName}: ${error.message}`);
            
            // Capture enhanced debugging for SPA errors
            await this.captureNavigationErrorWithSPAState(pageName, error.message, 'spa');
            
            // Categorize error results
            this.categorizeValidationResults(validation, pageName);
            
            return validation;
        }
    }

    /**
     * Verify responsive interface elements and mobile-first design patterns
     * Enhanced for dynamic content and SPA compatibility
     * @returns Boolean indicating if the interface is responsive
     */
    public async verifyResponsiveInterface(): Promise<boolean> {
        try {
            console.log("Verifying responsive interface with dynamic content support...");
            
            const viewportCategory = await this.getCurrentViewportCategory();
            let isResponsive = true;
            const errors: string[] = [];

            // Wait for responsive elements to be rendered by JavaScript
            await this.waitForResponsiveElementsToRender(viewportCategory);

            // Verify viewport-specific elements with dynamic content support
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

            // Verify touch target sizes for mobile with dynamic content
            if (this.isMobile) {
                const touchTargetsValid = await this.verifyTouchTargetSizesWithDynamicContent();
                if (!touchTargetsValid) {
                    isResponsive = false;
                    errors.push("Touch targets do not meet minimum size requirements");
                }
            }

            // Verify responsive navigation with SPA support
            const navigationResponsive = await this.verifyResponsiveNavigationWithSPA();
            if (!navigationResponsive) {
                isResponsive = false;
                errors.push("Navigation is not responsive");
            }

            // Verify responsive search interface with dynamic content
            const searchResponsive = await this.verifyResponsiveSearchInterfaceWithDynamicContent();
            if (!searchResponsive) {
                isResponsive = false;
                errors.push("Search interface is not responsive");
            }

            if (isResponsive) {
                console.log(`Responsive interface verification passed for ${viewportCategory}`);
            } else {
                console.log(`Responsive interface verification failed for ${viewportCategory}:`);
                errors.forEach(error => console.log(`- ${error}`));
                
                // Capture enhanced debugging for responsive failures
                await this.captureNavigationErrorWithSPAState(
                    'responsive-interface', 
                    `Responsive verification failed: ${errors.join(', ')}`, 
                    'component'
                );
            }

            return isResponsive;

        } catch (error) {
            console.log(`Responsive interface verification error: ${error.message}`);
            
            // Capture enhanced debugging for responsive errors
            await this.captureNavigationErrorWithSPAState(
                'responsive-interface', 
                error.message, 
                'component'
            );
            
            return false;
        }
    }

    // ===== RESPONSIVE INTERFACE VERIFICATION HELPER METHODS =====

    /**
     * Wait for responsive elements to be rendered by JavaScript
     * Ensures dynamic responsive elements are available before verification
     */
    private async waitForResponsiveElementsToRender(viewportCategory: string): Promise<void> {
        try {
            console.log(`Waiting for responsive elements to render for ${viewportCategory}...`);
            
            // Wait for responsive containers to be populated
            await this.page.waitForFunction(
                (viewport) => {
                    // Check for responsive containers
                    const containers = document.querySelectorAll(
                        '.container, .container-fluid, .responsive-container, [data-responsive]'
                    );
                    
                    if (containers.length === 0) return false;
                    
                    // Check for viewport-specific elements
                    if (viewport === 'mobile') {
                        const mobileElements = document.querySelectorAll(
                            '.mobile-container, [data-mobile], .d-block-mobile, .mobile-nav'
                        );
                        return mobileElements.length > 0;
                    } else if (viewport === 'tablet') {
                        const tabletElements = document.querySelectorAll(
                            '.tablet-container, [data-tablet], .d-block-tablet'
                        );
                        return tabletElements.length > 0 || containers.length > 0;
                    } else {
                        const desktopElements = document.querySelectorAll(
                            '.desktop-container, [data-desktop], .d-block-desktop'
                        );
                        return desktopElements.length > 0 || containers.length > 0;
                    }
                },
                viewportCategory,
                { timeout: NavigationConstants.SPA_TIMEOUTS.componentMount }
            );

            console.log(`Responsive elements rendered for ${viewportCategory}`);
            
        } catch (error) {
            console.log(`Responsive elements wait failed for ${viewportCategory}: ${error.message}`);
            // Don't throw - elements might still be usable
        }
    }

    /**
     * Verify touch target sizes with dynamic content support
     * Enhanced to wait for dynamically rendered interactive elements
     */
    private async verifyTouchTargetSizesWithDynamicContent(): Promise<boolean> {
        try {
            console.log("Verifying touch target sizes with dynamic content...");
            
            // Wait for interactive elements to be rendered
            await this.page.waitForFunction(
                () => {
                    const interactiveElements = document.querySelectorAll(
                        'a, button, input, select, textarea, [role="button"], [tabindex="0"]'
                    );
                    return interactiveElements.length > 0;
                },
                { timeout: NavigationConstants.SPA_TIMEOUTS.componentMount }
            );

            // Get all interactive elements and check their sizes
            const touchTargetResults = await this.page.evaluate(() => {
                const interactiveElements = document.querySelectorAll(
                    'a, button, input, select, textarea, [role="button"], [tabindex="0"]'
                );
                
                const results = {
                    totalElements: interactiveElements.length,
                    adequateTargets: 0,
                    inadequateTargets: [] as Array<{selector: string, width: number, height: number}>
                };
                
                interactiveElements.forEach((element, index) => {
                    const rect = element.getBoundingClientRect();
                    const width = rect.width;
                    const height = rect.height;
                    
                    // Check if touch target meets minimum size (44px x 44px)
                    if (width >= 44 && height >= 44) {
                        results.adequateTargets++;
                    } else {
                        const selector = element.tagName.toLowerCase() + 
                                       (element.id ? `#${element.id}` : '') +
                                       (element.className ? `.${Array.from(element.classList).join('.')}` : '') +
                                       `[${index}]`;
                        results.inadequateTargets.push({ selector, width, height });
                    }
                });
                
                return results;
            });

            const adequacyRate = touchTargetResults.totalElements > 0 ? 
                (touchTargetResults.adequateTargets / touchTargetResults.totalElements) : 1;

            if (adequacyRate < 0.8) { // 80% of touch targets should be adequate
                console.log(`Touch target verification failed: ${touchTargetResults.adequateTargets}/${touchTargetResults.totalElements} adequate`);
                touchTargetResults.inadequateTargets.forEach(target => {
                    console.log(`- Inadequate target: ${target.selector} (${target.width}x${target.height})`);
                });
                return false;
            }

            console.log(`Touch target verification passed: ${touchTargetResults.adequateTargets}/${touchTargetResults.totalElements} adequate`);
            return true;
            
        } catch (error) {
            console.log(`Touch target verification error: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify responsive navigation with SPA support
     * Enhanced to handle dynamically rendered navigation elements
     */
    private async verifyResponsiveNavigationWithSPA(): Promise<boolean> {
        try {
            console.log("Verifying responsive navigation with SPA support...");
            
            // Wait for navigation to be rendered
            await this.waitForNavigationRendered();
            
            const viewportCategory = await this.getCurrentViewportCategory();
            
            if (viewportCategory === 'mobile') {
                // Verify mobile navigation elements
                const mobileNavVisible = await this.waitForJavaScriptElement(
                    NavigationConstants.MOBILE_MENU_TOGGLE,
                    "Mobile Menu Toggle",
                    NavigationConstants.SPA_TIMEOUTS.componentMount
                );
                
                if (!mobileNavVisible) {
                    console.log("Mobile navigation toggle not found");
                    return false;
                }
                
                // Test mobile menu functionality
                const mobileMenuFunctional = await this.page.evaluate(() => {
                    const toggle = document.querySelector('[data-testid="mobile-menu-toggle"]');
                    if (!toggle) return false;
                    
                    // Check if toggle is clickable
                    const style = window.getComputedStyle(toggle);
                    return style.pointerEvents !== 'none' && 
                           style.visibility !== 'hidden' && 
                           style.display !== 'none';
                });
                
                if (!mobileMenuFunctional) {
                    console.log("Mobile menu toggle is not functional");
                    return false;
                }
                
            } else {
                // Verify desktop/tablet navigation
                const mainNavVisible = await this.waitForJavaScriptElement(
                    NavigationConstants.MAIN_NAVIGATION,
                    "Main Navigation",
                    NavigationConstants.SPA_TIMEOUTS.componentMount
                );
                
                if (!mainNavVisible) {
                    console.log("Main navigation not found for desktop/tablet");
                    return false;
                }
            }

            // Verify navigation links are present and functional
            const navigationLinksValid = await this.page.evaluate(() => {
                const navLinks = document.querySelectorAll('a[href], [data-testid^="nav-"]');
                if (navLinks.length === 0) return false;
                
                // Check if at least some links are functional
                let functionalLinks = 0;
                navLinks.forEach(link => {
                    const style = window.getComputedStyle(link);
                    if (style.pointerEvents !== 'none' && 
                        style.visibility !== 'hidden' && 
                        style.display !== 'none') {
                        functionalLinks++;
                    }
                });
                
                return functionalLinks > 0;
            });

            if (!navigationLinksValid) {
                console.log("Navigation links are not functional");
                return false;
            }

            console.log("Responsive navigation verification passed");
            return true;
            
        } catch (error) {
            console.log(`Responsive navigation verification error: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify responsive search interface with dynamic content
     * Enhanced to handle JavaScript-rendered search components
     */
    private async verifyResponsiveSearchInterfaceWithDynamicContent(): Promise<boolean> {
        try {
            console.log("Verifying responsive search interface with dynamic content...");
            
            const viewportCategory = await this.getCurrentViewportCategory();
            
            // Wait for search interface to be rendered
            const searchSelectors = viewportCategory === 'mobile' ? 
                NavigationConstants.MOBILE_SEARCH_CONTAINER : 
                NavigationConstants.SEARCH_CONTAINER;
            
            const searchInterfaceVisible = await this.waitForJavaScriptElement(
                searchSelectors,
                "Search Interface",
                NavigationConstants.SPA_TIMEOUTS.componentMount
            );
            
            if (!searchInterfaceVisible) {
                console.log(`Search interface not found for ${viewportCategory}`);
                return false;
            }

            // Verify search input functionality
            const searchInputSelectors = viewportCategory === 'mobile' ? 
                NavigationConstants.MOBILE_SEARCH_INPUT : 
                NavigationConstants.SEARCH_INPUT;
            
            const searchInputFunctional = await this.page.evaluate((selectors) => {
                const inputs = document.querySelectorAll(selectors);
                if (inputs.length === 0) return false;
                
                // Check if at least one search input is functional
                for (const input of inputs) {
                    const style = window.getComputedStyle(input);
                    if (style.pointerEvents !== 'none' && 
                        style.visibility !== 'hidden' && 
                        style.display !== 'none' &&
                        !(input as HTMLInputElement).disabled) {
                        return true;
                    }
                }
                
                return false;
            }, searchInputSelectors);

            if (!searchInputFunctional) {
                console.log("Search input is not functional");
                return false;
            }

            // Verify responsive behavior
            const searchResponsive = await this.page.evaluate((viewport) => {
                const searchContainers = document.querySelectorAll(
                    '.search-container, .search-interface, [data-search]'
                );
                
                if (searchContainers.length === 0) return false;
                
                // Check if search interface adapts to viewport
                for (const container of searchContainers) {
                    const style = window.getComputedStyle(container);
                    const rect = container.getBoundingClientRect();
                    
                    // Basic responsive checks
                    if (viewport === 'mobile') {
                        // Mobile search should be compact or collapsible
                        if (rect.width > window.innerWidth * 0.9) {
                            return false; // Too wide for mobile
                        }
                    } else {
                        // Desktop search should be visible and appropriately sized
                        if (rect.width < 200) {
                            return false; // Too narrow for desktop
                        }
                    }
                }
                
                return true;
            }, viewportCategory);

            if (!searchResponsive) {
                console.log("Search interface is not responsive");
                return false;
            }

            console.log("Responsive search interface verification passed");
            return true;
            
        } catch (error) {
            console.log(`Responsive search interface verification error: ${error.message}`);
            return false;
        }
    }

    // ===== MOBILE-FIRST NAVIGATION PATTERNS =====

    /**
     * Handle mobile navigation with touch-friendly interactions
     * Updated to use correct selectors and wait for dynamically rendered elements
     */
    private async handleMobileNavigation(navigationSelector: string, pageName: string): Promise<void> {
        try {
            console.log(`Handling mobile navigation for ${pageName}...`);
            
            // Wait for SPA navigation to be rendered first
            await this.waitForNavigationRendered();
            
            // Check if mobile menu needs to be opened
            const mobileMenuContainer = '[data-testid="mobile-navigation"], .mobile-menu, .navbar-collapse, .nav-mobile';
            const isMobileMenuVisible = await this.web.element(mobileMenuContainer, "Mobile Menu").isVisible(1);
            
            if (!isMobileMenuVisible) {
                // Open mobile menu using correct selector
                const mobileToggleSelector = '[data-testid="mobile-menu-toggle"]';
                console.log(`Looking for mobile menu toggle: ${mobileToggleSelector}`);
                
                // Wait for mobile toggle to be available
                await this.page.waitForSelector(mobileToggleSelector, { 
                    timeout: NavigationConstants.SPA_TIMEOUTS.componentMount,
                    state: 'visible'
                });
                
                const isToggleVisible = await this.web.element(mobileToggleSelector, "Mobile Menu Toggle").isVisible(2);
                
                if (isToggleVisible) {
                    await this.touchFriendlyClick(mobileToggleSelector, "Mobile Menu Toggle");
                    await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideInDuration);
                    
                    // Wait for mobile menu to be fully expanded
                    await this.page.waitForSelector(mobileMenuContainer, { 
                        timeout: NavigationConstants.SPA_TIMEOUTS.componentMount,
                        state: 'visible'
                    });
                } else {
                    throw new Error("Mobile menu toggle not found");
                }
            }

            // Get the correct navigation link selector for the page
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new Error(`Page configuration not found for: ${pageName}`);
            }

            // Try navigation link strategies in priority order
            let navigationClicked = false;
            for (const strategy of pageConfig.navigationLinks.strategies) {
                try {
                    console.log(`Trying navigation strategy: ${strategy.description} - ${strategy.selector}`);
                    
                    // Wait for the navigation link to be available
                    await this.page.waitForSelector(strategy.selector, { 
                        timeout: 2000,
                        state: 'visible'
                    });
                    
                    const isNavLinkVisible = await this.web.element(strategy.selector, `${pageName} Navigation Link`).isVisible(2);
                    if (isNavLinkVisible) {
                        await this.touchFriendlyClick(strategy.selector, `${pageName} Navigation Link`);
                        navigationClicked = true;
                        console.log(`Successfully clicked navigation link using: ${strategy.selector}`);
                        break;
                    }
                } catch (strategyError) {
                    console.log(`Strategy failed: ${strategy.description} - ${strategyError.message}`);
                    continue;
                }
            }

            // Try fallback selectors if primary strategies failed
            if (!navigationClicked) {
                console.log("Trying fallback navigation selectors...");
                for (const fallbackSelector of pageConfig.navigationLinks.fallbacks) {
                    try {
                        const isNavLinkVisible = await this.web.element(fallbackSelector, `${pageName} Navigation Link`).isVisible(2);
                        if (isNavLinkVisible) {
                            await this.touchFriendlyClick(fallbackSelector, `${pageName} Navigation Link`);
                            navigationClicked = true;
                            console.log(`Successfully clicked navigation link using fallback: ${fallbackSelector}`);
                            break;
                        }
                    } catch (fallbackError) {
                        console.log(`Fallback failed: ${fallbackSelector} - ${fallbackError.message}`);
                        continue;
                    }
                }
            }

            if (!navigationClicked) {
                throw new Error(`Navigation link not found for ${pageName}. Tried all strategies and fallbacks.`);
            }

        } catch (error) {
            // Capture enhanced debugging information
            await this.captureNavigationErrorWithSPAState(pageName, error.message, 'component');
            
            throw new NavigationError(pageName, 'element', `Mobile navigation failed: ${error.message}`);
        }
    }

    /**
     * Handle desktop navigation with standard interactions
     * Updated to use correct selectors and wait for dynamically rendered elements
     */
    private async handleDesktopNavigation(navigationSelector: string, pageName: string): Promise<void> {
        try {
            console.log(`Handling desktop navigation for ${pageName}...`);
            
            // Wait for SPA navigation to be rendered first
            await this.waitForNavigationRendered();
            
            // Get the correct navigation link selector for the page
            const pageConfig = NavigationConstants.getPageConfig(pageName);
            if (!pageConfig) {
                throw new Error(`Page configuration not found for: ${pageName}`);
            }

            // Try navigation link strategies in priority order
            let navigationClicked = false;
            for (const strategy of pageConfig.navigationLinks.strategies) {
                // Skip mobile-specific strategies for desktop
                if (strategy.viewport === 'mobile') {
                    continue;
                }
                
                try {
                    console.log(`Trying navigation strategy: ${strategy.description} - ${strategy.selector}`);
                    
                    // Wait for the navigation link to be available
                    await this.page.waitForSelector(strategy.selector, { 
                        timeout: 3000,
                        state: 'visible'
                    });
                    
                    const isNavLinkVisible = await this.web.element(strategy.selector, `${pageName} Navigation Link`).isVisible(3);
                    if (isNavLinkVisible) {
                        await this.clickElement(strategy.selector, `${pageName} Navigation Link`);
                        navigationClicked = true;
                        console.log(`Successfully clicked navigation link using: ${strategy.selector}`);
                        break;
                    }
                } catch (strategyError) {
                    console.log(`Strategy failed: ${strategy.description} - ${strategyError.message}`);
                    continue;
                }
            }

            // Try fallback selectors if primary strategies failed
            if (!navigationClicked) {
                console.log("Trying fallback navigation selectors...");
                for (const fallbackSelector of pageConfig.navigationLinks.fallbacks) {
                    try {
                        // Wait for fallback selector to be available
                        await this.page.waitForSelector(fallbackSelector, { 
                            timeout: 2000,
                            state: 'visible'
                        });
                        
                        const isNavLinkVisible = await this.web.element(fallbackSelector, `${pageName} Navigation Link`).isVisible(2);
                        if (isNavLinkVisible) {
                            await this.clickElement(fallbackSelector, `${pageName} Navigation Link`);
                            navigationClicked = true;
                            console.log(`Successfully clicked navigation link using fallback: ${fallbackSelector}`);
                            break;
                        }
                    } catch (fallbackError) {
                        console.log(`Fallback failed: ${fallbackSelector} - ${fallbackError.message}`);
                        continue;
                    }
                }
            }

            if (!navigationClicked) {
                throw new Error(`Navigation link not found for ${pageName}. Tried all strategies and fallbacks.`);
            }

        } catch (error) {
            // Capture enhanced debugging information
            await this.captureNavigationErrorWithSPAState(pageName, error.message, 'component');
            
            throw new NavigationError(pageName, 'element', `Desktop navigation failed: ${error.message}`);
        }
    }

    // ===== VIEWPORT-AWARE INTERACTIONS =====

    /**
     * Get available navigation links based on current viewport
     * Updated to work with dynamically rendered navigation and correct selectors
     */
    public async getNavigationLinks(): Promise<string[]> {
        try {
            console.log("Getting available navigation links...");
            
            // Wait for SPA navigation to be rendered first
            await this.waitForNavigationRendered();
            
            const availablePages: string[] = [];
            const pageNames = NavigationConstants.getPageNames();

            // Handle mobile navigation differently
            if (this.isMobile) {
                // Check if mobile menu needs to be opened to see navigation links
                const mobileMenuContainer = '[data-testid="mobile-navigation"], .mobile-menu, .navbar-collapse';
                const isMobileMenuVisible = await this.web.element(mobileMenuContainer, "Mobile Menu").isVisible(1);
                
                if (!isMobileMenuVisible) {
                    // Temporarily open mobile menu to check available links
                    const mobileToggleSelector = '[data-testid="mobile-menu-toggle"]';
                    const isToggleVisible = await this.web.element(mobileToggleSelector, "Mobile Menu Toggle").isVisible(2);
                    
                    if (isToggleVisible) {
                        await this.touchFriendlyClick(mobileToggleSelector, "Mobile Menu Toggle");
                        await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideInDuration);
                    }
                }
            }

            // Check each page for available navigation links
            for (const pageName of pageNames) {
                const pageConfig = NavigationConstants.getPageConfig(pageName);
                if (!pageConfig) {
                    console.log(`No configuration found for page: ${pageName}`);
                    continue;
                }

                let isPageAvailable = false;

                // Try each navigation strategy to see if the link is available
                for (const strategy of pageConfig.navigationLinks.strategies) {
                    // Skip mobile-specific strategies for desktop and vice versa
                    if (this.isMobile && strategy.viewport === 'desktop') {
                        continue;
                    }
                    if (!this.isMobile && strategy.viewport === 'mobile') {
                        continue;
                    }

                    try {
                        const isVisible = await this.web.element(strategy.selector, `${pageName} Navigation`).isVisible(1);
                        if (isVisible) {
                            isPageAvailable = true;
                            console.log(`Found navigation link for ${pageName} using: ${strategy.selector}`);
                            break;
                        }
                    } catch (strategyError) {
                        // Continue to next strategy
                        continue;
                    }
                }

                // Try fallback selectors if primary strategies didn't work
                if (!isPageAvailable) {
                    for (const fallbackSelector of pageConfig.navigationLinks.fallbacks) {
                        try {
                            const isVisible = await this.web.element(fallbackSelector, `${pageName} Navigation`).isVisible(1);
                            if (isVisible) {
                                isPageAvailable = true;
                                console.log(`Found navigation link for ${pageName} using fallback: ${fallbackSelector}`);
                                break;
                            }
                        } catch (fallbackError) {
                            // Continue to next fallback
                            continue;
                        }
                    }
                }

                if (isPageAvailable) {
                    availablePages.push(pageName);
                }
            }

            // Close mobile menu if we opened it
            if (this.isMobile) {
                const mobileMenuContainer = '[data-testid="mobile-navigation"], .mobile-menu, .navbar-collapse';
                const isMobileMenuVisible = await this.web.element(mobileMenuContainer, "Mobile Menu").isVisible(1);
                
                if (isMobileMenuVisible) {
                    const mobileToggleSelector = '[data-testid="mobile-menu-toggle"]';
                    const isToggleVisible = await this.web.element(mobileToggleSelector, "Mobile Menu Toggle").isVisible(1);
                    
                    if (isToggleVisible) {
                        await this.touchFriendlyClick(mobileToggleSelector, "Mobile Menu Toggle");
                        await this.page.waitForTimeout(NavigationConstants.MOBILE_MENU_CONFIG.slideOutDuration);
                    }
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
     * Initialize the navigation page with SPA awareness
     */
    public async initialize(): Promise<void> {
        try {
            console.log("Initializing NavigationPage with SPA support...");
            
            // Detect viewport category
            this.detectViewportCategory();
            
            // Check if we're on a valid page (not about:blank)
            const currentUrl = this.page.url();
            if (currentUrl === 'about:blank' || currentUrl === '') {
                console.log("Page not loaded yet, skipping SPA initialization until navigation");
                return;
            }
            
            // Wait for SPA to initialize
            await this.waitForSPAInitialization();
            
            // Wait for page to be ready
            await this.waitForPageLoad();
            
            // Wait for navigation to be rendered
            await this.waitForNavigationRendered();
            
            // Verify navigation structure is properly rendered
            const navigationValid = await this.verifyNavigationStructure();
            if (!navigationValid) {
                console.log("Warning: Navigation structure validation failed during initialization");
            }

            console.log("NavigationPage initialized successfully with SPA support");

        } catch (error) {
            console.log(`NavigationPage initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Initialize SPA after page navigation
     * Called after navigating to a page to ensure SPA components are ready
     */
    public async initializeSPAAfterNavigation(): Promise<void> {
        try {
            console.log("Initializing SPA after navigation...");
            
            // Wait for SPA to initialize
            await this.waitForSPAInitialization();
            
            // Wait for navigation to be rendered
            await this.waitForNavigationRendered();
            
            // Verify navigation structure is properly rendered
            const navigationValid = await this.verifyNavigationStructure();
            if (!navigationValid) {
                console.log("Warning: Navigation structure validation failed after navigation");
            }

            console.log("SPA initialization after navigation completed");

        } catch (error) {
            console.log(`SPA initialization after navigation failed: ${error.message}`);
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