/**
 * Step definitions for testing the dual-mode framework integration
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TestMode } from '../types';


Given('I am running a test in isolated mode', async function () {
  // This step verifies that the hooks have set up the test context correctly
  expect(this.testMode).toBeDefined();
  expect(this.dataContext).toBeDefined();
  
  // For isolated mode tests, we expect either ISOLATED or DUAL mode
  expect([TestMode.ISOLATED, TestMode.DUAL]).toContain(this.testMode);
});

Given('I am running a test in production mode', async function () {
  // This step verifies that the hooks have set up the test context correctly
  expect(this.testMode).toBeDefined();
  expect(this.dataContext).toBeDefined();
  
  // For production mode tests, we expect either PRODUCTION or DUAL mode
  expect([TestMode.PRODUCTION, TestMode.DUAL]).toContain(this.testMode);
});

Given('I am running a test that supports dual mode', async function () {
  // This step verifies that the hooks have set up the test context correctly
  expect(this.testMode).toBeDefined();
  expect(this.dataContext).toBeDefined();
  
  // For dual mode tests, any mode is acceptable
  expect(Object.values(TestMode)).toContain(this.testMode);
});

When('the test framework detects the mode', async function () {
  // The mode detection happens in the Before hook, so we just verify it worked
  expect(this.testMode).toBeDefined();
  expect(this.testConfig).toBeDefined();
  
  console.log(`Detected test mode: ${this.testMode}`);
  console.log(`Test configuration: ${JSON.stringify(this.testConfig, null, 2)}`);
});

Then('it should setup an isolated database context', async function () {
  expect(this.dataContext).toBeDefined();
  expect(this.dataContext.mode).toEqual(TestMode.ISOLATED);
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.connectionInfo).toBeDefined();
  
  console.log(`Isolated context setup - Test Run ID: ${this.dataContext.testData.metadata.testRunId}`);
});

Then('it should setup a production test data context', async function () {
  expect(this.dataContext).toBeDefined();
  expect(this.dataContext.mode).toEqual(TestMode.PRODUCTION);
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.connectionInfo).toBeDefined();
  
  console.log(`Production context setup - Test Run ID: ${this.dataContext.testData.metadata.testRunId}`);
});

Then('it should setup the appropriate context based on environment', async function () {
  expect(this.dataContext).toBeDefined();
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.connectionInfo).toBeDefined();
  
  // The mode should be one of the valid modes
  expect(Object.values(TestMode)).toContain(this.dataContext.mode);
  
  console.log(`Dual mode context setup - Mode: ${this.dataContext.mode}, Test Run ID: ${this.dataContext.testData.metadata.testRunId}`);
});

Then('the test should have access to test data', async function () {
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.testData.metadata).toBeDefined();
  expect(this.dataContext.testData.metadata.testRunId).toBeDefined();
  
  // Verify that the test data structure is correct
  expect(this.dataContext.testData.customers).toBeDefined();
  expect(this.dataContext.testData.routes).toBeDefined();
  expect(this.dataContext.testData.tickets).toBeDefined();
  
  console.log(`Test data available - Customers: ${this.dataContext.testData.customers.length}, Routes: ${this.dataContext.testData.routes.length}`);
});

Then('the test should have access to looneyTunes test data', async function () {
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.testData.customers).toBeDefined();
  
  // For production mode, we should have looneyTunes test customers
  if (this.dataContext.testData.customers.length > 0) {
    const hasLooneyTunesData = this.dataContext.testData.customers.some(customer => 
      customer.name.includes('looneyTunesTest') || customer.isTestData
    );
    expect(hasLooneyTunesData).toBe(true);
  }
  
  console.log(`LooneyTunes test data available - Test customers: ${this.dataContext.testData.customers.filter(c => c.isTestData).length}`);
});

Then('the test should work in either mode', async function () {
  expect(this.dataContext).toBeDefined();
  expect(this.testMode).toBeDefined();
  
  // Verify that regardless of mode, we have the necessary test infrastructure
  expect(this.dataContext.testData).toBeDefined();
  expect(this.dataContext.connectionInfo).toBeDefined();
  expect(this.dataContext.cleanup).toBeDefined();
  
  // Verify that the page context has test information
  if (this.page) {
    const testContextInfo = await this.page.evaluate(() => {
      return (window as any).__TEST_CONTEXT__ || null;
    });
    
    if (testContextInfo) {
      expect(testContextInfo.mode).toBeDefined();
      expect(testContextInfo.testId).toBeDefined();
      expect(testContextInfo.testRunId).toBeDefined();
      
      console.log(`Page test context: ${JSON.stringify(testContextInfo)}`);
    }
  }
  
  console.log(`Dual mode test completed successfully in ${this.testMode} mode`);
});