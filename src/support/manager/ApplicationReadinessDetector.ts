/**
 * ApplicationReadinessDetector - SPA-specific readiness detection for timeout optimization
 * 
 * Implements intelligent readiness detection for Single Page Applications by:
 * - Monitoring SPA state and framework initialization
 * - Detecting JavaScript framework loading (React, Vue, Angular)
 * - Validating component initialization and navigation element readiness
 * - Providing comprehensive readiness scoring for smart timeout decisions
 */

import { Page } from '@playwright/test';

/**
 * SPA readiness state with comprehensive indicators
 */
export interface SPAReadinessState {
  domReady: boolean;
  jsFrameworkLoaded: boolean;
  componentsInitialized: boolean;
  navigationRendered: boolean;
  dataLoaded: boolean;
  networkQuiet: boolean;
  readinessScore: number; // 0-100
  frameworkDetails?: {
    name: string;
    version?: string;
    detected: boolean;
  };
  componentDetails?: {
    totalComponents: number;
    initializedComponents: number;
    navigationComponents: number;
  };
  networkDetails?: {
    activeRequests: number;
    lastActivity: number;
    quietDuration: number;
  };
}

/**
 * JavaScript framework detection result
 */
export interface FrameworkDetectionResult {
  name: string;
  detected: boolean;
  version?: string;
  globalObject?: string;
  readyIndicator?: string;
}

/**
 * Component readiness configuration
 */
export interface ComponentReadinessConfig {
  selector: string;
  requiredAttributes?: string[];
  requiredClasses?: string[];
  interactivityCheck?: boolean;
  dataLoadedIndicator?: string;
  timeout?: number;
}

/**
 * Navigation readiness configuration
 */
export interface NavigationReadinessConfig {
  navigationSelectors: string[];
  mobileNavigationSelectors?: string[];
  requiredLinks?: string[];
  interactivityRequired?: boolean;
  responsiveCheck?: boolean;
  timeout?: number;
  // Enhanced configuration options
  validateLinkTargets?: boolean; // Check if links have valid href attributes
  checkNavigationStructure?: boolean; // Validate navigation has proper structure (ul/li, etc.)
  minimumLinks?: number; // Minimum number of navigation links required
  excludeDisabledLinks?: boolean; // Exclude disabled links from validation
  waitForAnimations?: boolean; // Wait for CSS animations/transitions to complete
}

/**
 * Navigation validation result with detailed information
 */
export interface NavigationValidationResult {
  isReady: boolean;
  foundNavigationElements: number;
  interactiveElements: number;
  validLinks: number;
  mobileNavigationReady: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Data loading indicators configuration
 */
export interface DataLoadingConfig {
  apiEndpoints?: string[];
  loadingIndicators?: string[];
  dataAttributes?: string[];
  networkQuietDuration?: number;
  timeout?: number;
}

/**
 * ApplicationReadinessDetector - Core class for SPA readiness detection
 */
export class ApplicationReadinessDetector {
  private page: Page;
  private config: {
    networkQuietDuration: number;
    componentCheckInterval: number;
    maxReadinessChecks: number;
    frameworkDetectionTimeout: number;
  };

  constructor(page: Page, config?: Partial<ApplicationReadinessDetector['config']>) {
    this.page = page;
    this.config = {
      networkQuietDuration: 500, // 500ms of network quiet
      componentCheckInterval: 100, // Check every 100ms
      maxReadinessChecks: 50, // Maximum 50 checks (5 seconds)
      frameworkDetectionTimeout: 2000, // 2 seconds to detect framework
      ...config
    };
  }

  /**
   * Check comprehensive SPA readiness state
   * Requirement 5.1: WHEN detecting SPA readiness THEN the system SHALL check for application initialization markers
   */
  async checkSPAReadiness(): Promise<SPAReadinessState> {
    const startTime = performance.now();
    
    // Initialize readiness state
    const readinessState: SPAReadinessState = {
      domReady: false,
      jsFrameworkLoaded: false,
      componentsInitialized: false,
      navigationRendered: false,
      dataLoaded: false,
      networkQuiet: false,
      readinessScore: 0
    };

    try {
      // Check DOM readiness
      readinessState.domReady = await this.checkDOMReadiness();

      // Detect and check JavaScript framework
      const frameworkResult = await this.detectJavaScriptFramework();
      readinessState.jsFrameworkLoaded = frameworkResult.detected;
      readinessState.frameworkDetails = frameworkResult;

      // Check component initialization
      const componentResult = await this.checkComponentInitialization();
      readinessState.componentsInitialized = componentResult.initialized;
      readinessState.componentDetails = componentResult.details;

      // Check navigation rendering
      readinessState.navigationRendered = await this.checkNavigationRendering();

      // Check data loading state
      readinessState.dataLoaded = await this.checkDataLoadingState();

      // Check network activity
      const networkResult = await this.checkNetworkQuietState();
      readinessState.networkQuiet = networkResult.quiet;
      readinessState.networkDetails = networkResult.details;

      // Calculate overall readiness score
      readinessState.readinessScore = this.calculateReadinessScore(readinessState);

      return readinessState;
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Error checking SPA readiness: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return partial state with error indication
      readinessState.readinessScore = 0;
      return readinessState;
    }
  }

