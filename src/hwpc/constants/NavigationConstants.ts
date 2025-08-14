/**
 * NavigationConstants - Configuration constants for HWPC navigation testing
 * Provides mobile-first navigation configuration and page definitions
 */

export interface ViewportConfig {
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop';
}

export interface TimeoutConfig {
  pageLoad: number;
  elementWait: number;
  networkIdle: number;
}

export interface SelectorStrategy {
  selector: string;
  priority: number;
  description: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'all';
  reliability: 'high' | 'medium' | 'low';
}

export interface NavigationLinkSelectors {
  strategies: SelectorStrategy[];
  fallbacks: string[];
}

export interface PageValidation {
  isLoaded: boolean;
  url: string;
  title: string;
  loadTime: number;
  searchInterfacePresent: boolean;
  searchInterfaceRequired: boolean;
  searchInterfaceValidationSkipped: boolean;
  isResponsive: boolean;
  warnings: string[];
  errors: string[];
}

export interface PageConfig {
  name: string;
  url: string;
  urlPatterns: string[];
  title: string;
  titlePatterns: string[];
  selectors: {
    main: string;
    navigation: string;
    searchInterface?: string;
  };
  validation?: {
    searchInterfaceRequired?: boolean;
    searchInterfaceOptional?: boolean;
  };
  navigationLinks: NavigationLinkSelectors;
  pageIdentifiers: SelectorStrategy[];
  requiredElements: SelectorStrategy[];
}

/**
 * NavigationConstants class providing configuration for navigation testing
 */
class NavigationConstants {
  
  // Viewport configurations for responsive testing
  private static readonly VIEWPORTS: Record<string, ViewportConfig> = {
    mobile: { width: 375, height: 667, category: 'mobile' },
    tablet: { width: 768, height: 1024, category: 'tablet' },
    desktop: { width: 1920, height: 1080, category: 'desktop' }
  };

  // Timeout configurations by viewport category with SPA-specific timeouts
  private static readonly TIMEOUTS: Record<string, TimeoutConfig> = {
    mobile: { pageLoad: 20000, elementWait: 15000, networkIdle: 8000 },
    tablet: { pageLoad: 18000, elementWait: 12000, networkIdle: 6000 },
    desktop: { pageLoad: 15000, elementWait: 10000, networkIdle: 5000 }
  };

  // SPA-specific timeout configurations for JavaScript rendering
  static readonly SPA_TIMEOUTS = {
    initialization: 10000,  // Wait for app.js to load and initialize
    navigationRender: 5000, // Wait for navigation component to render
    routeChange: 3000,      // Wait for route changes to complete
    componentMount: 4000    // Wait for components to mount
  };

  // Navigation container selector for SPA initialization waiting
  static readonly NAVIGATION_CONTAINER = '[data-testid="main-navigation"], .main-nav, .navbar-nav, .navigation, .nav-menu';
  
  // Main navigation selector based on actual application structure
  static readonly MAIN_NAVIGATION = '.navigation, .main-nav, .navbar-nav, [data-testid="main-navigation"], .nav-menu';
  
  // Mobile menu toggle selector from actual application
  static readonly MOBILE_MENU_TOGGLE = '[data-testid="mobile-menu-toggle"]';

