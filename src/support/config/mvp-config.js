/**
 * MVP Configuration for UI Testing Infrastructure
 * 
 * This configuration defines the MVP approach for authentication and testing
 * to avoid login/encryption complexity during initial development phase.
 */

module.exports = {
  // MVP Authentication Configuration
  mvpAuth: {
    enabled: true,
    mockUser: {
      email: 'usermvp@hwpc.net',
      name: 'MVP Test User',
      id: 'mvp-user-001',
      role: 'admin',
      company: 'HWPC Test Company'
    },
    
    // Permissions for MVP user (full access for testing)
    permissions: [
      'read',
      'write', 
      'delete',
      'admin',
      'customer_management',
      'ticket_management',
      'route_planning',
      'print_export',
      'user_management'
    ],
    
    // Session configuration
    session: {
      timeout: 3600000, // 1 hour in milliseconds
      cookieName: 'mvp_session',
      storageKey: 'auth_user'
    }
  },

  // Test Data Configuration
  testData: {
    // Prefix for all MVP test data
    prefix: 'MVP_TEST_',
    
    // Flag to identify MVP test data
    mvpFlag: 'mvpTestData',
    
    // Cleanup strategy
    cleanup: {
      enabled: true,
      afterEachTest: false,
      afterTestSuite: true
    },
    
    // Data attribution
    attribution: {
      createdByField: 'createdBy',
      createdByValue: 'usermvp@hwpc.net',
      testFlagField: 'mvpTestData',
      testFlagValue: true
    }
  },

  // Feature Flags for MVP
  features: {
    // Authentication features (disabled for MVP)
    realAuthentication: false,
    googleOAuth: false,
    userRegistration: false,
    passwordReset: false,
    
    // Core features (enabled for MVP)
    customerManagement: true,
    ticketManagement: true,
    routePlanning: true,
    printExport: true,
    mobileSupport: true,
    
    // Advanced features (may be limited for MVP)
    userRoleManagement: false,
    auditLogging: true,
    dataExport: true,
    apiIntegration: true
  },

  // Environment Configuration
  environments: {
    mvp: {
      name: 'MVP Development',
      baseUrl: process.env.MVP_BASE_URL || 'http://localhost:3000',
      apiUrl: process.env.MVP_API_URL || 'http://localhost:3001/api',
      sheetsId: process.env.MVP_SHEETS_ID || 'test-sheets-id',
      mockAuth: true,
      debugMode: true
    }
  },

  // Post-MVP Migration Plan
  postMVP: {
    // Steps to transition from mock auth to real auth
    migrationSteps: [
      'Implement Google OAuth integration',
      'Create user registration/login pages', 
      'Update page objects to handle real authentication',
      'Modify step definitions for real login flows',
      'Update test data to use real user accounts',
      'Add authentication error handling',
      'Implement session management',
      'Add role-based access control testing'
    ],
    
    // Files that will need updates
    filesToUpdate: [
      'src/support/MockAuthManager.js -> src/support/AuthManager.js',
      'src/step-definitions/mvp-auth-steps.js -> src/step-definitions/auth-steps.js',
      'src/support/page-objects/BasePage.js (remove MVP methods)',
      'features/*.feature (update authentication steps)',
      'src/support/config/test-config.js (enable real auth)'
    ]
  },

  // Documentation
  documentation: {
    purpose: 'Enable rapid MVP development by deferring authentication complexity',
    benefits: [
      'Faster development cycle',
      'Focus on core user workflows',
      'Easier debugging and testing',
      'Reduced external dependencies',
      'Simplified CI/CD pipeline'
    ],
    limitations: [
      'No real security testing',
      'Cannot test authentication edge cases',
      'Mock data may not reflect real user behavior',
      'Requires migration work post-MVP'
    ],
    timeline: 'Use until core workflows and backend API are verified and approved'
  }
};