  /**
   * Wait for navigation readiness with comprehensive checks
   * Requirement 5.2: WHEN validating navigation readiness THEN the system SHALL verify navigation elements are interactive
   * Requirement 5.3: WHEN checking component readiness THEN the system SHALL ensure components have finished mounting
   */
  async waitForNavigationReadiness(config?: NavigationReadinessConfig): Promise<NavigationValidationResult> {
    const defaultConfig: NavigationReadinessConfig = {
      navigationSelectors: [
        'nav',
        '[role="navigation"]',
        '.navigation',
        '.navbar',
        '.nav-menu',
        '.main-nav',
        '.header-nav',
        '.primary-nav',
        '.site-nav'
      ],
      mobileNavigationSelectors: [
        '.mobile-nav',
        '.hamburger-menu',
        '.nav-toggle',
        '[data-mobile-nav]',
        '.mobile-menu',
        '.nav-drawer',
        '.sidebar-nav',
        '.offcanvas-nav'
      ],
      requiredLinks: [],
      interactivityRequired: true,
      responsiveCheck: true,
      timeout: 8000,
      validateLinkTargets: true,
      checkNavigationStructure: true,
      minimumLinks: 1,
      excludeDisabledLinks: true,
      waitForAnimations: true
    };

    const finalConfig = { ...defaultConfig, ...config };
    const startTime = performance.now();
    const maxWait = finalConfig.timeout || 8000;

    let lastValidationResult: NavigationValidationResult = {
      isReady: false,
      foundNavigationElements: 0,
      interactiveElements: 0,
      validLinks: 0,
      mobileNavigationReady: false,
      errors: [],
      warnings: []
    };

    while ((performance.now() - startTime) < maxWait) {
      try {
        // Perform comprehensive navigation validation
        const validationResult = await this.performNavigationValidation(finalConfig);
        lastValidationResult = validationResult;
        
        if (validationResult.isReady) {
          return validationResult;
        }

        // Wait before next check
        await this.sleep(this.config.componentCheckInterval);
      } catch (error) {
        console.warn(`[ApplicationReadinessDetector] Navigation readiness check failed: ${error instanceof Error ? error.message : String(error)}`);
        lastValidationResult.errors.push(`Navigation check error: ${error instanceof Error ? error.message : String(error)}`);
        await this.sleep(this.config.componentCheckInterval);
      }
    }

    lastValidationResult.errors.push(`Navigation readiness timeout after ${maxWait}ms`);
    throw new Error(`Navigation readiness timeout after ${maxWait}ms. Validation result: ${JSON.stringify(lastValidationResult)}`);
  }