  // Page configurations for navigation testing with multiple selector strategies
  private static readonly PAGES: Record<string, PageConfig> = {
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
      validation: {
        searchInterfaceRequired: false,
        searchInterfaceOptional: true
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
      urlPatterns: ['/dashboard', '/', '/home', '/dashboard.html', '?page=dashboard'],
      title: 'Dashboard - Static Site API Testing',
      titlePatterns: ['Dashboard - Static Site API Testing', 'Dashboard', 'Home', 'Static Site', 'API Testing'],
      selectors: {
        main: '[data-testid="dashboard-page"], .dashboard-page, .main-content, body',
        navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu'
      },
      navigationLinks: {
        strategies: [
          { selector: '[data-testid="nav-dashboard"]', priority: 1, description: 'Test ID dashboard navigation link', viewport: 'all', reliability: 'high' },
          { selector: 'a[href="/dashboard"]', priority: 2, description: 'Direct dashboard link', viewport: 'all', reliability: 'high' },
          { selector: 'a[href="/"]', priority: 3, description: 'Home/dashboard link', viewport: 'all', reliability: 'high' },
          { selector: 'a[href="#/dashboard"]', priority: 4, description: 'SPA dashboard route', viewport: 'all', reliability: 'high' },
          { selector: '[data-testid="dashboard-link"]', priority: 5, description: 'Test ID dashboard link', viewport: 'all', reliability: 'high' },
          { selector: '[data-nav="dashboard"]', priority: 6, description: 'Data nav dashboard', viewport: 'all', reliability: 'high' },
          { selector: '.nav-dashboard', priority: 7, description: 'CSS class dashboard link', viewport: 'all', reliability: 'medium' }
        ],
        fallbacks: ['a:has-text("Dashboard")', 'a:has-text("Home")', '[role="button"]:has-text("Dashboard")']
      },
      pageIdentifiers: [
        { selector: '.dashboard-page', priority: 1, description: 'Dashboard page container', viewport: 'all', reliability: 'high' },
        { selector: '[data-testid="dashboard-page"]', priority: 2, description: 'Test ID dashboard page', viewport: 'all', reliability: 'high' },
        { selector: 'h1:has-text("Dashboard")', priority: 3, description: 'Dashboard heading', viewport: 'all', reliability: 'medium' },
        { selector: '.main-content', priority: 4, description: 'Main content area', viewport: 'all', reliability: 'low' }
      ],
      requiredElements: [
        { selector: '[data-testid="dashboard-page"], .dashboard-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
        { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
        { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
      ]
    },
    reports: {
      name: 'reports',
      url: '/reports',
      urlPatterns: ['/reports', '/report', '/reports.html', '?page=reports'],
      title: 'Reports - Static Site API Testing',
      titlePatterns: ['Reports - Static Site API Testing', 'Reports', 'Report Management', 'Static Site', 'API Testing'],
      selectors: {
        main: '[data-testid="reports-page"], .reports-page, .main-content, body',
        navigation: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu'
      },
      navigationLinks: {
        strategies: [
          { selector: '[data-testid="nav-reports"]', priority: 1, description: 'Test ID reports navigation link', viewport: 'all', reliability: 'high' },
          { selector: 'a[href="/reports"]', priority: 2, description: 'Direct reports link', viewport: 'all', reliability: 'high' },
          { selector: 'a[href="#/reports"]', priority: 3, description: 'SPA reports route', viewport: 'all', reliability: 'high' },
          { selector: '[data-testid="reports-link"]', priority: 4, description: 'Test ID reports link', viewport: 'all', reliability: 'high' },
          { selector: '[data-nav="reports"]', priority: 5, description: 'Data nav reports', viewport: 'all', reliability: 'high' },
          { selector: '.nav-reports', priority: 6, description: 'CSS class reports link', viewport: 'all', reliability: 'medium' },
          { selector: 'a[href*="reports"]', priority: 7, description: 'Contains reports in href', viewport: 'all', reliability: 'medium' }
        ],
        fallbacks: ['a:has-text("Reports")', 'a:has-text("Report")', '[role="button"]:has-text("Reports")']
      },
      pageIdentifiers: [
        { selector: '.reports-page', priority: 1, description: 'Reports page container', viewport: 'all', reliability: 'high' },
        { selector: '[data-testid="reports-page"]', priority: 2, description: 'Test ID reports page', viewport: 'all', reliability: 'high' },
        { selector: 'h1:has-text("Reports")', priority: 3, description: 'Reports heading', viewport: 'all', reliability: 'medium' },
        { selector: '.report-list', priority: 4, description: 'Report list container', viewport: 'all', reliability: 'medium' },
        { selector: '.main-content', priority: 5, description: 'Main content area', viewport: 'all', reliability: 'low' }
      ],
      requiredElements: [
        { selector: '[data-testid="reports-page"], .reports-page, .main-content, body', priority: 1, description: 'Main content container', viewport: 'all', reliability: 'high' },
        { selector: '.navigation, [data-testid="main-navigation"], .main-nav, .navbar-nav, .nav-menu', priority: 2, description: 'Main navigation', viewport: 'all', reliability: 'high' },
        { selector: '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]', priority: 3, description: 'Search interface', viewport: 'all', reliability: 'medium' }
      ]
    }
  };

  /**
   * Get timeout configuration for specific viewport category and operation
   */
  static getTimeout(viewportCategory: string, operation: keyof TimeoutConfig): number {
    const timeouts = this.TIMEOUTS[viewportCategory] || this.TIMEOUTS.mobile;
    return timeouts[operation];
  }

  /**
   * Get viewport configuration by name
   */
  static getViewport(viewportName: string): ViewportConfig {
    return this.VIEWPORTS[viewportName] || this.VIEWPORTS.mobile;
  }

  /**
   * Get all supported page names
   */
  static getPageNames(): string[] {
    return Object.keys(this.PAGES);
  }

  /**
   * Get page configuration by name
   */
  static getPageConfig(pageName: string): PageConfig | undefined {
    return this.PAGES[pageName.toLowerCase()];
  }

  /**
   * Get all viewport categories
   */
  static getViewportCategories(): string[] {
    return Object.keys(this.VIEWPORTS);
  }

  /**
   * Get base URL from environment or default
   */
  static getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Get full URL for a page
   */
  static getPageUrl(pageName: string): string {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) {
      throw new Error(`Unknown page: ${pageName}`);
    }
    return this.getBaseUrl() + pageConfig.url;
  }

  /**
   * Get page title for validation
   */
  static getPageTitle(pageName: string): string {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) {
      throw new Error(`Unknown page: ${pageName}`);
    }
    return pageConfig.title;
  }

  /**
   * Get page selectors for element identification
   */
  static getPageSelectors(pageName: string): PageConfig['selectors'] {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) {
      throw new Error(`Unknown page: ${pageName}`);
    }
    return pageConfig.selectors;
  }

