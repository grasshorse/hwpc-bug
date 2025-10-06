/**
 * TestContextManager with mode detection from tags and dual-mode support
 * Manages test context, data registry, and cleanup coordination
 */

import { TestMode, TestContext } from './types';
import { TestModeDetector } from './TestModeDetector';
import { ProductionSafetyValidator } from './ProductionSafetyValidator';

export interface TestContextManagerOptions {
  enableProductionSafety?: boolean;
  autoCleanup?: boolean;
  trackDataCreation?: boolean;
}

export interface ExtendedTestContext extends TestContext {
  mode: TestMode;
  createdAt: Date;
  dataRegistry: DataRegistry;
  cleanupTasks: CleanupTask[];
  isolationPrefix: string;
}

export interface DataRegistry {
  customers: string[];
  tickets: string[];
  routes: string[];
  assignments: string[];
  locations: string[];
}

export interface CleanupTask {
  id: string;
  type: 'delete' | 'update' | 'restore';
  entityType: string;
  entityIds: string[];
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
}

export interface TestOperation {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  targetEntity?: any;
  entityName?: string;
}

/**
 * Manages test context with dual-mode detection and data tracking
 */
export class TestContextManager {
  private modeDetector: TestModeDetector;
  private productionSafetyValidator: ProductionSafetyValidator;
  private options: TestContextManagerOptions;
  private activeContexts: Map<string, ExtendedTestContext> = new Map();

  constructor(options: TestContextManagerOptions = {}) {
    this.options = {
      enableProductionSafety: true,
      autoCleanup: true,
      trackDataCreation: true,
      ...options
    };
    
    this.modeDetector = new TestModeDetector();
    this.productionSafetyValidator = new ProductionSafetyValidator();
  }

  /**
   * Initializes test context with mode detection and data registry
   */
  public async initializeContext(testName: string, tags: string[]): Promise<ExtendedTestContext> {
    // Generate unique test ID
    const testId = this.generateTestId(testName);
    
    // Detect test mode from tags and environment
    const modeResult = this.modeDetector.detectMode({ testName, tags, testId });
    const mode = modeResult.mode;

    // Create isolation prefix based on mode
    const isolationPrefix = this.generateIsolationPrefix(testId, mode);

    // Initialize data registry
    const dataRegistry: DataRegistry = {
      customers: [],
      tickets: [],
      routes: [],
      assignments: [],
      locations: []
    };

    // Create extended test context
    const context: ExtendedTestContext = {
      testName,
      tags,
      testId,
      mode,
      createdAt: new Date(),
      dataRegistry,
      cleanupTasks: [],
      isolationPrefix
    };

    // Store active context
    this.activeContexts.set(testId, context);

    console.log(`Initialized test context: ${testName} (${mode} mode) with ID: ${testId}`);
    
    return context;
  }

  /**
   * Detects test mode from tags using the existing detector
   */
  public async detectTestMode(tags: string[]): Promise<TestMode> {
    const context = { testName: 'temp', tags, testId: 'temp' };
    const result = this.modeDetector.detectMode(context);
    return result.mode;
  }

  /**
   * Registers created data in the context registry
   */
  public async registerCreatedData(testId: string, type: string, data: any[]): Promise<void> {
    const context = this.activeContexts.get(testId);
    if (!context) {
      throw new Error(`No active context found for test ID: ${testId}`);
    }

    if (!this.options.trackDataCreation) {
      return;
    }

    // Extract IDs from data objects
    const ids = data.map(item => item.id || item.identifier || item.name);
    
    // Add to appropriate registry
    switch (type.toLowerCase()) {
      case 'customers':
        context.dataRegistry.customers.push(...ids);
        break;
      case 'tickets':
        context.dataRegistry.tickets.push(...ids);
        break;
      case 'routes':
        context.dataRegistry.routes.push(...ids);
        break;
      case 'assignments':
        context.dataRegistry.assignments.push(...ids);
        break;
      case 'locations':
        context.dataRegistry.locations.push(...ids);
        break;
      default:
        console.warn(`Unknown data type for registry: ${type}`);
    }

    console.log(`Registered ${data.length} ${type} for test ${testId}`);
  }