  /**
   * Perform comprehensive navigation validation
   * Enhanced navigation component detection with detailed validation
   */
  private async performNavigationValidation(config: NavigationReadinessConfig): Promise<NavigationValidationResult> {
    const result: NavigationValidationResult = {
      isReady: false,
      foundNavigationElements: 0,
      interactiveElements: 0,
      validLinks: 0,
      mobileNavigationReady: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Check for navigation elements presence and visibility
      const navigationElementsResult = await this.validateNavigationElements(config);
      result.foundNavigationElements = navigationElementsResult.count;
      result.errors.push(...navigationElementsResult.errors);
      result.warnings.push(...navigationElementsResult.warnings);

      if (navigationElementsResult.count === 0) {
        result.errors.push('No navigation elements found');
        return result;
      }

      // Step 2: Validate interactive elements within navigation
      const interactivityResult = await this.validateNavigationInteractiveElements(config);
      result.interactiveElements = interactivityResult.count;
      result.validLinks = interactivityResult.validLinks;
      result.errors.push(...interactivityResult.errors);
      result.warnings.push(...interactivityResult.warnings);

      // Step 3: Check minimum links requirement
      if (config.minimumLinks && result.validLinks < config.minimumLinks) {
        result.errors.push(`Insufficient navigation links: found ${result.validLinks}, required ${config.minimumLinks}`);
        return result;
      }

      // Step 4: Validate mobile navigation if responsive check is enabled
      if (config.responsiveCheck) {
        const mobileNavResult = await this.validateMobileNavigationComprehensive(config);
        result.mobileNavigationReady = mobileNavResult.isReady;
        result.errors.push(...mobileNavResult.errors);
        result.warnings.push(...mobileNavResult.warnings);

        if (!mobileNavResult.isReady && mobileNavResult.isMobileViewport) {
          result.errors.push('Mobile navigation not ready in mobile viewport');
          return result;
        }
      } else {
        result.mobileNavigationReady = true; // Skip mobile check
      }

      // Step 5: Wait for animations if required
      if (config.waitForAnimations) {
        const animationsComplete = await this.waitForNavigationAnimations(config);
        if (!animationsComplete) {
          result.warnings.push('Navigation animations may still be running');
        }
      }

      // Step 6: Final readiness determination
      const hasMinimumInteractivity = config.interactivityRequired ? result.interactiveElements > 0 : true;
      const hasValidLinks = result.validLinks > 0 || !config.interactivityRequired;
      
      result.isReady = result.foundNavigationElements > 0 && 
                      hasMinimumInteractivity && 
                      hasValidLinks && 
                      result.mobileNavigationReady &&
                      result.errors.length === 0;

      return result;
    } catch (error) {
      result.errors.push(`Navigation validation error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Wait for specific component to mount and become ready
   * Requirement 5.2: WHEN checking component readiness THEN the system SHALL ensure components have finished mounting
   */
  async waitForComponentMount(selector: string, config?: ComponentReadinessConfig): Promise<void> {
    const defaultConfig: ComponentReadinessConfig = {
      selector,
      requiredAttributes: [],
      requiredClasses: [],
      interactivityCheck: true,
      timeout: 5000
    };

    const finalConfig = { ...defaultConfig, ...config };
    const startTime = performance.now();
    const maxWait = finalConfig.timeout || 5000;

    while ((performance.now() - startTime) < maxWait) {
      try {
        const componentReady = await this.checkComponentMountState(finalConfig);
        
        if (componentReady) {
          return;
        }

        await this.sleep(this.config.componentCheckInterval);
      } catch (error) {
        console.warn(`[ApplicationReadinessDetector] Component mount check failed for ${selector}: ${error instanceof Error ? error.message : String(error)}`);
        await this.sleep(this.config.componentCheckInterval);
      }
    }

    throw new Error(`Component mount timeout for ${selector} after ${maxWait}ms`);
  }

  /**
   * Wait for data loading completion
   * Requirement 5.1: WHEN detecting data loading THEN the system SHALL wait for API responses and data population
   */
  async waitForDataLoad(indicators: string[], config?: DataLoadingConfig): Promise<void> {
    const defaultConfig: DataLoadingConfig = {
      loadingIndicators: indicators,
      networkQuietDuration: this.config.networkQuietDuration,
      timeout: 10000
    };

    const finalConfig = { ...defaultConfig, ...config };
    const startTime = performance.now();
    const maxWait = finalConfig.timeout || 10000;

    while ((performance.now() - startTime) < maxWait) {
      try {
        const dataLoaded = await this.checkDataLoadingComplete(finalConfig);
        
        if (dataLoaded) {
          return;
        }

        await this.sleep(this.config.componentCheckInterval);
      } catch (error) {
        console.warn(`[ApplicationReadinessDetector] Data loading check failed: ${error instanceof Error ? error.message : String(error)}`);
        await this.sleep(this.config.componentCheckInterval);
      }
    }

    throw new Error(`Data loading timeout after ${maxWait}ms`);
  }

  /**
   * Detect JavaScript framework (React, Vue, Angular)
   * Requirement 5.1: Add JavaScript framework detection
   */
  private async detectJavaScriptFramework(): Promise<FrameworkDetectionResult> {
    try {
      const frameworkDetection = await this.page.evaluate(() => {
        // React detection
        if (typeof window !== 'undefined') {
          // React DevTools or React instance
          if ((window as any).React || 
              (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
              document.querySelector('[data-reactroot]') ||
              document.querySelector('[data-react-checksum]')) {
            
            const reactVersion = (window as any).React?.version || 
                               document.querySelector('script[src*="react"]')?.getAttribute('src')?.match(/react@?([0-9.]+)/)?.[1];
            
            return {
              name: 'React',
              detected: true,
              version: reactVersion,
              globalObject: 'React',
              readyIndicator: '__REACT_DEVTOOLS_GLOBAL_HOOK__'
            };
          }

          // Vue detection
          if ((window as any).Vue || 
              document.querySelector('[data-v-]') ||
              document.querySelector('.v-application') ||
              document.querySelector('[id*="vue"]')) {
            
            const vueVersion = (window as any).Vue?.version ||
                             document.querySelector('script[src*="vue"]')?.getAttribute('src')?.match(/vue@?([0-9.]+)/)?.[1];
            
            return {
              name: 'Vue',
              detected: true,
              version: vueVersion,
              globalObject: 'Vue',
              readyIndicator: 'Vue'
            };
          }

          // Angular detection
          if ((window as any).ng || 
              (window as any).angular ||
              document.querySelector('[ng-app]') ||
              document.querySelector('[data-ng-app]') ||
              document.querySelector('app-root') ||
              document.querySelector('[ng-version]')) {
            
            const angularVersion = document.querySelector('[ng-version]')?.getAttribute('ng-version') ||
                                 document.querySelector('script[src*="angular"]')?.getAttribute('src')?.match(/angular@?([0-9.]+)/)?.[1];
            
            return {
              name: 'Angular',
              detected: true,
              version: angularVersion,
              globalObject: 'ng',
              readyIndicator: 'ng'
            };
          }
        }

        return {
          name: 'Unknown',
          detected: false
        };
      });

      return frameworkDetection;
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Framework detection failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        name: 'Unknown',
        detected: false
      };
    }
  }

  /**
   * Check DOM readiness state
   */
  private async checkDOMReadiness(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        return document.readyState === 'complete' || document.readyState === 'interactive';
      });
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] DOM readiness check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check component initialization state
   */
  private async checkComponentInitialization(): Promise<{
    initialized: boolean;
    details: {
      totalComponents: number;
      initializedComponents: number;
      navigationComponents: number;
    };
  }> {
    try {
      const componentState = await this.page.evaluate(() => {
        // Look for common component indicators
        const componentSelectors = [
          '[data-component]',
          '[data-react-component]',
          '[data-vue-component]',
          '[data-ng-component]',
          '.component',
          '[class*="component"]',
          '[id*="component"]'
        ];

        const navigationSelectors = [
          'nav',
          '[role="navigation"]',
          '.navigation',
          '.navbar',
          '.nav-menu'
        ];

        let totalComponents = 0;
        let initializedComponents = 0;

        // Count total components
        componentSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          totalComponents += elements.length;
          
          // Check if components appear initialized (have content, classes, etc.)
          elements.forEach(element => {
            if (element.children.length > 0 || 
                element.textContent?.trim() || 
                element.classList.length > 1 ||
                element.hasAttribute('data-initialized')) {
              initializedComponents++;
            }
          });
        });

        // Count navigation components
        let navigationComponents = 0;
        navigationSelectors.forEach(selector => {
          navigationComponents += document.querySelectorAll(selector).length;
        });

        return {
          totalComponents,
          initializedComponents,
          navigationComponents
        };
      });

      // Consider components initialized if most are ready or if there are no components detected
      const initialized = componentState.totalComponents === 0 || 
                         (componentState.initializedComponents / componentState.totalComponents) >= 0.8;

      return {
        initialized,
        details: componentState
      };
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Component initialization check failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        initialized: false,
        details: {
          totalComponents: 0,
          initializedComponents: 0,
          navigationComponents: 0
        }
      };
    }
  }

  /**
   * Check navigation rendering state
   */
  private async checkNavigationRendering(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        const navigationSelectors = [
          'nav',
          '[role="navigation"]',
          '.navigation',
          '.navbar',
          '.nav-menu',
          '.main-nav'
        ];

        // Check if at least one navigation element exists and has content
        for (const selector of navigationSelectors) {
          const navElement = document.querySelector(selector);
          if (navElement && 
              (navElement.children.length > 0 || navElement.textContent?.trim())) {
            return true;
          }
        }

        return false;
      });
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Navigation rendering check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check data loading state
   */
  private async checkDataLoadingState(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        // Look for common loading indicators that should be hidden when data is loaded
        const loadingSelectors = [
          '.loading',
          '.spinner',
          '.loader',
          '[data-loading="true"]',
          '.skeleton',
          '.placeholder'
        ];

        // Check if loading indicators are hidden/removed
        for (const selector of loadingSelectors) {
          const loadingElement = document.querySelector(selector) as HTMLElement;
          if (loadingElement && 
              loadingElement.offsetParent !== null && 
              !loadingElement.hidden &&
              getComputedStyle(loadingElement).display !== 'none') {
            return false; // Still loading
          }
        }

        // Look for data indicators that should be present when loaded
        const dataSelectors = [
          '[data-loaded="true"]',
          '.data-loaded',
          '.content-loaded',
          '[data-content]'
        ];

        let hasDataIndicators = false;
        for (const selector of dataSelectors) {
          if (document.querySelector(selector)) {
            hasDataIndicators = true;
            break;
          }
        }

        // If no specific data indicators, assume loaded if no loading indicators
        return hasDataIndicators || loadingSelectors.every(selector => {
          const element = document.querySelector(selector) as HTMLElement;
          return !element || element.offsetParent === null;
        });
      });
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Data loading state check failed: ${error instanceof Error ? error.message : String(error)}`);
      return true; // Assume loaded if check fails
    }
  }

