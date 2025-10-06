/**
 * IsolationManager with dual naming strategies
 * Handles data isolation and naming conventions for both isolated and production modes
 */

import { TestMode } from './types';
import { ValidationResult } from './TestDataFactory';

export interface IsolationConfig {
  looneyTunesCharacters: string[];
  testLocations: string[];
  emailDomain: string;
  routeNamePattern: string;
}

/**
 * Manages data isolation with mode-specific naming strategies
 */
export class IsolationManager {
  private config: IsolationConfig;

  constructor(config?: Partial<IsolationConfig>) {
    this.config = {
      looneyTunesCharacters: [
        'Bugs Bunny',
        'Daffy Duck', 
        'Porky Pig',
        'Tweety Bird',
        'Sylvester Cat',
        'Pepe Le Pew',
        'Foghorn Leghorn',
        'Marvin Martian',
        'Yosemite Sam',
        'Speedy Gonzales'
      ],
      testLocations: [
        'Cedar Falls',
        'Winfield',
        "O'Fallon"
      ],
      emailDomain: 'looneytunestest.com',
      routeNamePattern: '[Location] Test Route - looneyTunesTest',
      ...config
    };
  }

  /**
   * Generates unique prefix for test data based on mode
   */
  public generateUniquePrefix(testId: string, mode: TestMode): string {
    if (mode === TestMode.PRODUCTION) {
      return 'looneyTunesTest';
    } else {
      // Use timestamp-based unique prefix for isolated mode
      const timestamp = Date.now();
      const shortId = testId.split('_').pop() || 'unknown';
      return `test_${timestamp}_${shortId}`;
    }
  }

  /**
   * Creates isolated name with appropriate strategy for the mode
   */
  public createIsolatedName(baseName: string, testId: string, mode: TestMode): string {
    if (mode === TestMode.PRODUCTION) {
      return this.createProductionTestName(baseName);
    } else {
      const prefix = this.generateUniquePrefix(testId, mode);
      return `${prefix}_${baseName}`;
    }
  }

  /**
   * Creates production test name using looneyTunesTest conventions
   */
  public createProductionTestName(baseName: string, character?: string): string {
    const selectedCharacter = character || this.getRandomLooneyTunesCharacter();
    
    // Different naming patterns based on base name type
    if (baseName.toLowerCase().includes('customer') || baseName.toLowerCase().includes('user')) {
      return `${selectedCharacter} - looneyTunesTest`;
    } else if (baseName.toLowerCase().includes('route')) {
      const location = this.getRandomTestLocation();
      return `${location} Test Route - looneyTunesTest`;
    } else if (baseName.toLowerCase().includes('ticket')) {
      return `${baseName} - looneyTunesTest`;
    } else {
      return `${baseName} - looneyTunesTest`;
    }
  }

