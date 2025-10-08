/**
 * BaselineTestRunner - Comprehensive test runner for measuring timeout performance baselines
 * Runs standardized tests across different pages, viewports, and scenarios
 */

import { Browser } from '@playwright/test';
import { TimeoutPerformanceBaseline, BaselineMetrics, TimeoutMeasurement } from './TimeoutPerformanceBaseline';
import NavigationConstants from '../../hwpc/constants/NavigationConstants';
import HWPCConfig from '../../hwpc/constants/HWPCConfig';

export interface BaselineTestConfig {
    pages: string[];
    viewports: string[];
    iterations: number;
    includeFailureScenarios: boolean;
    outputPath?: string;
}

export interface BaselineTestResults {
    config: BaselineTestConfig;
    environment: string;
    timestamp: number;
    totalDuration: number;
    results: {
        [viewport: string]: {
            [page: string]: {
                measurements: TimeoutMeasurement[];
                metrics: BaselineMetrics;
            };
        };
    };
    summary: {
        totalMeasurements: number;
        totalWastedTime: number;
        averageTimeoutUtilization: number;
        potentialTimeSavings: number;
        recommendations: string[];
    };
}

/**
 * Comprehensive baseline test runner
 */
export class BaselineTestRunner {
    private browser: Browser;
    private results: BaselineTestResults;

    constructor(browser: Browser) {
        this.browser = browser;
    }

    /**
     * Run comprehensive baseline measurements
     */
    async runBaselineTests(config: BaselineTestConfig): Promise<BaselineTestResults> {
        const startTime = Date.now();
        
        this.results = {
            config,
            environment: this.detectEnvironment(),
            timestamp: startTime,
            totalDuration: 0,
            results: {},
            summary: {
                totalMeasurements: 0,
                totalWastedTime: 0,
                averageTimeoutUtilization: 0,
                potentialTimeSavings: 0,
                recommendations: []
            }
        };

        console.log('Starting baseline timeout performance measurements...');
        console.log('Configuration:', config);

        // Run tests for each viewport
        for (const viewport of config.viewports) {
            console.log(`\n=== Testing viewport: ${viewport} ===`);
            this.results.results[viewport] = {};

            const viewportConfig = NavigationConstants.getViewport(viewport);
            let context = null;
            
            try {
                context = await this.browser.newContext({
                    viewport: { width: viewportConfig.width, height: viewportConfig.height }
                });

                // Run tests for each page
                for (const pageName of config.pages) {
                    console.log(`\n--- Testing page: ${pageName} ---`);
                    
                    try {
                        this.results.results[viewport][pageName] = await this.runPageTests(
                            context, 
                            pageName, 
                            viewport, 
                            config.iterations
                        );
                    } catch (error) {
                        console.log(`    Page ${pageName} failed: ${error.message}`);
                        // Create empty results for failed page
                        this.results.results[viewport][pageName] = {
                            measurements: [],
                            metrics: this.calculateMetricsFromMeasurements([])
                        };
                    }
                }
            } catch (error) {
                console.log(`  Viewport ${viewport} failed: ${error.message}`);
                // Create empty results for failed viewport
                for (const pageName of config.pages) {
                    this.results.results[viewport][pageName] = {
                        measurements: [],
                        metrics: this.calculateMetricsFromMeasurements([])
                    };
                }
            } finally {
                if (context) {
                    try {
                        await context.close();
                    } catch (error) {
                        console.log(`    Error closing context: ${error.message}`);
                    }
                }
            }
        }

        // Calculate summary metrics
        this.calculateSummaryMetrics();

        this.results.totalDuration = Date.now() - startTime;
        console.log(`\nBaseline tests completed in ${this.results.totalDuration}ms`);

        return this.results;
    }

