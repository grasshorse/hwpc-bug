/**
 * Context-Aware Page Object Interfaces
 * 
 * Defines interfaces for page objects that can work with different data contexts
 * in both isolated and production testing modes.
 */

import { DataContext, TestMode } from '../types';

/**
 * Interface for page objects that are aware of the testing context
 */
export interface ContextAwarePageObject {
  /**
   * Sets the data context for the page object
   */
  setDataContext(context: DataContext): void;
  
  /**
   * Gets the current data context
   */
  getDataContext(): DataContext | null;
  
  /**
   * Gets the current testing mode
   */
  getTestMode(): TestMode | null;
  
  /**
   * Validates that the page object can work with the current context
   */
  validateContext(): Promise<boolean>;
}

/**
 * Interface for page objects that can adapt their behavior based on test mode
 */
export interface ModeAdaptivePageObject extends ContextAwarePageObject {
  /**
   * Gets mode-specific selectors for elements
   */
  getModeSpecificSelector(baseSelector: string, elementName: string): string;
  
  /**
   * Performs mode-specific element validation
   */
  validateModeSpecificElements(): Promise<boolean>;
  
  /**
   * Gets debugging information specific to the current mode
   */
  getModeSpecificDebugInfo(): Promise<ModeSpecificDebugInfo>;
}

/**
 * Interface for debugging information specific to testing modes
 */
export interface ModeSpecificDebugInfo {
  mode: TestMode;
  dataContext: {
    hasTestData: boolean;
    testDataCount: number;
    testDataTypes: string[];
  };
  selectors: {
    attempted: string[];
    successful: string[];
    failed: string[];
  };
  elements: {
    found: number;
    expected: number;
    modeSpecific: number;
  };
  errors: string[];
  timestamp: Date;
}

/**
 * Configuration for context-aware element selection
 */
export interface ContextAwareElementConfig {
  baseSelector: string;
  isolatedModeSelector?: string;
  productionModeSelector?: string;
  fallbackSelector?: string;
  elementName: string;
  isRequired: boolean;
  modeSpecific: {
    [TestMode.ISOLATED]?: {
      selector: string;
      validation?: (element: any) => Promise<boolean>;
    };
    [TestMode.PRODUCTION]?: {
      selector: string;
      validation?: (element: any) => Promise<boolean>;
    };
  };
}

/**
 * Error class for context-aware page object failures
 */
export class ContextAwarePageObjectError extends Error {
  constructor(
    public pageName: string,
    public mode: TestMode,
    public contextInfo: any,
    public details: string,
    public debugInfo?: ModeSpecificDebugInfo
  ) {
    super(`Context-aware page object error in ${pageName} (${mode}): ${details}`);
    this.name = 'ContextAwarePageObjectError';
  }
}