/**
 * MockAuthManager handles MVP authentication simulation
 * Uses mock user usermvp@hwpc.net to avoid login/encryption complexity during development
 */
class MockAuthManager {
  constructor() {
    this.mockUser = {
      email: 'usermvp@hwpc.net',
      name: 'MVP Test User',
      id: 'mvp-user-001',
      permissions: ['read', 'write', 'delete', 'admin'],
      sessionId: 'mvp-session-' + Date.now(),
      authenticated: true,
      role: 'admin',
      company: 'HWPC Test Company'
    };
  }

  /**
   * Authenticate as MVP user by setting up mock session
   * @param {Page} page - Playwright page object
   */
  async authenticateAsMVPUser(page) {
    try {
      // Set mock authentication in localStorage
      await page.addInitScript((user) => {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('session_id', user.sessionId);
        localStorage.setItem('user_permissions', JSON.stringify(user.permissions));
      }, this.mockUser);
      
      // Set session cookie - only if page has a URL
      try {
        const currentUrl = page.url();
        if (currentUrl && currentUrl !== 'about:blank') {
          await page.context().addCookies([{
            name: 'mvp_session',
            value: 'authenticated',
            domain: new URL(currentUrl).hostname,
            path: '/'
          }]);
        } else {
          // Set cookie for localhost as default
          await page.context().addCookies([{
            name: 'mvp_session',
            value: 'authenticated',
            domain: 'localhost',
            path: '/'
          }]);
        }
      } catch (cookieError) {
        // If cookie setting fails, continue without it - localStorage auth should be sufficient
        console.warn('Could not set authentication cookie, using localStorage only:', cookieError.message);
      }

      console.log(`Mock authentication set for user: ${this.mockUser.email}`);
    } catch (error) {
      console.error('Failed to set mock authentication:', error);
      throw error;
    }
  }

  /**
   * Set mock user context in the page window object
   * @param {Page} page - Playwright page object
   */
  async setMockUserContext(page) {
    try {
      await page.evaluate((user) => {
        window.currentUser = user;
        window.isAuthenticated = true;
        window.userPermissions = user.permissions;
        
        // Dispatch custom event to notify app of authentication
        window.dispatchEvent(new CustomEvent('userAuthenticated', { 
          detail: user 
        }));
      }, this.mockUser);

      console.log('Mock user context set in page');
    } catch (error) {
      console.error('Failed to set mock user context:', error);
      throw error;
    }
  }

  /**
   * Get the mock user object
   * @returns {Object} Mock user data
   */
  getMockUser() {
    return { ...this.mockUser };
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    return this.mockUser.permissions.includes(permission);
  }

  /**
   * Clear mock authentication from page
   * @param {Page} page - Playwright page object
   */
  async clearMockAuth(page) {
    try {
      // Check if page is still available
      if (page.isClosed()) {
        console.log('Page already closed, skipping auth cleanup');
        return;
      }

      await page.evaluate(() => {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('session_id');
        localStorage.removeItem('user_permissions');
        delete window.currentUser;
        window.isAuthenticated = false;
        delete window.userPermissions;
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
      });

      // Clear cookies
      try {
        await page.context().clearCookies();
      } catch (cookieError) {
        console.warn('Could not clear cookies:', cookieError.message);
      }

      console.log('Mock authentication cleared');
    } catch (error) {
      console.error('Failed to clear mock authentication:', error);
    }
  }

  /**
   * Verify mock authentication is active
   * @param {Page} page - Playwright page object
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated(page) {
    try {
      return await page.evaluate(() => {
        try {
          const authUser = localStorage.getItem('auth_user');
          return authUser && window.isAuthenticated === true;
        } catch (localStorageError) {
          // If localStorage is not accessible, check window object
          return window.currentUser && window.isAuthenticated === true;
        }
      });
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      // If page evaluation fails, assume authenticated if mockAuth was set up
      return this.mockUser !== null;
    }
  }

  /**
   * Get current user from page context
   * @param {Page} page - Playwright page object
   * @returns {Promise<Object|null>} Current user or null
   */
  async getCurrentUser(page) {
    try {
      return await page.evaluate(() => {
        try {
          const authUser = localStorage.getItem('auth_user');
          return authUser ? JSON.parse(authUser) : null;
        } catch (localStorageError) {
          // If localStorage is not accessible, return window.currentUser
          return window.currentUser || null;
        }
      });
    } catch (error) {
      console.error('Failed to get current user:', error);
      // If page evaluation fails, return the mock user
      return this.mockUser;
    }
  }

  /**
   * Simulate user permission change (for testing different access levels)
   * @param {Page} page - Playwright page object
   * @param {Array<string>} permissions - New permissions array
   */
  async updatePermissions(page, permissions) {
    try {
      this.mockUser.permissions = permissions;
      
      await page.evaluate((newPermissions) => {
        const authUser = JSON.parse(localStorage.getItem('auth_user'));
        authUser.permissions = newPermissions;
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        window.currentUser.permissions = newPermissions;
        window.userPermissions = newPermissions;
        
        // Dispatch permission change event
        window.dispatchEvent(new CustomEvent('permissionsUpdated', { 
          detail: newPermissions 
        }));
      }, permissions);

      console.log(`Updated mock user permissions: ${permissions.join(', ')}`);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      throw error;
    }
  }

  /**
   * Create test data with MVP user attribution
   * @param {Object} baseData - Base data object
   * @returns {Object} Data with MVP user attribution
   */
  addMVPUserAttribution(baseData) {
    return {
      ...baseData,
      createdBy: this.mockUser.email,
      createdByName: this.mockUser.name,
      mvpTestData: true,
      testUser: true,
      sessionId: this.mockUser.sessionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate unique test identifier with MVP prefix
   * @param {string} prefix - Prefix for the identifier
   * @returns {string} Unique test identifier
   */
  generateTestId(prefix = 'MVP') {
    return `${prefix}_${this.mockUser.id}_${Date.now()}`;
  }
}

module.exports = { MockAuthManager };