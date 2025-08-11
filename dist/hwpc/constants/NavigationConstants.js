"use strict";
/**
 * NavigationConstants - Configuration constants for HWPC navigation testing
 * Provides mobile-first navigation configuration and page definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * NavigationConstants class providing configuration for navigation testing
 */
class NavigationConstants {
    /**
     * Get timeout configuration for specific viewport category and operation
     */
    static getTimeout(viewportCategory, operation) {
        const timeouts = this.TIMEOUTS[viewportCategory] || this.TIMEOUTS.mobile;
        return timeouts[operation];
    }
    /**
     * Get viewport configuration by name
     */
    static getViewport(viewportName) {
        return this.VIEWPORTS[viewportName] || this.VIEWPORTS.mobile;
    }
    /**
     * Get all supported page names
     */
    static getPageNames() {
        return Object.keys(this.PAGES);
    }
    /**
     * Get page configuration by name
     */
    static getPageConfig(pageName) {
        return this.PAGES[pageName.toLowerCase()];
    }
    /**
     * Get all viewport categories
     */
    static getViewportCategories() {
        return Object.keys(this.VIEWPORTS);
    }
    /**
     * Get base URL from environment or default
     */
    static getBaseUrl() {
        return process.env.BASE_URL || 'http://localhost:3000';
    }
    /**
     * Get full URL for a page
     */
    static getPageUrl(pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig) {
            throw new Error(`Unknown page: ${pageName}`);
        }
        return this.getBaseUrl() + pageConfig.url;
    }
    /**
     * Get page title for validation
     */
    static getPageTitle(pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig) {
            throw new Error(`Unknown page: ${pageName}`);
        }
        return pageConfig.title;
    }
    /**
     * Get page selectors for element identification
     */
    static getPageSelectors(pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig) {
            throw new Error(`Unknown page: ${pageName}`);
        }
        return pageConfig.selectors;
    }
    /**
     * Check if page has search interface
     */
    static hasSearchInterface(pageName) {
        const pageConfig = this.getPageConfig(pageName);
        return pageConfig?.selectors.searchInterface !== undefined;
    }
    /**
     * Get default mobile viewport
     */
    static getMobileViewport() {
        return this.VIEWPORTS.mobile;
    }
    /**
     * Get default tablet viewport
     */
    static getTabletViewport() {
        return this.VIEWPORTS.tablet;
    }
    /**
     * Get default desktop viewport
     */
    static getDesktopViewport() {
        return this.VIEWPORTS.desktop;
    }
    /**
     * Determine viewport category based on width
     */
    static getViewportCategoryByWidth(width) {
        if (width < 768)
            return 'mobile';
        if (width < 1024)
            return 'tablet';
        return 'desktop';
    }
    /**
     * Get retry configuration for navigation
     */
    static getRetryConfig() {
        return {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2
        };
    }
    /**
     * Get navigation selectors for different viewport categories with fallbacks
     */
    static getNavigationSelectors(viewportCategory) {
        const baseSelectors = {
            mainNav: '.main-nav, .navbar-nav, [data-testid="main-nav"], .navigation, .nav-menu, [data-testid="main-navigation"]',
            mobileMenuToggle: '.navbar-toggle, .mobile-menu-toggle, [data-testid="mobile-nav-toggle"], .hamburger, .menu-toggle, .navbar-toggler, [data-testid="mobile-menu-toggle"]',
            navLinks: 'a[href], .nav-link, [data-nav-link], [data-testid="nav-link"]',
            searchInterface: '.search-interface, .search-container, [data-search], [data-testid="search-interface"]'
        };
        switch (viewportCategory) {
            case 'mobile':
                return {
                    ...baseSelectors,
                    activeNav: '.mobile-nav, .nav-mobile, [data-mobile-nav], [data-testid="mobile-navigation"]',
                    menuButton: '.mobile-menu-button, .menu-btn-mobile, [data-mobile-menu-btn], [data-testid="mobile-menu-button"]'
                };
            case 'tablet':
                return {
                    ...baseSelectors,
                    activeNav: '.tablet-nav, .nav-tablet, [data-tablet-nav], [data-testid="tablet-navigation"]'
                };
            case 'desktop':
                return {
                    ...baseSelectors,
                    activeNav: '.desktop-nav, .nav-desktop, [data-desktop-nav], [data-testid="desktop-navigation"]'
                };
            default:
                return baseSelectors;
        }
    }
    /**
     * Get navigation link selector for a specific page with fallbacks
     */
    static getNavigationLinkSelector(pageName) {
        const fallbackSelectors = [
            `a[href*="${pageName}"]`,
            `a[href*="/${pageName}"]`,
            `.${pageName}-link`,
            `[data-nav="${pageName}"]`,
            `[data-testid="${pageName}-link"]`,
            `[data-testid="nav-link-${pageName}"]`,
            `.nav-${pageName}`,
            `.menu-${pageName}`
        ];
        return fallbackSelectors.join(', ');
    }
    // Legacy method compatibility for NavigationPage.ts
    static getNavigationSelector(pageName, isMobile) {
        const viewportCategory = isMobile ? 'mobile' : 'desktop';
        const selectors = this.getNavigationSelectors(viewportCategory);
        return selectors.mainNav;
    }
    // URL matching methods
    static matchesPageUrl(currentUrl, pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig)
            return false;
        return currentUrl.includes(pageConfig.url);
    }
    static matchesPageTitle(currentTitle, pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig)
            return false;
        return currentTitle.includes(pageConfig.title);
    }
    // Page identifier methods
    static getPageIdentifierSelector(pageName, isMobile) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig)
            return '[data-testid="page-identifier"]';
        return pageConfig.selectors.main;
    }
    static getRequiredElements(pageName) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig)
            return [];
        return [pageConfig.selectors.main, pageConfig.selectors.navigation];
    }
    static getSearchInterfaceSelector(pageName, isMobile) {
        const pageConfig = this.getPageConfig(pageName);
        if (!pageConfig || !pageConfig.selectors.searchInterface) {
            return '[data-testid="search-interface"]';
        }
        return pageConfig.selectors.searchInterface;
    }
    // Touch target validation
    static isTouchTargetAdequate(width, height) {
        const minTouchTarget = 44; // iOS/Android minimum touch target size
        return width >= minTouchTarget && height >= minTouchTarget;
    }
}
// Viewport configurations for responsive testing
NavigationConstants.VIEWPORTS = {
    mobile: { width: 375, height: 667, category: 'mobile' },
    tablet: { width: 768, height: 1024, category: 'tablet' },
    desktop: { width: 1920, height: 1080, category: 'desktop' }
};
// Timeout configurations by viewport category with SPA-specific timeouts
NavigationConstants.TIMEOUTS = {
    mobile: { pageLoad: 20000, elementWait: 15000, networkIdle: 8000 },
    tablet: { pageLoad: 18000, elementWait: 12000, networkIdle: 6000 },
    desktop: { pageLoad: 15000, elementWait: 10000, networkIdle: 5000 }
};
// SPA-specific timeout configurations for JavaScript rendering
NavigationConstants.SPA_TIMEOUTS = {
    initialization: 10000,
    navigationRender: 5000,
    routeChange: 3000,
    componentMount: 4000 // Wait for components to mount
};
// Navigation container selector for SPA initialization waiting
NavigationConstants.NAVIGATION_CONTAINER = '[data-testid="main-navigation"], .main-nav, .navbar-nav, .navigation, .nav-menu';
// Main navigation selector based on actual application structure
NavigationConstants.MAIN_NAVIGATION = '.navigation, .main-nav, .navbar-nav, [data-testid="main-navigation"], .nav-menu';
// Mobile menu toggle selector from actual application
NavigationConstants.MOBILE_MENU_TOGGLE = '[data-testid="mobile-menu-toggle"]';
// Page configurations for navigation testing with multiple selector strategies
NavigationConstants.PAGES = {
    home: {
        name: 'home',
        url: '/',
        urlPatterns: ['/', '/home', '/dashboard', '/index.html', '?page=home'],
        title: 'Dashboard - Static Site API Testing',
        titlePatterns: ['Dashboard - Static Site API Testing', 'Dashboard', 'Home', 'Static Site', 'API Testing'],
        selectors: {
            main: '[data-testid="home-page"], [data-testid="dashboard-page"], .home-page, .dashboard-page, .main-content, body',
            navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu',
            searchInterface: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"], [data-testid="search-interface"], .search-interface'
        },
        navigationLinks: {
            strategies: [
                { selector: '[data-testid="nav-home"]', priority: 1, description: 'Test ID home navigation link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="/"]', priority: 2, description: 'Direct home link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="/home"]', priority: 3, description: 'Home page link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="#/"]', priority: 4, description: 'SPA home route', viewport: 'all', reliability: 'high' },
                { selector: '[data-testid="home-link"]', priority: 5, description: 'Test ID home link', viewport: 'all', reliability: 'high' },
                { selector: '.nav-home', priority: 6, description: 'CSS class home link', viewport: 'all', reliability: 'medium' }
            ],
            fallbacks: ['a:has-text("Home")', 'a:has-text("Dashboard")', '[role="button"]:has-text("Home")']
        },
        pageIdentifiers: [
            { selector: '.home-page', priority: 1, description: 'Home page container', viewport: 'all', reliability: 'high' },
            { selector: '.dashboard-page', priority: 2, description: 'Dashboard page container', viewport: 'all', reliability: 'high' },
            { selector: '[data-testid="home-page"]', priority: 3, description: 'Test ID home page', viewport: 'all', reliability: 'high' },
            { selector: 'h1:has-text("Dashboard")', priority: 4, description: 'Dashboard heading', viewport: 'all', reliability: 'medium' },
            { selector: '.main-content', priority: 5, description: 'Main content area', viewport: 'all', reliability: 'low' }
        ],
        requiredElements: [
            { selector: '[data-testid="home-page"], [data-testid="dashboard-page"], .home-page, .dashboard-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
            { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
            { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
        ]
    },
    customers: {
        name: 'customers',
        url: '/customers',
        urlPatterns: ['/customers', '/customer', '/customers.html', '?page=customers'],
        title: 'Customers - Static Site API Testing',
        titlePatterns: ['Customers - Static Site API Testing', 'Customers', 'Customer Management', 'Static Site', 'API Testing'],
        selectors: {
            main: '[data-testid="customers-page"], .customers-page, .main-content, body',
            navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu',
            searchInterface: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"], [data-testid="customer-search"], .customer-search'
        },
        navigationLinks: {
            strategies: [
                { selector: '[data-testid="nav-customers"]', priority: 1, description: 'Test ID customers navigation link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="/customers"]', priority: 2, description: 'Direct customers link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="#/customers"]', priority: 3, description: 'SPA customers route', viewport: 'all', reliability: 'high' },
                { selector: '[data-testid="customers-link"]', priority: 4, description: 'Test ID customers link', viewport: 'all', reliability: 'high' },
                { selector: '[data-nav="customers"]', priority: 5, description: 'Data nav customers', viewport: 'all', reliability: 'high' },
                { selector: '.nav-customers', priority: 6, description: 'CSS class customers link', viewport: 'all', reliability: 'medium' },
                { selector: 'a[href*="customers"]', priority: 7, description: 'Contains customers in href', viewport: 'all', reliability: 'medium' }
            ],
            fallbacks: ['a:has-text("Customers")', 'a:has-text("Customer")', '[role="button"]:has-text("Customers")']
        },
        pageIdentifiers: [
            { selector: '.customers-page', priority: 1, description: 'Customers page container', viewport: 'all', reliability: 'high' },
            { selector: '[data-testid="customers-page"]', priority: 2, description: 'Test ID customers page', viewport: 'all', reliability: 'high' },
            { selector: 'h1:has-text("Customers")', priority: 3, description: 'Customers heading', viewport: 'all', reliability: 'medium' },
            { selector: '.customer-list', priority: 4, description: 'Customer list container', viewport: 'all', reliability: 'medium' },
            { selector: '.main-content', priority: 5, description: 'Main content area', viewport: 'all', reliability: 'low' }
        ],
        requiredElements: [
            { selector: '[data-testid="customers-page"], .customers-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
            { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
            { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
        ]
    },
    tickets: {
        name: 'tickets',
        url: '/tickets',
        urlPatterns: ['/tickets', '/ticket', '/tickets.html', '?page=tickets'],
        title: 'Tickets - Static Site API Testing',
        titlePatterns: ['Tickets - Static Site API Testing', 'Tickets', 'Ticket Management', 'Static Site', 'API Testing'],
        selectors: {
            main: '[data-testid="tickets-page"], .tickets-page, .main-content, body',
            navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu',
            searchInterface: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"], [data-testid="ticket-search"], .ticket-search'
        },
        navigationLinks: {
            strategies: [
                { selector: '[data-testid="nav-tickets"]', priority: 1, description: 'Test ID tickets navigation link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="/tickets"]', priority: 2, description: 'Direct tickets link', viewport: 'all', reliability: 'high' },
                { selector: 'a[href="#/tickets"]', priority: 3, description: 'SPA tickets route', viewport: 'all', reliability: 'high' },
                { selector: '[data-testid="tickets-link"]', priority: 4, description: 'Test ID tickets link', viewport: 'all', reliability: 'high' },
                { selector: '[data-nav="tickets"]', priority: 5, description: 'Data nav tickets', viewport: 'all', reliability: 'high' },
                { selector: '.nav-tickets', priority: 6, description: 'CSS class tickets link', viewport: 'all', reliability: 'medium' },
                { selector: 'a[href*="tickets"]', priority: 7, description: 'Contains tickets in href', viewport: 'all', reliability: 'medium' }
            ],
            fallbacks: ['a:has-text("Tickets")', 'a:has-text("Ticket")', '[role="button"]:has-text("Tickets")']
        },
        pageIdentifiers: [
            { selector: '.tickets-page', priority: 1, description: 'Tickets page container', viewport: 'all', reliability: 'high' },
            { selector: '[data-testid="tickets-page"]', priority: 2, description: 'Test ID tickets page', viewport: 'all', reliability: 'high' },
            { selector: 'h1:has-text("Tickets")', priority: 3, description: 'Tickets heading', viewport: 'all', reliability: 'medium' },
            { selector: '.ticket-list', priority: 4, description: 'Ticket list container', viewport: 'all', reliability: 'medium' },
            { selector: '.tickets-container', priority: 5, description: 'Tickets container', viewport: 'all', reliability: 'medium' },
            { selector: '.main-content', priority: 6, description: 'Main content area', viewport: 'all', reliability: 'low' }
        ],
        requiredElements: [
            { selector: '[data-testid="tickets-page"], .tickets-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
            { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
            { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
        ]
    },
    routes: {
        name: 'routes',
        url: '/routes',
        urlPatterns: ['/routes', '/route', '/routes.html', '?page=routes'],
        title: 'Routes - Static Site API Testing',
        titlePatterns: ['Routes - Static Site API Testing', 'Routes', 'Route Management', 'Static Site', 'API Testing'],
        selectors: {
            main: '[data-testid="routes-page"], .routes-page, .main-content, body',
            navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu',
            searchInterface: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"], [data-testid="route-search"], .route-search'
        },
        navigationLinks: {
            strategies: [
                { selector: 'a[href="/routes"]', priority: 1, description: 'Direct routes link', viewport: 'all', reliability: 'high' },
                { selector: '[data-testid="routes-link"]', priority: 2, description: 'Test ID routes link', viewport: 'all', reliability: 'high' },
                { selector: '[data-nav="routes"]', priority: 3, description: 'Data nav routes', viewport: 'all', reliability: 'high' },
                { selector: '.nav-routes', priority: 4, description: 'CSS class routes link', viewport: 'all', reliability: 'medium' },
                { selector: 'a[href*="routes"]', priority: 5, description: 'Contains routes in href', viewport: 'all', reliability: 'medium' },
                { selector: '.routes-link', priority: 6, description: 'Generic routes link class', viewport: 'all', reliability: 'medium' },
                { selector: '.mobile-nav a[href*="routes"]', priority: 7, description: 'Mobile nav routes link', viewport: 'mobile', reliability: 'medium' }
            ],
            fallbacks: ['a:has-text("Routes")', 'a:has-text("Route")', '[role="button"]:has-text("Routes")']
        },
        pageIdentifiers: [
            { selector: '.routes-page', priority: 1, description: 'Routes page container', viewport: 'all', reliability: 'high' },
            { selector: '[data-testid="routes-page"]', priority: 2, description: 'Test ID routes page', viewport: 'all', reliability: 'high' },
            { selector: 'h1:has-text("Routes")', priority: 3, description: 'Routes heading', viewport: 'all', reliability: 'medium' },
            { selector: '.route-list', priority: 4, description: 'Route list container', viewport: 'all', reliability: 'medium' },
            { selector: '.main-content', priority: 5, description: 'Main content area', viewport: 'all', reliability: 'low' }
        ],
        requiredElements: [
            { selector: '[data-testid="routes-page"], .routes-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
            { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
            { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
        ]
    },
    dashboard: {
        name: 'dashboard',
        url: '/dashboard',
        title: 'Static Site - API Testing',
        selectors: {
            main: '.dashboard-page, .main-content, [data-testid="dashboard-page"], body',
            navigation: '.main-nav, .navbar-nav, [data-testid="main-nav"], .navigation, .nav-menu, [data-testid="main-navigation"]'
        },
        urlPatterns: [],
        titlePatterns: [],
        navigationLinks: { strategies: [], fallbacks: [] },
        pageIdentifiers: [],
        requiredElements: []
    },
    reports: {
        name: 'reports',
        url: '/reports',
        title: 'Static Site - API Testing',
        selectors: {
            main: '.reports-page, .main-content, [data-testid="reports-page"], body',
            navigation: '.main-nav, .navbar-nav, [data-testid="main-nav"], .navigation, .nav-menu, [data-testid="main-navigation"]',
            searchInterface: '.report-search, .search-container, [data-search], [data-testid="report-search"]'
        },
        urlPatterns: [],
        titlePatterns: [],
        navigationLinks: { strategies: [], fallbacks: [] },
        pageIdentifiers: [],
        requiredElements: []
    }
};
// Static selector constants with fallbacks for real application compatibility
NavigationConstants.MOBILE_MENU_CONTAINER = '.mobile-menu, .navbar-collapse, .nav-mobile, [data-mobile-menu], [data-testid="mobile-menu-container"]';
// static readonly MOBILE_MENU_TOGGLE = '.navbar-toggle, .mobile-menu-toggle, [data-testid="mobile-nav-toggle"], .hamburger, .menu-toggle, .navbar-toggler, [data-testid="mobile-menu-toggle"]';
NavigationConstants.MOBILE_CONTAINER = '.mobile-container, .container-mobile, [data-mobile], [data-testid="mobile-container"]';
NavigationConstants.MOBILE_HIDDEN = '[data-mobile-hidden="true"], .mobile-hidden, .d-none-mobile';
NavigationConstants.TABLET_CONTAINER = '.tablet-container, .container-tablet, [data-tablet], [data-testid="tablet-container"]';
NavigationConstants.TABLET_VISIBLE = '[data-tablet-visible="true"], .tablet-visible, .d-block-tablet';
NavigationConstants.DESKTOP_CONTAINER = '.desktop-container, .container-desktop, [data-desktop], [data-testid="desktop-container"]';
NavigationConstants.DESKTOP_VISIBLE = '[data-desktop-visible="true"], .desktop-visible, .d-block-desktop';
//static readonly MAIN_NAVIGATION = '.main-nav, .navbar-nav, [data-testid="main-nav"], .navigation, .nav-menu, [data-testid="main-navigation"]';
NavigationConstants.NAVIGATION_MENU = '.nav-menu, .navigation-menu, .navbar-nav, [data-testid="navigation-menu"]';
NavigationConstants.MOBILE_SEARCH_CONTAINER = '.mobile-search, .search-mobile, [data-mobile-search], [data-testid="mobile-search-container"]';
NavigationConstants.SEARCH_CONTAINER = '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]';
NavigationConstants.MOBILE_SEARCH_INPUT = '.mobile-search-input, .search-input-mobile, [data-mobile-search-input], [data-testid="mobile-search-input"]';
NavigationConstants.SEARCH_INPUT = '.search-input, input[type="search"], [data-search-input], [data-testid="search-input"]';
NavigationConstants.RESPONSIVE_CONTAINER = '.container, .container-fluid, .responsive-container, [data-responsive], [data-testid="responsive-container"]';
// Mobile menu configuration
NavigationConstants.MOBILE_MENU_CONFIG = {
    slideInDuration: 300,
    slideOutDuration: 250
};
exports.default = NavigationConstants;
//# sourceMappingURL=NavigationConstants.js.map