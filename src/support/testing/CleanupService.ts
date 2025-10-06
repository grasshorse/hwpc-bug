/**
 * CleanupService with production safety validation
 * Manages test data cleanup with retry logic and production safety checks
 */

import { TestMode } from './types';
import { ProductionSafetyValidator, TestOperation } from './ProductionSafetyValidator';

export interface CleanupTask {
  id: string;
  type: 'delete' | 'update' | 'restore';
  entityType: string;
  entityIds: string[];
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  testId: string;
  mode: TestMode;
}

export interface CleanupResult {
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  errors: CleanupError[];
  duration: number;
}

export interface CleanupError {
  taskId: string;
  entityType: string;
  entityIds: string[];
  error: string;
  retryCount: number;
  timestamp: Date;
}

export interface CleanupServiceOptions {
  enableProductionSafety?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  enableLogging?: boolean;
}

/**
 * Manages cleanup of test data with production safety validation
 */
export class CleanupService {
  private productionSafetyValidator: ProductionSafetyValidator;
  private options: Required<CleanupServiceOptions>;
  private registeredTasks: Map<string, CleanupTask[]> = new Map();
  private executionHistory: Map<string, CleanupResult> = new Map();

  constructor(options: CleanupServiceOptions = {}) {
    this.options = {
      enableProductionSafety: true,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      enableLogging: true,
      ...options
    };
    
    this.productionSafetyValidator = new ProductionSafetyValidator();
  }

  /**
   * Registers a cleanup task for later execution
   */
  public async registerCleanupTask(task: Omit<CleanupTask, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const cleanupTask: CleanupTask = {
      ...task,
      id: this.generateTaskId(),
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: task.maxRetries || this.options.maxRetries
    };

    // Validate production safety if enabled
    if (this.options.enableProductionSafety && task.mode === TestMode.PRODUCTION) {
      await this.validateTaskSafety(cleanupTask);
    }

    // Add to registry
    if (!this.registeredTasks.has(task.testId)) {
      this.registeredTasks.set(task.testId, []);
    }
    
    this.registeredTasks.get(task.testId)!.push(cleanupTask);

    if (this.options.enableLogging) {
      console.log(`Registered cleanup task: ${cleanupTask.type} ${cleanupTask.entityType} (${cleanupTask.entityIds.length} items) for test ${task.testId}`);
    }
  }

  /**
   * Executes cleanup for a specific test
   */
  public async executeCleanup(testId: string): Promise<CleanupResult> {
    const startTime = Date.now();
    const tasks = this.registeredTasks.get(testId) || [];
    
    if (tasks.length === 0) {
      if (this.options.enableLogging) {
        console.log(`No cleanup tasks found for test ${testId}`);
      }
      
      return {
        success: true,
        completedTasks: 0,
        failedTasks: 0,
        errors: [],
        duration: Date.now() - startTime
      };
    }

    if (this.options.enableLogging) {
      console.log(`Executing cleanup for test ${testId} (${tasks.length} tasks)`);
    }

    // Sort tasks by priority (higher priority first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    const results: { task: CleanupTask; success: boolean; error?: CleanupError }[] = [];

    // Execute tasks in batches
    for (let i = 0; i < sortedTasks.length; i += this.options.batchSize) {
      const batch = sortedTasks.slice(i, i + this.options.batchSize);
      const batchResults = await this.executeBatch(batch);
      results.push(...batchResults);
    }

    // Compile final result
    const completedTasks = results.filter(r => r.success).length;
    const failedTasks = results.filter(r => !r.success).length;
    const errors = results.filter(r => r.error).map(r => r.error!);

    const result: CleanupResult = {
      success: failedTasks === 0,
      completedTasks,
      failedTasks,
      errors,
      duration: Date.now() - startTime
    };

    // Store execution history
    this.executionHistory.set(testId, result);

    // Remove completed tasks from registry
    if (result.success) {
      this.registeredTasks.delete(testId);
    } else {
      // Keep failed tasks for potential retry
      const failedTaskIds = errors.map(e => e.taskId);
      const remainingTasks = tasks.filter(t => failedTaskIds.includes(t.id));
      this.registeredTasks.set(testId, remainingTasks);
    }

    if (this.options.enableLogging) {
      console.log(`Cleanup completed for test ${testId}: ${completedTasks}/${tasks.length} tasks successful (${result.duration}ms)`);
    }

    return result;
  }

