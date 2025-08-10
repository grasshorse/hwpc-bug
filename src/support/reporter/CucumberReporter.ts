import DateUtil from "../utils/DateUtil";
import EnvUtil from "../utils/EnvUtil";
import NavigationTestConfig from "../../hwpc/constants/NavigationTestConfig";

var reporter = require('cucumber-html-reporter');

export default class CucumberReporter {    
    public static generate() {
        // require('dotenv').config();
        EnvUtil.setEnv();
        
        // Get navigation test configuration
        const navigationMetadata = NavigationTestConfig.getCustomMetadata();
        const configValidation = NavigationTestConfig.validateConfiguration();
        
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
                "Execution Date": DateUtil.dateGenerator("DD/MM/YYYY", 0, 0, 0),                
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
CucumberReporter.generate();