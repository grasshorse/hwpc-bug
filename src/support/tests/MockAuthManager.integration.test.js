/**
 * Integration tests for MockAuthManager with BasePage
 * Tests the MVP mock authentication system integration
 */

const { MockAuthManager } = require('../MockAuthManager');
const { BasePage } = require('../page-objects/BasePage');

// Mock Playwright page object
const createMockPage = () => {
  const mockPage = {
    url: () => 'http://localhost:3000',
    addInitScript: jest.fn(),
    evaluate: jest.fn(),
    isClosed: () => false,
    on: jest.fn(), // Add event listener mock
    context: () => ({
      addCookies: jest.fn(),
      clearCookies: jest.fn()
    })
  };
  return mockPage;
};

describe('MockAuthManager Integration', () => {
  let mockAuth;
  let mockPage;

  beforeEach(() => {
    mockAuth = new MockAuthManager();
    mockPage = createMockPage();
  });

  describe('Authentication Setup', () => {
    test('should set up authentication with page', async () => {
      await mockAuth.authenticateAsMVPUser(mockPage);

      expect(mockPage.addInitScript).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          email: 'usermvp@hwpc.net',
          name: 'MVP Test User',
          authenticated: true
        })
      );
    });

    test('should set user context in page', async () => {
      mockPage.evaluate.mockResolvedValue(true);

      await mockAuth.setMockUserContext(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          email: 'usermvp@hwpc.net',
          name: 'MVP Test User'
        })
      );
    });
  });

  describe('Authentication Verification', () => {
    test('should verify authentication when localStorage is available', async () => {
      mockPage.evaluate.mockResolvedValue(true);

      const isAuth = await mockAuth.isAuthenticated(mockPage);

      expect(isAuth).toBe(true);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    test('should fallback to mock user when page evaluation fails', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Page evaluation failed'));

      const isAuth = await mockAuth.isAuthenticated(mockPage);

      expect(isAuth).toBe(true);
    });

    test('should get current user from page', async () => {
      const expectedUser = {
        email: 'usermvp@hwpc.net',
        name: 'MVP Test User'
      };
      mockPage.evaluate.mockResolvedValue(expectedUser);

      const currentUser = await mockAuth.getCurrentUser(mockPage);

      expect(currentUser).toEqual(expectedUser);
    });

    test('should fallback to mock user when getCurrentUser fails', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Page evaluation failed'));

      const currentUser = await mockAuth.getCurrentUser(mockPage);

      expect(currentUser.email).toBe('usermvp@hwpc.net');
      expect(currentUser.name).toBe('MVP Test User');
    });
  });

  describe('Authentication Cleanup', () => {
    test('should clear authentication from page', async () => {
      mockPage.evaluate.mockResolvedValue(true);

      await mockAuth.clearMockAuth(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    test('should handle cleanup when page is closed', async () => {
      mockPage.isClosed = () => true;

      // Should not throw error
      await expect(mockAuth.clearMockAuth(mockPage)).resolves.toBeUndefined();
    });

    test('should handle cleanup errors gracefully', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw error
      await expect(mockAuth.clearMockAuth(mockPage)).resolves.toBeUndefined();
    });
  });

  describe('BasePage Integration', () => {
    test('should work with BasePage MVP methods', () => {
      const basePage = new BasePage(mockPage);

      expect(basePage.hasMVPPermission('read')).toBe(true);
      expect(basePage.hasMVPPermission('admin')).toBe(true);
      expect(basePage.hasMVPPermission('nonexistent')).toBe(false);
    });

    test('should generate MVP test IDs through BasePage', () => {
      const basePage = new BasePage(mockPage);

      const testId = basePage.generateMVPTestId('TEST');
      expect(testId).toMatch(/^TEST_mvp-user-001_\d+$/);
    });

    test('should add MVP attribution through BasePage', () => {
      const basePage = new BasePage(mockPage);
      const testData = { name: 'Test Item' };

      const attributedData = basePage.addMVPAttribution(testData);

      expect(attributedData.name).toBe('Test Item');
      expect(attributedData.createdBy).toBe('usermvp@hwpc.net');
      expect(attributedData.mvpTestData).toBe(true);
    });
  });
});