  /**
   * Forces cleanup of all registered tasks (emergency cleanup)
   */
  public async forceCleanupAll(): Promise<CleanupResult> {
    const startTime = Date.now();
    
    if (this.options.enableLogging) {
      console.log(`Emergency cleanup: ${this.registeredTasks.size} test contexts with tasks`);
    }

    const allResults: CleanupResult[] = [];

    // Execute cleanup for each test context
    for (const testId of this.registeredTasks.keys()) {
      try {
        const result = await this.executeCleanup(testId);
        allResults.push(result);
      } catch (error) {
        if (this.options.enableLogging) {
          console.error(`Failed to cleanup test ${testId}:`, error.message);
        }
        
        allResults.push({
          success: false,
          completedTasks: 0,
          failedTasks: 1,
          errors: [{
            taskId: 'unknown',
            entityType: 'unknown',
            entityIds: [],
            error: error.message,
            retryCount: 0,
            timestamp: new Date()
          }],
          duration: 0
        });
      }
    }

    // Aggregate results
    const totalCompleted = allResults.reduce((sum, r) => sum + r.completedTasks, 0);
    const totalFailed = allResults.reduce((sum, r) => sum + r.failedTasks, 0);
    const allErrors = allResults.flatMap(r => r.errors);

    return {
      success: totalFailed === 0,
      completedTasks: totalCompleted,
      failedTasks: totalFailed,
      errors: allErrors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Validates cleanup completion for a test
   */
  public async validateCleanupCompletion(testId: string): Promise<boolean> {
    const result = this.executionHistory.get(testId);
    
    if (!result) {
      // No cleanup executed yet
      return false;
    }

    // Check if cleanup was successful
    if (!result.success) {
      return false;
    }

    // Check if there are any remaining tasks
    const remainingTasks = this.registeredTasks.get(testId);
    return !remainingTasks || remainingTasks.length === 0;
  }

  /**
   * Gets cleanup status for a test
   */
  public getCleanupStatus(testId: string): {
    hasTasks: boolean;
    taskCount: number;
    lastExecution?: CleanupResult;
    isComplete: boolean;
  } {
    const tasks = this.registeredTasks.get(testId) || [];
    const lastExecution = this.executionHistory.get(testId);
    
    return {
      hasTasks: tasks.length > 0,
      taskCount: tasks.length,
      lastExecution,
      isComplete: tasks.length === 0 && lastExecution?.success === true
    };
  }

  /**
   * Retries failed cleanup tasks for a test
   */
  public async retryFailedCleanup(testId: string): Promise<CleanupResult> {
    const tasks = this.registeredTasks.get(testId) || [];
    const failedTasks = tasks.filter(t => t.retryCount < t.maxRetries);

    if (failedTasks.length === 0) {
      if (this.options.enableLogging) {
        console.log(`No failed tasks to retry for test ${testId}`);
      }
      
      return {
        success: true,
        completedTasks: 0,
        failedTasks: 0,
        errors: [],
        duration: 0
      };
    }

    if (this.options.enableLogging) {
      console.log(`Retrying ${failedTasks.length} failed cleanup tasks for test ${testId}`);
    }

    // Increment retry count
    failedTasks.forEach(task => task.retryCount++);

    // Execute retry
    return await this.executeCleanup(testId);
  }

  /**
   * Executes a batch of cleanup tasks
   */
  private async executeBatch(tasks: CleanupTask[]): Promise<{ task: CleanupTask; success: boolean; error?: CleanupError }[]> {
    const results: { task: CleanupTask; success: boolean; error?: CleanupError }[] = [];

    for (const task of tasks) {
      try {
        // Validate production safety
        if (this.options.enableProductionSafety && task.mode === TestMode.PRODUCTION) {
          await this.validateTaskSafety(task);
        }

        // Execute the cleanup task
        await this.executeCleanupTask(task);
        
        results.push({ task, success: true });
        
        if (this.options.enableLogging) {
          console.log(`✓ Completed cleanup task: ${task.type} ${task.entityType} (${task.entityIds.length} items)`);
        }
        
      } catch (error) {
        const cleanupError: CleanupError = {
          taskId: task.id,
          entityType: task.entityType,
          entityIds: task.entityIds,
          error: error.message,
          retryCount: task.retryCount,
          timestamp: new Date()
        };
        
        results.push({ task, success: false, error: cleanupError });
        
        if (this.options.enableLogging) {
          console.error(`✗ Failed cleanup task: ${task.type} ${task.entityType} - ${error.message}`);
        }
      }

      // Add delay between tasks to avoid overwhelming the system
      if (this.options.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay / 10));
      }
    }

    return results;
  }

