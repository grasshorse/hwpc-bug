/**
 * Test Data Manager
 * Orchestrates test data setup and cleanup for location assignment testing
 */

import { 
  LocationTestScenario,
  ValidationResult,
  TestDataContext,
  DatabaseResetOptions,
  TestDataCleanupOptions,
  SafetyCheckResult
} from './location-assignment-types';
import { TestMode } from './types';
import { GeographicTestDataGenerator } from './GeographicTestDataGenerator';
import { ProductionTestDataManager, ProductionTestDataConfig } from './ProductionTestDataManager';
import { ProductionDataValidator } from './ProductionDataValidator';
import { ProductionSafetyGuard, SafetyCheckResult as ProductionSafetyCheckResult } from './ProductionSafetyGuard';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestDataManagerConfig {
  mode: TestMode;
  databaseConfig?: {
    connectionString?: string;
    resetBetweenScenarios?: boolean;
    useTransactions?: boolean;
  };
  productionConfig?: ProductionTestDataConfig;
  isolatedConfig?: {
    useInMemoryDatabase?: boolean;
    preserveDataBetweenTests?: boolean;
  };
  cleanupConfig?: TestDataCleanupOptions;
}

export interface ScenarioSetupResult {
  success: boolean;
  context: TestDataContext | null;
  errors: string[];
  warnings: string[];
  setupTime: number;
}

export class TestDataManager {
  private config: TestDataManagerConfig;
  private productionManager?: ProductionTestDataManager;
  private safetyGuard?: ProductionSafetyGuard;
  private currentContext?: TestDataContext;

  constructor(config: TestDataManagerConfig) {
    this.config = config;
    
    if (config.mode === TestMode.PRODUCTION) {
      this.productionManager = new ProductionTestDataManager(config.productionConfig);
      this.safetyGuard = new ProductionSafetyGuard();
    }
  }

  /**
   * Sets up test scenario with appropriate data based on mode
   */
  public async setupTestScenario(
    scenarioName: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment',
    options?: {
      forceReset?: boolean;
      validateData?: boolean;
      skipSafetyChecks?: boolean;
    }
  ): Promise<ScenarioSetupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log(`Setting up test scenario: ${scenarioName} in ${this.config.mode} mode`);

      // Reset database if configured or forced
      if (this.config.databaseConfig?.resetBetweenScenarios || options?.forceReset) {
        await this.resetDatabase();
      }

      let context: TestDataContext;

      if (this.config.mode === TestMode.ISOLATED) {
        context = await this.setupIsolatedScenario(scenarioName);
      } else {
        context = await this.setupProductionScenario(scenarioName, options);
      }

      // Validate setup data if requested
      if (options?.validateData !== false) {
        try {
          const validation = await this.validateScenarioSetup(context);
          if (!validation.isValid) {
            // In isolated mode, validation failures are warnings, not errors
            if (this.config.mode === TestMode.ISOLATED) {
              warnings.push(...(validation.issues || []));
            } else {
              errors.push(...(validation.issues || []));
            }
          }
        } catch (validationError) {
          warnings.push(`Validation error: ${validationError.message}`);
        }
      }

      // Store current context
      this.currentContext = context;

      const setupTime = Date.now() - startTime;
      console.log(`Scenario setup completed in ${setupTime}ms`);

