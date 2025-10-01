/**
 * Context-Aware Base Page
 * 
 * Extends the existing BasePage with context awareness capabilities
 * for dual testing architecture support.
 */

import BasePage from '../../../hwpc/pages/base/BasePage';
import UIActions from '../../playwright/actions/UIActions';
import { 
  ContextAwarePageObject, 
  ModeAdaptivePageObject, 
  ModeSpecificDebugInfo,
  ContextAwareElementConfig,
  ContextAwarePageObjectError
} from '../interfaces/ContextAwarePageObject';
import { DataContext, TestMode } from '../types';

/**
 * Base class for context-aware page objects
 */
export abstract class ContextAwareBasePage extends BasePage implements ModeAdaptivePageObject {
  protected dataContext: DataContext | null = null;
  protected modeSpecificSelectors: Map<string, ContextAwareElementConfig> = new Map();
  protected debugInfo: ModeSpecificDebugInfo | null = null;

  constructor(web: UIActions) {
    super(web);
  }

  // ===== CONTEXT MANAGEMENT METHODS =====

  /**
   * Sets the data context for the page object
   */
  public setDataContext(context: DataContext): void {
    this.dataContext = context;
    console.log(`Data context set for ${this.constructor.name}: mode=${context.mode}`);
    
    // Initialize mode-specific configurations
    this.initializeModeSpecificConfigurations();
  }

  /**
   * Gets the current data context
   */
  public getDataContext(): DataContext | null {
    return this.dataContext;
  }

  /**
   * Gets the current testing mode
   */
  public getTestMode(): TestMode | null {
    return this.dataContext?.mode || null;
  }

  /**
   * Validates that the page object can work with the current context
   */
  public async validateContext(): Promise<boolean> {
    if (!this.dataContext) {
      console.log(`No data context set for ${this.constructor.name}`);
      return false;
    }

    try {
      // Validate that test data is available
      const hasTestData = this.dataContext.testData && 
        (this.dataContext.testData.customers.length > 0 ||
         this.dataContext.testData.routes.length > 0 ||
         this.dataContext.testData.tickets.length > 0);

      if (!hasTestData) {
        console.log(`No test data available in context for ${this.constructor.name}`);
        return false;
      }

      // Validate mode-specific requirements
      return await this.validateModeSpecificRequirements();

    } catch (error) {
      console.log(`Context validation failed for ${this.constructor.name}: ${error.message}`);
      return false;
    }
  }

  // ===== MODE-ADAPTIVE METHODS =====

  /**
   * Gets mode-specific selectors for elements
   */
  public getModeSpecificSelector(baseSelector: string, elementName: string): string {
    const config = this.modeSpecificSelectors.get(elementName);
    const currentMode = this.getTestMode();

    if (!config || !currentMode) {
      return baseSelector;
    }

    // Check for mode-specific selector
    const modeConfig = config.modeSpecific[currentMode];
    if (modeConfig?.selector) {
      return modeConfig.selector;
    }

    // Check for mode-specific overrides
    switch (currentMode) {
      case TestMode.ISOLATED:
        return config.isolatedModeSelector || baseSelector;
      case TestMode.PRODUCTION:
        return config.productionModeSelector || baseSelector;
      default:
        return config.fallbackSelector || baseSelector;
    }
  }

  /**
   * Performs mode-specific element validation
   */
  public async validateModeSpecificElements(): Promise<boolean> {
    const currentMode = this.getTestMode();
    if (!currentMode) {
      return false;
    }

    let validationResults: boolean[] = [];

    for (const [elementName, config] of this.modeSpecificSelectors) {
      try {
        const selector = this.getModeSpecificSelector(config.baseSelector, elementName);
        const element = this.web.element(selector, elementName);
        
        // Check if element exists
        const isVisible = await element.isVisible(2);
        
        if (config.isRequired && !isVisible) {
          console.log(`Required element '${elementName}' not found in ${currentMode} mode`);
          validationResults.push(false);
          continue;
        }

        // Run mode-specific validation if available
        const modeConfig = config.modeSpecific[currentMode];
        if (modeConfig?.validation && isVisible) {
          const isValid = await modeConfig.validation(element);
          validationResults.push(isValid);
        } else {
          validationResults.push(isVisible);
        }

      } catch (error) {
        console.log(`Validation failed for element '${elementName}': ${error.message}`);
        validationResults.push(false);
      }
    }

    return validationResults.length === 0 || validationResults.every(result => result);
  }

