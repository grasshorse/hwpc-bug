/**
 * TimeoutPerformanceBaseline - Utilities for measuring current timeout behavior
 * and creating baseline metrics for navigation, SPA initialization, and element waiting
 */

import { Page } from '@playwright/test';
import NavigationConstants from '../../hwpc/constants/NavigationConstants';
import HWPCConfig from '../../hwpc/constants/HWPCConfig';

export interface TimeoutMeasurement {
    operation: string;
    startTime: number;
    endTime: number;
    actualDuration: number;
    configuredTimeout: number;
    timeoutUsed: number;
    success: boolean;
    errorMessage?: string;
    metadata: {
        selector?: string;
        pageName?: string;
        viewport?: string;
        environment?: string;
        url?: string;
    };
}

export interface BaselineMetrics {
    totalMeasurements: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    timeoutUtilization: number; // Percentage of timeout actually used
    wastedTime: number; // Total time that could have been saved
    operationBreakdown: {
        [operation: string]: {
            count: number;
            averageDuration: number;
            averageTimeout: number;
            wastedTime: number;
        };
    };
}

export interface EnvironmentContext {
    environment: 'local' | 'ci' | 'remote';
    viewport: string;
    baseUrl: string;
    timestamp: number;
    userAgent: string;
    networkConditions?: string;
}

/**
 * Performance measurement utility for capturing timeout behavior
 */
export class TimeoutPerformanceBaseline {
    private measurements: TimeoutMeasurement[] = [];
    private context: EnvironmentContext;

    constructor(private page: Page, environment?: 'local' | 'ci' | 'remote') {
        this.context = {
            environment: environment || this.detectEnvironment(),
            viewport: 'unknown',
            baseUrl: HWPCConfig.getBaseUrl(),
            timestamp: Date.now(),
            userAgent: 'unknown'
        };
    }

    /**
     * Initialize baseline measurement context
     */
    async initialize(): Promise<void> {
        // Get viewport information
        const viewport = this.page.viewportSize();
        if (viewport) {
            this.context.viewport = NavigationConstants.getViewportCategoryByWidth(viewport.width);
        }

        // Get user agent
        this.context.userAgent = await this.page.evaluate(() => navigator.userAgent);

        console.log('TimeoutPerformanceBaseline initialized:', this.context);
    }

    /**
     * Measure SPA initialization timeout performance
     */
    async measureSPAInitialization(pageName: string): Promise<TimeoutMeasurement> {
        const startTime = performance.now();
        const configuredTimeout = NavigationConstants.SPA_TIMEOUTS.initialization;
        
        try {
            // Measure actual SPA initialization time
            await this.page.waitForFunction(
                () => {
                    return document.readyState === 'complete' &&
                           window.performance &&
                           document.querySelector('script[src*="app"]') !== null;
                },
                { timeout: configuredTimeout }
            );

            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'spa_initialization',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: actualDuration,
                success: true,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;

        } catch (error) {
            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'spa_initialization',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: configuredTimeout, // Full timeout was used
                success: false,
                errorMessage: error.message,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;
        }
    }

    /**
     * Measure navigation rendering timeout performance
     */
    async measureNavigationRendering(pageName: string): Promise<TimeoutMeasurement> {
        const startTime = performance.now();
        const configuredTimeout = NavigationConstants.SPA_TIMEOUTS.navigationRender;
        
        try {
            // Measure actual navigation rendering time
            await this.page.waitForFunction(
                () => {
                    const navContainer = document.querySelector(NavigationConstants.NAVIGATION_CONTAINER);
                    if (!navContainer) return false;
                    const navLinks = navContainer.querySelectorAll('a[href]');
                    return navLinks.length > 0;
                },
                { timeout: configuredTimeout }
            );

            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'navigation_rendering',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: actualDuration,
                success: true,
                metadata: {
                    pageName,
                    selector: NavigationConstants.NAVIGATION_CONTAINER,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;

        } catch (error) {
            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'navigation_rendering',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: configuredTimeout,
                success: false,
                errorMessage: error.message,
                metadata: {
                    pageName,
                    selector: NavigationConstants.NAVIGATION_CONTAINER,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;
        }
    }

    /**
     * Measure element waiting timeout performance
     */
    async measureElementWaiting(selector: string, _elementName: string, pageName?: string): Promise<TimeoutMeasurement> {
        const startTime = performance.now();
        const viewportCategory = this.context.viewport;
        const configuredTimeout = NavigationConstants.getTimeout(viewportCategory, 'elementWait');
        
        try {
            // Measure actual element waiting time
            await this.page.waitForSelector(selector, { 
                timeout: configuredTimeout,
                state: 'visible'
            });

            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'element_waiting',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: actualDuration,
                success: true,
                metadata: {
                    selector,
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;

        } catch (error) {
            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'element_waiting',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: configuredTimeout,
                success: false,
                errorMessage: error.message,
                metadata: {
                    selector,
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;
        }
    }

    /**
     * Measure page load timeout performance
     */
    async measurePageLoad(pageName: string, targetUrl: string): Promise<TimeoutMeasurement> {
        const startTime = performance.now();
        const viewportCategory = this.context.viewport;
        const configuredTimeout = NavigationConstants.getTimeout(viewportCategory, 'pageLoad');
        
        try {
            // Navigate and measure page load time
            await this.page.goto(targetUrl, { 
                timeout: configuredTimeout,
                waitUntil: 'domcontentloaded'
            });

            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'page_load',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: actualDuration,
                success: true,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: targetUrl
                }
            };

            this.measurements.push(measurement);
            return measurement;

        } catch (error) {
            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'page_load',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: configuredTimeout,
                success: false,
                errorMessage: error.message,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: targetUrl
                }
            };

            this.measurements.push(measurement);
            return measurement;
        }
    }