      return {
        success: errors.length === 0,
        context: errors.length === 0 ? context : null,
        errors,
        warnings,
        setupTime
      };

    } catch (error) {
      errors.push(`Setup failed: ${error.message}`);
      return {
        success: false,
        context: null,
        errors,
        warnings,
        setupTime: Date.now() - startTime
      };
    }
  }

  /**
   * Sets up isolated mode scenario with controlled data
   */
  private async setupIsolatedScenario(
    scenarioName: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment'
  ): Promise<TestDataContext> {
    console.log(`Setting up isolated scenario: ${scenarioName}`);

    // Load SQL script for scenario
    await this.loadScenarioSqlScript(scenarioName);

    // Generate test scenario data
    const scenario = GeographicTestDataGenerator.generateTestScenario(
      scenarioName,
      TestMode.ISOLATED
    );

    // Load baseline data
    await this.loadBaselineData();

    // Insert scenario-specific data
    await this.insertScenarioData(scenario);

    return {
      mode: TestMode.ISOLATED,
      scenario: scenarioName,
      tickets: scenario.tickets,
      routes: scenario.routes,
      expectedResults: {
        behavior: scenario.expectedBehavior,
        validationRules: scenario.validationRules
      },
      metadata: {
        setupAt: new Date(),
        dataSource: 'generated',
        resetRequired: true
      }
    };
  }

  /**
   * Sets up production mode scenario with real data validation
   */
  private async setupProductionScenario(
    scenarioName: 'optimal-assignment' | 'capacity-constraints' | 'bulk-assignment',
    options?: { skipSafetyChecks?: boolean }
  ): Promise<TestDataContext> {
    if (!this.productionManager || !this.safetyGuard) {
      throw new Error('Production manager not initialized');
    }

    console.log(`Setting up production scenario: ${scenarioName}`);

    // Safety checks
    if (!options?.skipSafetyChecks) {
      const safetyCheck = await this.performProductionSafetyChecks();
      if (!safetyCheck.isValid) {
        throw new Error(`Safety checks failed: ${safetyCheck.issues?.join(', ')}`);
      }
    }

    // Ensure production test data exists
    const ensureResult = await this.productionManager.ensureTestDataExists(scenarioName);
    if (!ensureResult.isValid) {
      throw new Error(`Production test data setup failed: ${ensureResult.issues?.join(', ')}`);
    }

    // Get validated production test data
    const testData = await this.productionManager.getProductionTestData(scenarioName);

    return {
      mode: TestMode.PRODUCTION,
      scenario: scenarioName,
      tickets: testData.tickets,
      routes: testData.routes,
      expectedResults: null, // Results vary in production
      metadata: {
        setupAt: new Date(),
        dataSource: 'production',
        resetRequired: false,
        testDataVersion: testData.metadata?.version
      }
    };
  }

  /**
   * Resets database to clean state
   */
  public async resetDatabase(options?: DatabaseResetOptions): Promise<void> {
    console.log('Resetting database for test data');

    const resetOptions: DatabaseResetOptions = {
      dropTables: false,
      recreateSchema: false,
      preserveBaseline: true,
      ...options
    };

    try {
      if (this.config.mode === TestMode.ISOLATED) {
        await this.resetIsolatedDatabase(resetOptions);
      } else {
        await this.resetProductionDatabase(resetOptions);
      }

      console.log('Database reset completed successfully');
    } catch (error) {
      console.error('Database reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Resets isolated mode database
   */
  private async resetIsolatedDatabase(options: DatabaseResetOptions): Promise<void> {
    if (options.dropTables) {
      await this.executeScript('cleanup-all-tables.sql');
    } else {
      // Just clear test data
      await this.executeScript('cleanup-test-data.sql');
    }

    if (options.recreateSchema || options.dropTables) {
      await this.loadBaselineData();
    }
  }

  /**
   * Resets production database (with safety guards)
   */
  private async resetProductionDatabase(options: DatabaseResetOptions): Promise<void> {
    if (!this.safetyGuard) {
      throw new Error('Safety guard not initialized for production reset');
    }

    // Extra safety check for production
    const safetyCheck = await this.safetyGuard.validateDatabaseReset(options);
    if (!safetyCheck.isSafe) {
      throw new Error(`Production database reset blocked: ${safetyCheck.issues.join(', ')}`);
    }

    // Only clean test data in production
    await this.cleanupProductionTestData();
  }

  /**
   * Cleans up test data after scenario completion
   */
  public async cleanupTestData(options?: TestDataCleanupOptions): Promise<void> {
    const cleanupOptions: TestDataCleanupOptions = {
      removeAssignments: true,
      removeTickets: true,
      preserveRoutes: this.config.mode === TestMode.PRODUCTION, // Preserve routes in production by default
      preserveLocations: this.config.mode === TestMode.PRODUCTION, // Preserve locations in production by default
      ...options
    };

    console.log('Cleaning up test data');

    try {
      if (this.config.mode === TestMode.ISOLATED) {
        await this.cleanupIsolatedTestData(cleanupOptions);
      } else {
        await this.cleanupProductionTestData(cleanupOptions);
      }

      // Clear current context
      this.currentContext = undefined;

      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Test data cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Cleans up isolated mode test data
   */
  private async cleanupIsolatedTestData(options: TestDataCleanupOptions): Promise<void> {
    const cleanupSteps: string[] = [];

    if (options.removeAssignments) {
      cleanupSteps.push('DELETE FROM test_assignments WHERE created_at >= ?');
    }

    if (options.removeTickets) {
      cleanupSteps.push('DELETE FROM test_tickets WHERE created_at >= ?');
    }

    if (!options.preserveRoutes) {
      cleanupSteps.push('DELETE FROM test_routes WHERE created_at >= ?');
    }

    if (!options.preserveLocations) {
      cleanupSteps.push('DELETE FROM test_locations WHERE created_at >= ?');
    }

    // Execute cleanup steps
    for (const step of cleanupSteps) {
      await this.executeQuery(step, [this.currentContext?.metadata?.setupAt || new Date()]);
    }
  }

  /**
   * Cleans up production test data with safety checks
   */
  private async cleanupProductionTestData(options?: TestDataCleanupOptions): Promise<void> {
    if (!this.safetyGuard) {
      throw new Error('Safety guard not initialized');
    }

    // Validate cleanup is safe
    const safetyCheck = await this.safetyGuard.validateCleanupOperation(options);
    if (!safetyCheck.isSafe) {
      throw new Error(`Cleanup blocked: ${safetyCheck.issues.join(', ')}`);
    }

    // Only clean data with looneyTunesTest identifier
    await this.executeQuery(
      "DELETE FROM test_assignments WHERE ticket_id IN (SELECT id FROM test_tickets WHERE customer_name LIKE '%looneyTunesTest%')"
    );
    
    await this.executeQuery(
      "DELETE FROM test_tickets WHERE customer_name LIKE '%looneyTunesTest%'"
    );

    if (!options?.preserveRoutes) {
      await this.executeQuery(
        "DELETE FROM test_routes WHERE name LIKE '%looneyTunesTest%'"
      );
    }
  }

  /**
   * Loads baseline test data from SQL script
   */
  private async loadBaselineData(): Promise<void> {
    console.log('Loading baseline test data');
    await this.executeScript('baseline-location-data.sql');
  }

  /**
   * Loads scenario-specific SQL script
   */
  private async loadScenarioSqlScript(scenarioName: string): Promise<void> {
    const scriptName = `scenario-${scenarioName}.sql`;
    const scriptExists = await this.scriptExists(scriptName);
    
    if (scriptExists) {
      console.log(`Loading scenario script: ${scriptName}`);
      await this.executeScript(scriptName);
    } else {
      console.log(`No specific script found for scenario: ${scenarioName}`);
    }
  }

  /**
   * Inserts generated scenario data into database
   */
  private async insertScenarioData(scenario: LocationTestScenario): Promise<void> {
    console.log(`Inserting scenario data: ${scenario.tickets.length} tickets, ${scenario.routes.length} routes`);

    // Insert tickets
    for (const ticket of scenario.tickets) {
      await this.insertTicket(ticket);
    }

    // Insert routes (if not already present)
    for (const route of scenario.routes) {
      await this.insertRoute(route);
    }
  }

  /**
   * Validates scenario setup
   */
  private async validateScenarioSetup(context: TestDataContext): Promise<ValidationResult> {
    const issues: string[] = [];

    try {
      // Validate tickets
      for (const ticket of context.tickets) {
        const validation = ProductionDataValidator.validateTestTicket(ticket);
        if (!validation.isValid) {
          issues.push(`Ticket ${ticket.id}: ${validation.issues?.join(', ')}`);
        }
      }

      // Validate routes
      for (const route of context.routes) {
        const validation = ProductionDataValidator.validateTestRoute(route);
        if (!validation.isValid) {
          issues.push(`Route ${route.id}: ${validation.issues?.join(', ')}`);
        }
      }

      // Mode-specific validation
      if (context.mode === TestMode.PRODUCTION && this.safetyGuard) {
        const safetyValidation = await this.safetyGuard.validateTestDataSafety({
          tickets: context.tickets,
          routes: context.routes
        });
        if (!safetyValidation.isSafe) {
          issues.push(...safetyValidation.issues);
        }
      }

    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Performs production safety checks
   */
  private async performProductionSafetyChecks(): Promise<ValidationResult> {
    if (!this.safetyGuard) {
      return { isValid: false, issues: ['Safety guard not initialized'] };
    }

    return await this.safetyGuard.performPreSetupSafetyCheck();
  }

  /**
   * Executes SQL script from file
   */
  private async executeScript(scriptName: string): Promise<void> {
    const scriptPath = path.join(__dirname, 'sql', scriptName);
    
    try {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');
      await this.executeQuery(scriptContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Script not found: ${scriptName}`);
      } else {
        throw new Error(`Failed to execute script ${scriptName}: ${error.message}`);
      }
    }
  }

  /**
   * Checks if SQL script exists
   */
  private async scriptExists(scriptName: string): Promise<boolean> {
    const scriptPath = path.join(__dirname, 'sql', scriptName);
    
    try {
      await fs.access(scriptPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Executes SQL query (placeholder implementation)
   */
  private async executeQuery(query: string, params?: any[]): Promise<any> {
    // This would implement actual database execution
    // For now, just logging the query
    console.log(`Executing query: ${query.substring(0, 100)}...`);
    if (params) {
      console.log(`Parameters: ${JSON.stringify(params)}`);
    }
    
    // Placeholder return
    return { affectedRows: 0 };
  }

  /**
   * Inserts ticket into database (placeholder implementation)
   */
  private async insertTicket(ticket: any): Promise<void> {
    const query = `
      INSERT INTO test_tickets (id, customer_id, customer_name, latitude, longitude, address, priority, service_type, created_at, is_test_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.executeQuery(query, [
      ticket.id,
      ticket.customerId,
      ticket.customerName,
      ticket.location.lat,
      ticket.location.lng,
      ticket.address,
      ticket.priority,
      ticket.serviceType,
      ticket.createdAt,
      ticket.isTestData
    ]);
  }

  /**
   * Inserts route into database (placeholder implementation)
   */
  private async insertRoute(route: any): Promise<void> {
    const query = `
      INSERT OR IGNORE INTO test_routes (id, name, capacity, current_load, start_time, end_time, days_of_week, technician_id, technician_name, is_test_route, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.executeQuery(query, [
      route.id,
      route.name,
      route.capacity,
      route.currentLoad,
      route.schedule.startTime,
      route.schedule.endTime,
      JSON.stringify(route.schedule.days),
      route.technicianId,
      route.technicianName,
      route.isTestRoute,
      new Date()
    ]);
  }

  /**
   * Gets current test data context
   */
  public getCurrentContext(): TestDataContext | undefined {
    return this.currentContext;
  }

  /**
   * Gets configuration
   */
  public getConfig(): TestDataManagerConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  public updateConfig(newConfig: Partial<TestDataManagerConfig>): void {
    const oldMode = this.config.mode;
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize managers if mode changed
    if (newConfig.mode && newConfig.mode !== oldMode) {
      if (newConfig.mode === TestMode.PRODUCTION) {
        this.productionManager = new ProductionTestDataManager(this.config.productionConfig);
        this.safetyGuard = new ProductionSafetyGuard();
      } else {
        this.productionManager = undefined;
        this.safetyGuard = undefined;
      }
    }
  }
}