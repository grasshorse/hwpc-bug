/**
 * HWPC Environment-specific Configuration
 * This file contains environment-specific configurations for HWPC testing
 */

export interface HWPCEnvironmentConfig {
    baseUrl: string;
    apiBaseUrl: string;
    environment: string;
    timeouts: {
        default: number;
        mobile: number;
        api: number;
        network: number;
    };
    viewport: {
        width: number;
        height: number;
    };
    features: {
        apiTesting: boolean;
        mobileFirst: boolean;
        responsiveTesting: boolean;
        accessibilityTesting: boolean;
    };
}

export default class HWPCConfig {
    // ===== ENVIRONMENT CONFIGURATIONS =====
    
    static readonly TEST_CONFIG: HWPCEnvironmentConfig = {
        baseUrl: "http://10.147.17.219:3000",
        apiBaseUrl: "http://10.147.17.219:3000/api/v1",
        environment: "test",
        timeouts: {
            default: 5000,
            mobile: 8000,
            api: 10000,
            network: 15000
        },
        viewport: {
            width: 375,
            height: 667
        },
        features: {
            apiTesting: false, // API not yet available
            mobileFirst: true,
            responsiveTesting: true,
            accessibilityTesting: true
        }
    };
    
    static readonly QA_CONFIG: HWPCEnvironmentConfig = {
        baseUrl: process.env.QA_BASE_URL || "http://hwpc-qa.example.com",
        apiBaseUrl: process.env.QA_API_URL || "http://hwpc-qa.example.com/api/v1",
        environment: "qa",
        timeouts: {
            default: 5000,
            mobile: 8000,
            api: 10000,
            network: 15000
        },
        viewport: {
            width: 375,
            height: 667
        },
        features: {
            apiTesting: true,
            mobileFirst: true,
            responsiveTesting: true,
            accessibilityTesting: true
        }
    };
    
    static readonly PROD_CONFIG: HWPCEnvironmentConfig = {
        baseUrl: process.env.PROD_BASE_URL || "https://hwpc.example.com",
        apiBaseUrl: process.env.PROD_API_URL || "https://hwpc.example.com/api/v1",
        environment: "prod",
        timeouts: {
            default: 3000,
            mobile: 5000,
            api: 8000,
            network: 10000
        },
        viewport: {
            width: 375,
            height: 667
        },
        features: {
            apiTesting: true,
            mobileFirst: true,
            responsiveTesting: true,
            accessibilityTesting: false // Disabled in prod for performance
        }
    };
    
    // ===== MOBILE DEVICE CONFIGURATIONS =====
    
    static readonly MOBILE_DEVICES = {
        IPHONE_SE: {
            name: "iPhone SE",
            viewport: { width: 375, height: 667 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        },
        IPHONE_12: {
            name: "iPhone 12",
            viewport: { width: 390, height: 844 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        },
        SAMSUNG_GALAXY_S21: {
            name: "Samsung Galaxy S21",
            viewport: { width: 360, height: 800 },
            userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        },
        IPAD: {
            name: "iPad",
            viewport: { width: 768, height: 1024 },
            userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true
        }
    };
    
    // ===== RESPONSIVE TESTING CONFIGURATIONS =====
    
    static readonly RESPONSIVE_TEST_VIEWPORTS = [
        { name: "Mobile Small", width: 320, height: 568 },
        { name: "Mobile Medium", width: 375, height: 667 },
        { name: "Mobile Large", width: 414, height: 896 },
        { name: "Tablet Portrait", width: 768, height: 1024 },
        { name: "Tablet Landscape", width: 1024, height: 768 },
        { name: "Desktop Small", width: 1366, height: 768 },
        { name: "Desktop Large", width: 1920, height: 1080 }
    ];
    
    // ===== PERFORMANCE TESTING CONFIGURATIONS =====
    
    static readonly NETWORK_CONDITIONS = {
        FAST_3G: {
            name: "Fast 3G",
            downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
            uploadThroughput: 750 * 1024 / 8, // 750 Kbps
            latency: 150
        },
        SLOW_3G: {
            name: "Slow 3G",
            downloadThroughput: 500 * 1024 / 8, // 500 Kbps
            uploadThroughput: 500 * 1024 / 8, // 500 Kbps
            latency: 400
        },
        OFFLINE: {
            name: "Offline",
            downloadThroughput: 0,
            uploadThroughput: 0,
            latency: 0
        }
    };
    
    // ===== UTILITY METHODS =====
    
    /**
     * Get configuration based on environment
     * @param environment - The environment name (test, qa, prod)
     * @returns Environment-specific configuration
     */
    static getConfig(environment?: string): HWPCEnvironmentConfig {
        const env = environment || process.env.NODE_ENV || process.env.TEST_ENV || "test";
        
        switch (env.toLowerCase()) {
            case "qa":
                return this.QA_CONFIG;
            case "prod":
            case "production":
                return this.PROD_CONFIG;
            case "test":
            case "development":
            default:
                return this.TEST_CONFIG;
        }
    }
    
    /**
     * Get mobile device configuration by name
     * @param deviceName - Name of the mobile device
     * @returns Device configuration
     */
    static getMobileDevice(deviceName: string) {
        const devices = this.MOBILE_DEVICES as any;
        return devices[deviceName.toUpperCase().replace(/\s+/g, '_')] || devices.IPHONE_SE;
    }
    
    /**
     * Check if API testing is enabled for current environment
     * @param environment - The environment name
     * @returns Boolean indicating if API testing is enabled
     */
    static isApiTestingEnabled(environment?: string): boolean {
        return this.getConfig(environment).features.apiTesting;
    }
    
    /**
     * Check if mobile-first testing is enabled
     * @param environment - The environment name
     * @returns Boolean indicating if mobile-first testing is enabled
     */
    static isMobileFirstEnabled(environment?: string): boolean {
        return this.getConfig(environment).features.mobileFirst;
    }
    
    /**
     * Get timeout value for specific operation type
     * @param operation - Type of operation (default, mobile, api, network)
     * @param environment - The environment name
     * @returns Timeout value in milliseconds
     */
    static getTimeout(operation: 'default' | 'mobile' | 'api' | 'network', environment?: string): number {
        return this.getConfig(environment).timeouts[operation];
    }
    
    /**
     * Get base URL for current environment
     * @param environment - The environment name
     * @returns Base URL string
     */
    static getBaseUrl(environment?: string): string {
        return this.getConfig(environment).baseUrl;
    }
    
    /**
     * Get API base URL for current environment
     * @param environment - The environment name
     * @returns API base URL string
     */
    static getApiBaseUrl(environment?: string): string {
        return this.getConfig(environment).apiBaseUrl;
    }
}