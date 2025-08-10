/**
 * HWPC Mobile Viewports - Standardized mobile device configurations for comprehensive testing
 * Provides device profiles, viewport configurations, and mobile-specific testing utilities
 */

// ===== INTERFACE DEFINITIONS =====

export interface ViewportSize {
    width: number;
    height: number;
}

export interface DeviceConfiguration {
    name: string;
    viewport: ViewportSize;
    userAgent: string;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    orientation?: 'portrait' | 'landscape';
    pixelRatio?: number;
    platform?: string;
    networkType?: '3g' | '4g' | 'wifi' | 'offline';
}

export interface ResponsiveBreakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
    description: string;
}

export interface TouchGestureConfig {
    tapDuration: number;
    longPressDuration: number;
    swipeDistance: number;
    swipeVelocity: number;
    pinchScale: number;
}

export interface NetworkCondition {
    name: string;
    downloadThroughput: number; // bytes per second
    uploadThroughput: number; // bytes per second
    latency: number; // milliseconds
    description: string;
}

// ===== MOBILE DEVICE CONFIGURATIONS =====

export default class MobileViewports {
    
    // ===== STANDARD MOBILE DEVICES =====
    
    static readonly DEVICES = {
        // iPhone Models
        IPHONE_SE_2020: {
            name: "iPhone SE (2020)",
            viewport: { width: 375, height: 667 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'iOS'
        },
        IPHONE_12_MINI: {
            name: "iPhone 12 Mini",
            viewport: { width: 375, height: 812 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_12: {
            name: "iPhone 12",
            viewport: { width: 390, height: 844 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_12_PRO: {
            name: "iPhone 12 Pro",
            viewport: { width: 390, height: 844 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_12_PRO_MAX: {
            name: "iPhone 12 Pro Max",
            viewport: { width: 428, height: 926 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_13: {
            name: "iPhone 13",
            viewport: { width: 390, height: 844 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_13_PRO_MAX: {
            name: "iPhone 13 Pro Max",
            viewport: { width: 428, height: 926 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_14: {
            name: "iPhone 14",
            viewport: { width: 390, height: 844 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        IPHONE_14_PRO_MAX: {
            name: "iPhone 14 Pro Max",
            viewport: { width: 430, height: 932 },
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'iOS'
        },
        
        // Android Devices
        SAMSUNG_GALAXY_S20: {
            name: "Samsung Galaxy S20",
            viewport: { width: 360, height: 800 },
            userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'Android'
        },
        SAMSUNG_GALAXY_S21: {
            name: "Samsung Galaxy S21",
            viewport: { width: 360, height: 800 },
            userAgent: "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'Android'
        },
        SAMSUNG_GALAXY_S22: {
            name: "Samsung Galaxy S22",
            viewport: { width: 360, height: 780 },
            userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36",
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 3,
            platform: 'Android'
        },
        SAMSUNG_GALAXY_NOTE_20: {
            name: "Samsung Galaxy Note 20",
            viewport: { width: 412, height: 915 },
            userAgent: "Mozilla/5.0 (Linux; Android 11; SM-N981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
            deviceScaleFactor: 2.625,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2.625,
            platform: 'Android'
        },
        GOOGLE_PIXEL_5: {
            name: "Google Pixel 5",
            viewport: { width: 393, height: 851 },
            userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36",
            deviceScaleFactor: 2.75,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2.75,
            platform: 'Android'
        },
        GOOGLE_PIXEL_6: {
            name: "Google Pixel 6",
            viewport: { width: 412, height: 915 },
            userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36",
            deviceScaleFactor: 2.625,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2.625,
            platform: 'Android'
        },
        GOOGLE_PIXEL_7: {
            name: "Google Pixel 7",
            viewport: { width: 412, height: 915 },
            userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36",
            deviceScaleFactor: 2.625,
            isMobile: true,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2.625,
            platform: 'Android'
        },
        
        // Tablet Devices
        IPAD_MINI: {
            name: "iPad Mini",
            viewport: { width: 768, height: 1024 },
            userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'iOS'
        },
        IPAD_AIR: {
            name: "iPad Air",
            viewport: { width: 820, height: 1180 },
            userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'iOS'
        },
        IPAD_PRO_11: {
            name: "iPad Pro 11\"",
            viewport: { width: 834, height: 1194 },
            userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'iOS'
        },
        IPAD_PRO_12_9: {
            name: "iPad Pro 12.9\"",
            viewport: { width: 1024, height: 1366 },
            userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'iOS'
        },
        SAMSUNG_GALAXY_TAB_S7: {
            name: "Samsung Galaxy Tab S7",
            viewport: { width: 753, height: 1037 },
            userAgent: "Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36",
            deviceScaleFactor: 2.4,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2.4,
            platform: 'Android'
        },
        SURFACE_PRO_7: {
            name: "Microsoft Surface Pro 7",
            viewport: { width: 912, height: 1368 },
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            orientation: 'portrait' as const,
            pixelRatio: 2,
            platform: 'Windows'
        }
    };
    
    // ===== LANDSCAPE ORIENTATIONS =====
    
    static readonly LANDSCAPE_DEVICES = {
        IPHONE_12_LANDSCAPE: {
            ...MobileViewports.DEVICES.IPHONE_12,
            name: "iPhone 12 (Landscape)",
            viewport: { width: 844, height: 390 },
            orientation: 'landscape' as const
        },
        IPHONE_12_PRO_MAX_LANDSCAPE: {
            ...MobileViewports.DEVICES.IPHONE_12_PRO_MAX,
            name: "iPhone 12 Pro Max (Landscape)",
            viewport: { width: 926, height: 428 },
            orientation: 'landscape' as const
        },
        SAMSUNG_GALAXY_S21_LANDSCAPE: {
            ...MobileViewports.DEVICES.SAMSUNG_GALAXY_S21,
            name: "Samsung Galaxy S21 (Landscape)",
            viewport: { width: 800, height: 360 },
            orientation: 'landscape' as const
        },
        IPAD_AIR_LANDSCAPE: {
            ...MobileViewports.DEVICES.IPAD_AIR,
            name: "iPad Air (Landscape)",
            viewport: { width: 1180, height: 820 },
            orientation: 'landscape' as const
        }
    };
    
    // ===== RESPONSIVE BREAKPOINTS =====
    
    static readonly BREAKPOINTS: ResponsiveBreakpoint[] = [
        {
            name: "Mobile Small",
            minWidth: 320,
            maxWidth: 374,
            description: "Small mobile devices (iPhone SE, older Android phones)"
        },
        {
            name: "Mobile Medium",
            minWidth: 375,
            maxWidth: 413,
            description: "Standard mobile devices (iPhone 12, most Android phones)"
        },
        {
            name: "Mobile Large",
            minWidth: 414,
            maxWidth: 767,
            description: "Large mobile devices (iPhone Pro Max, large Android phones)"
        },
        {
            name: "Tablet Portrait",
            minWidth: 768,
            maxWidth: 1023,
            description: "Tablets in portrait orientation"
        },
        {
            name: "Tablet Landscape",
            minWidth: 1024,
            maxWidth: 1365,
            description: "Tablets in landscape orientation and small laptops"
        },
        {
            name: "Desktop",
            minWidth: 1366,
            maxWidth: 1919,
            description: "Desktop computers and laptops"
        },
        {
            name: "Large Desktop",
            minWidth: 1920,
            description: "Large desktop monitors and high-resolution displays"
        }
    ];
    
    // ===== TOUCH GESTURE CONFIGURATIONS =====
    
    static readonly TOUCH_GESTURES: TouchGestureConfig = {
        tapDuration: 100,        // milliseconds
        longPressDuration: 1000, // milliseconds
        swipeDistance: 100,      // pixels
        swipeVelocity: 500,      // pixels per second
        pinchScale: 0.5          // scale factor for pinch gestures
    };
    
    // ===== NETWORK CONDITIONS =====
    
    static readonly NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
        WIFI: {
            name: "WiFi",
            downloadThroughput: 10 * 1024 * 1024, // 10 Mbps
            uploadThroughput: 5 * 1024 * 1024,    // 5 Mbps
            latency: 20,                           // 20ms
            description: "Fast WiFi connection"
        },
        FAST_4G: {
            name: "Fast 4G",
            downloadThroughput: 4 * 1024 * 1024,  // 4 Mbps
            uploadThroughput: 1 * 1024 * 1024,    // 1 Mbps
            latency: 50,                           // 50ms
            description: "Fast 4G mobile connection"
        },
        SLOW_4G: {
            name: "Slow 4G",
            downloadThroughput: 1.5 * 1024 * 1024, // 1.5 Mbps
            uploadThroughput: 750 * 1024,           // 750 Kbps
            latency: 100,                           // 100ms
            description: "Slow 4G mobile connection"
        },
        FAST_3G: {
            name: "Fast 3G",
            downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
            uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
            latency: 150,                               // 150ms
            description: "Fast 3G mobile connection"
        },
        SLOW_3G: {
            name: "Slow 3G",
            downloadThroughput: 500 * 1024 / 8,  // 500 Kbps
            uploadThroughput: 500 * 1024 / 8,    // 500 Kbps
            latency: 400,                         // 400ms
            description: "Slow 3G mobile connection"
        },
        OFFLINE: {
            name: "Offline",
            downloadThroughput: 0,
            uploadThroughput: 0,
            latency: 0,
            description: "No network connection"
        }
    };
    
    // ===== COMMON VIEWPORT SIZES =====
    
    static readonly COMMON_VIEWPORTS: ViewportSize[] = [
        { width: 320, height: 568 },   // iPhone SE (1st gen)
        { width: 375, height: 667 },   // iPhone SE (2nd gen), iPhone 6/7/8
        { width: 375, height: 812 },   // iPhone X/XS/12 Mini
        { width: 390, height: 844 },   // iPhone 12/13
        { width: 414, height: 896 },   // iPhone XR/11/XS Max/11 Pro Max
        { width: 428, height: 926 },   // iPhone 12/13 Pro Max
        { width: 360, height: 640 },   // Common Android
        { width: 360, height: 800 },   // Samsung Galaxy S20/S21
        { width: 412, height: 915 },   // Google Pixel
        { width: 768, height: 1024 },  // iPad
        { width: 1024, height: 768 },  // iPad Landscape
        { width: 1366, height: 768 },  // Common laptop
        { width: 1920, height: 1080 }  // Full HD desktop
    ];
    
    // ===== UTILITY METHODS =====
    
    /**
     * Get device configuration by name
     * @param deviceName - Name of the device
     * @returns Device configuration or default mobile device
     */
    static getDevice(deviceName: string): DeviceConfiguration {
        const normalizedName = deviceName.toUpperCase().replace(/[\s-]/g, '_');
        
        // Check standard devices first
        if (this.DEVICES[normalizedName as keyof typeof this.DEVICES]) {
            return this.DEVICES[normalizedName as keyof typeof this.DEVICES];
        }
        
        // Check landscape devices
        if (this.LANDSCAPE_DEVICES[normalizedName as keyof typeof this.LANDSCAPE_DEVICES]) {
            return this.LANDSCAPE_DEVICES[normalizedName as keyof typeof this.LANDSCAPE_DEVICES];
        }
        
        // Return default mobile device if not found
        return this.DEVICES.IPHONE_12;
    }
    
    /**
     * Get all mobile devices (excluding tablets)
     * @returns Array of mobile device configurations
     */
    static getMobileDevices(): DeviceConfiguration[] {
        return Object.values(this.DEVICES).filter(device => device.isMobile);
    }
    
    /**
     * Get all tablet devices
     * @returns Array of tablet device configurations
     */
    static getTabletDevices(): DeviceConfiguration[] {
        return Object.values(this.DEVICES).filter(device => !device.isMobile && device.hasTouch);
    }
    
    /**
     * Get devices by platform
     * @param platform - Platform name (iOS, Android, Windows)
     * @returns Array of device configurations for the platform
     */
    static getDevicesByPlatform(platform: string): DeviceConfiguration[] {
        return Object.values(this.DEVICES).filter(device => 
            device.platform?.toLowerCase() === platform.toLowerCase()
        );
    }
    
    /**
     * Get responsive breakpoint for a given width
     * @param width - Viewport width
     * @returns Matching responsive breakpoint
     */
    static getBreakpointForWidth(width: number): ResponsiveBreakpoint | null {
        return this.BREAKPOINTS.find(breakpoint => {
            if (breakpoint.maxWidth) {
                return width >= breakpoint.minWidth && width <= breakpoint.maxWidth;
            }
            return width >= breakpoint.minWidth;
        }) || null;
    }
    
    /**
     * Check if viewport size is mobile
     * @param viewport - Viewport size
     * @returns Boolean indicating if viewport is mobile size
     */
    static isMobileViewport(viewport: ViewportSize): boolean {
        return viewport.width < 768;
    }
    
    /**
     * Check if viewport size is tablet
     * @param viewport - Viewport size
     * @returns Boolean indicating if viewport is tablet size
     */
    static isTabletViewport(viewport: ViewportSize): boolean {
        return viewport.width >= 768 && viewport.width < 1024;
    }
    
    /**
     * Check if viewport size is desktop
     * @param viewport - Viewport size
     * @returns Boolean indicating if viewport is desktop size
     */
    static isDesktopViewport(viewport: ViewportSize): boolean {
        return viewport.width >= 1024;
    }
    
    /**
     * Get landscape orientation for a device
     * @param device - Device configuration
     * @returns Device configuration in landscape orientation
     */
    static getLandscapeOrientation(device: DeviceConfiguration): DeviceConfiguration {
        return {
            ...device,
            name: `${device.name} (Landscape)`,
            viewport: {
                width: device.viewport.height,
                height: device.viewport.width
            },
            orientation: 'landscape'
        };
    }
    
    /**
     * Get portrait orientation for a device
     * @param device - Device configuration
     * @returns Device configuration in portrait orientation
     */
    static getPortraitOrientation(device: DeviceConfiguration): DeviceConfiguration {
        return {
            ...device,
            name: `${device.name} (Portrait)`,
            viewport: {
                width: Math.min(device.viewport.width, device.viewport.height),
                height: Math.max(device.viewport.width, device.viewport.height)
            },
            orientation: 'portrait'
        };
    }
    
    /**
     * Get network condition by name
     * @param conditionName - Name of the network condition
     * @returns Network condition configuration
     */
    static getNetworkCondition(conditionName: string): NetworkCondition {
        const normalizedName = conditionName.toUpperCase().replace(/[\s-]/g, '_');
        return this.NETWORK_CONDITIONS[normalizedName] || this.NETWORK_CONDITIONS.WIFI;
    }
    
    /**
     * Generate test viewport combinations for comprehensive testing
     * @returns Array of viewport configurations for testing
     */
    static getTestViewportCombinations(): Array<{device: DeviceConfiguration, network: NetworkCondition}> {
        const combinations: Array<{device: DeviceConfiguration, network: NetworkCondition}> = [];
        
        // Key mobile devices with different network conditions
        const keyDevices = [
            this.DEVICES.IPHONE_12,
            this.DEVICES.IPHONE_12_PRO_MAX,
            this.DEVICES.SAMSUNG_GALAXY_S21,
            this.DEVICES.GOOGLE_PIXEL_6,
            this.DEVICES.IPAD_AIR
        ];
        
        const keyNetworks = [
            this.NETWORK_CONDITIONS.WIFI,
            this.NETWORK_CONDITIONS.FAST_4G,
            this.NETWORK_CONDITIONS.SLOW_3G
        ];
        
        keyDevices.forEach(device => {
            keyNetworks.forEach(network => {
                combinations.push({ device, network });
            });
        });
        
        return combinations;
    }
    
    /**
     * Get device configuration optimized for HWPC testing
     * @returns Array of device configurations suitable for HWPC testing
     */
    static getHWPCTestDevices(): DeviceConfiguration[] {
        return [
            this.DEVICES.IPHONE_12,           // Standard iPhone
            this.DEVICES.IPHONE_12_PRO_MAX,   // Large iPhone
            this.DEVICES.SAMSUNG_GALAXY_S21,  // Standard Android
            this.DEVICES.GOOGLE_PIXEL_6,      // Google Android
            this.DEVICES.IPAD_AIR,            // Tablet for field work
            this.LANDSCAPE_DEVICES.IPHONE_12_LANDSCAPE, // Landscape mobile
            this.LANDSCAPE_DEVICES.IPAD_AIR_LANDSCAPE   // Landscape tablet
        ];
    }
    
    /**
     * Get viewport sizes for responsive design testing
     * @returns Array of viewport sizes covering all breakpoints
     */
    static getResponsiveTestViewports(): ViewportSize[] {
        return [
            { width: 320, height: 568 },   // Mobile small
            { width: 375, height: 667 },   // Mobile medium
            { width: 414, height: 896 },   // Mobile large
            { width: 768, height: 1024 },  // Tablet portrait
            { width: 1024, height: 768 },  // Tablet landscape
            { width: 1366, height: 768 },  // Desktop small
            { width: 1920, height: 1080 }  // Desktop large
        ];
    }
}