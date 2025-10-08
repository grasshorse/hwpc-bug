/**
 * Timeout Performance Baseline Test Suite
 * Measures current timeout behavior to establish performance baselines
 */

// Load environment variables first
require('dotenv').config();

import { test, expect, Browser, chromium } from '@playwright/test';
import EnvUtil from '../../support/utils/EnvUtil';
import { BaselineTestRunner, BaselineTestConfig } from '../../support/utils/BaselineTestRunner';
import { TimeoutPerformanceBaseline } from '../../support/utils/TimeoutPerformanceBaseline';
import NavigationConstants from '../../hwpc/constants/NavigationConstants';
import HWPCConfig from '../../hwpc/constants/HWPCConfig';

// Ensure environment variables are loaded
EnvUtil.setEnv();
import fs from 'fs/promises';
import path from 'path';

// Test configuration for baseline measurements
const BASELINE_CONFIG: BaselineTestConfig = {
    pages: ['home', 'customers'], // Reduced scope for faster execution
    viewports: ['mobile', 'desktop'], // Reduced viewports for faster execution
    iterations: 2, // Reduced iterations for faster execution
    includeFailureScenarios: true,
    outputPath: 'baseline-results'
};

test.describe('Timeout Performance Baseline Measurements', () => {
    let browser: Browser;
    let baselineRunner: BaselineTestRunner;

    // Increase test timeout for comprehensive measurements
    test.setTimeout(180000); // 3 minutes per test

    test.beforeAll(async () => {
        // Verify base URL configuration
        const navigationBaseUrl = NavigationConstants.getBaseUrl();
        const hwpcBaseUrl = HWPCConfig.getBaseUrl();
        
        console.log('=== BASE URL VERIFICATION ===');
        console.log(`NavigationConstants.getBaseUrl(): ${navigationBaseUrl}`);
        console.log(`HWPCConfig.getBaseUrl(): ${hwpcBaseUrl}`);
        console.log(`process.env.BASE_URL: ${process.env.BASE_URL}`);
        
        if (navigationBaseUrl !== hwpcBaseUrl) {
            console.warn(`⚠️  WARNING: Base URL mismatch detected!`);
            console.warn(`   NavigationConstants: ${navigationBaseUrl}`);
            console.warn(`   HWPCConfig: ${hwpcBaseUrl}`);
            console.warn(`   This may affect baseline measurement accuracy.`);
        } else {
            console.log(`✅ Base URL configuration is consistent: ${navigationBaseUrl}`);
        }
        
        // Launch browser for baseline tests
        browser = await chromium.launch();
        baselineRunner = new BaselineTestRunner(browser);
    });

    test.afterAll(async () => {
        // Clean up browser
        if (browser) {
            await browser.close();
        }
    });

    test('Run comprehensive baseline measurements', async () => {
        // Run the comprehensive baseline test suite
        const results = await baselineRunner.runBaselineTests(BASELINE_CONFIG);
        
        // Validate that we got meaningful results
        expect(results.summary.totalMeasurements).toBeGreaterThan(0);
        expect(results.totalDuration).toBeGreaterThan(0);
        
        // Log summary results
        console.log('\n=== BASELINE MEASUREMENT SUMMARY ===');
        console.log(`Total Measurements: ${results.summary.totalMeasurements}`);
        console.log(`Total Wasted Time: ${(results.summary.totalWastedTime / 1000).toFixed(1)}s`);
        console.log(`Average Timeout Utilization: ${results.summary.averageTimeoutUtilization.toFixed(1)}%`);
        console.log(`Potential Time Savings: ${(results.summary.potentialTimeSavings / 1000).toFixed(1)}s`);
        console.log(`Test Duration: ${(results.totalDuration / 1000).toFixed(1)}s`);
        
        // Log recommendations
        console.log('\n=== RECOMMENDATIONS ===');
        results.summary.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });

        // Export detailed results
        const resultsJson = await baselineRunner.exportResults();
        const reportText = baselineRunner.generateReport();
        
        // Save results to files
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsDir = 'baseline-results';
        
        try {
            await fs.mkdir(resultsDir, { recursive: true });
            
            // Save JSON results
            const jsonPath = path.join(resultsDir, `baseline-results-${timestamp}.json`);
            await fs.writeFile(jsonPath, resultsJson);
            console.log(`\nDetailed results saved to: ${jsonPath}`);
            
            // Save human-readable report
            const reportPath = path.join(resultsDir, `baseline-report-${timestamp}.md`);
            await fs.writeFile(reportPath, reportText);
            console.log(`Human-readable report saved to: ${reportPath}`);
            
            // Update the main timeout analysis report
            const analysisReportPath = 'timeout-analysis-report.md';
            const baselineSection = generateBaselineSection(results);
            
            try {
                const existingReport = await fs.readFile(analysisReportPath, 'utf-8');
                const updatedReport = existingReport + '\n\n' + baselineSection;
                await fs.writeFile(analysisReportPath, updatedReport);
                console.log(`Updated analysis report: ${analysisReportPath}`);
            } catch (error) {
                // If file doesn't exist, create it with just the baseline section
                await fs.writeFile(analysisReportPath, baselineSection);
                console.log(`Created new analysis report: ${analysisReportPath}`);
            }
            
        } catch (error) {
            console.error('Error saving baseline results:', error);
            // Don't fail the test if we can't save files, just log the error
        }

        // Validate key performance indicators
        expect(results.summary.averageTimeoutUtilization).toBeLessThan(90); // Should not be using 90%+ of timeouts
        expect(results.summary.totalWastedTime).toBeGreaterThan(0); // Should identify some wasted time
        expect(results.summary.recommendations.length).toBeGreaterThan(0); // Should provide recommendations
    });

    test('Individual timeout measurement validation', async () => {
        // Test individual measurement methods to ensure they work correctly
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        
        const page = await context.newPage();
        const baseline = new TimeoutPerformanceBaseline(page, 'local');
        await baseline.initialize();
        
        try {
            // Test page load measurement
            const pageLoadMeasurement = await baseline.measurePageLoad('home', NavigationConstants.getPageUrl('home'));
            expect(pageLoadMeasurement.operation).toBe('page_load');
            expect(pageLoadMeasurement.actualDuration).toBeGreaterThan(0);
            expect(pageLoadMeasurement.configuredTimeout).toBeGreaterThan(0);
            
            // Test SPA initialization measurement
            const spaInitMeasurement = await baseline.measureSPAInitialization('home');
            expect(spaInitMeasurement.operation).toBe('spa_initialization');
            expect(spaInitMeasurement.actualDuration).toBeGreaterThan(0);
            
            // Test navigation rendering measurement
            const navRenderMeasurement = await baseline.measureNavigationRendering('home');
            expect(navRenderMeasurement.operation).toBe('navigation_rendering');
            expect(navRenderMeasurement.actualDuration).toBeGreaterThan(0);
            
            // Test element waiting measurement
            const elementMeasurement = await baseline.measureElementWaiting('body', 'body-element', 'home');
            expect(elementMeasurement.operation).toBe('element_waiting');
            expect(elementMeasurement.actualDuration).toBeGreaterThan(0);
            
            // Calculate baseline metrics
            const metrics = baseline.calculateBaselineMetrics();
            expect(metrics.totalMeasurements).toBe(4);
            expect(metrics.averageDuration).toBeGreaterThan(0);
            
            console.log('\n=== INDIVIDUAL MEASUREMENT VALIDATION ===');
            console.log(`Page Load: ${pageLoadMeasurement.actualDuration.toFixed(0)}ms (${pageLoadMeasurement.success ? 'SUCCESS' : 'FAILED'})`);
            console.log(`SPA Init: ${spaInitMeasurement.actualDuration.toFixed(0)}ms (${spaInitMeasurement.success ? 'SUCCESS' : 'FAILED'})`);
            console.log(`Nav Render: ${navRenderMeasurement.actualDuration.toFixed(0)}ms (${navRenderMeasurement.success ? 'SUCCESS' : 'FAILED'})`);
            console.log(`Element Wait: ${elementMeasurement.actualDuration.toFixed(0)}ms (${elementMeasurement.success ? 'SUCCESS' : 'FAILED'})`);
            console.log(`Average Duration: ${metrics.averageDuration.toFixed(0)}ms`);
            console.log(`Timeout Utilization: ${metrics.timeoutUtilization.toFixed(1)}%`);
            
        } finally {
            await context.close();
        }
    });

    test('Environment detection validation', async () => {
        // Test that environment detection works correctly
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        
        const page = await context.newPage();
        const baseline = new TimeoutPerformanceBaseline(page);
        await baseline.initialize();
        
        try {
            // Run a simple measurement to ensure we have data
            await baseline.measurePageLoad('home', NavigationConstants.getPageUrl('home'));
            
            // Verify environment detection
            const measurements = baseline.getMeasurements();
            expect(measurements).toBeDefined();
            expect(measurements.length).toBeGreaterThan(0);
            
            // Test export functionality
            const exportData = baseline.exportMeasurements();
            expect(exportData).toContain('context');
            expect(exportData).toContain('measurements');
            expect(exportData).toContain('baseline');
            
            const parsedData = JSON.parse(exportData);
            expect(parsedData.context.environment).toMatch(/^(local|ci|remote)$/);
            expect(parsedData.context.viewport).toMatch(/^(mobile|tablet|desktop)$/);
            
            console.log('\n=== ENVIRONMENT DETECTION ===');
            console.log(`Environment: ${parsedData.context.environment}`);
            console.log(`Viewport: ${parsedData.context.viewport}`);
            console.log(`Base URL: ${parsedData.context.baseUrl}`);
            console.log(`User Agent: ${parsedData.context.userAgent.substring(0, 50)}...`);
            
        } finally {
            await context.close();
        }
    });
});

