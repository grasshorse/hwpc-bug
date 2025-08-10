const { BasePage } = require('./BasePage');

/**
 * DashboardPage class handles the main dashboard interface
 * Provides navigation, menu interactions, and responsive layout verification
 * Supports both desktop and mobile interactions
 */
class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Dashboard URL pattern
    this.baseUrl = process.env.BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.dashboardUrl = `${this.baseUrl}?page=dashboard`;
    
    // Desktop selectors
    this.selectors = {
      // Main navigation elements
      mainNavigation: '[data-testid="main-navigation"]',
      dashboardTitle: '[data-testid="dashboard-title"]',
      userProfile: '[data-testid="user-profile"]',
      logoutButton: '[data-testid="logout-btn"]',
      
      // Menu items
      customersMenuItem: '[data-testid="nav-customers"]',
      ticketsMenuItem: '[data-testid="nav-tickets"]',
      routesMenuItem: '[data-testid="nav-routes"]',
      reportsMenuItem: '[data-testid="nav-reports"]',
      settingsMenuItem: '[data-testid="nav-settings"]',
      
      // Dashboard widgets
      dashboardWidgets: '[data-testid="dashboard-widgets"]',
      todayTicketsWidget: '[data-testid="widget-today-tickets"]',
      pendingTicketsWidget: '[data-testid="widget-pending-tickets"]',
      routeStatusWidget: '[data-testid="widget-route-status"]',
      customerSummaryWidget: '[data-testid="widget-customer-summary"]',
      
      // Quick actions
      quickActions: '[data-testid="quick-actions"]',
      createTicketButton: '[data-testid="quick-create-ticket"]',
      viewRoutesButton: '[data-testid="quick-view-routes"]',
      addCustomerButton: '[data-testid="quick-add-customer"]',
      
      // Responsive elements
      mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',
      mobileNavigation: '[data-testid="mobile-navigation"]',
      mobileMenuOverlay: '[data-testid="mobile-menu-overlay"]',
      
      // Loading and error states
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]'
    };
    
    // Mobile breakpoints for responsive testing
    this.breakpoints = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    };
  }

  /**
   * Navigate to the dashboard page with MVP authentication
   * @param {boolean} waitForLoad - Whether to wait for complete page load
   */
  async navigateToDashboard(waitForLoad = true) {
    try {
      await this.navigate(this.dashboardUrl);
      
      // Handle Google Sites iframe if present
      await this.switchToGoogleSitesFrame();
      
      if (waitForLoad) {
        await this.waitForDashboardLoad();
      }
      
      return true;
    } catch (error) {
      await this.handleError(error, 'dashboard-navigation');
      return false;
    }
  }

  /**
   * Wait for dashboard to fully load
   * Verifies key elements are present and interactive
   */
  async waitForDashboardLoad() {
    try {
      // Wait for main navigation to be visible
      await this.waitForElement(this.selectors.mainNavigation);
      
      // Wait for dashboard title
      await this.waitForElement(this.selectors.dashboardTitle);
      
      // Wait for loading spinner to disappear
      await this.page.waitForSelector(this.selectors.loadingSpinner, { 
        state: 'hidden', 
        timeout: 5000 
      }).catch(() => {
        // Loading spinner might not be present, continue
      });
      
      // Ensure MVP authentication is active
      await this.ensureMVPAuthentication();
      
      return true;
    } catch (error) {
      await this.handleError(error, 'dashboard-load');
      throw error;
    }
  }

  /**
   * Verify dashboard page load with all essential elements
   * @returns {Promise<boolean>} True if dashboard loaded successfully
   */
  async verifyDashboardLoaded() {
    try {
      const checks = [
        this.elementExists(this.selectors.dashboardTitle),
        this.elementExists(this.selectors.mainNavigation),
        this.elementExists(this.selectors.dashboardWidgets)
      ];
      
      const results = await Promise.all(checks);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Dashboard load verification failed:', error);
      return false;
    }
  }

  /**
   * Navigate to customers page via menu
   */
  async navigateToCustomers() {
    await this.clickMenuItem('customers');
  }

  /**
   * Navigate to tickets page via menu
   */
  async navigateToTickets() {
    await this.clickMenuItem('tickets');
  }

  /**
   * Navigate to routes page via menu
   */
  async navigateToRoutes() {
    await this.clickMenuItem('routes');
  }

  /**
   * Navigate to reports page via menu
   */
  async navigateToReports() {
    await this.clickMenuItem('reports');
  }

  /**
   * Navigate to settings page via menu
   */
  async navigateToSettings() {
    await this.clickMenuItem('settings');
  }

  /**
   * Click on a specific menu item
   * @param {string} menuItem - The menu item to click (customers, tickets, routes, reports, settings)
   */
  async clickMenuItem(menuItem) {
    try {
      const selectorMap = {
        'customers': this.selectors.customersMenuItem,
        'tickets': this.selectors.ticketsMenuItem,
        'routes': this.selectors.routesMenuItem,
        'reports': this.selectors.reportsMenuItem,
        'settings': this.selectors.settingsMenuItem
      };
      
      const selector = selectorMap[menuItem.toLowerCase()];
      if (!selector) {
        throw new Error(`Unknown menu item: ${menuItem}`);
      }
      
      // Check if mobile menu needs to be opened first
      const isMobile = await this.isMobileView();
      if (isMobile) {
        await this.openMobileMenu();
      }
      
      await this.click(selector);
      
      // Close mobile menu after navigation
      if (isMobile) {
        await this.closeMobileMenu();
      }
      
      // Wait for navigation to complete
      await this.waitForPageLoad();
      
    } catch (error) {
      await this.handleError(error, `menu-navigation-${menuItem}`);
      throw error;
    }
  }

  /**
   * Get dashboard widget data
   * @param {string} widgetType - Type of widget (today-tickets, pending-tickets, route-status, customer-summary)
   * @returns {Promise<Object>} Widget data
   */
  async getWidgetData(widgetType) {
    try {
      const selectorMap = {
        'today-tickets': this.selectors.todayTicketsWidget,
        'pending-tickets': this.selectors.pendingTicketsWidget,
        'route-status': this.selectors.routeStatusWidget,
        'customer-summary': this.selectors.customerSummaryWidget
      };
      
      const selector = selectorMap[widgetType];
      if (!selector) {
        throw new Error(`Unknown widget type: ${widgetType}`);
      }
      
      await this.waitForElement(selector);
      
      // Extract widget data
      const widgetData = await this.page.evaluate((sel) => {
        const widget = document.querySelector(sel);
        if (!widget) return null;
        
        return {
          title: widget.querySelector('[data-testid="widget-title"]')?.textContent || '',
          value: widget.querySelector('[data-testid="widget-value"]')?.textContent || '',
          subtitle: widget.querySelector('[data-testid="widget-subtitle"]')?.textContent || '',
          isVisible: widget.offsetParent !== null
        };
      }, selector);
      
      return widgetData;
    } catch (error) {
      await this.handleError(error, `widget-data-${widgetType}`);
      throw error;
    }
  }

  /**
   * Perform quick action from dashboard
   * @param {string} action - Action type (create-ticket, view-routes, add-customer)
   */
  async performQuickAction(action) {
    try {
      const selectorMap = {
        'create-ticket': this.selectors.createTicketButton,
        'view-routes': this.selectors.viewRoutesButton,
        'add-customer': this.selectors.addCustomerButton
      };
      
      const selector = selectorMap[action];
      if (!selector) {
        throw new Error(`Unknown quick action: ${action}`);
      }
      
      await this.click(selector);
      await this.waitForPageLoad();
      
    } catch (error) {
      await this.handleError(error, `quick-action-${action}`);
      throw error;
    }
  }

  /**
   * Check if current view is mobile
   * @returns {Promise<boolean>} True if mobile view
   */
  async isMobileView() {
    try {
      const viewport = this.page.viewportSize();
      return viewport.width <= 768;
    } catch (error) {
      // Fallback: check if mobile menu toggle is visible
      return await this.elementExists(this.selectors.mobileMenuToggle);
    }
  }

  /**
   * Open mobile navigation menu
   */
  async openMobileMenu() {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        throw new Error('Not in mobile view - cannot open mobile menu');
      }
      
      // Check if menu is already open
      const isMenuOpen = await this.elementExists(this.selectors.mobileNavigation);
      if (isMenuOpen) {
        return; // Menu already open
      }
      
      // Click mobile menu toggle
      await this.click(this.selectors.mobileMenuToggle);
      
      // Wait for mobile navigation to appear
      await this.waitForElement(this.selectors.mobileNavigation);
      
    } catch (error) {
      await this.handleError(error, 'mobile-menu-open');
      throw error;
    }
  }

  /**
   * Close mobile navigation menu
   */
  async closeMobileMenu() {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        return; // Not in mobile view
      }
      
      // Check if menu is open
      const isMenuOpen = await this.elementExists(this.selectors.mobileNavigation);
      if (!isMenuOpen) {
        return; // Menu already closed
      }
      
      // Click overlay or toggle to close
      const hasOverlay = await this.elementExists(this.selectors.mobileMenuOverlay);
      if (hasOverlay) {
        await this.click(this.selectors.mobileMenuOverlay);
      } else {
        await this.click(this.selectors.mobileMenuToggle);
      }
      
      // Wait for mobile navigation to disappear
      await this.page.waitForSelector(this.selectors.mobileNavigation, { 
        state: 'hidden', 
        timeout: 3000 
      });
      
    } catch (error) {
      await this.handleError(error, 'mobile-menu-close');
      throw error;
    }
  }

  /**
   * Perform mobile touch interaction on menu item
   * @param {string} menuItem - Menu item to tap
   */
  async tapMenuItem(menuItem) {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        throw new Error('Not in mobile view - use clickMenuItem instead');
      }
      
      await this.openMobileMenu();
      
      const selectorMap = {
        'customers': this.selectors.customersMenuItem,
        'tickets': this.selectors.ticketsMenuItem,
        'routes': this.selectors.routesMenuItem,
        'reports': this.selectors.reportsMenuItem,
        'settings': this.selectors.settingsMenuItem
      };
      
      const selector = selectorMap[menuItem.toLowerCase()];
      if (!selector) {
        throw new Error(`Unknown menu item: ${menuItem}`);
      }
      
      // Use touch tap instead of click
      await this.page.tap(selector);
      
      // Wait for navigation
      await this.waitForPageLoad();
      
    } catch (error) {
      await this.handleError(error, `mobile-tap-${menuItem}`);
      throw error;
    }
  }

  /**
   * Verify responsive layout at different breakpoints
   * @param {string} breakpoint - Breakpoint to test (mobile, tablet, desktop)
   * @returns {Promise<Object>} Layout verification results
   */
  async verifyResponsiveLayout(breakpoint = 'mobile') {
    try {
      const viewport = this.breakpoints[breakpoint];
      if (!viewport) {
        throw new Error(`Unknown breakpoint: ${breakpoint}`);
      }
      
      // Set viewport size
      await this.page.setViewportSize(viewport);
      
      // Wait for layout to adjust
      await this.page.waitForTimeout(500);
      
      // Verify layout elements
      const layoutChecks = {
        navigationVisible: await this.elementExists(this.selectors.mainNavigation),
        dashboardTitleVisible: await this.elementExists(this.selectors.dashboardTitle),
        widgetsVisible: await this.elementExists(this.selectors.dashboardWidgets),
        mobileMenuToggleVisible: breakpoint === 'mobile' ? 
          await this.elementExists(this.selectors.mobileMenuToggle) : true,
        quickActionsVisible: await this.elementExists(this.selectors.quickActions)
      };
      
      // Check if elements are properly positioned (not overlapping)
      const layoutMetrics = await this.page.evaluate(() => {
        const nav = document.querySelector('[data-testid="main-navigation"]');
        const widgets = document.querySelector('[data-testid="dashboard-widgets"]');
        
        return {
          navigationHeight: nav ? nav.offsetHeight : 0,
          widgetsTop: widgets ? widgets.offsetTop : 0,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        };
      });
      
      return {
        breakpoint,
        viewport,
        checks: layoutChecks,
        metrics: layoutMetrics,
        isValid: Object.values(layoutChecks).every(check => check === true)
      };
      
    } catch (error) {
      await this.handleError(error, `responsive-layout-${breakpoint}`);
      throw error;
    }
  }

  /**
   * Test mobile touch gestures on dashboard
   */
  async testMobileTouchGestures() {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        throw new Error('Not in mobile view - cannot test touch gestures');
      }
      
      // Test swipe gesture on widgets (if scrollable)
      const widgetsSelector = this.selectors.dashboardWidgets;
      await this.waitForElement(widgetsSelector);
      
      // Get element bounds for swipe calculation
      const widgetsBounds = await this.page.locator(widgetsSelector).boundingBox();
      
      if (widgetsBounds) {
        const startX = widgetsBounds.x + widgetsBounds.width * 0.8;
        const endX = widgetsBounds.x + widgetsBounds.width * 0.2;
        const y = widgetsBounds.y + widgetsBounds.height * 0.5;
        
        // Perform swipe gesture
        await this.page.touchscreen.tap(startX, y);
        await this.page.touchscreen.tap(endX, y);
      }
      
      // Test tap on quick actions
      const quickActionsExist = await this.elementExists(this.selectors.quickActions);
      if (quickActionsExist) {
        await this.page.tap(this.selectors.createTicketButton);
        await this.page.goBack(); // Return to dashboard
      }
      
      return true;
    } catch (error) {
      await this.handleError(error, 'mobile-touch-gestures');
      throw error;
    }
  }

  /**
   * Get current user profile information from dashboard
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile() {
    try {
      await this.waitForElement(this.selectors.userProfile);
      
      const profileData = await this.page.evaluate((selector) => {
        const profile = document.querySelector(selector);
        if (!profile) return null;
        
        return {
          name: profile.querySelector('[data-testid="user-name"]')?.textContent || '',
          email: profile.querySelector('[data-testid="user-email"]')?.textContent || '',
          role: profile.querySelector('[data-testid="user-role"]')?.textContent || '',
          avatar: profile.querySelector('[data-testid="user-avatar"]')?.src || ''
        };
      }, this.selectors.userProfile);
      
      return profileData;
    } catch (error) {
      await this.handleError(error, 'user-profile');
      throw error;
    }
  }

  /**
   * Logout from the dashboard
   */
  async logout() {
    try {
      await this.click(this.selectors.logoutButton);
      
      // Clear MVP authentication
      await this.clearMVPAuth();
      
      // Wait for redirect to login or home page
      await this.waitForPageLoad();
      
    } catch (error) {
      await this.handleError(error, 'logout');
      throw error;
    }
  }

  /**
   * Check for error messages on dashboard
   * @returns {Promise<string|null>} Error message if present
   */
  async getErrorMessage() {
    try {
      const hasError = await this.elementExists(this.selectors.errorMessage);
      if (hasError) {
        return await this.getText(this.selectors.errorMessage);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check for success messages on dashboard
   * @returns {Promise<string|null>} Success message if present
   */
  async getSuccessMessage() {
    try {
      const hasSuccess = await this.elementExists(this.selectors.successMessage);
      if (hasSuccess) {
        return await this.getText(this.selectors.successMessage);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboard() {
    try {
      await this.reload();
      await this.waitForDashboardLoad();
    } catch (error) {
      await this.handleError(error, 'dashboard-refresh');
      throw error;
    }
  }
}

module.exports = { DashboardPage };