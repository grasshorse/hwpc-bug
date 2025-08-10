const { MockAuthManager } = require('../MockAuthManager');

/**
 * BasePage class provides common functionality for all page objects
 * Uses Playwright for browser automation with Google Sites iframe handling
 * Includes MVP mock authentication support
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
    this.consoleLogs = [];
    this.mockAuth = new MockAuthManager();
    
    // Listen for console messages
    this.page.on('console', msg => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Navigate to a specific URL with MVP mock authentication
   * @param {string} url - The URL to navigate to
   * @param {boolean} authenticate - Whether to set up mock authentication (default: true)
   */
  async navigate(url, authenticate = true) {
    if (authenticate) {
      await this.mockAuth.authenticateAsMVPUser(this.page);
    }
    
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    if (authenticate) {
      await this.mockAuth.setMockUserContext(this.page);
    }
  }

  /**
   * Wait for an element to be visible
   * @param {string} selector - CSS selector for the element
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<ElementHandle>} The element handle
   */
  async waitForElement(selector, timeout = this.timeout) {
    return await this.page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Click on an element
   * @param {string} selector - CSS selector for the element
   * @param {Object} options - Click options
   */
  async click(selector, options = {}) {
    await this.waitForElement(selector);
    await this.page.click(selector, options);
  }

  /**
   * Type text into an input field
   * @param {string} selector - CSS selector for the input field
   * @param {string} text - Text to type
   */
  async type(selector, text) {
    await this.waitForElement(selector);
    await this.page.fill(selector, text);
  }

  /**
   * Get text content from an element
   * @param {string} selector - CSS selector for the element
   * @returns {Promise<string>} The text content
   */
  async getText(selector) {
    await this.waitForElement(selector);
    return await this.page.textContent(selector);
  }

  /**
   * Wait for a specific condition
   * @param {Function} condition - Function that returns a boolean
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitFor(condition, timeout = this.timeout) {
    await this.page.waitForFunction(condition, { timeout });
  }

  /**
   * Handle Google Sites iframe navigation and switching logic
   * Searches through all frames to find the pest control application
   * @returns {Promise<boolean>} True if iframe found and switched
   */
  async switchToGoogleSitesFrame() {
    try {
      const frames = this.page.frames();
      
      for (let frame of frames) {
        try {
          // Check if this frame contains the pest control application
          const appElements = await frame.$$('[data-app="pest-control"]');
          const pestControlElements = await frame.$$('[class*="pest-control"]');
          const appScriptElements = await frame.$$('[data-testid*="pest"]');
          
          if (appElements.length > 0 || pestControlElements.length > 0 || appScriptElements.length > 0) {
            // Found the correct frame, update page reference
            this.page = frame;
            return true;
          }
        } catch (frameError) {
          // Frame might not be accessible, continue to next frame
          continue;
        }
      }
      
      // If no specific frame found, try to find iframe by src containing script ID
      const iframes = await this.page.$$('iframe');
      for (let iframe of iframes) {
        try {
          const src = await iframe.getAttribute('src');
          if (src && (src.includes('script.google.com') || src.includes('apps-script'))) {
            const frame = await iframe.contentFrame();
            if (frame) {
              this.page = frame;
              return true;
            }
          }
        } catch (iframeError) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error switching to Google Sites frame:', error);
      return false;
    }
  }

  /**
   * Take a screenshot for debugging or test evidence
   * @param {string} filename - Name of the screenshot file
   * @param {Object} options - Screenshot options
   */
  async takeScreenshot(filename, options = {}) {
    const defaultOptions = {
      path: `screenshots/${filename}`,
      fullPage: true,
      ...options
    };
    
    try {
      await this.page.screenshot(defaultOptions);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  }

  /**
   * Handle errors and capture debugging information
   * @param {Error} error - The error that occurred
   * @param {string} context - Context information about where the error occurred
   */
  async handleError(error, context = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorContext = context ? `-${context}` : '';
    
    try {
      // Take screenshot of current state
      await this.takeScreenshot(`error${errorContext}-${timestamp}.png`);
      
      // Save page content
      const content = await this.page.content();
      require('fs').writeFileSync(
        `logs/page-content${errorContext}-${timestamp}.html`, 
        content
      );
      
      // Save console logs
      require('fs').writeFileSync(
        `logs/console${errorContext}-${timestamp}.json`, 
        JSON.stringify(this.consoleLogs, null, 2)
      );
      
    } catch (captureError) {
      console.error('Failed to capture error artifacts:', captureError);
    }
    
    // Re-throw the original error
    throw error;
  }

  /**
   * Wait for page to be fully loaded
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForPageLoad(timeout = this.timeout) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Check if an element exists on the page
   * @param {string} selector - CSS selector for the element
   * @returns {Promise<boolean>} True if element exists
   */
  async elementExists(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll to an element
   * @param {string} selector - CSS selector for the element
   */
  async scrollToElement(selector) {
    await this.waitForElement(selector);
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Get the current URL
   * @returns {Promise<string>} Current page URL
   */
  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /**
   * Go back to the previous page
   */
  async goBack() {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  /**
   * Close the current page
   */
  async close() {
    await this.page.close();
  }

  /**
   * Ensure MVP mock authentication is active
   * @returns {Promise<boolean>} True if authenticated
   */
  async ensureMVPAuthentication() {
    const isAuth = await this.mockAuth.isAuthenticated(this.page);
    if (!isAuth) {
      await this.mockAuth.authenticateAsMVPUser(this.page);
      await this.mockAuth.setMockUserContext(this.page);
    }
    return true;
  }

  /**
   * Get current MVP user context
   * @returns {Promise<Object>} Current user data
   */
  async getCurrentMVPUser() {
    return await this.mockAuth.getCurrentUser(this.page);
  }

  /**
   * Check if current user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasMVPPermission(permission) {
    return this.mockAuth.hasPermission(permission);
  }

  /**
   * Create test data with MVP user attribution
   * @param {Object} data - Base data object
   * @returns {Object} Data with MVP attribution
   */
  addMVPAttribution(data) {
    return this.mockAuth.addMVPUserAttribution(data);
  }

  /**
   * Generate unique test ID with MVP prefix
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique test ID
   */
  generateMVPTestId(prefix = 'MVP') {
    return this.mockAuth.generateTestId(prefix);
  }

  /**
   * Clear MVP authentication (for cleanup)
   */
  async clearMVPAuth() {
    await this.mockAuth.clearMockAuth(this.page);
  }
}

module.exports = { BasePage };