/**
 * Generate baseline section for the analysis report
 */
function generateBaselineSection(results: any): string {
    const report = [];
    
    report.push('# Task 1.2: Timeout Performance Baseline Measurements');
    report.push(`Generated: ${new Date(results.timestamp).toISOString()}`);
    report.push(`Environment: ${results.environment}`);
    report.push(`Test Duration: ${(results.totalDuration / 1000).toFixed(1)}s`);
    report.push('');

    // Executive Summary
    report.push('## Executive Summary');
    report.push(`- **Total Measurements**: ${results.summary.totalMeasurements} timeout operations measured`);
    report.push(`- **Total Wasted Time**: ${(results.summary.totalWastedTime / 1000).toFixed(1)}s of unnecessary waiting identified`);
    report.push(`- **Average Timeout Utilization**: ${results.summary.averageTimeoutUtilization.toFixed(1)}% of configured timeout values actually used`);
    report.push(`- **Potential Time Savings**: ${(results.summary.potentialTimeSavings / 1000).toFixed(1)}s could be saved per test run`);
    report.push('');

    // Key Findings
    report.push('## Key Findings');
    
    if (results.summary.averageTimeoutUtilization < 30) {
        report.push('- **🔴 CRITICAL**: Extremely low timeout utilization indicates massive over-provisioning of timeout values');
    } else if (results.summary.averageTimeoutUtilization < 50) {
        report.push('- **🟡 WARNING**: Low timeout utilization suggests timeouts are too conservative');
    } else if (results.summary.averageTimeoutUtilization > 80) {
        report.push('- **🟡 WARNING**: High timeout utilization may indicate timeouts are too aggressive');
    } else {
        report.push('- **🟢 GOOD**: Timeout utilization is within reasonable range');
    }
    
    const avgWastedTimePerOp = results.summary.totalWastedTime / results.summary.totalMeasurements;
    if (avgWastedTimePerOp > 5000) {
        report.push('- **🔴 CRITICAL**: Very high average wasted time per operation (>5s)');
    } else if (avgWastedTimePerOp > 2000) {
        report.push('- **🟡 WARNING**: High average wasted time per operation (>2s)');
    } else {
        report.push('- **🟢 GOOD**: Average wasted time per operation is reasonable');
    }
    
    report.push('');

    // Performance by Viewport
    report.push('## Performance by Viewport');
    for (const viewport in results.results) {
        const viewportResults = results.results[viewport];
        let totalMeasurements = 0;
        let totalWastedTime = 0;
        let totalUtilization = 0;
        let pageCount = 0;
        
        for (const page in viewportResults) {
            const pageMetrics = viewportResults[page].metrics;
            totalMeasurements += pageMetrics.totalMeasurements;
            totalWastedTime += pageMetrics.wastedTime;
            totalUtilization += pageMetrics.timeoutUtilization;
            pageCount++;
        }
        
        const avgUtilization = pageCount > 0 ? totalUtilization / pageCount : 0;
        
        report.push(`### ${viewport.toUpperCase()} Viewport`);
        report.push(`- Measurements: ${totalMeasurements}`);
        report.push(`- Wasted Time: ${(totalWastedTime / 1000).toFixed(1)}s`);
        report.push(`- Avg Timeout Utilization: ${avgUtilization.toFixed(1)}%`);
        report.push('');
    }

    // Operation Breakdown
    report.push('## Operation Type Analysis');
    const operationSummary: { [key: string]: { count: number; avgDuration: number; avgTimeout: number; wastedTime: number } } = {};
    
    for (const viewport in results.results) {
        for (const page in results.results[viewport]) {
            const breakdown = results.results[viewport][page].metrics.operationBreakdown;
            for (const operation in breakdown) {
                if (!operationSummary[operation]) {
                    operationSummary[operation] = { count: 0, avgDuration: 0, avgTimeout: 0, wastedTime: 0 };
                }
                const op = operationSummary[operation];
                const pageOp = breakdown[operation];
                
                op.count += pageOp.count;
                op.avgDuration = (op.avgDuration * (op.count - pageOp.count) + pageOp.averageDuration * pageOp.count) / op.count;
                op.avgTimeout = (op.avgTimeout * (op.count - pageOp.count) + pageOp.averageTimeout * pageOp.count) / op.count;
                op.wastedTime += pageOp.wastedTime;
            }
        }
    }
    
    for (const operation in operationSummary) {
        const op = operationSummary[operation];
        const utilization = (op.avgDuration / op.avgTimeout) * 100;
        
        report.push(`### ${operation.replace(/_/g, ' ').toUpperCase()}`);
        report.push(`- Count: ${op.count} operations`);
        report.push(`- Average Duration: ${op.avgDuration.toFixed(0)}ms`);
        report.push(`- Average Timeout: ${op.avgTimeout.toFixed(0)}ms`);
        report.push(`- Utilization: ${utilization.toFixed(1)}%`);
        report.push(`- Total Wasted Time: ${(op.wastedTime / 1000).toFixed(1)}s`);
        report.push('');
    }

    // Recommendations
    report.push('## Baseline-Driven Recommendations');
    results.summary.recommendations.forEach((rec: string, index: number) => {
        report.push(`${index + 1}. ${rec}`);
    });
    report.push('');

    // Next Steps
    report.push('## Next Steps Based on Baseline');
    report.push('1. **Implement Smart Timeout Manager** - Create progressive timeout strategies based on measured patterns');
    report.push('2. **Add Application Readiness Detection** - Implement SPA-specific readiness indicators to exit early');
    report.push('3. **Create Environment-Aware Profiles** - Use different timeout values for local/CI/remote environments');
    report.push('4. **Optimize High-Impact Operations** - Focus on operations with highest wasted time first');
    report.push('5. **Continuous Monitoring** - Track timeout performance improvements over time');
    report.push('');

    return report.join('\n');
}