  /**
   * Check if page has search interface that is required for validation
   * Returns true only if the page has a search interface AND it's required for validation
   * Returns false for pages with optional search interfaces or no search interface
   */
  static hasSearchInterface(pageName: string): boolean {
    const pageConfig = this.getPageConfig(pageName);
    
    // If no page config or no search interface selector, return false
    if (!pageConfig || !pageConfig.selectors.searchInterface) {
      return false;
    }
    
    // Check validation configuration
    if (pageConfig.validation) {
      // If validation config exists, check if search interface is required
      return pageConfig.validation.searchInterfaceRequired === true;
    }
    
    // Backward compatibility: if no validation config exists, 
    // default to true (required) to maintain existing behavior
    return true;
  }

  /**
   * Get default mobile viewport
   */
  static getMobileViewport(): ViewportConfig {
    return this.VIEWPORTS.mobile;
  }

  /**
   * Get default tablet viewport
   */
  static getTabletViewport(): ViewportConfig {
    return this.VIEWPORTS.tablet;
  }

  /**
   * Get default desktop viewport
   */
  static getDesktopViewport(): ViewportConfig {
    return this.VIEWPORTS.desktop;
  }

  /**
   * Determine viewport category based on width
   */
  static getViewportCategoryByWidth(width: number): string {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
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
  static getNavigationSelectors(viewportCategory: string) {
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
  static getNavigationLinkSelector(pageName: string): string {
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
  static getNavigationSelector(pageName: string, isMobile: boolean): string {
    const viewportCategory = isMobile ? 'mobile' : 'desktop';
    const selectors = this.getNavigationSelectors(viewportCategory);
    return selectors.mainNav;
  }

  // URL matching methods
  static matchesPageUrl(currentUrl: string, pageName: string): boolean {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) return false;
    return currentUrl.includes(pageConfig.url);
  }

  static matchesPageTitle(currentTitle: string, pageName: string): boolean {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) return false;
    return currentTitle.includes(pageConfig.title);
  }

  // Page identifier methods
  static getPageIdentifierSelector(pageName: string, isMobile: boolean): string {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) return '[data-testid="page-identifier"]';
    return pageConfig.selectors.main;
  }

