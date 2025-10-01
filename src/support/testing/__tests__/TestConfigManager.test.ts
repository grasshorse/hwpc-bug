import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  TestConfigManager, 
  ConfigValidationError, 
  DEFAULT_CONFIG, 
  DEFAULT_DATABASE_CONFIG, 
  DEFAULT_PRODUCTION_CONFIG,
  MODE_TIMEOUTS,
  MODE_RETRIES
} from '../TestConfigManager';
import { TestMode } from '../types';

describe('TestConfigManager', () => {
  let configManager: TestConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.TEST_MODE;
    delete process.env.TEST_TIMEOUT;
    delete process.env.TEST_RETRIES;
    delete process.env.TEST_TAGS;
    delete process.env.TEST_DATABASE_BACKUP_PATH;
    delete process.env.TEST_DATABASE_URL;
    delete process.env.TEST_DATABASE_RESTORE_TIMEOUT;
    delete process.env.TEST_DATA_PREFIX;
    delete process.env.TEST_LOCATIONS;
    delete process.env.TEST_CUSTOMER_NAMES;
    delete process.env.TEST_CLEANUP_POLICY;

    configManager = TestConfigManager.getInstance();
    configManager.clearCache();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    configManager.clearCache();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = TestConfigManager.getInstance();
      const instance2 = TestConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadConfig', () => {
    it('should load default configuration when no environment variables are set', () => {
      const config = configManager.loadConfig();
      
      expect(config.mode).toBe(DEFAULT_CONFIG.mode);
      expect(config.retries).toBe(DEFAULT_CONFIG.retries);
      expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
      expect(config.tags).toEqual(DEFAULT_CONFIG.tags);
      expect(config.databaseConfig).toEqual(DEFAULT_DATABASE_CONFIG);
      expect(config.productionConfig).toEqual(DEFAULT_PRODUCTION_CONFIG);
    });

    it('should load configuration from environment variables', () => {
      process.env.TEST_MODE = 'production';
      process.env.TEST_TIMEOUT = '45000';
      process.env.TEST_RETRIES = '5';
      process.env.TEST_TAGS = 'api,integration,smoke';

      const config = configManager.loadConfig();
      
      expect(config.mode).toBe(TestMode.PRODUCTION);
      expect(config.timeout).toBe(45000);
      expect(config.retries).toBe(5);
      expect(config.tags).toEqual(['api', 'integration', 'smoke']);
    });

    it('should merge overrides with environment and defaults', () => {
      process.env.TEST_MODE = 'isolated';
      process.env.TEST_TIMEOUT = '30000';

      const config = configManager.loadConfig({
        retries: 10,
        tags: ['custom']
      });
      
      expect(config.mode).toBe(TestMode.ISOLATED);
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(10);
      expect(config.tags).toContain('custom');
    });

    it('should throw ConfigValidationError for invalid TEST_MODE', () => {
      process.env.TEST_MODE = 'invalid';
      
      expect(() => configManager.loadConfig()).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig()).toThrow('Invalid TEST_MODE value: invalid');
    });

    it('should throw ConfigValidationError for invalid TEST_TIMEOUT', () => {
      process.env.TEST_TIMEOUT = 'invalid';
      
      expect(() => configManager.loadConfig()).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig()).toThrow('Invalid TEST_TIMEOUT value: invalid');
    });

    it('should throw ConfigValidationError for negative TEST_RETRIES', () => {
      process.env.TEST_RETRIES = '-1';
      
      expect(() => configManager.loadConfig()).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig()).toThrow('Invalid TEST_RETRIES value: -1');
    });
  });

  describe('database configuration loading', () => {
    it('should load database configuration from environment', () => {
      process.env.TEST_DATABASE_BACKUP_PATH = '/custom/backup/path';
      process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost/testdb';
      process.env.TEST_DATABASE_RESTORE_TIMEOUT = '120000';

      const config = configManager.loadConfig();
      
      expect(config.databaseConfig?.backupPath).toBe('/custom/backup/path');
      expect(config.databaseConfig?.connectionString).toBe('postgresql://test:test@localhost/testdb');
      expect(config.databaseConfig?.restoreTimeout).toBe(120000);
    });

    it('should throw ConfigValidationError for invalid database restore timeout', () => {
      process.env.TEST_DATABASE_RESTORE_TIMEOUT = 'invalid';
      
      expect(() => configManager.loadConfig()).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig()).toThrow('Invalid TEST_DATABASE_RESTORE_TIMEOUT value: invalid');
    });
  });

  describe('production configuration loading', () => {
    it('should load production configuration from environment', () => {
      process.env.TEST_DATA_PREFIX = 'customTestPrefix';
      process.env.TEST_LOCATIONS = 'Location1,Location2,Location3';
      process.env.TEST_CUSTOMER_NAMES = 'Customer1,Customer2,Customer3';
      process.env.TEST_CLEANUP_POLICY = 'cleanup';

      const config = configManager.loadConfig();
      
      expect(config.productionConfig?.testDataPrefix).toBe('customTestPrefix');
      expect(config.productionConfig?.locations).toEqual(['Location1', 'Location2', 'Location3']);
      expect(config.productionConfig?.customerNames).toEqual(['Customer1', 'Customer2', 'Customer3']);
      expect(config.productionConfig?.cleanupPolicy).toBe('cleanup');
    });

    it('should throw ConfigValidationError for invalid cleanup policy', () => {
      process.env.TEST_CLEANUP_POLICY = 'invalid';
      
      expect(() => configManager.loadConfig()).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig()).toThrow('Invalid TEST_CLEANUP_POLICY value: invalid');
    });
  });

  describe('getConfig', () => {
    it('should return cached configuration if available', () => {
      const config1 = configManager.loadConfig({ retries: 99 });
      const config2 = configManager.getConfig();
      
      expect(config2).toBe(config1);
      expect(config2.retries).toBe(99);
    });

    it('should load configuration if not cached', () => {
      process.env.TEST_MODE = 'production';
      
      const config = configManager.getConfig();
      
      expect(config.mode).toBe(TestMode.PRODUCTION);
    });
  });

  describe('clearCache', () => {
    it('should clear cached configuration', () => {
      configManager.loadConfig({ retries: 99 });
      configManager.clearCache();
      
      process.env.TEST_RETRIES = '5';
      const config = configManager.getConfig();
      
      expect(config.retries).toBe(5);
    });
  });

  describe('getTimeout', () => {
    it('should return mode-specific timeout for operation', () => {
      expect(configManager.getTimeout(TestMode.ISOLATED, 'database')).toBe(MODE_TIMEOUTS[TestMode.ISOLATED].database);
      expect(configManager.getTimeout(TestMode.PRODUCTION, 'setup')).toBe(MODE_TIMEOUTS[TestMode.PRODUCTION].setup);
      expect(configManager.getTimeout(TestMode.DUAL, 'cleanup')).toBe(MODE_TIMEOUTS[TestMode.DUAL].cleanup);
    });

    it('should return default timeout for unknown operation', () => {
      expect(configManager.getTimeout(TestMode.ISOLATED, 'unknown')).toBe(MODE_TIMEOUTS[TestMode.ISOLATED].default);
    });

    it('should return default timeout when no operation specified', () => {
      expect(configManager.getTimeout(TestMode.PRODUCTION)).toBe(MODE_TIMEOUTS[TestMode.PRODUCTION].default);
    });
  });

  describe('getRetries', () => {
    it('should return mode-specific retries for operation', () => {
      expect(configManager.getRetries(TestMode.ISOLATED, 'database')).toBe(MODE_RETRIES[TestMode.ISOLATED].database);
      expect(configManager.getRetries(TestMode.PRODUCTION, 'network')).toBe(MODE_RETRIES[TestMode.PRODUCTION].network);
      expect(configManager.getRetries(TestMode.DUAL, 'default')).toBe(MODE_RETRIES[TestMode.DUAL].default);
    });

    it('should return default retries for unknown operation', () => {
      expect(configManager.getRetries(TestMode.ISOLATED, 'unknown')).toBe(MODE_RETRIES[TestMode.ISOLATED].default);
    });

    it('should return default retries when no operation specified', () => {
      expect(configManager.getRetries(TestMode.PRODUCTION)).toBe(MODE_RETRIES[TestMode.PRODUCTION].default);
    });
  });

  describe('createModeSpecificConfig', () => {
    it('should create configuration with mode-specific defaults', () => {
      const config = configManager.createModeSpecificConfig(TestMode.PRODUCTION);
      
      expect(config.mode).toBe(TestMode.PRODUCTION);
      expect(config.timeout).toBe(MODE_TIMEOUTS[TestMode.PRODUCTION].default);
      expect(config.retries).toBe(MODE_RETRIES[TestMode.PRODUCTION].default);
    });

    it('should merge overrides with mode-specific config', () => {
      const config = configManager.createModeSpecificConfig(TestMode.ISOLATED, {
        timeout: 99999,
        tags: ['custom']
      });
      
      expect(config.mode).toBe(TestMode.ISOLATED);
      expect(config.timeout).toBe(99999);
      expect(config.retries).toBe(MODE_RETRIES[TestMode.ISOLATED].default);
      expect(config.tags).toContain('custom');
    });
  });

  describe('validateEnvironmentForMode', () => {
    it('should validate isolated mode requirements', () => {
      const result = configManager.validateEnvironmentForMode(TestMode.ISOLATED);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate production mode requirements', () => {
      const result = configManager.validateEnvironmentForMode(TestMode.PRODUCTION);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate dual mode requirements', () => {
      const result = configManager.validateEnvironmentForMode(TestMode.DUAL);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing isolated mode requirements', () => {
      // Clear cache and set up config with empty values
      configManager.clearCache();
      
      // Mock environment to have empty values
      process.env.TEST_DATABASE_BACKUP_PATH = '';
      process.env.TEST_DATABASE_URL = '';
      
      const result = configManager.validateEnvironmentForMode(TestMode.ISOLATED);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database backup path is required for isolated testing');
      expect(result.errors).toContain('Database connection string is required for isolated testing');
    });

    it('should return errors for missing production mode requirements', () => {
      // Clear cache and set up config with empty values
      configManager.clearCache();
      
      // Mock environment to have empty values
      process.env.TEST_DATA_PREFIX = '';
      process.env.TEST_LOCATIONS = '';
      process.env.TEST_CUSTOMER_NAMES = '';
      
      const result = configManager.validateEnvironmentForMode(TestMode.PRODUCTION);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test data prefix is required for production testing');
      expect(result.errors).toContain('Test locations are required for production testing');
      expect(result.errors).toContain('Test customer names are required for production testing');
    });
  });

  describe('configuration validation', () => {
    it('should validate required mode field', () => {
      expect(() => configManager.loadConfig({ mode: undefined as any })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ mode: undefined as any })).toThrow('Test mode is required');
    });

    it('should validate mode enum values', () => {
      expect(() => configManager.loadConfig({ mode: 'invalid' as any })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ mode: 'invalid' as any })).toThrow('Invalid test mode: invalid');
    });

    it('should validate timeout is positive number', () => {
      expect(() => configManager.loadConfig({ timeout: -1 })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ timeout: -1 })).toThrow('Timeout must be a positive number');
    });

    it('should validate retries is non-negative number', () => {
      expect(() => configManager.loadConfig({ retries: -1 })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ retries: -1 })).toThrow('Retries must be a non-negative number');
    });

    it('should validate tags is array of strings', () => {
      expect(() => configManager.loadConfig({ tags: 'not-array' as any })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ tags: 'not-array' as any })).toThrow('Tags must be an array of strings');
      
      expect(() => configManager.loadConfig({ tags: [123] as any })).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig({ tags: [123] as any })).toThrow('All tags must be strings');
    });
  });

  describe('database configuration validation', () => {
    it('should validate backup path is non-empty string', () => {
      expect(() => configManager.loadConfig({
        databaseConfig: { ...DEFAULT_DATABASE_CONFIG, backupPath: '' }
      })).toThrow(ConfigValidationError);
    });

    it('should validate connection string is non-empty string', () => {
      expect(() => configManager.loadConfig({
        databaseConfig: { ...DEFAULT_DATABASE_CONFIG, connectionString: '' }
      })).toThrow(ConfigValidationError);
    });

    it('should validate restore timeout is positive number', () => {
      expect(() => configManager.loadConfig({
        databaseConfig: { ...DEFAULT_DATABASE_CONFIG, restoreTimeout: -1 }
      })).toThrow(ConfigValidationError);
    });

    it('should validate verification queries is array of non-empty strings', () => {
      expect(() => configManager.loadConfig({
        databaseConfig: { ...DEFAULT_DATABASE_CONFIG, verificationQueries: 'not-array' as any }
      })).toThrow(ConfigValidationError);
      
      expect(() => configManager.loadConfig({
        databaseConfig: { ...DEFAULT_DATABASE_CONFIG, verificationQueries: [''] }
      })).toThrow(ConfigValidationError);
    });
  });

  describe('production configuration validation', () => {
    it('should validate test data prefix is non-empty string', () => {
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, testDataPrefix: '' }
      })).toThrow(ConfigValidationError);
    });

    it('should validate locations is non-empty array of strings', () => {
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, locations: [] }
      })).toThrow(ConfigValidationError);
      
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, locations: [''] }
      })).toThrow(ConfigValidationError);
    });

    it('should validate customer names is non-empty array of strings', () => {
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, customerNames: [] }
      })).toThrow(ConfigValidationError);
      
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, customerNames: [''] }
      })).toThrow(ConfigValidationError);
    });

    it('should validate cleanup policy is valid enum value', () => {
      expect(() => configManager.loadConfig({
        productionConfig: { ...DEFAULT_PRODUCTION_CONFIG, cleanupPolicy: 'invalid' as any }
      })).toThrow(ConfigValidationError);
    });
  });
});