const config = {
  // Feature files location
  features: ['features/ticket-location-assignment/*.feature'],
  
  // Step definitions location
  require: [
    'features/ticket-location-assignment/step_definitions/**/*.steps.ts',
    'features/ticket-location-assignment/support/**/*.ts'
  ],
  
  // Test execution configuration
  parallel: 2, // Run tests in parallel
  retry: 1, // Retry failed tests once
  
  // Output formats
  format: [
    'progress-bar',
    'json:test-results/cucumber-report.json',
    'html:test-results/cucumber-report.html',
    '@cucumber/pretty-formatter'
  ],
  
  // Tag-based test execution
  tags: process.env.CUCUMBER_TAGS || '@dual or @isolated or @production',
  
  // World parameters
  worldParameters: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0'),
    recordVideo: process.env.RECORD_VIDEO === 'true'
  },
  
  // Hooks and setup
  requireModule: ['ts-node/register'],
  
  // Test timeouts
  timeout: 60000, // 60 seconds default timeout
  
  // Publish results
  publish: process.env.CUCUMBER_PUBLISH === 'true'
};

module.exports = config;