  /**
   * Check network quiet state
   */
  private async checkNetworkQuietState(): Promise<{
    quiet: boolean;
    details: {
      activeRequests: number;
      lastActivity: number;
      quietDuration: number;
    };
  }> {
    try {
      // Use Playwright's network monitoring if available
      const networkState = await this.page.evaluate((quietDuration) => {
        // Simple heuristic: check for ongoing fetch requests or XHR
        const now = Date.now();
        
        // Check for active loading states in the DOM
        const activeLoaders = document.querySelectorAll('.loading, .spinner, .loader, [data-loading="true"]');
        const visibleLoaders = Array.from(activeLoaders).filter(el => {
          const htmlEl = el as HTMLElement;
          return htmlEl.offsetParent !== null && !htmlEl.hidden && getComputedStyle(htmlEl).display !== 'none';
        });

        return {
          activeRequests: visibleLoaders.length,
          lastActivity: now,
          quietDuration: quietDuration
        };
      }, this.config.networkQuietDuration);

      return {
        quiet: networkState.activeRequests === 0,
        details: networkState
      };
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Network quiet state check failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        quiet: true, // Assume quiet if check fails
        details: {
          activeRequests: 0,
          lastActivity: Date.now(),
          quietDuration: this.config.networkQuietDuration
        }
      };
    }
  }

