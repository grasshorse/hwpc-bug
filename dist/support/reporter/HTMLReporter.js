"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DateUtil_1 = __importDefault(require("../utils/DateUtil"));
const EnvUtil_1 = __importDefault(require("../utils/EnvUtil"));
const NavigationTestConfig_1 = __importDefault(require("../../hwpc/constants/NavigationTestConfig"));
class HTMLReporter {
    static generateReport() {
        const os = require('node:os');
        const report = require('multiple-cucumber-html-reporter');
        // require('dotenv').config();
        EnvUtil_1.default.setEnv();
        // Get navigation test configuration and summary
        const navigationMetadata = NavigationTestConfig_1.default.getCustomMetadata();
        const executionSummary = NavigationTestConfig_1.default.getExecutionSummary();
        const configValidation = NavigationTestConfig_1.default.validateConfiguration();
        report.generate({
            jsonDir: './test-results/reports/',
            reportPath: './test-results/reports/html/',
            pageTitle: 'HWPC Test Execution Report',
            reportName: 'HWPC Navigation & Functional Test Results',
            displayDuration: true,
            displayReportTime: true,
            hideMetadata: false,
            customMetadata: true,
            metadata: {
                browser: {
                    name: process.env.BROWSER || 'chromium',
                    version: 'latest'
                },
                device: os.hostname(),
                platform: {
                    name: os.type(),
                    version: os.version(),
                }
            },
            customData: {
                title: 'Test Execution Information',
                data: [
                    { label: 'Execution Date', value: DateUtil_1.default.dateGenerator("DD/MM/YYYY", 0, 0, 0) },
                    { label: 'Base URL', value: process.env.BASE_URL },
                    { label: 'Environment', value: process.env.ENVIRONMENT },
                    { label: 'SOAP Endpoint', value: process.env.SOAP_API_BASE_URL },
                    { label: 'REST Endpoint', value: process.env.REST_API_BASE_URL },
                    { label: 'DB Config', value: process.env.DB_CONFIG },
                    // Navigation-specific information
                    { label: '--- Navigation Test Framework ---', value: '---' },
                    { label: 'Navigation Framework', value: navigationMetadata["Navigation Framework"] },
                    { label: 'Mobile-First Testing', value: navigationMetadata["Mobile-First"] },
                    { label: 'Responsive Testing', value: navigationMetadata["Responsive Testing"] },
                    { label: 'Error Recovery', value: navigationMetadata["Error Recovery"] },
                    { label: 'CI Environment', value: navigationMetadata["CI Environment"] },
                    { label: 'Viewport Category', value: navigationMetadata["Viewport Category"] },
                    { label: '--- Test Configuration ---', value: '---' },
                    { label: 'Test Retries', value: navigationMetadata["Retries"] },
                    { label: 'Test Timeout', value: navigationMetadata["Timeout"] + ' minutes' },
                    { label: 'Parallel Threads', value: navigationMetadata["Parallel Threads"] },
                    { label: 'Video Recording', value: navigationMetadata["Video Recording"] },
                    { label: 'Config Validation', value: configValidation.isValid ? '✓ Valid' : '⚠ Issues Found' },
                    { label: '--- Test Categories ---', value: '---' },
                    { label: 'Available Categories', value: executionSummary.categories.join(', ') },
                    { label: 'Available Tags', value: executionSummary.tags.join(', ') },
                    { label: 'Execution Environment', value: executionSummary.environment }
                ]
            }
        });
        // Log configuration information
        console.log('\n=== Navigation Test Configuration Summary ===');
        console.log(`Environment: ${executionSummary.environment}`);
        console.log(`Configuration Valid: ${configValidation.isValid ? '✓' : '✗'}`);
        if (configValidation.warnings.length > 0) {
            console.log('\nConfiguration Warnings:');
            configValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        if (configValidation.errors.length > 0) {
            console.log('\nConfiguration Errors:');
            configValidation.errors.forEach(error => console.log(`  - ${error}`));
        }
        console.log('\nTest Categories Available:');
        executionSummary.categories.forEach(category => console.log(`  - ${category}`));
        console.log('\n=== End Configuration Summary ===\n');
    }
}
exports.default = HTMLReporter;
HTMLReporter.generateReport();
//# sourceMappingURL=HTMLReporter.js.map