  /**
   * Validates task safety using ProductionSafetyValidator
   */
  private async validateTaskSafety(task: CleanupTask): Promise<void> {
    const operations: TestOperation[] = task.entityIds.map(entityId => ({
      type: task.type as any,
      entityType: task.entityType,
      entityName: entityId
    }));

    // Validate each operation
    for (const operation of operations) {
      const validation = this.productionSafetyValidator.validateTestOperation(operation, task.mode);
      
      if (!validation.isValid) {
        throw new Error(`Production safety validation failed: ${validation.issues?.join(', ')}`);
      }

      if (validation.riskLevel === 'critical' || validation.riskLevel === 'high') {
        throw new Error(`Operation risk level too high: ${validation.riskLevel}`);
      }
    }

    // Validate bulk operation
    const bulkValidation = this.productionSafetyValidator.validateBulkOperation(operations, task.mode);
    if (!bulkValidation.isValid) {
      throw new Error(`Bulk operation validation failed: ${bulkValidation.issues?.join(', ')}`);
    }
  }

  /**
   * Executes individual cleanup task (placeholder implementation)
   */
  private async executeCleanupTask(task: CleanupTask): Promise<void> {
    // This would implement actual database cleanup operations
    // For now, just simulate the operation with validation
    
    if (this.options.enableLogging) {
      console.log(`Executing ${task.type} operation on ${task.entityType}: ${task.entityIds.join(', ')}`);
    }

    // Simulate async operation with some validation
    await new Promise(resolve => setTimeout(resolve, 50));

    // Validate that we're not trying to delete too many items at once
    if (task.type === 'delete' && task.entityIds.length > 100) {
      throw new Error(`Bulk delete operation too large: ${task.entityIds.length} items`);
    }

    // Validate entity IDs look like test data
    for (const entityId of task.entityIds) {
      if (!this.looksLikeTestData(entityId)) {
        throw new Error(`Entity ID "${entityId}" doesn't look like test data`);
      }
    }
  }

  /**
   * Checks if entity ID looks like test data
   */
  private looksLikeTestData(entityId: string): boolean {
    const testPatterns = [
      /test_/i,
      /looneyTunesTest/i,
      /^[0-9]+_test/i,
      /_test_[0-9]+/i
    ];

    return testPatterns.some(pattern => pattern.test(entityId));
  }

  /**
   * Generates unique task ID
   */
  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cleanup_${timestamp}_${random}`;
  }

  /**
   * Gets all registered tasks
   */
  public getAllRegisteredTasks(): Map<string, CleanupTask[]> {
    return new Map(this.registeredTasks);
  }

  /**
   * Gets execution history
   */
  public getExecutionHistory(): Map<string, CleanupResult> {
    return new Map(this.executionHistory);
  }

  /**
   * Clears execution history
   */
  public clearExecutionHistory(): void {
    this.executionHistory.clear();
  }

  /**
   * Gets current options
   */
  public getOptions(): Required<CleanupServiceOptions> {
    return { ...this.options };
  }

  /**
   * Updates options
   */
  public updateOptions(newOptions: Partial<CleanupServiceOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Gets statistics about cleanup operations
   */
  public getStatistics(): {
    totalTests: number;
    totalTasks: number;
    completedCleanups: number;
    failedCleanups: number;
    averageTasksPerTest: number;
    averageCleanupDuration: number;
  } {
    const totalTests = this.registeredTasks.size + this.executionHistory.size;
    const totalTasks = Array.from(this.registeredTasks.values()).reduce((sum, tasks) => sum + tasks.length, 0);
    const completedCleanups = Array.from(this.executionHistory.values()).filter(r => r.success).length;
    const failedCleanups = Array.from(this.executionHistory.values()).filter(r => !r.success).length;
    
    const allResults = Array.from(this.executionHistory.values());
    const averageCleanupDuration = allResults.length > 0 
      ? allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length 
      : 0;
    
    const averageTasksPerTest = totalTests > 0 ? totalTasks / totalTests : 0;

    return {
      totalTests,
      totalTasks,
      completedCleanups,
      failedCleanups,
      averageTasksPerTest,
      averageCleanupDuration
    };
  }
}