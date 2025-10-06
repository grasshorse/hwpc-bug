import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { LocationAssignmentModeDetector } from '../../../src/support/testing/LocationAssignmentModeDetector';
import { ProductionSafetyGuard } from '../../../src/support/testing/ProductionSafetyGuard';
import { GeographicTestDataGenerator } from '../../../src/support/testing/GeographicTestDataGenerator';

let browser: Browser;
let context: BrowserContext;
let page: Page;

BeforeAll(async function () {
  // Launch browser for all tests
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0
  });
});

AfterAll(async function () {
  // Close browser after all tests
  if (browser) {
    await browser.close();
  }
});

Before(async function (scenario) {
  // Create new context and page for each scenario
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: process.env.RECORD_VIDEO === 'true' ? { dir: 'test-results/videos' } : undefined
  });
  
  page = await context.newPage();
  
  // Set up test mode based on scenario tags
  const testMode = this.determineTestMode(scenario.pickle.tags);
  
  // Initialize test context
  this.testContext = {
    mode: testMode,
    page: page,
    scenario: scenario,
    testData: {},
    services: {}
  };
  
  // Set up mode-specific configurations
  await this.setupTestMode(testMode);
  
  // Enable production safety guards for production mode
  if (testMode === 'production') {
    await this.enableProductionSafetyGuards();
  }
  
  // Set up test data based on mode
  await this.setupTestData(testMode);
});

After(async function (scenario) {
  // Clean up test data if needed
  await this.cleanupTestData();
  
  // Take screenshot on failure
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await page.screenshot({ 
      path: `test-results/screenshots/${scenario.pickle.name}-${Date.now()}.png`,
      fullPage: true 
    });
    this.attach(screenshot, 'image/png');
  }
  
  // Close context
  if (context) {
    await context.close();
  }
});

// Helper methods attached to World
Before(function () {
  this.determineTestMode = function(tags: any[]) {
    const tagNames = tags.map(tag => tag.name);
    
    if (tagNames.includes('@isolated')) {
      return 'isolated';
    } else if (tagNames.includes('@production')) {
      return 'production';
    } else if (tagNames.includes('@dual')) {
      return 'dual';
    }
    
    return 'dual'; // Default mode
  };
  
  this.setupTestMode = async function(mode: string) {
    // Navigate to test mode configuration
    await page.goto('/test-mode/configure');
    
    // Set the appropriate test mode
    await page.selectOption('[data-testid="test-mode-selector"]', mode);
    await page.click('[data-testid="apply-mode"]');
    
    // Wait for mode to be applied
    await page.waitForSelector(`[data-testid="test-mode-indicator"]:has-text("${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode")`);
  };
  
  this.enableProductionSafetyGuards = async function() {
    // Enable all production safety features
    await page.goto('/admin/safety-guards');
    await page.check('[data-testid="enable-data-isolation"]');
    await page.check('[data-testid="enable-test-data-validation"]');
    await page.check('[data-testid="enable-production-protection"]');
    await page.click('[data-testid="apply-safety-settings"]');
    
    // Verify safety guards are active
    const safetyStatus = page.locator('[data-testid="safety-guard-status"]');
    await safetyStatus.waitFor({ state: 'visible' });
  };
  
  this.setupTestData = async function(mode: string) {
    if (mode === 'isolated') {
      // Load controlled test data for isolated mode
      await page.goto('/admin/test-data/isolated');
      await page.click('[data-testid="load-isolated-data"]');
      await page.waitForSelector('[data-testid="isolated-data-loaded"]');
      
    } else if (mode === 'production') {
      // Validate looneyTunesTest data exists
      await page.goto('/admin/test-data/production');
      await page.click('[data-testid="validate-looney-tunes-data"]');
      await page.waitForSelector('[data-testid="validation-complete"]');
      
      // Ensure test data is properly isolated
      const isolationCheck = page.locator('[data-testid="isolation-status"]');
      await isolationCheck.waitFor({ state: 'visible' });
      
    } else if (mode === 'dual') {
      // Set up dual mode with both isolated and production capabilities
      await page.goto('/admin/test-data/dual');
      await page.click('[data-testid="setup-dual-mode"]');
      await page.waitForSelector('[data-testid="dual-mode-ready"]');
    }
  };
  
  this.cleanupTestData = async function() {
    const mode = this.testContext?.mode;
    
    if (mode === 'isolated') {
      // Clean up isolated test data
      await page.goto('/admin/test-data/cleanup');
      await page.click('[data-testid="cleanup-isolated-data"]');
      
    } else if (mode === 'production') {
      // Clean up only test assignments, preserve base looneyTunesTest data
      await page.goto('/admin/test-data/cleanup');
      await page.click('[data-testid="cleanup-test-assignments"]');
      
    } else if (mode === 'dual') {
      // Clean up dual mode test data
      await page.goto('/admin/test-data/cleanup');
      await page.click('[data-testid="cleanup-dual-data"]');
    }
  };
});

// Export page for use in step definitions
export { page };

// Custom World class for additional context
export class CustomWorld {
  public testContext: any;
  public selectedTicketId: string | null = null;
  public assignedRouteId: string | null = null;
  public createdTickets: string[] = [];
  public testCustomers: any[] = [];
  public testRoutes: any[] = [];
  public calculatedDistances: Map<string, number> = new Map();
  public generatedTicketCount: number = 0;
  public generatedRouteCount: number = 0;
  public routeCapacity: number = 0;
  public totalCapacity: number = 0;
  public optimizedTotalDistance: number = 0;
  public newAssignmentId: string | null = null;
  public testTicketId: string | null = null;
  public testLocations: any[] = [];
  public selectedTicketCount: number = 0;
  
  constructor() {
    // Initialize any additional world properties
  }
}