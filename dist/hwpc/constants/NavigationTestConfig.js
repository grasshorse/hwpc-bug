"use strict";
/**
 * NavigationTestConfig - Centralized configuration for navigation testing
 * Provides test categorization, CI/CD integration settings, and reporting configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * NavigationTestConfig - Main configuration class for navigation testing
 */
class NavigationTestConfig {
    /**
     * Get tag combination for specific test category
     */
    static getTagsForCategory(category) {
        const tags = this.CATEGORIES[category];
        return tags.join(' and ');
    }
    /**
     * Get all navigation-related tags
     */
    static getAllNavigationTags() {
        return Object.values(this.TAGS);
    }
    /**
     * Check if current environment is CI/CD
     */
    static isCIEnvironment() {
        return process.env.CI === 'true' ||
            process.env.GITHUB_ACTIONS === 'true' ||
            process.env.JENKINS_URL !== undefined ||
            process.env.ENVIRONMENT === 'ci';
    }
    /**
     * Get environment-specific configuration
     */
    static getEnvironmentConfig() {
        const isCI = this.isCIEnvironment();
        return {
            retries: isCI ? this.CI_CONFIG.retries : parseInt(process.env.RETRIES || '1', 10),
            timeout: isCI ? this.CI_CONFIG.timeout : parseInt(process.env.TEST_TIMEOUT || '5', 10),
            parallelThreads: isCI ? this.CI_CONFIG.parallelThreads : parseInt(process.env.PARALLEL_THREAD || '2', 10),
            recordVideo: isCI ? this.CI_CONFIG.recordVideo : process.env.RECORD_VIDEO === 'true'
        };
    }
    /**
     * Generate screenshot filename based on test context
     */
    static generateScreenshotFilename(testType, scenario, additionalContext = {}) {
        let template = this.REPORTING_CONFIG.screenshotNaming[testType];
        // Replace common placeholders
        template = template.replace('{scenario}', scenario.toLowerCase().replace(/\s+/g, '-'));
        template = template.replace('{timestamp}', new Date().toISOString().replace(/[:.]/g, '-'));
        // Replace additional context placeholders
        Object.entries(additionalContext).forEach(([key, value]) => {
            template = template.replace(`{${key}}`, value);
        });
        return template + '.png';
    }
    /**
     * Generate video filename based on test context
     */
    static generateVideoFilename(testType, scenario, additionalContext = {}) {
        let template = this.REPORTING_CONFIG.videoNaming[testType];
        // Replace common placeholders
        template = template.replace('{scenario}', scenario.toLowerCase().replace(/\s+/g, '-'));
        template = template.replace('{timestamp}', new Date().toISOString().replace(/[:.]/g, '-'));
        // Replace additional context placeholders
        Object.entries(additionalContext).forEach(([key, value]) => {
            template = template.replace(`{${key}}`, value);
        });
        return template;
    }
    /**
     * Get custom metadata for reports
     */
    static getCustomMetadata() {
        const envConfig = this.getEnvironmentConfig();
        return {
            ...this.REPORTING_CONFIG.customMetadata,
            'Environment': process.env.ENVIRONMENT || 'local',
            'CI Environment': this.isCIEnvironment().toString(),
            'Retries': envConfig.retries.toString(),
            'Timeout': envConfig.timeout.toString(),
            'Parallel Threads': envConfig.parallelThreads.toString(),
            'Video Recording': envConfig.recordVideo.toString(),
            'Base URL': process.env.BASE_URL || 'http://localhost:3000',
            'Browser': process.env.BROWSER || 'chromium',
            'Viewport Category': process.env.VIEWPORT_CATEGORY || 'mobile'
        };
    }
    /**
     * Validate test configuration
     */
    static validateConfiguration() {
        const errors = [];
        const warnings = [];
        // Check required environment variables
        if (!process.env.BASE_URL) {
            warnings.push('BASE_URL not set, using default: http://localhost:3000');
        }
        if (!process.env.BROWSER) {
            warnings.push('BROWSER not set, using default: chromium');
        }
        // Validate timeout values
        const timeout = parseInt(process.env.TEST_TIMEOUT || '5', 10);
        if (timeout < 1 || timeout > 30) {
            warnings.push(`TEST_TIMEOUT (${timeout}) should be between 1-30 minutes`);
        }
        // Validate retry values
        const retries = parseInt(process.env.RETRIES || '1', 10);
        if (retries < 0 || retries > 5) {
            warnings.push(`RETRIES (${retries}) should be between 0-5`);
        }
        // Validate parallel threads
        const parallelThreads = parseInt(process.env.PARALLEL_THREAD || '2', 10);
        if (parallelThreads < 1 || parallelThreads > 10) {
            warnings.push(`PARALLEL_THREAD (${parallelThreads}) should be between 1-10`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Get test execution summary for reporting
     */
    static getExecutionSummary() {
        return {
            configuration: this.getCustomMetadata(),
            categories: this.REPORTING_CONFIG.reportCategories,
            tags: this.getAllNavigationTags(),
            environment: this.isCIEnvironment() ? 'CI/CD' : 'Local'
        };
    }
}
exports.default = NavigationTestConfig;
/**
 * Test tags for categorization and selective execution
 */
NavigationTestConfig.TAGS = {
    navigation: '@navigation',
    responsive: '@responsive',
    mobile: '@mobile',
    performance: '@performance',
    errorHandling: '@error-handling',
    accessibility: '@accessibility',
    crossViewport: '@cross-viewport',
    regression: '@regression',
    sanity: '@sanity'
};
/**
 * Test categories for organized execution
 */
NavigationTestConfig.CATEGORIES = {
    core: ['@navigation', '@regression'],
    mobile: ['@navigation', '@mobile', '@responsive'],
    responsive: ['@navigation', '@responsive', '@cross-viewport'],
    performance: ['@navigation', '@performance'],
    errorHandling: ['@navigation', '@error-handling'],
    accessibility: ['@navigation', '@accessibility']
};
/**
 * CI/CD configuration settings
 */
NavigationTestConfig.CI_CONFIG = {
    retries: parseInt(process.env.CI_RETRIES || '2', 10),
    timeout: parseInt(process.env.CI_TIMEOUT || '10', 10),
    parallelThreads: parseInt(process.env.CI_PARALLEL_THREADS || '1', 10),
    recordVideo: process.env.CI_RECORD_VIDEO === 'true',
    screenshotOnFailure: process.env.CI_SCREENSHOT_ON_FAILURE !== 'false',
    artifactRetentionDays: parseInt(process.env.CI_ARTIFACT_RETENTION_DAYS || '7', 10)
};
/**
 * Reporting configuration for enhanced artifact collection
 */
NavigationTestConfig.REPORTING_CONFIG = {
    screenshotNaming: {
        navigation: 'navigation-error-{scenario}-{viewport}-{timestamp}',
        mobile: 'mobile-navigation-error-{scenario}-{timestamp}',
        performance: 'performance-navigation-error-{scenario}-{loadTime}ms-{timestamp}',
        error: 'navigation-error-{errorType}-{scenario}-{timestamp}'
    },
    videoNaming: {
        navigation: 'navigation-error-{scenario}-{viewport}-{timestamp}.webm',
        mobile: 'mobile-navigation-error-{scenario}-{timestamp}.webm',
        performance: 'performance-navigation-error-{scenario}-{loadTime}ms-{timestamp}.webm',
        error: 'navigation-error-{errorType}-{scenario}-{timestamp}.webm'
    },
    reportCategories: [
        'Navigation Core',
        'Mobile Navigation',
        'Responsive Design',
        'Performance',
        'Error Handling',
        'Accessibility'
    ],
    customMetadata: {
        'Test Framework': 'Playwright + Cucumber',
        'Navigation Framework': 'HWPC Navigation Testing',
        'Mobile-First': 'true',
        'Responsive Testing': 'true',
        'Error Recovery': 'true'
    }
};
//# sourceMappingURL=NavigationTestConfig.js.map