    /**
     * Measure network idle timeout performance
     */
    async measureNetworkIdle(pageName: string): Promise<TimeoutMeasurement> {
        const startTime = performance.now();
        const viewportCategory = this.context.viewport;
        const configuredTimeout = NavigationConstants.getTimeout(viewportCategory, 'networkIdle');
        
        try {
            // Measure network idle waiting time
            await this.page.waitForLoadState('networkidle', { timeout: configuredTimeout });

            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'network_idle',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: actualDuration,
                success: true,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;

        } catch (error) {
            const endTime = performance.now();
            const actualDuration = endTime - startTime;

            const measurement: TimeoutMeasurement = {
                operation: 'network_idle',
                startTime,
                endTime,
                actualDuration,
                configuredTimeout,
                timeoutUsed: configuredTimeout,
                success: false,
                errorMessage: error.message,
                metadata: {
                    pageName,
                    viewport: this.context.viewport,
                    environment: this.context.environment,
                    url: this.page.url()
                }
            };

            this.measurements.push(measurement);
            return measurement;
        }
    }

    /**
     * Calculate baseline metrics from collected measurements
     */
    calculateBaselineMetrics(): BaselineMetrics {
        if (this.measurements.length === 0) {
            // Return empty metrics instead of throwing error
            return {
                totalMeasurements: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageDuration: 0,
                medianDuration: 0,
                p95Duration: 0,
                p99Duration: 0,
                timeoutUtilization: 0,
                wastedTime: 0,
                operationBreakdown: {}
            };
        }

        const successfulMeasurements = this.measurements.filter(m => m.success);
        const durations = successfulMeasurements.map(m => m.actualDuration);
        const sortedDurations = durations.sort((a, b) => a - b);

        // Calculate percentiles
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p99Index = Math.floor(sortedDurations.length * 0.99);
        const medianIndex = Math.floor(sortedDurations.length * 0.5);

        // Calculate wasted time (time that could have been saved)
        const totalWastedTime = successfulMeasurements.reduce((total, measurement) => {
            const wastedTime = measurement.configuredTimeout - measurement.actualDuration;
            return total + (wastedTime > 0 ? wastedTime : 0);
        }, 0);

        // Calculate timeout utilization
        const totalTimeoutUsed = this.measurements.reduce((total, m) => total + m.timeoutUsed, 0);
        const totalTimeoutConfigured = this.measurements.reduce((total, m) => total + m.configuredTimeout, 0);
        const timeoutUtilization = (totalTimeoutUsed / totalTimeoutConfigured) * 100;

        // Calculate operation breakdown
        const operationBreakdown: BaselineMetrics['operationBreakdown'] = {};
        
        for (const measurement of this.measurements) {
            if (!operationBreakdown[measurement.operation]) {
                operationBreakdown[measurement.operation] = {
                    count: 0,
                    averageDuration: 0,
                    averageTimeout: 0,
                    wastedTime: 0
                };
            }

            const op = operationBreakdown[measurement.operation];
            op.count++;
            op.averageDuration = (op.averageDuration * (op.count - 1) + measurement.actualDuration) / op.count;
            op.averageTimeout = (op.averageTimeout * (op.count - 1) + measurement.configuredTimeout) / op.count;
            
            if (measurement.success) {
                const wastedTime = measurement.configuredTimeout - measurement.actualDuration;
                op.wastedTime += wastedTime > 0 ? wastedTime : 0;
            }
        }

        return {
            totalMeasurements: this.measurements.length,
            successfulOperations: successfulMeasurements.length,
            failedOperations: this.measurements.length - successfulMeasurements.length,
            averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
            medianDuration: sortedDurations[medianIndex] || 0,
            p95Duration: sortedDurations[p95Index] || 0,
            p99Duration: sortedDurations[p99Index] || 0,
            timeoutUtilization,
            wastedTime: totalWastedTime,
            operationBreakdown
        };
    }

    /**
     * Get all measurements
     */
    getMeasurements(): TimeoutMeasurement[] {
        return [...this.measurements];
    }

    /**
     * Get measurements by operation type
     */
    getMeasurementsByOperation(operation: string): TimeoutMeasurement[] {
        return this.measurements.filter(m => m.operation === operation);
    }

    /**
     * Clear all measurements
     */
    clearMeasurements(): void {
        this.measurements = [];
    }

    /**
     * Export measurements to JSON
     */
    exportMeasurements(): string {
        return JSON.stringify({
            context: this.context,
            measurements: this.measurements,
            baseline: this.calculateBaselineMetrics()
        }, null, 2);
    }

    /**
     * Detect environment based on various indicators
     */
    private detectEnvironment(): 'local' | 'ci' | 'remote' {
        // Check for CI environment variables
        if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL) {
            return 'ci';
        }

        // Check for local development indicators
        const baseUrl = HWPCConfig.getBaseUrl();
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            return 'local';
        }

        // Default to remote
        return 'remote';
    }
}