  /**
   * Validate navigation elements presence and visibility
   * Enhanced navigation element detection with detailed reporting
   */
  private async validateNavigationElements(config: NavigationReadinessConfig): Promise<{
    count: number;
    errors: string[];
    warnings: string[];
  }> {
    try {
      return await this.page.evaluate((navConfig) => {
        const { navigationSelectors, requiredLinks, checkNavigationStructure } = navConfig;
        const result = { count: 0, errors: [] as string[], warnings: [] as string[] };
        
        // Check each navigation selector
        for (const selector of navigationSelectors) {
          const navElements = document.querySelectorAll(selector);
          
          for (const navElement of Array.from(navElements)) {
            const htmlElement = navElement as HTMLElement;
            
            // Check visibility
            if (htmlElement.offsetParent === null || 
                htmlElement.hidden || 
                getComputedStyle(htmlElement).display === 'none' ||
                getComputedStyle(htmlElement).visibility === 'hidden') {
              result.warnings.push(`Navigation element ${selector} found but not visible`);
              continue;
            }

            // Check if element has content
            if (!htmlElement.children.length && !htmlElement.textContent?.trim()) {
              result.warnings.push(`Navigation element ${selector} is empty`);
              continue;
            }

            // Check navigation structure if required
            if (checkNavigationStructure) {
              const hasProperStructure = htmlElement.querySelector('ul, ol, menu') || 
                                       htmlElement.querySelectorAll('a, button, [role="menuitem"]').length > 0;
              if (!hasProperStructure) {
                result.warnings.push(`Navigation element ${selector} lacks proper structure (no lists or interactive elements)`);
              }
            }

            // Check required links if specified
            if (requiredLinks && requiredLinks.length > 0) {
              const foundLinks = requiredLinks.filter(linkText => 
                htmlElement.textContent?.includes(linkText)
              );
              if (foundLinks.length < requiredLinks.length) {
                const missingLinks = requiredLinks.filter(link => !foundLinks.includes(link));
                result.warnings.push(`Navigation missing required links: ${missingLinks.join(', ')}`);
                continue;
              }
            }

            result.count++;
          }
        }

        if (result.count === 0) {
          result.errors.push(`No visible navigation elements found. Checked selectors: ${navigationSelectors.join(', ')}`);
        }

        return result;
      }, config);
    } catch (error) {
      return {
        count: 0,
        errors: [`Navigation elements validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      };
    }
  }

  /**
   * Validate interactive elements within navigation
   * Enhanced interactive element validation for navigation links
   */
  private async validateNavigationInteractiveElements(config: NavigationReadinessConfig): Promise<{
    count: number;
    validLinks: number;
    errors: string[];
    warnings: string[];
  }> {
    try {
      return await this.page.evaluate((navConfig) => {
        const { 
          navigationSelectors, 
          interactivityRequired, 
          validateLinkTargets, 
          excludeDisabledLinks 
        } = navConfig;
        
        const result = { 
          count: 0, 
          validLinks: 0, 
          errors: [] as string[], 
          warnings: [] as string[] 
        };

        if (!interactivityRequired) {
          return result; // Skip if interactivity not required
        }

        // Check interactive elements in each navigation
        for (const selector of navigationSelectors) {
          const navElements = document.querySelectorAll(selector);
          
          for (const navElement of Array.from(navElements)) {
            const htmlNavElement = navElement as HTMLElement;
            
            // Skip hidden navigation elements
            if (htmlNavElement.offsetParent === null) continue;

            // Find all potentially interactive elements
            const interactiveElements = htmlNavElement.querySelectorAll(
              'a, button, [role="button"], [role="menuitem"], [role="link"], [tabindex], input[type="button"], input[type="submit"]'
            );

            for (const element of Array.from(interactiveElements)) {
              const htmlElement = element as HTMLElement;
              
              // Check visibility
              if (htmlElement.offsetParent === null || 
                  htmlElement.hidden || 
                  getComputedStyle(htmlElement).display === 'none' ||
                  getComputedStyle(htmlElement).visibility === 'hidden') {
                continue;
              }

              // Check if disabled and should be excluded
              if (excludeDisabledLinks && 
                  (htmlElement.hasAttribute('disabled') || 
                   htmlElement.getAttribute('aria-disabled') === 'true' ||
                   htmlElement.classList.contains('disabled'))) {
                continue;
              }

              // Validate interactivity
              const tagName = element.tagName.toLowerCase();
              const isLink = tagName === 'a';
              const isButton = tagName === 'button' || tagName === 'input';
              const hasRole = element.hasAttribute('role');
              const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';
              const hasClickHandler = (htmlElement as any).onclick !== null;

              if (isLink || isButton || hasRole || hasTabIndex || hasClickHandler) {
                result.count++;

                // Additional validation for links
                if (isLink) {
                  const href = element.getAttribute('href');
                  
                  if (validateLinkTargets) {
                    if (!href || href === '#' || href === 'javascript:void(0)') {
                      result.warnings.push(`Navigation link without valid target: "${element.textContent?.trim() || 'unnamed link'}"`);
                    } else {
                      result.validLinks++;
                    }
                  } else {
                    result.validLinks++;
                  }
                } else if (isButton || hasRole || hasClickHandler) {
                  // Count buttons and other interactive elements as valid
                  result.validLinks++;
                }
              }
            }
          }
        }

        if (result.count === 0) {
          result.errors.push('No interactive elements found in navigation');
        }

        return result;
      }, config);
    } catch (error) {
      return {
        count: 0,
        validLinks: 0,
        errors: [`Interactive elements validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      };
    }
  }

  /**
   * Simplified navigation readiness check for backward compatibility
   * Returns boolean result for simple use cases
   */
  async waitForNavigationReadinessSimple(config?: NavigationReadinessConfig): Promise<void> {
    try {
      const result = await this.waitForNavigationReadiness(config);
      if (!result.isReady) {
        throw new Error(`Navigation not ready: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Comprehensive mobile navigation validation for responsive layouts
   * Enhanced mobile navigation readiness detection with detailed reporting
   */
  private async validateMobileNavigationComprehensive(config: NavigationReadinessConfig): Promise<{
    isReady: boolean;
    isMobileViewport: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      return await this.page.evaluate((navConfig) => {
        const { 
          mobileNavigationSelectors, 
          navigationSelectors,
          responsiveCheck, 
          interactivityRequired,
          waitForAnimations 
        } = navConfig;
        
        const result = {
          isReady: false,
          isMobileViewport: false,
          errors: [] as string[],
          warnings: [] as string[]
        };

        if (!responsiveCheck) {
          result.isReady = true;
          return result; // Skip mobile check if not required
        }

        // Determine viewport size and type
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth <= 768;
        const isTablet = viewportWidth > 768 && viewportWidth <= 1024;
        const isMobileOrTablet = isMobile || isTablet;
        
        result.isMobileViewport = isMobileOrTablet;

        if (!isMobileOrTablet) {
          // Desktop viewport - check that desktop navigation is visible
          let desktopNavVisible = false;
          for (const selector of navigationSelectors) {
            const navElement = document.querySelector(selector) as HTMLElement;
            if (navElement && navElement.offsetParent !== null && 
                getComputedStyle(navElement).display !== 'none') {
              desktopNavVisible = true;
              break;
            }
          }
          
          result.isReady = desktopNavVisible;
          if (!desktopNavVisible) {
            result.warnings.push('Desktop navigation not visible in desktop viewport');
          }
          return result;
        }

        // Mobile/Tablet viewport - validate mobile navigation
        if (!mobileNavigationSelectors || mobileNavigationSelectors.length === 0) {
          // No mobile selectors specified - check if regular nav adapts to mobile
          let adaptiveNavFound = false;
          for (const selector of navigationSelectors) {
            const navElement = document.querySelector(selector) as HTMLElement;
            if (navElement && navElement.offsetParent !== null) {
              // Check if navigation has mobile-friendly styling
              const computedStyle = getComputedStyle(navElement);
              const hasResponsiveIndicators = computedStyle.display === 'flex' || 
                                            computedStyle.display === 'block' ||
                                            navElement.classList.contains('responsive') ||
                                            navElement.classList.contains('mobile') ||
                                            navElement.hasAttribute('data-mobile');
              
              if (hasResponsiveIndicators) {
                adaptiveNavFound = true;
                break;
              }
            }
          }
          
          result.isReady = adaptiveNavFound;
          if (!adaptiveNavFound) {
            result.warnings.push('No mobile navigation selectors specified and regular navigation does not appear mobile-friendly');
          }
          return result;
        }

        // Check mobile navigation elements
        let mobileNavFound = false;
        let hasInteractiveTrigger = false;
        let mobileNavDetails = {
          foundElements: 0,
          visibleElements: 0,
          interactiveTriggers: 0
        };

        for (const selector of mobileNavigationSelectors) {
          const mobileNavElements = document.querySelectorAll(selector);
          mobileNavDetails.foundElements += mobileNavElements.length;
          
          for (const mobileNavElement of Array.from(mobileNavElements)) {
            const htmlElement = mobileNavElement as HTMLElement;
            
            // Check if element exists (may be hidden initially for mobile menus)
            if (htmlElement) {
              mobileNavFound = true;
              
              // Check visibility (mobile nav might be hidden until triggered)
              const isVisible = htmlElement.offsetParent !== null && 
                              !htmlElement.hidden && 
                              getComputedStyle(htmlElement).display !== 'none';
              
              if (isVisible) {
                mobileNavDetails.visibleElements++;
              }

              // Check for mobile nav triggers (hamburger menu, toggle button)
              const triggerSelectors = [
                `${selector}`,
                `${selector} button`,
                `${selector} [role="button"]`,
                '.hamburger',
                '.menu-toggle',
                '.nav-toggle',
                '.mobile-menu-trigger',
                '[data-toggle="mobile-nav"]',
                '[aria-controls*="nav"]',
                '[aria-expanded]'
              ];

              for (const triggerSelector of triggerSelectors) {
                const triggers = document.querySelectorAll(triggerSelector);
                
                for (const trigger of Array.from(triggers)) {
                  const htmlTrigger = trigger as HTMLElement;
                  
                  // Check if trigger is interactive and visible
                  const isTriggerVisible = htmlTrigger.offsetParent !== null && 
                                         !htmlTrigger.hidden && 
                                         getComputedStyle(htmlTrigger).display !== 'none';
                  
                  if (isTriggerVisible) {
                    const isInteractive = htmlTrigger.tagName.toLowerCase() === 'button' ||
                                         htmlTrigger.hasAttribute('role') ||
                                         htmlTrigger.hasAttribute('tabindex') ||
                                         htmlTrigger.hasAttribute('aria-expanded') ||
                                         htmlTrigger.hasAttribute('aria-controls') ||
                                         (htmlTrigger as any).onclick !== null;
                    
                    if (isInteractive) {
                      hasInteractiveTrigger = true;
                      mobileNavDetails.interactiveTriggers++;
                    }
                  }
                }
              }
            }
          }
        }

        // Validate mobile navigation readiness
        if (!mobileNavFound) {
          result.errors.push(`No mobile navigation elements found. Checked selectors: ${mobileNavigationSelectors.join(', ')}`);
          return result;
        }

        if (interactivityRequired && !hasInteractiveTrigger) {
          result.errors.push('Mobile navigation found but no interactive triggers detected');
          return result;
        }

        // Check for common mobile navigation patterns
        const hasHamburgerIcon = document.querySelector('.hamburger, .menu-icon, [class*="hamburger"], [class*="menu-icon"]');
        const hasToggleButton = document.querySelector('[data-toggle], [aria-expanded], .nav-toggle, .menu-toggle');
        const hasMobileMenuIndicator = hasHamburgerIcon || hasToggleButton;

        if (!hasMobileMenuIndicator) {
          result.warnings.push('Mobile navigation found but no common mobile menu indicators (hamburger icon, toggle button) detected');
        }

        // Final readiness determination
        result.isReady = mobileNavFound && (!interactivityRequired || hasInteractiveTrigger);
        
        if (result.isReady && mobileNavDetails.visibleElements === 0 && mobileNavDetails.interactiveTriggers > 0) {
          result.warnings.push('Mobile navigation ready but menu content is hidden (normal for collapsed mobile menus)');
        }

        return result;
      }, config);
    } catch (error) {
      return {
        isReady: false,
        isMobileViewport: false,
        errors: [`Mobile navigation validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      };
    }
  }

  /**
   * Wait for navigation animations to complete
   * Ensures CSS transitions and animations have finished before considering navigation ready
   */
  private async waitForNavigationAnimations(config: NavigationReadinessConfig): Promise<boolean> {
    try {
      return await this.page.evaluate((navConfig) => {
        const { navigationSelectors, mobileNavigationSelectors } = navConfig;
        const allSelectors = [...navigationSelectors, ...(mobileNavigationSelectors || [])];
        
        // Check for running animations/transitions on navigation elements
        for (const selector of allSelectors) {
          const elements = document.querySelectorAll(selector);
          
          for (const element of Array.from(elements)) {
            const htmlElement = element as HTMLElement;
            const computedStyle = getComputedStyle(htmlElement);
            
            // Check for CSS transitions
            const transitionDuration = computedStyle.transitionDuration;
            if (transitionDuration && transitionDuration !== '0s' && transitionDuration !== '0ms') {
              // Element has active transition - check if it's currently transitioning
              const transitionProperty = computedStyle.transitionProperty;
              if (transitionProperty !== 'none') {
                return false; // Animation likely still running
              }
            }
            
            // Check for CSS animations
            const animationDuration = computedStyle.animationDuration;
            if (animationDuration && animationDuration !== '0s' && animationDuration !== '0ms') {
              const animationName = computedStyle.animationName;
              if (animationName !== 'none') {
                return false; // Animation likely still running
              }
            }
          }
        }
        
        return true; // No animations detected
      }, config);
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Animation check failed: ${error instanceof Error ? error.message : String(error)}`);
      return true; // Assume animations complete if check fails
    }
  }

  /**
   * Check component mount state
   */
  private async checkComponentMountState(config: ComponentReadinessConfig): Promise<boolean> {
    try {
      return await this.page.evaluate((componentConfig) => {
        const { selector, requiredAttributes, requiredClasses, interactivityCheck, dataLoadedIndicator } = componentConfig;
        
        const element = document.querySelector(selector) as HTMLElement;
        if (!element || element.offsetParent === null) {
          return false; // Element not found or not visible
        }

        // Check required attributes
        if (requiredAttributes && requiredAttributes.length > 0) {
          for (const attr of requiredAttributes) {
            if (!element.hasAttribute(attr)) {
              return false;
            }
          }
        }

        // Check required classes
        if (requiredClasses && requiredClasses.length > 0) {
          for (const className of requiredClasses) {
            if (!element.classList.contains(className)) {
              return false;
            }
          }
        }

        // Check interactivity
        if (interactivityCheck) {
          const htmlElement = element as HTMLElement;
          const isInteractive = element.tagName.toLowerCase() === 'button' ||
                               element.tagName.toLowerCase() === 'a' ||
                               element.hasAttribute('role') ||
                               element.hasAttribute('tabindex') ||
                               htmlElement.onclick !== null;
          
          if (!isInteractive) {
            return false;
          }
        }

        // Check data loaded indicator
        if (dataLoadedIndicator) {
          if (!element.hasAttribute(dataLoadedIndicator) && 
              !element.querySelector(`[${dataLoadedIndicator}]`)) {
            return false;
          }
        }

        return true;
      }, config);
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Component mount state check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check data loading completion
   */
  private async checkDataLoadingComplete(config: DataLoadingConfig): Promise<boolean> {
    try {
      return await this.page.evaluate((dataConfig) => {
        const { loadingIndicators, dataAttributes, networkQuietDuration } = dataConfig;
        
        // Check loading indicators are hidden
        if (loadingIndicators && loadingIndicators.length > 0) {
          for (const indicator of loadingIndicators) {
            const element = document.querySelector(indicator);
            if (element && (element as HTMLElement).offsetParent !== null && 
                !(element as HTMLElement).hidden && getComputedStyle(element).display !== 'none') {
              return false; // Still showing loading
            }
          }
        }

        // Check data attributes are present
        if (dataAttributes && dataAttributes.length > 0) {
          for (const attr of dataAttributes) {
            if (!document.querySelector(`[${attr}]`)) {
              return false; // Data attribute not found
            }
          }
        }

        return true;
      }, config);
    } catch (error) {
      console.warn(`[ApplicationReadinessDetector] Data loading completion check failed: ${error instanceof Error ? error.message : String(error)}`);
      return true; // Assume loaded if check fails
    }
  }

  /**
   * Calculate overall readiness score
   */
  private calculateReadinessScore(state: SPAReadinessState): number {
    const weights = {
      domReady: 15,
      jsFrameworkLoaded: 20,
      componentsInitialized: 25,
      navigationRendered: 20,
      dataLoaded: 15,
      networkQuiet: 5
    };

    let score = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      totalWeight += weight;
      if (state[key as keyof SPAReadinessState] === true) {
        score += weight;
      }
    });

    return Math.round((score / totalWeight) * 100);
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}