  /**
   * Creates production test email using looneyTunesTest domain
   */
  public createProductionTestEmail(character?: string): string {
    const selectedCharacter = character || this.getRandomLooneyTunesCharacter();
    const emailName = selectedCharacter.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z.]/g, '');
    
    return `${emailName}@${this.config.emailDomain}`;
  }

  /**
   * Creates production test route name
   */
  public createProductionTestRouteName(location?: string): string {
    const selectedLocation = location || this.getRandomTestLocation();
    return this.config.routeNamePattern.replace('[Location]', selectedLocation);
  }

  /**
   * Validates data isolation for the given mode
   */
  public validateDataIsolation(data: any[], testId: string, mode: TestMode): ValidationResult {
    const issues: string[] = [];

    data.forEach((item, index) => {
      if (mode === TestMode.ISOLATED) {
        // In isolated mode, data should contain unique test identifiers
        const prefix = this.generateUniquePrefix(testId, mode);
        const hasIsolationMarker = this.hasIsolationMarker(item, prefix);
        
        if (!hasIsolationMarker) {
          issues.push(`Item ${index + 1}: Missing isolation marker for test ${testId}`);
        }
      } else if (mode === TestMode.PRODUCTION) {
        // In production mode, data should follow looneyTunesTest conventions
        const followsConvention = this.followsLooneyTunesConvention(item);
        
        if (!followsConvention) {
          issues.push(`Item ${index + 1}: Doesn't follow looneyTunesTest naming convention`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Validates looneyTunesTest naming conventions
   */
  public validateLooneyTunesNaming(data: any[]): ValidationResult {
    const issues: string[] = [];

    data.forEach((item, index) => {
      // Check name field
      if (item.name && !item.name.includes('looneyTunesTest')) {
        issues.push(`Item ${index + 1}: Name "${item.name}" doesn't include looneyTunesTest marker`);
      }

      // Check email field
      if (item.email && !item.email.includes(this.config.emailDomain)) {
        issues.push(`Item ${index + 1}: Email "${item.email}" doesn't use ${this.config.emailDomain} domain`);
      }

      // Check for Looney Tunes character names
      if (item.name && item.name.includes('looneyTunesTest')) {
        const hasCharacter = this.config.looneyTunesCharacters.some(character => 
          item.name.includes(character)
        );
        
        if (!hasCharacter) {
          issues.push(`Item ${index + 1}: Name "${item.name}" should include a Looney Tunes character`);
        }
      }

      // Check route naming for routes
      if (item.type === 'route' || (item.name && item.name.toLowerCase().includes('route'))) {
        const hasValidRoutePattern = this.config.testLocations.some(location =>
          item.name && item.name.includes(`${location} Test Route`)
        );
        
        if (!hasValidRoutePattern) {
          issues.push(`Item ${index + 1}: Route name "${item.name}" doesn't follow location pattern`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Detects conflicts in parallel test execution
   */
  public detectConflicts(currentTestId: string, existingData: any[]): ValidationResult {
    const issues: string[] = [];
    const currentPrefix = this.generateUniquePrefix(currentTestId, TestMode.ISOLATED);

    existingData.forEach((item, index) => {
      // Check if existing data might conflict with current test
      if (this.hasIsolationMarker(item, currentPrefix)) {
        issues.push(`Item ${index + 1}: Potential conflict with current test data`);
      }

      // Check for similar naming that might cause confusion
      if (item.name && item.name.includes(currentTestId.split('_')[1])) {
        issues.push(`Item ${index + 1}: Similar naming pattern detected, potential conflict`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Gets a random Looney Tunes character
   */
  public getRandomLooneyTunesCharacter(): string {
    const randomIndex = Math.floor(Math.random() * this.config.looneyTunesCharacters.length);
    return this.config.looneyTunesCharacters[randomIndex];
  }

  /**
   * Gets a random test location
   */
  public getRandomTestLocation(): string {
    const randomIndex = Math.floor(Math.random() * this.config.testLocations.length);
    return this.config.testLocations[randomIndex];
  }

  /**
   * Checks if item has isolation marker for the given prefix
   */
  private hasIsolationMarker(item: any, prefix: string): boolean {
    // Check various fields that might contain the isolation marker
    const fieldsToCheck = ['name', 'identifier', 'id', 'email', 'title'];
    
    return fieldsToCheck.some(field => {
      const value = item[field];
      return value && typeof value === 'string' && value.includes(prefix);
    });
  }

  /**
   * Checks if item follows looneyTunesTest conventions
   */
  private followsLooneyTunesConvention(item: any): boolean {
    // Check for looneyTunesTest marker in name
    const hasTestMarker = item.name && item.name.includes('looneyTunesTest');
    
    // Check for proper email domain if email exists
    const hasValidEmail = !item.email || item.email.includes(this.config.emailDomain);
    
    // Check for Looney Tunes character if it's a customer/user
    const hasCharacter = !item.name || 
      item.name.includes('looneyTunesTest') && 
      this.config.looneyTunesCharacters.some(character => item.name.includes(character));

    return hasTestMarker && hasValidEmail && hasCharacter;
  }

  /**
   * Gets current configuration
   */
  public getConfig(): IsolationConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  public updateConfig(newConfig: Partial<IsolationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generates test data identifier based on mode
   */
  public generateTestDataId(entityType: string, testId: string, mode: TestMode): string {
    const prefix = this.generateUniquePrefix(testId, mode);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${prefix}_${entityType}_${timestamp}_${random}`;
  }

  /**
   * Validates that test data doesn't conflict with production data
   */
  public validateProductionSafety(data: any[]): ValidationResult {
    const issues: string[] = [];

    data.forEach((item, index) => {
      // Check that data has proper test markers
      const hasTestMarker = this.hasTestMarkers(item);
      
      if (!hasTestMarker) {
        issues.push(`Item ${index + 1}: Missing test markers, could conflict with production data`);
      }

      // Check for suspicious production-like names
      if (this.looksLikeProductionData(item)) {
        issues.push(`Item ${index + 1}: Looks like production data, potential safety risk`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Checks if item has proper test markers
   */
  private hasTestMarkers(item: any): boolean {
    const testMarkers = ['test', 'looneyTunesTest', 'Test Route', this.config.emailDomain];
    
    const fieldsToCheck = ['name', 'email', 'identifier', 'title'];
    
    return fieldsToCheck.some(field => {
      const value = item[field];
      if (!value || typeof value !== 'string') return false;
      
      return testMarkers.some(marker => 
        value.toLowerCase().includes(marker.toLowerCase())
      );
    });
  }

  /**
   * Checks if item looks like production data
   */
  private looksLikeProductionData(item: any): boolean {
    // Check for common production patterns that should be avoided
    const productionPatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Real person names
      /\b(admin|administrator|root|system)\b/i,
      /\b(real|actual|live|prod)\b/i,
      /@(gmail|yahoo|hotmail|outlook)\.com$/i // Real email domains
    ];

    const fieldsToCheck = ['name', 'email', 'identifier'];
    
    return fieldsToCheck.some(field => {
      const value = item[field];
      if (!value || typeof value !== 'string') return false;
      
      return productionPatterns.some(pattern => pattern.test(value));
    });
  }
}