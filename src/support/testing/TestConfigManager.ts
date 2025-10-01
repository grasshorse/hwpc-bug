import { TestMode, TestConfig, DatabaseConfig, ProductionConfig } from './types';

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<TestConfig> = {
  mode: TestMode.ISOLATED,
  tags: [],
  retries: 3,
  timeout: 30000, // 30 seconds
};

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  backupPath: '.kiro/test-data/isolated/',
  connectionString: process.env.TEST_DATABASE_URL || 'sqlite://test.db',
  restoreTimeout: 60000, // 60 seconds
  verificationQueries: [
    'SELECT COUNT(*) as count FROM customers',
    'SELECT COUNT(*) as count FROM routes',
    'SELECT COUNT(*) as count FROM tickets'
  ]
};

export const DEFAULT_PRODUCTION_CONFIG: ProductionConfig = {
  testDataPrefix: 'looneyTunesTest',
  locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
  customerNames: [
    'Bugs Bunny',
    'Daffy Duck',
    'Porky Pig',
    'Tweety Bird',
    'Sylvester Cat',
    'Pepe Le Pew',
    'Foghorn Leghorn',
    'Marvin Martian'
  ],
  cleanupPolicy: 'preserve'
};

/**
 * Mode-specific timeout configurations
 */
export const MODE_TIMEOUTS = {
  [TestMode.ISOLATED]: {
    default: 30000,
    database: 60000,
    setup: 45000,
    cleanup: 30000
  },
  [TestMode.PRODUCTION]: {
    default: 45000,
    database: 30000,
    setup: 60000,
    cleanup: 45000
  },
  [TestMode.DUAL]: {
    default: 60000,
    database: 90000,
    setup: 75000,
    cleanup: 60000
  }
};

/**
 * Mode-specific retry configurations
 */
export const MODE_RETRIES = {
  [TestMode.ISOLATED]: {
    default: 2,
    database: 3,
    network: 1
  },
  [TestMode.PRODUCTION]: {
    default: 3,
    database: 2,
    network: 4
  },
  [TestMode.DUAL]: {
    default: 4,
    database: 3,
    network: 5
  }
};

/**
 * TestConfigManager handles loading, validation, and management of test configuration
 */
export class TestConfigManager {
  private static instance: TestConfigManager;
  private cachedConfig: TestConfig | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TestConfigManager {
    if (!TestConfigManager.instance) {
      TestConfigManager.instance = new TestConfigManager();
    }
    return TestConfigManager.instance;
  }

  /**
   * Load configuration from environment variables and defaults
   */
  public loadConfig(overrides: Partial<TestConfig> = {}): TestConfig {
    const envConfig = this.loadFromEnvironment();
    
    // Handle the case where mode is explicitly set to undefined in overrides
    let mergedConfig: Partial<TestConfig>;
    if (overrides.hasOwnProperty('mode') && overrides.mode === undefined) {
      // Don't merge defaults if mode is explicitly undefined
      mergedConfig = this.mergeConfigs(envConfig, overrides);
    } else {
      mergedConfig = this.mergeConfigs(DEFAULT_CONFIG, envConfig, overrides);
    }
    
    this.validateConfig(mergedConfig);
    this.cachedConfig = mergedConfig as TestConfig;
    
    return this.cachedConfig;
  }

  /**
   * Get cached configuration or load if not cached
   */
  public getConfig(): TestConfig {
    if (!this.cachedConfig) {
      return this.loadConfig();
    }
    return this.cachedConfig;
  }

  /**
   * Clear cached configuration
   */
  public clearCache(): void {
    this.cachedConfig = null;
  }

  /**
   * Get mode-specific timeout for operation type
   */
  public getTimeout(mode: TestMode, operation: string = 'default'): number {
    const modeTimeouts = MODE_TIMEOUTS[mode];
    return modeTimeouts[operation as keyof typeof modeTimeouts] || modeTimeouts.default;
  }

