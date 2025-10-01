/**
 * Data Context Factory
 * 
 * Factory class for creating appropriate data context managers based on test mode
 */

import { DataContextManager } from './DataContextManager';
import { DatabaseContextManager } from './DatabaseContextManager';
import { ProductionTestDataManager } from './ProductionTestDataManager';
import { TestMode } from './types';

/**
 * Factory for creating data context managers
 */
export class DataContextFactory {
  private static managers: Map<TestMode, DataContextManager> = new Map();
  
  /**
   * Gets the appropriate data context manager for the specified mode
   */
  static getManager(mode: TestMode): DataContextManager {
    // Return existing manager if available
    if (this.managers.has(mode)) {
      return this.managers.get(mode)!;
    }
    
    // Create new manager based on mode
    let manager: DataContextManager;
    
    switch (mode) {
      case TestMode.ISOLATED:
        manager = new DatabaseContextManager();
        break;
      case TestMode.PRODUCTION:
        manager = new ProductionTestDataManager();
        break;
      case TestMode.DUAL:
        // For dual mode, we'll need to determine which manager to use at runtime
        // For now, default to isolated mode
        manager = new DatabaseContextManager();
        break;
      default:
        throw new Error(`Unsupported test mode: ${mode}`);
    }
    
    // Cache the manager
    this.managers.set(mode, manager);
    
    return manager;
  }
  
  /**
   * Gets all available managers
   */
  static getAllManagers(): Map<TestMode, DataContextManager> {
    return new Map(this.managers);
  }
  
  /**
   * Clears all cached managers (useful for testing)
   */
  static clearManagers(): void {
    this.managers.clear();
  }
  
  /**
   * Registers a custom manager for a specific mode
   */
  static registerManager(mode: TestMode, manager: DataContextManager): void {
    this.managers.set(mode, manager);
  }
  
  /**
   * Gets supported modes
   */
  static getSupportedModes(): TestMode[] {
    return [TestMode.ISOLATED, TestMode.PRODUCTION, TestMode.DUAL];
  }
}