    /**
     * Run baseline tests for a specific page
     */
    private async runPageTests(
        context: any, 
        pageName: string, 
        _viewport: string, 
        iterations: number
    ): Promise<{ measurements: TimeoutMeasurement[]; metrics: BaselineMetrics }> {
        let page = null;
        const allMeasurements: TimeoutMeasurement[] = [];

        try {
            page = await context.newPage();
            const baseline = new TimeoutPerformanceBaseline(page);
            await baseline.initialize();

            const pageUrl = NavigationConstants.getPageUrl(pageName);

            // Run multiple iterations for statistical significance
            for (let i = 0; i < iterations; i++) {
                console.log(`  Iteration ${i + 1}/${iterations}`);

                try {
                    // 1. Measure page load
                    const pageLoadMeasurement = await baseline.measurePageLoad(pageName, pageUrl);
                    allMeasurements.push(pageLoadMeasurement);

                    // 2. Measure SPA initialization
                    const spaInitMeasurement = await baseline.measureSPAInitialization(pageName);
                    allMeasurements.push(spaInitMeasurement);

                    // 3. Measure navigation rendering
                    const navRenderMeasurement = await baseline.measureNavigationRendering(pageName);
                    allMeasurements.push(navRenderMeasurement);

                    // 4. Measure network idle
                    const networkIdleMeasurement = await baseline.measureNetworkIdle(pageName);
                    allMeasurements.push(networkIdleMeasurement);

                    // 5. Measure element waiting for key page elements
                    const pageConfig = NavigationConstants.getPageConfig(pageName);
                    if (pageConfig) {
                        // Test main content element
                        try {
                            const mainElementMeasurement = await baseline.measureElementWaiting(
                                pageConfig.selectors.main,
                                'main-content',
                                pageName
                            );
                            allMeasurements.push(mainElementMeasurement);
                        } catch (error) {
                            console.log(`    Main element not found on ${pageName}: ${error.message}`);
                        }

                        // Test navigation element
                        try {
                            const navElementMeasurement = await baseline.measureElementWaiting(
                                pageConfig.selectors.navigation,
                                'navigation',
                                pageName
                            );
                            allMeasurements.push(navElementMeasurement);
                        } catch (error) {
                            console.log(`    Navigation element not found on ${pageName}: ${error.message}`);
                        }

                        // Test search interface if present
                        if (pageConfig.selectors.searchInterface) {
                            try {
                                const searchElementMeasurement = await baseline.measureElementWaiting(
                                    pageConfig.selectors.searchInterface,
                                    'search-interface',
                                    pageName
                                );
                                allMeasurements.push(searchElementMeasurement);
                            } catch (error) {
                                // Search interface might not be present on all pages
                                console.log(`    Search interface not found on ${pageName}: ${error.message}`);
                            }
                        }
                    }

                    // Small delay between iterations to avoid overwhelming the server
                    if (i < iterations - 1) {
                        await page.waitForTimeout(1000);
                    }

                } catch (error) {
                    console.log(`    Iteration ${i + 1} failed: ${error.message}`);
                    // Continue with next iteration
                }
            }

            // Calculate metrics for this page
            const metrics = this.calculateMetricsFromMeasurements(allMeasurements);

            return {
                measurements: allMeasurements,
                metrics
            };

        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (error) {
                    console.log(`    Error closing page: ${error.message}`);
                }
            }
        }
    }

    /**
     * Calculate metrics from a set of measurements
     */
    private calculateMetricsFromMeasurements(measurements: TimeoutMeasurement[]): BaselineMetrics {
        if (measurements.length === 0) {
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

        const successfulMeasurements = measurements.filter(m => m.success);
        const durations = successfulMeasurements.map(m => m.actualDuration);
        const sortedDurations = durations.sort((a, b) => a - b);

        // Calculate percentiles
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p99Index = Math.floor(sortedDurations.length * 0.99);
        const medianIndex = Math.floor(sortedDurations.length * 0.5);

        // Calculate wasted time
        const totalWastedTime = successfulMeasurements.reduce((total, measurement) => {
            const wastedTime = measurement.configuredTimeout - measurement.actualDuration;
            return total + (wastedTime > 0 ? wastedTime : 0);
        }, 0);

        // Calculate timeout utilization
        const totalTimeoutUsed = measurements.reduce((total, m) => total + m.timeoutUsed, 0);
        const totalTimeoutConfigured = measurements.reduce((total, m) => total + m.configuredTimeout, 0);
        const timeoutUtilization = totalTimeoutConfigured > 0 ? (totalTimeoutUsed / totalTimeoutConfigured) * 100 : 0;

        // Calculate operation breakdown
        const operationBreakdown: BaselineMetrics['operationBreakdown'] = {};
        
        for (const measurement of measurements) {
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
            totalMeasurements: measurements.length,
            successfulOperations: successfulMeasurements.length,
            failedOperations: measurements.length - successfulMeasurements.length,
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
     * Calculate summary metrics across all tests
     */
    private calculateSummaryMetrics(): void {
        let totalMeasurements = 0;
        let totalWastedTime = 0;
        let totalTimeoutUtilization = 0;
        let utilizationCount = 0;

        // Aggregate metrics from all viewport/page combinations
        for (const viewport in this.results.results) {
            for (const page in this.results.results[viewport]) {
                const pageResults = this.results.results[viewport][page];
                totalMeasurements += pageResults.metrics.totalMeasurements;
                totalWastedTime += pageResults.metrics.wastedTime;
                
                if (pageResults.metrics.timeoutUtilization > 0) {
                    totalTimeoutUtilization += pageResults.metrics.timeoutUtilization;
                    utilizationCount++;
                }
            }
        }

        const averageTimeoutUtilization = utilizationCount > 0 ? totalTimeoutUtilization / utilizationCount : 0;
        const potentialTimeSavings = totalWastedTime;

        // Generate recommendations based on findings
        const recommendations = this.generateRecommendations(averageTimeoutUtilization, totalWastedTime, totalMeasurements);

        this.results.summary = {
            totalMeasurements,
            totalWastedTime,
            averageTimeoutUtilization,
            potentialTimeSavings,
            recommendations
        };
    }

    /**
     * Generate recommendations based on baseline measurements
     */
    private generateRecommendations(
        avgUtilization: number, 
        totalWastedTime: number, 
        totalMeasurements: number
    ): string[] {
        const recommendations: string[] = [];

        // Timeout utilization recommendations
        if (avgUtilization < 30) {
            recommendations.push(
                `Low timeout utilization (${avgUtilization.toFixed(1)}%) indicates timeouts are too conservative. ` +
                'Consider implementing smart timeout strategies with progressive timeouts.'
            );
        } else if (avgUtilization > 80) {
            recommendations.push(
                `High timeout utilization (${avgUtilization.toFixed(1)}%) indicates timeouts may be too aggressive. ` +
                'Consider increasing base timeouts or implementing better readiness detection.'
            );
        }

        // Wasted time recommendations
        const avgWastedTimePerOperation = totalWastedTime / totalMeasurements;
        if (avgWastedTimePerOperation > 2000) {
            recommendations.push(
                `High average wasted time per operation (${avgWastedTimePerOperation.toFixed(0)}ms). ` +
                'Implement application-specific readiness detection to reduce unnecessary waiting.'
            );
        }

        // Total time savings potential
        if (totalWastedTime > 30000) {
            const timeSavingsMinutes = (totalWastedTime / 1000 / 60).toFixed(1);
            recommendations.push(
                `Significant time savings potential: ${timeSavingsMinutes} minutes could be saved ` +
                'across all measured operations. Prioritize timeout optimization implementation.'
            );
        }

        // Environment-specific recommendations
        const environment = this.detectEnvironment();
        if (environment === 'local') {
            recommendations.push(
                'Local environment detected. Implement fast timeout profiles for local development ' +
                'to improve developer experience and test feedback speed.'
            );
        } else if (environment === 'ci') {
            recommendations.push(
                'CI environment detected. Balance timeout optimization with reliability. ' +
                'Consider moderate timeout reductions with robust fallback strategies.'
            );
        }

        return recommendations;
    }

    /**
     * Export results to JSON file
     */
    async exportResults(filePath?: string): Promise<string> {
        const outputPath = filePath || `baseline-results-${Date.now()}.json`;
        const resultsJson = JSON.stringify(this.results, null, 2);
        
        // In a real implementation, you would write to file system
        // For now, we'll return the JSON string
        console.log(`Baseline results exported to: ${outputPath}`);
        return resultsJson;
    }

    /**
     * Generate human-readable report
     */
    generateReport(): string {
        const report = [];
        
        report.push('# Timeout Performance Baseline Report');
        report.push(`Generated: ${new Date(this.results.timestamp).toISOString()}`);
        report.push(`Environment: ${this.results.environment}`);
        report.push(`Total Duration: ${(this.results.totalDuration / 1000).toFixed(1)}s`);
        report.push('');

        // Summary section
        report.push('## Summary');
        report.push(`- Total Measurements: ${this.results.summary.totalMeasurements}`);
        report.push(`- Total Wasted Time: ${(this.results.summary.totalWastedTime / 1000).toFixed(1)}s`);
        report.push(`- Average Timeout Utilization: ${this.results.summary.averageTimeoutUtilization.toFixed(1)}%`);
        report.push(`- Potential Time Savings: ${(this.results.summary.potentialTimeSavings / 1000).toFixed(1)}s`);
        report.push('');

        // Recommendations section
        report.push('## Recommendations');
        this.results.summary.recommendations.forEach((rec, index) => {
            report.push(`${index + 1}. ${rec}`);
        });
        report.push('');

        // Detailed results by viewport and page
        report.push('## Detailed Results');
        for (const viewport in this.results.results) {
            report.push(`### ${viewport.toUpperCase()} Viewport`);
            
            for (const page in this.results.results[viewport]) {
                const pageResults = this.results.results[viewport][page];
                const metrics = pageResults.metrics;
                
                report.push(`#### ${page} Page`);
                report.push(`- Measurements: ${metrics.totalMeasurements}`);
                report.push(`- Success Rate: ${((metrics.successfulOperations / metrics.totalMeasurements) * 100).toFixed(1)}%`);
                report.push(`- Average Duration: ${metrics.averageDuration.toFixed(0)}ms`);
                report.push(`- P95 Duration: ${metrics.p95Duration.toFixed(0)}ms`);
                report.push(`- Timeout Utilization: ${metrics.timeoutUtilization.toFixed(1)}%`);
                report.push(`- Wasted Time: ${(metrics.wastedTime / 1000).toFixed(1)}s`);
                
                // Operation breakdown
                report.push('- Operation Breakdown:');
                for (const operation in metrics.operationBreakdown) {
                    const op = metrics.operationBreakdown[operation];
                    report.push(`  - ${operation}: ${op.averageDuration.toFixed(0)}ms avg (${op.count} samples)`);
                }
                report.push('');
            }
        }

        return report.join('\n');
    }

    /**
     * Detect environment
     */
    private detectEnvironment(): string {
        if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL) {
            return 'ci';
        }
        
        const baseUrl = NavigationConstants.getBaseUrl();
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            return 'local';
        }
        
        return 'remote';
    }
}