  /**
   * Gets debugging information specific to the current mode
   */
  public async getModeSpecificDebugInfo(): Promise<ModeSpecificDebugInfo> {
    const currentMode = this.getTestMode() || TestMode.ISOLATED;
    const debugInfo: ModeSpecificDebugInfo = {
      mode: currentMode,
      dataContext: {
        hasTestData: false,
        testDataCount: 0,
        testDataTypes: []
      },
      selectors: {
        attempted: [],
        successful: [],
        failed: []
      },
      elements: {
        found: 0,
        expected: this.modeSpecificSelectors.size,
        modeSpecific: 0
      },
      errors: [],
      timestamp: new Date()
    };

    try {
      // Collect data context information
      if (this.dataContext) {
        debugInfo.dataContext.hasTestData = true;
        debugInfo.dataContext.testDataCount = 
          this.dataContext.testData.customers.length +
          this.dataContext.testData.routes.length +
          this.dataContext.testData.tickets.length;
        
        if (this.dataContext.testData.customers.length > 0) debugInfo.dataContext.testDataTypes.push('customers');
        if (this.dataContext.testData.routes.length > 0) debugInfo.dataContext.testDataTypes.push('routes');
        if (this.dataContext.testData.tickets.length > 0) debugInfo.dataContext.testDataTypes.push('tickets');
      }

      // Collect selector information
      for (const [elementName, config] of this.modeSpecificSelectors) {
        const selector = this.getModeSpecificSelector(config.baseSelector, elementName);
        debugInfo.selectors.attempted.push(`${elementName}: ${selector}`);

        try {
          const element = this.web.element(selector, elementName);
          const isVisible = await element.isVisible(1);
          
          if (isVisible) {
            debugInfo.selectors.successful.push(`${elementName}: ${selector}`);
            debugInfo.elements.found++;
            
            // Check if this is a mode-specific element
            if (config.modeSpecific[currentMode]) {
              debugInfo.elements.modeSpecific++;
            }
          } else {
            debugInfo.selectors.failed.push(`${elementName}: ${selector}`);
          }
        } catch (error) {
          debugInfo.selectors.failed.push(`${elementName}: ${selector} (${error.message})`);
          debugInfo.errors.push(`${elementName}: ${error.message}`);
        }
      }

    } catch (error) {
      debugInfo.errors.push(`Debug info collection failed: ${error.message}`);
    }

    this.debugInfo = debugInfo;
    return debugInfo;
  }

  // ===== CONTEXT-AWARE ELEMENT INTERACTION METHODS =====

  /**
   * Context-aware element click that uses mode-specific selectors
   */
  public async contextAwareClick(elementName: string, fallbackSelector?: string): Promise<void> {
    const config = this.modeSpecificSelectors.get(elementName);
    if (!config) {
      if (fallbackSelector) {
        await this.clickElement(fallbackSelector, elementName);
        return;
      }
      throw new ContextAwarePageObjectError(
        this.constructor.name,
        this.getTestMode() || TestMode.ISOLATED,
        this.dataContext,
        `No configuration found for element: ${elementName}`
      );
    }

    const selector = this.getModeSpecificSelector(config.baseSelector, elementName);
    
    try {
      await this.clickElement(selector, elementName);
    } catch (error) {
      // Try fallback selector if available
      if (config.fallbackSelector && selector !== config.fallbackSelector) {
        console.log(`Primary selector failed for ${elementName}, trying fallback`);
        await this.clickElement(config.fallbackSelector, elementName);
      } else {
        throw new ContextAwarePageObjectError(
          this.constructor.name,
          this.getTestMode() || TestMode.ISOLATED,
          this.dataContext,
          `Failed to click element ${elementName}: ${error.message}`,
          this.debugInfo || undefined
        );
      }
    }
  }

  /**
   * Context-aware text input that uses mode-specific selectors
   */
  public async contextAwareTypeText(elementName: string, text: string, fallbackSelector?: string): Promise<void> {
    const config = this.modeSpecificSelectors.get(elementName);
    if (!config) {
      if (fallbackSelector) {
        await this.typeText(fallbackSelector, text, elementName);
        return;
      }
      throw new ContextAwarePageObjectError(
        this.constructor.name,
        this.getTestMode() || TestMode.ISOLATED,
        this.dataContext,
        `No configuration found for element: ${elementName}`
      );
    }

    const selector = this.getModeSpecificSelector(config.baseSelector, elementName);
    
    try {
      await this.typeText(selector, text, elementName);
    } catch (error) {
      // Try fallback selector if available
      if (config.fallbackSelector && selector !== config.fallbackSelector) {
        console.log(`Primary selector failed for ${elementName}, trying fallback`);
        await this.typeText(config.fallbackSelector, text, elementName);
      } else {
        throw new ContextAwarePageObjectError(
          this.constructor.name,
          this.getTestMode() || TestMode.ISOLATED,
          this.dataContext,
          `Failed to type text in element ${elementName}: ${error.message}`,
          this.debugInfo || undefined
        );
      }
    }
  }