  static getRequiredElements(pageName: string): string[] {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig) return [];
    return [pageConfig.selectors.main, pageConfig.selectors.navigation];
  }

  static getSearchInterfaceSelector(pageName: string, isMobile: boolean): string {
    const pageConfig = this.getPageConfig(pageName);
    if (!pageConfig || !pageConfig.selectors.searchInterface) {
      return '[data-testid="search-interface"]';
    }
    return pageConfig.selectors.searchInterface;
  }

  // Static selector constants with fallbacks for real application compatibility
  static readonly MOBILE_MENU_CONTAINER = '.mobile-menu, .navbar-collapse, .nav-mobile, [data-mobile-menu], [data-testid="mobile-menu-container"]';
 // static readonly MOBILE_MENU_TOGGLE = '.navbar-toggle, .mobile-menu-toggle, [data-testid="mobile-nav-toggle"], .hamburger, .menu-toggle, .navbar-toggler, [data-testid="mobile-menu-toggle"]';
  static readonly MOBILE_CONTAINER = '.mobile-container, .container-mobile, [data-mobile], [data-testid="mobile-container"]';
  static readonly MOBILE_HIDDEN = '[data-mobile-hidden="true"], .mobile-hidden, .d-none-mobile';
  static readonly TABLET_CONTAINER = '.tablet-container, .container-tablet, [data-tablet], [data-testid="tablet-container"]';
  static readonly TABLET_VISIBLE = '[data-tablet-visible="true"], .tablet-visible, .d-block-tablet';
  static readonly DESKTOP_CONTAINER = '.desktop-container, .container-desktop, [data-desktop], [data-testid="desktop-container"]';
  static readonly DESKTOP_VISIBLE = '[data-desktop-visible="true"], .desktop-visible, .d-block-desktop';
  //static readonly MAIN_NAVIGATION = '.main-nav, .navbar-nav, [data-testid="main-nav"], .navigation, .nav-menu, [data-testid="main-navigation"]';
  static readonly NAVIGATION_MENU = '.nav-menu, .navigation-menu, .navbar-nav, [data-testid="navigation-menu"]';
  static readonly MOBILE_SEARCH_CONTAINER = '.mobile-search, .search-mobile, [data-mobile-search], [data-testid="mobile-search-container"]';
  static readonly SEARCH_CONTAINER = '.search-container, .search-wrapper, [data-search], [data-testid="search-container"]';
  static readonly MOBILE_SEARCH_INPUT = '.mobile-search-input, .search-input-mobile, [data-mobile-search-input], [data-testid="mobile-search-input"]';
  static readonly SEARCH_INPUT = '.search-input, input[type="search"], [data-search-input], [data-testid="search-input"]';
  static readonly RESPONSIVE_CONTAINER = '.container, .container-fluid, .responsive-container, [data-responsive], [data-testid="responsive-container"]';

  // Mobile menu configuration
  static readonly MOBILE_MENU_CONFIG = {
    slideInDuration: 300,
    slideOutDuration: 250
  };

  // Touch target validation
  static isTouchTargetAdequate(width: number, height: number): boolean {
    const minTouchTarget = 44; // iOS/Android minimum touch target size
    return width >= minTouchTarget && height >= minTouchTarget;
  }
}

// Export PageValidation interface for NavigationPage compatibility
export interface PageValidation {
  isLoaded: boolean;
  url: string;
  title: string;
  loadTime: number;
  searchInterfacePresent: boolean;
  searchInterfaceRequired: boolean;
  searchInterfaceValidationSkipped: boolean;
  isResponsive: boolean;
  warnings: string[];
  errors: string[];
}

// Enhanced validation interfaces for comprehensive testing
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  navigationStart: number;
  domInteractive: number;
  loadEventEnd: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export interface ElementValidationDetail {
  selector: string;
  name: string;
  isPresent: boolean;
  isVisible: boolean;
  isInteractable: boolean;
}

export interface UrlValidationResult {
  isValid: boolean;
  expectedPattern: string;
  actualUrl: string;
  matchDetails: {
    pathMatches: boolean;
    queryParamsValid: boolean;
    fragmentValid: boolean;
  };
  errors: string[];
}

export interface TitleValidationResult {
  isValid: boolean;
  expectedTitle: string;
  actualTitle: string;
  matchType: 'exact' | 'contains' | 'pattern' | 'none';
  errors: string[];
}

export interface ElementValidationResult {
  isValid: boolean;
  totalElements: number;
  presentElements: number;
  missingElements: string[];
  elementDetails: ElementValidationDetail[];
  errors: string[];
}

export interface PerformanceValidationResult {
  isValid: boolean;
  metrics: PerformanceMetrics;
  thresholds: {
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  validationResults: {
    loadTimeValid: boolean;
    domContentLoadedValid: boolean;
    firstContentfulPaintValid: boolean;
    largestContentfulPaintValid: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface ComprehensiveValidationResult {
  isValid: boolean;
  loadTime: number;
  performanceMetrics: PerformanceMetrics;
  validationResults: PageValidation;
  timeoutExceeded: boolean;
  errors: string[];
}

export default NavigationConstants;