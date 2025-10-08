#!/usr/bin/env ts-node

/**
 * Script to run timeout performance baseline measurements
 * This script can be run independently to generate baseline metrics
 */

import { chromium, Browser } from '@playwright/test';
import { BaselineTestRunner, BaselineTestConfig } from '../src/support/utils/BaselineTestRunner';
import fs from 'fs/promises';
import path from 'path';

async function runBaselineMeasurements() {
    console.log('🚀 Starting Timeout Performance Baseline Measurements...\n');
    
    const config: BaselineTestConfig = {
        pages: ['home', 'customers', 'tickets', 'routes', 'dashboard', 'reports'],
        viewports: ['mobile', 'tablet', 'desktop'],
        iterations: 2, // Reduced for faster execution
        includeFailureScenarios: true,
        outputPath: 'baseline-results'
    };

    console.log('Configuration:');
    console.log(`- Pages: ${config.pages.join(', ')}`);
    console.log(`- Viewports: ${config.viewports.join(', ')}`);
    console.log(`- Iterations per test: ${config.iterations}`);
    console.log('');

    let browser: Browser | null = null;
    
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });

        // Create baseline runner
        const runner = new BaselineTestRunner(browser);
        
        // Run baseline tests
        console.log('📊 Running baseline measurements...');
        const results = await runner.runBaselineTests(config);
        
        // Display summary
        console.log('\n' + '='.repeat(60));
        console.log('📈 BASELINE MEASUREMENT RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Measurements: ${results.summary.totalMeasurements}`);
        console.log(`Total Duration: ${(results.totalDuration / 1000).toFixed(1)}s`);
        console.log(`Total Wasted Time: ${(results.summary.totalWastedTime / 1000).toFixed(1)}s`);
        console.log(`Average Timeout Utilization: ${results.summary.averageTimeoutUtilization.toFixed(1)}%`);
        console.log(`Potential Time Savings: ${(results.summary.potentialTimeSavings / 1000).toFixed(1)}s`);
        
        // Display recommendations
        console.log('\n🎯 RECOMMENDATIONS:');
        results.summary.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        // Save results
        console.log('\n💾 Saving results...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsDir = 'baseline-results';
        
        await fs.mkdir(resultsDir, { recursive: true });
        
        // Save JSON results
        const resultsJson = await runner.exportResults();
        const jsonPath = path.join(resultsDir, `baseline-results-${timestamp}.json`);
        await fs.writeFile(jsonPath, resultsJson);
        console.log(`✅ Detailed results: ${jsonPath}`);
        
        // Save human-readable report
        const reportText = runner.generateReport();
        const reportPath = path.join(resultsDir, `baseline-report-${timestamp}.md`);
        await fs.writeFile(reportPath, reportText);
        console.log(`✅ Human-readable report: ${reportPath}`);
        
        // Update main analysis report
        const analysisReportPath = 'timeout-analysis-report.md';
        const baselineSection = generateBaselineSection(results);
        
        try {
            const existingReport = await fs.readFile(analysisReportPath, 'utf-8');
            const updatedReport = existingReport + '\n\n' + baselineSection;
            await fs.writeFile(analysisReportPath, updatedReport);
            console.log(`✅ Updated analysis report: ${analysisReportPath}`);
        } catch (error) {
            await fs.writeFile(analysisReportPath, baselineSection);
            console.log(`✅ Created analysis report: ${analysisReportPath}`);
        }
        
        console.log('\n🎉 Baseline measurements completed successfully!');
        
        // Performance assessment
        const utilizationStatus = results.summary.averageTimeoutUtilization < 30 ? '🔴 CRITICAL' : 
                                 results.summary.averageTimeoutUtilization < 50 ? '🟡 WARNING' : '🟢 GOOD';
        const avgWastedTime = results.summary.totalWastedTime / results.summary.totalMeasurements;
        const wastedTimeStatus = avgWastedTime > 5000 ? '🔴 CRITICAL' : 
                                avgWastedTime > 2000 ? '🟡 WARNING' : '🟢 GOOD';
        
        console.log('\n📊 PERFORMANCE ASSESSMENT:');
        console.log(`Timeout Utilization: ${utilizationStatus} (${results.summary.averageTimeoutUtilization.toFixed(1)}%)`);
        console.log(`Wasted Time per Operation: ${wastedTimeStatus} (${avgWastedTime.toFixed(0)}ms)`);
        
        if (results.summary.averageTimeoutUtilization < 30 || avgWastedTime > 2000) {
            console.log('\n⚡ HIGH OPTIMIZATION POTENTIAL DETECTED!');
            console.log('Consider implementing smart timeout strategies for significant performance gains.');
        }
        
    } catch (error) {
        console.error('❌ Error running baseline measurements:', error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

function generateBaselineSection(results: any): string {
    const report = [];
    
    report.push('# Task 1.2: Timeout Performance Baseline Measurements - COMPLETED');
    report.push(`Generated: ${new Date(results.timestamp).toISOString()}`);
    report.push(`Environment: ${results.environment}`);
    report.push(`Test Duration: ${(results.totalDuration / 1000).toFixed(1)}s`);
    report.push('');

    report.push('## Baseline Measurement Results');
    report.push(`- **Total Measurements**: ${results.summary.totalMeasurements} timeout operations measured`);
    report.push(`- **Total Wasted Time**: ${(results.summary.totalWastedTime / 1000).toFixed(1)}s of unnecessary waiting identified`);
    report.push(`- **Average Timeout Utilization**: ${results.summary.averageTimeoutUtilization.toFixed(1)}% of configured timeout values actually used`);
    report.push(`- **Potential Time Savings**: ${(results.summary.potentialTimeSavings / 1000).toFixed(1)}s could be saved per test run`);
    report.push('');

    report.push('## Performance Assessment');
    const utilizationStatus = results.summary.averageTimeoutUtilization < 30 ? 'CRITICAL - Extremely low utilization' : 
                             results.summary.averageTimeoutUtilization < 50 ? 'WARNING - Low utilization' : 
                             results.summary.averageTimeoutUtilization > 80 ? 'WARNING - High utilization' : 'GOOD - Reasonable utilization';
    
    const avgWastedTime = results.summary.totalWastedTime / results.summary.totalMeasurements;
    const wastedTimeStatus = avgWastedTime > 5000 ? 'CRITICAL - Very high wasted time' : 
                            avgWastedTime > 2000 ? 'WARNING - High wasted time' : 'GOOD - Reasonable wasted time';
    
    report.push(`- **Timeout Utilization**: ${utilizationStatus} (${results.summary.averageTimeoutUtilization.toFixed(1)}%)`);
    report.push(`- **Wasted Time per Operation**: ${wastedTimeStatus} (${avgWastedTime.toFixed(0)}ms)`);
    report.push('');

    report.push('## Key Findings from Baseline');
    results.summary.recommendations.forEach((rec: string, index: number) => {
        report.push(`${index + 1}. ${rec}`);
    });
    report.push('');

    report.push('## Baseline Data Available For Next Tasks');
    report.push('- ✅ Current timeout configurations documented and measured');
    report.push('- ✅ Performance bottlenecks identified with quantitative data');
    report.push('- ✅ Environment-specific behavior patterns captured');
    report.push('- ✅ Operation-specific timeout utilization measured');
    report.push('- ✅ Potential time savings calculated and prioritized');
    report.push('');
    
    report.push('**Ready for Task 2.1**: Implement SmartTimeoutManager with data-driven timeout strategies');
    report.push('');

    return report.join('\n');
}

// Run the script if called directly
if (require.main === module) {
    runBaselineMeasurements().catch(console.error);
}

export { runBaselineMeasurements };