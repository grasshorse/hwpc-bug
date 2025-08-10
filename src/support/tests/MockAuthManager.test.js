/**
 * Unit tests for MockAuthManager
 * Tests the MVP mock authentication system functionality
 */

const { MockAuthManager } = require('../MockAuthManager');

describe('MockAuthManager', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = new MockAuthManager();
  });

  describe('Constructor', () => {
    test('should initialize with correct MVP user data', () => {
      const user = mockAuth.getMockUser();
      
      expect(user.email).toBe('usermvp@hwpc.net');
      expect(user.name).toBe('MVP Test User');
      expect(user.id).toBe('mvp-user-001');
      expect(user.authenticated).toBe(true);
      expect(user.role).toBe('admin');
      expect(user.company).toBe('HWPC Test Company');
    });

    test('should have all required permissions', () => {
      const user = mockAuth.getMockUser();
      
      expect(user.permissions).toContain('read');
      expect(user.permissions).toContain('write');
      expect(user.permissions).toContain('delete');
      expect(user.permissions).toContain('admin');
    });

    test('should generate unique session ID', async () => {
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const mockAuth2 = new MockAuthManager();
      
      expect(mockAuth.getMockUser().sessionId).not.toBe(mockAuth2.getMockUser().sessionId);
    });
  });

  describe('Permission Management', () => {
    test('should correctly check permissions', () => {
      expect(mockAuth.hasPermission('read')).toBe(true);
      expect(mockAuth.hasPermission('write')).toBe(true);
      expect(mockAuth.hasPermission('delete')).toBe(true);
      expect(mockAuth.hasPermission('admin')).toBe(true);
      expect(mockAuth.hasPermission('nonexistent')).toBe(false);
    });
  });

  describe('Test Data Attribution', () => {
    test('should add MVP user attribution to data', () => {
      const baseData = {
        name: 'Test Item',
        value: 123
      };

      const attributedData = mockAuth.addMVPUserAttribution(baseData);

      expect(attributedData.name).toBe('Test Item');
      expect(attributedData.value).toBe(123);
      expect(attributedData.createdBy).toBe('usermvp@hwpc.net');
      expect(attributedData.createdByName).toBe('MVP Test User');
      expect(attributedData.mvpTestData).toBe(true);
      expect(attributedData.testUser).toBe(true);
      expect(attributedData.sessionId).toBe(mockAuth.getMockUser().sessionId);
      expect(attributedData.timestamp).toBeDefined();
    });

    test('should not modify original data object', () => {
      const baseData = {
        name: 'Test Item',
        value: 123
      };

      const attributedData = mockAuth.addMVPUserAttribution(baseData);

      expect(baseData.createdBy).toBeUndefined();
      expect(baseData.mvpTestData).toBeUndefined();
      expect(attributedData).not.toBe(baseData);
    });
  });

  describe('Test ID Generation', () => {
    test('should generate unique test IDs with default prefix', async () => {
      const id1 = mockAuth.generateTestId();
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const id2 = mockAuth.generateTestId();

      expect(id1).toMatch(/^MVP_mvp-user-001_\d+$/);
      expect(id2).toMatch(/^MVP_mvp-user-001_\d+$/);
      expect(id1).not.toBe(id2);
    });

    test('should generate unique test IDs with custom prefix', () => {
      const id1 = mockAuth.generateTestId('CUSTOM');
      const id2 = mockAuth.generateTestId('TEST');

      expect(id1).toMatch(/^CUSTOM_mvp-user-001_\d+$/);
      expect(id2).toMatch(/^TEST_mvp-user-001_\d+$/);
    });
  });

  describe('User Data Immutability', () => {
    test('should return copy of user data, not reference', () => {
      const user1 = mockAuth.getMockUser();
      const user2 = mockAuth.getMockUser();

      expect(user1).toEqual(user2);
      expect(user1).not.toBe(user2);

      // Modifying returned user should not affect internal user
      user1.email = 'modified@test.com';
      expect(mockAuth.getMockUser().email).toBe('usermvp@hwpc.net');
    });
  });
});