  /**
   * Schedules cleanup task for later execution
   */
  public async scheduleCleanup(testId: string, task: Omit<CleanupTask, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const context = this.activeContexts.get(testId);
    if (!context) {
      throw new Error(`No active context found for test ID: ${testId}`);
    }

    const cleanupTask: CleanupTask = {
      ...task,
      id: `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0
    };

    context.cleanupTasks.push(cleanupTask);
    
    console.log(`Scheduled cleanup task: ${cleanupTask.type} ${cleanupTask.entityType} (${cleanupTask.entityIds.length} items)`);
  }

  /**
   * Executes all cleanup tasks for a test context
   */
  public async executeCleanup(testId: string): Promise<void> {
    const context = this.activeContexts.get(testId);
    if (!context) {
      console.warn(`No active context found for cleanup: ${testId}`);
      return;
    }

    if (!this.options.autoCleanup) {
      console.log(`Auto-cleanup disabled, skipping cleanup for test ${testId}`);
      return;
    }

    console.log(`Executing cleanup for test ${testId} (${context.cleanupTasks.length} tasks)`);

    // Sort tasks by priority (higher priority first)
    const sortedTasks = [...context.cleanupTasks].sort((a, b) => b.priority - a.priority);

    const results: { task: CleanupTask; success: boolean; error?: string }[] = [];

    for (const task of sortedTasks) {
      try {
        // Validate production safety if enabled
        if (this.options.enableProductionSafety && context.mode === TestMode.PRODUCTION) {
          await this.validateProductionSafety({
            type: task.type as any,
            entityType: task.entityType,
            entityName: task.entityIds.join(', ')
          });
        }

        // Execute cleanup task (placeholder - would implement actual cleanup)
        await this.executeCleanupTask(task);
        
        results.push({ task, success: true });
        console.log(`✓ Completed cleanup task: ${task.type} ${task.entityType}`);
        
      } catch (error) {
        results.push({ task, success: false, error: error.message });
        console.error(`✗ Failed cleanup task: ${task.type} ${task.entityType} - ${error.message}`);
        
        // Retry logic
        if (task.retryCount < task.maxRetries) {
          task.retryCount++;
          console.log(`Retrying cleanup task (attempt ${task.retryCount}/${task.maxRetries})`);
          // Would implement retry logic here
        }
      }
    }

    // Remove context after cleanup
    this.activeContexts.delete(testId);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Cleanup completed: ${successCount}/${results.length} tasks successful`);
  }

  /**
   * Validates production safety for operations
   */
  public async validateProductionSafety(operation: TestOperation): Promise<void> {
    if (!this.options.enableProductionSafety) {
      return;
    }

    this.productionSafetyValidator.validateTestOperation(operation, TestMode.PRODUCTION);
  }

  /**
   * Gets active test context by ID
   */
  public getContext(testId: string): ExtendedTestContext | undefined {
    return this.activeContexts.get(testId);
  }

  /**
   * Gets all active contexts
   */
  public getAllActiveContexts(): ExtendedTestContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Cleans up all active contexts (emergency cleanup)
   */
  public async cleanupAllContexts(): Promise<void> {
    console.log(`Emergency cleanup: ${this.activeContexts.size} active contexts`);
    
    const cleanupPromises = Array.from(this.activeContexts.keys()).map(testId => 
      this.executeCleanup(testId).catch(error => 
        console.error(`Failed to cleanup context ${testId}:`, error.message)
      )
    );

    await Promise.all(cleanupPromises);
  }

  /**
   * Generates unique test ID
   */
  private generateTestId(testName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    const sanitizedName = testName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `test_${timestamp}_${sanitizedName}_${random}`;
  }

  /**
   * Generates isolation prefix based on mode
   */
  private generateIsolationPrefix(testId: string, mode: TestMode): string {
    if (mode === TestMode.PRODUCTION) {
      return 'looneyTunesTest';
    } else {
      // Use timestamp-based prefix for isolation
      const timestamp = Date.now();
      const shortId = testId.split('_').pop() || 'unknown';
      return `test_${timestamp}_${shortId}`;
    }
  }

  /**
   * Executes individual cleanup task (placeholder implementation)
   */
  private async executeCleanupTask(task: CleanupTask): Promise<void> {
    // This would implement actual database cleanup operations
    // For now, just simulate the operation
    console.log(`Executing ${task.type} operation on ${task.entityType}: ${task.entityIds.join(', ')}`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Gets current options
   */
  public getOptions(): TestContextManagerOptions {
    return { ...this.options };
  }

  /**
   * Updates options
   */
  public updateOptions(newOptions: Partial<TestContextManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}