  /**
   * Get mode-specific retry count for operation type
   */
  public getRetries(mode: TestMode, operation: string = 'default'): number {
    const modeRetries = MODE_RETRIES[mode];
    return modeRetries[operation as keyof typeof modeRetries] || modeRetries.default;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<TestConfig> {
    const config: Partial<TestConfig> = {};

    // Load test mode
    const testMode = process.env.TEST_MODE;
    if (testMode) {
      const normalizedMode = testMode.toLowerCase();
      switch (normalizedMode) {
        case 'isolated':
          config.mode = TestMode.ISOLATED;
          break;
        case 'production':
          config.mode = TestMode.PRODUCTION;
          break;
        case 'dual':
          config.mode = TestMode.DUAL;
          break;
        default:
          throw new ConfigValidationError(
            `Invalid TEST_MODE value: ${testMode}. Valid values are: isolated, production, dual`,
            'TEST_MODE',
            testMode
          );
      }
    }

    // Load timeout configuration
    const timeout = process.env.TEST_TIMEOUT;
    if (timeout) {
      const timeoutValue = parseInt(timeout, 10);
      if (isNaN(timeoutValue) || timeoutValue <= 0) {
        throw new ConfigValidationError(
          `Invalid TEST_TIMEOUT value: ${timeout}. Must be a positive number`,
          'TEST_TIMEOUT',
          timeout
        );
      }
      config.timeout = timeoutValue;
    }

    // Load retry configuration
    const retries = process.env.TEST_RETRIES;
    if (retries) {
      const retriesValue = parseInt(retries, 10);
      if (isNaN(retriesValue) || retriesValue < 0) {
        throw new ConfigValidationError(
          `Invalid TEST_RETRIES value: ${retries}. Must be a non-negative number`,
          'TEST_RETRIES',
          retries
        );
      }
      config.retries = retriesValue;
    }

    // Load tags from environment
    const tags = process.env.TEST_TAGS;
    if (tags) {
      config.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Load database configuration
    config.databaseConfig = this.loadDatabaseConfigFromEnvironment();

    // Load production configuration
    config.productionConfig = this.loadProductionConfigFromEnvironment();

    return config;
  }

  /**
   * Load database configuration from environment variables
   */
  private loadDatabaseConfigFromEnvironment(): DatabaseConfig {
    const config = { ...DEFAULT_DATABASE_CONFIG };

    const backupPath = process.env.TEST_DATABASE_BACKUP_PATH;
    if (backupPath !== undefined) {
      config.backupPath = backupPath;
    }

    const connectionString = process.env.TEST_DATABASE_URL;
    if (connectionString !== undefined) {
      config.connectionString = connectionString;
    }

    const restoreTimeout = process.env.TEST_DATABASE_RESTORE_TIMEOUT;
    if (restoreTimeout) {
      const timeoutValue = parseInt(restoreTimeout, 10);
      if (isNaN(timeoutValue) || timeoutValue <= 0) {
        throw new ConfigValidationError(
          `Invalid TEST_DATABASE_RESTORE_TIMEOUT value: ${restoreTimeout}. Must be a positive number`,
          'TEST_DATABASE_RESTORE_TIMEOUT',
          restoreTimeout
        );
      }
      config.restoreTimeout = timeoutValue;
    }

    return config;
  }

  /**
   * Load production configuration from environment variables
   */
  private loadProductionConfigFromEnvironment(): ProductionConfig {
    const config = { ...DEFAULT_PRODUCTION_CONFIG };

    const testDataPrefix = process.env.TEST_DATA_PREFIX;
    if (testDataPrefix !== undefined) {
      config.testDataPrefix = testDataPrefix;
    }

    const locations = process.env.TEST_LOCATIONS;
    if (locations !== undefined) {
      config.locations = locations.split(',').map(loc => loc.trim()).filter(loc => loc.length > 0);
    }

    const customerNames = process.env.TEST_CUSTOMER_NAMES;
    if (customerNames !== undefined) {
      config.customerNames = customerNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
    }

    const cleanupPolicy = process.env.TEST_CLEANUP_POLICY;
    if (cleanupPolicy) {
      if (!['preserve', 'cleanup', 'archive'].includes(cleanupPolicy)) {
        throw new ConfigValidationError(
          `Invalid TEST_CLEANUP_POLICY value: ${cleanupPolicy}. Valid values are: preserve, cleanup, archive`,
          'TEST_CLEANUP_POLICY',
          cleanupPolicy
        );
      }
      config.cleanupPolicy = cleanupPolicy as 'preserve' | 'cleanup' | 'archive';
    }

    return config;
  }

  /**
   * Merge multiple configuration objects
   */
  private mergeConfigs(...configs: Partial<TestConfig>[]): Partial<TestConfig> {
    const result: Partial<TestConfig> = {};

    for (const config of configs) {
      // Handle explicit undefined values vs missing properties
      if (config.hasOwnProperty('mode')) result.mode = config.mode;
      if (config.hasOwnProperty('timeout')) result.timeout = config.timeout;
      if (config.hasOwnProperty('retries')) result.retries = config.retries;
      if (config.hasOwnProperty('tags')) {
        if (config.tags !== undefined) {
          if (Array.isArray(config.tags)) {
            result.tags = [...(result.tags || []), ...config.tags];
          } else {
            result.tags = config.tags; // Keep non-array value for validation to catch
          }
        } else {
          result.tags = config.tags; // Keep undefined
        }
      }
      
      if (config.databaseConfig) {
        result.databaseConfig = { ...result.databaseConfig, ...config.databaseConfig };
      }
      
      if (config.productionConfig) {
        result.productionConfig = { ...result.productionConfig, ...config.productionConfig };
      }
    }

    // Ensure we have default database and production configs if not provided
    if (!result.databaseConfig) {
      result.databaseConfig = DEFAULT_DATABASE_CONFIG;
    }
    
    if (!result.productionConfig) {
      result.productionConfig = DEFAULT_PRODUCTION_CONFIG;
    }

    return result;
  }

  /**
   * Validate configuration object
   */
  private validateConfig(config: Partial<TestConfig>): void {
    // Validate required fields
    if (config.mode === undefined || config.mode === null) {
      throw new ConfigValidationError('Test mode is required', 'mode');
    }

    if (!Object.values(TestMode).includes(config.mode)) {
      throw new ConfigValidationError(
        `Invalid test mode: ${config.mode}. Valid modes are: ${Object.values(TestMode).join(', ')}`,
        'mode',
        config.mode
      );
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout <= 0) {
        throw new ConfigValidationError(
          'Timeout must be a positive number',
          'timeout',
          config.timeout
        );
      }
    }

    // Validate retries
    if (config.retries !== undefined) {
      if (typeof config.retries !== 'number' || config.retries < 0) {
        throw new ConfigValidationError(
          'Retries must be a non-negative number',
          'retries',
          config.retries
        );
      }
    }

    // Validate tags
    if (config.tags !== undefined) {
      if (!Array.isArray(config.tags)) {
        throw new ConfigValidationError(
          'Tags must be an array of strings',
          'tags',
          config.tags
        );
      }

      for (const tag of config.tags) {
        if (typeof tag !== 'string') {
          throw new ConfigValidationError(
            'All tags must be strings',
            'tags',
            tag
          );
        }
      }
    }

    // Validate database configuration
    if (config.databaseConfig) {
      this.validateDatabaseConfig(config.databaseConfig);
    }

    // Validate production configuration
    if (config.productionConfig) {
      this.validateProductionConfig(config.productionConfig);
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfig(config: DatabaseConfig): void {
    if (!config.backupPath || typeof config.backupPath !== 'string') {
      throw new ConfigValidationError(
        'Database backup path must be a non-empty string',
        'databaseConfig.backupPath',
        config.backupPath
      );
    }

    if (!config.connectionString || typeof config.connectionString !== 'string') {
      throw new ConfigValidationError(
        'Database connection string must be a non-empty string',
        'databaseConfig.connectionString',
        config.connectionString
      );
    }

    if (typeof config.restoreTimeout !== 'number' || config.restoreTimeout <= 0) {
      throw new ConfigValidationError(
        'Database restore timeout must be a positive number',
        'databaseConfig.restoreTimeout',
        config.restoreTimeout
      );
    }

    if (!Array.isArray(config.verificationQueries)) {
      throw new ConfigValidationError(
        'Database verification queries must be an array',
        'databaseConfig.verificationQueries',
        config.verificationQueries
      );
    }

    for (const query of config.verificationQueries) {
      if (typeof query !== 'string' || query.trim().length === 0) {
        throw new ConfigValidationError(
          'All verification queries must be non-empty strings',
          'databaseConfig.verificationQueries',
          query
        );
      }
    }
  }

  /**
   * Validate production configuration
   */
  private validateProductionConfig(config: ProductionConfig): void {
    if (!config.testDataPrefix || typeof config.testDataPrefix !== 'string') {
      throw new ConfigValidationError(
        'Test data prefix must be a non-empty string',
        'productionConfig.testDataPrefix',
        config.testDataPrefix
      );
    }

    if (!Array.isArray(config.locations) || config.locations.length === 0) {
      throw new ConfigValidationError(
        'Locations must be a non-empty array',
        'productionConfig.locations',
        config.locations
      );
    }

    for (const location of config.locations) {
      if (typeof location !== 'string' || location.trim().length === 0) {
        throw new ConfigValidationError(
          'All locations must be non-empty strings',
          'productionConfig.locations',
          location
        );
      }
    }

    if (!Array.isArray(config.customerNames) || config.customerNames.length === 0) {
      throw new ConfigValidationError(
        'Customer names must be a non-empty array',
        'productionConfig.customerNames',
        config.customerNames
      );
    }

    for (const name of config.customerNames) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ConfigValidationError(
          'All customer names must be non-empty strings',
          'productionConfig.customerNames',
          name
        );
      }
    }

    if (!['preserve', 'cleanup', 'archive'].includes(config.cleanupPolicy)) {
      throw new ConfigValidationError(
        `Invalid cleanup policy: ${config.cleanupPolicy}. Valid values are: preserve, cleanup, archive`,
        'productionConfig.cleanupPolicy',
        config.cleanupPolicy
      );
    }
  }

  /**
   * Create a configuration for a specific test mode with appropriate defaults
   */
  public createModeSpecificConfig(mode: TestMode, overrides: Partial<TestConfig> = {}): TestConfig {
    const baseConfig = this.getConfig();
    
    const modeConfig: Partial<TestConfig> = {
      mode,
      timeout: this.getTimeout(mode),
      retries: this.getRetries(mode),
      ...overrides
    };

    return this.mergeConfigs(baseConfig, modeConfig) as TestConfig;
  }

  /**
   * Validate environment setup for a specific mode
   */
  public validateEnvironmentForMode(mode: TestMode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Build configuration directly from environment without validation
      const envConfig = this.loadFromEnvironment();
      const tempConfig = {
        mode,
        timeout: this.getTimeout(mode),
        retries: this.getRetries(mode),
        tags: envConfig.tags || [],
        databaseConfig: envConfig.databaseConfig || DEFAULT_DATABASE_CONFIG,
        productionConfig: envConfig.productionConfig || DEFAULT_PRODUCTION_CONFIG
      };

      if (mode === TestMode.ISOLATED || mode === TestMode.DUAL) {
        // Validate isolated mode requirements
        if (!tempConfig.databaseConfig?.backupPath || tempConfig.databaseConfig.backupPath.trim() === '') {
          errors.push('Database backup path is required for isolated testing');
        }
        
        if (!tempConfig.databaseConfig?.connectionString || tempConfig.databaseConfig.connectionString.trim() === '') {
          errors.push('Database connection string is required for isolated testing');
        }
      }

      if (mode === TestMode.PRODUCTION || mode === TestMode.DUAL) {
        // Validate production mode requirements
        if (!tempConfig.productionConfig?.testDataPrefix || tempConfig.productionConfig.testDataPrefix.trim() === '') {
          errors.push('Test data prefix is required for production testing');
        }
        
        if (!tempConfig.productionConfig?.locations?.length) {
          errors.push('Test locations are required for production testing');
        }
        
        if (!tempConfig.productionConfig?.customerNames?.length) {
          errors.push('Test customer names are required for production testing');
        }
      }

    } catch (error) {
      if (error instanceof ConfigValidationError) {
        errors.push(error.message);
      } else {
        errors.push(`Unexpected validation error: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}