  /**
   * Context-aware element wait that uses mode-specific selectors
   */
  public async contextAwareWaitForElement(elementName: string, fallbackSelector?: string): Promise<void> {
    const config = this.modeSpecificSelectors.get(elementName);
    if (!config) {
      if (fallbackSelector) {
        await this.waitForElement(fallbackSelector, elementName);
        return;
      }
      throw new ContextAwarePageObjectError(
        this.constructor.name,
        this.getTestMode() || TestMode.ISOLATED,
        this.dataContext,
        `No configuration found for element: ${elementName}`
      );
    }

    const selector = this.getModeSpecificSelector(config.baseSelector, elementName);
    
    try {
      await this.waitForElement(selector, elementName);
    } catch (error) {
      // Try fallback selector if available
      if (config.fallbackSelector && selector !== config.fallbackSelector) {
        console.log(`Primary selector failed for ${elementName}, trying fallback`);
        await this.waitForElement(config.fallbackSelector, elementName);
      } else {
        throw new ContextAwarePageObjectError(
          this.constructor.name,
          this.getTestMode() || TestMode.ISOLATED,
          this.dataContext,
          `Failed to wait for element ${elementName}: ${error.message}`,
          this.debugInfo || undefined
        );
      }
    }
  }

  // ===== CONTEXT-AWARE DATA METHODS =====

  /**
   * Gets test data based on current context
   */
  protected getTestCustomers() {
    return this.dataContext?.testData.customers || [];
  }

  /**
   * Gets test routes based on current context
   */
  protected getTestRoutes() {
    return this.dataContext?.testData.routes || [];
  }

  /**
   * Gets test tickets based on current context
   */
  protected getTestTickets() {
    return this.dataContext?.testData.tickets || [];
  }

  /**
   * Gets a specific test customer by index or criteria
   */
  protected getTestCustomer(indexOrCriteria: number | ((customer: any) => boolean)) {
    const customers = this.getTestCustomers();
    
    if (typeof indexOrCriteria === 'number') {
      return customers[indexOrCriteria] || null;
    } else {
      return customers.find(indexOrCriteria) || null;
    }
  }

  // ===== ABSTRACT AND PROTECTED METHODS =====

  /**
   * Initialize mode-specific configurations - to be implemented by subclasses
   */
  protected abstract initializeModeSpecificConfigurations(): void;

  /**
   * Validate mode-specific requirements - to be implemented by subclasses
   */
  protected abstract validateModeSpecificRequirements(): Promise<boolean>;

  /**
   * Register a mode-specific element configuration
   */
  protected registerModeSpecificElement(config: ContextAwareElementConfig): void {
    this.modeSpecificSelectors.set(config.elementName, config);
  }

  /**
   * Log context-aware debugging information
   */
  protected async logContextAwareDebugInfo(): Promise<void> {
    const debugInfo = await this.getModeSpecificDebugInfo();
    
    console.log('=== CONTEXT-AWARE PAGE OBJECT DEBUG INFO ===');
    console.log(`Page: ${this.constructor.name}`);
    console.log(`Mode: ${debugInfo.mode}`);
    console.log(`Data Context: ${debugInfo.dataContext.hasTestData ? 'Available' : 'Not Available'}`);
    console.log(`Test Data Count: ${debugInfo.dataContext.testDataCount}`);
    console.log(`Test Data Types: ${debugInfo.dataContext.testDataTypes.join(', ')}`);
    console.log(`Elements Found: ${debugInfo.elements.found}/${debugInfo.elements.expected}`);
    console.log(`Mode-Specific Elements: ${debugInfo.elements.modeSpecific}`);
    
    if (debugInfo.errors.length > 0) {
      console.log('Errors:');
      debugInfo.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (debugInfo.selectors.failed.length > 0) {
      console.log('Failed Selectors:');
      debugInfo.selectors.failed.forEach(selector => console.log(`  - ${selector}`));
    }
    
    console.log('=== END CONTEXT-AWARE DEBUG INFO ===');
  }
}