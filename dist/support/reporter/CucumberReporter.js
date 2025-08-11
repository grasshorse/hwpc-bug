"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DateUtil_1 = __importDefault(require("../utils/DateUtil"));
const EnvUtil_1 = __importDefault(require("../utils/EnvUtil"));
const NavigationTestConfig_1 = __importDefault(require("../../hwpc/constants/NavigationTestConfig"));
var reporter = require('cucumber-html-reporter');
class CucumberReporter {
    static generate() {
        // require('dotenv').config();
        EnvUtil_1.default.setEnv();
        // Get navigation test configuration
        const navigationMetadata = NavigationTestConfig_1.default.getCustomMetadata();
        const configValidation = NavigationTestConfig_1.default.validateConfiguration();
        const options = {
            brandTitle: "HWPC Test Execution Report",
            theme: 'bootstrap',
            jsonFile: 'test-results/reports/cucumber.json',
            output: 'test-results/reports/cucumber.html',
            reportSuiteAsScenarios: true,
            scenarioTimestamp: true,
            launchReport: false,
            columnLayout: 1,
            metadata: {
                "Execution Date": DateUtil_1.default.dateGenerator("DD/MM/YYYY", 0, 0, 0),
                "Base URL": process.env.BASE_URL,
                "Environment": process.env.ENVIRONMENT,
                "SOAP Endpoint": process.env.SOAP_API_BASE_URL,
                "Browser": process.env.BROWSER,
                "REST Endpoint": process.env.REST_API_BASE_URL,
                "DB Config": process.env.DB_CONFIG,
                // Navigation-specific metadata
                "Navigation Framework": navigationMetadata["Navigation Framework"],
                "Mobile-First Testing": navigationMetadata["Mobile-First"],
                "Responsive Testing": navigationMetadata["Responsive Testing"],
                "Error Recovery": navigationMetadata["Error Recovery"],
                "CI Environment": navigationMetadata["CI Environment"],
                "Viewport Category": navigationMetadata["Viewport Category"],
                "Test Retries": navigationMetadata["Retries"],
                "Test Timeout": navigationMetadata["Timeout"] + " minutes",
                "Parallel Threads": navigationMetadata["Parallel Threads"],
                "Video Recording": navigationMetadata["Video Recording"],
                "Config Validation": configValidation.isValid ? "✓ Valid" : "⚠ Issues Found"
            }
        };
        // Log configuration warnings if any
        if (configValidation.warnings.length > 0) {
            console.warn('Navigation Test Configuration Warnings:');
            configValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }
        reporter.generate(options);
    }
}
exports.default = CucumberReporter;
CucumberReporter.generate();
//# sourceMappingURL=CucumberReporter.js.map