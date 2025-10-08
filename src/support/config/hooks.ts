import { Before, BeforeAll, AfterAll, After, setDefaultTimeout, ITestCaseHookParameter, Status, formatterHelpers } from "@cucumber/cucumber";
import { Browser } from "@playwright/test";
import WebBrowser from "../manager/Browser";
import fse from "fs-extra";
import UIActions from "../playwright/actions/UIActions";
import Log from "../logger/Log";
import RESTRequest from "../playwright/API/RESTRequest";
import SOAPRequest from "../playwright/API/SOAPRequest";
import { TestModeDetector } from "../testing/TestModeDetector";
import { DatabaseContextManager } from "../testing/DatabaseContextManager";
import { ProductionTestDataManager } from "../testing/ProductionTestDataManager";
import { ModeFailureReporter, ModeFailureReport } from "../testing/ModeFailureReporter";
import { TestMode, TestConfig, DataContext, TestContext, ModeDetectionResult } from "../testing/types";

const timeInMin: number = 60 * 1000;
setDefaultTimeout(Number.parseInt(process.env.TEST_TIMEOUT, 10) * timeInMin);
let browser: Browser;

// Dual-mode testing infrastructure
const modeDetector = new TestModeDetector();
const databaseContextManager = new DatabaseContextManager();
const productionTestDataManager = new ProductionTestDataManager();
const activeContexts = new Map<string, DataContext>();

// launch the browser
BeforeAll(async function () {
    browser = await WebBrowser.launch();
});

// close the browser and cleanup any remaining contexts
AfterAll(async function () {
    // Cleanup any remaining active contexts
    if (activeContexts.size > 0) {
        Log.info(`Cleaning up ${activeContexts.size} remaining data contexts...`);
        
        for (const [testId, context] of activeContexts.entries()) {
            try {
                if (context.mode === TestMode.PRODUCTION || context.mode === TestMode.DUAL) {
                    await productionTestDataManager.cleanupContext(context);
                } else if (context.mode === TestMode.ISOLATED) {
                    await databaseContextManager.cleanupContext(context);
                }
                Log.info(`Cleaned up context for test: ${testId}`);
            } catch (error) {
                Log.error(`Failed to cleanup context for test ${testId}: ${error.message}`);
            }
        }
        
        activeContexts.clear();
        Log.info('All data contexts cleaned up');
    }
    
    await browser.close();
});

// Create a new browser context and page per scenario with dual-mode support
Before(async function ({ pickle, gherkinDocument }: ITestCaseHookParameter) {
    const { line } = formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle })
    const testId = `${pickle.name}-${line}`;
    
    Log.testBegin(`${pickle.name}: ${line}`);
    
    // Enhanced test mode detection with validation
    const testContext: TestContext = {
        testName: pickle.name,
        tags: pickle.tags?.map(tag => tag.name) || [],
        testId: testId
    };
    
    const modeResult: ModeDetectionResult = modeDetector.detectMode(testContext);
    let detectedMode = modeResult.mode;
    
    // Log mode detection information
    Log.info(`Test mode detected: ${detectedMode} (confidence: ${modeResult.confidence}, source: ${modeResult.source})`);
    if (modeResult.fallbackReason) {
        Log.info(`Mode detection fallback: ${modeResult.fallbackReason}`);
    }

    // Validate database connectivity for production/dual modes
    if (detectedMode === TestMode.PRODUCTION || detectedMode === TestMode.DUAL) {
        const connectivityResult = await modeDetector.validateDatabaseConnectivity(detectedMode);
        if (!connectivityResult.isValid) {
            Log.info(`WARNING: Database connectivity validation failed for ${detectedMode} mode: ${connectivityResult.issues?.join(', ')}`);
            
            // Attempt fallback to a supported mode
            const fallbackMode = modeDetector.getFallbackMode(detectedMode);
            if (fallbackMode) {
                Log.info(`Attempting fallback from ${detectedMode} to ${fallbackMode} mode`);
                detectedMode = fallbackMode;
            } else {
                Log.error(`No fallback mode available for ${detectedMode}`);
            }
        }
    }
    
    // Create test configuration
    const testConfig: TestConfig = {
        mode: detectedMode,
        tags: testContext.tags,
        retries: parseInt(process.env.RETRIES || '0', 10),
        timeout: parseInt(process.env.TEST_TIMEOUT || '5', 10) * timeInMin,
        databaseConfig: detectedMode === TestMode.ISOLATED || detectedMode === TestMode.DUAL ? {
            backupPath: 'test-backup.sql',
            connectionString: process.env.TEST_DB_CONNECTION || 'test-connection',
            restoreTimeout: 30000,
            verificationQueries: ['SELECT COUNT(*) FROM customers', 'SELECT COUNT(*) FROM routes']
        } : undefined,
        productionConfig: detectedMode === TestMode.PRODUCTION || detectedMode === TestMode.DUAL ? {
            testDataPrefix: 'looneyTunesTest',
            locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
            customerNames: ['Bugs Bunny', 'Daffy Duck', 'Porky Pig', 'Tweety Bird'],
            cleanupPolicy: 'preserve'
        } : undefined
    };
    
    // Enhanced data context setup with robust error handling and fallback
    let dataContext: DataContext | null = null;
    let finalMode = detectedMode;
    let setupAttempts = 0;
    const maxSetupAttempts = 3;

    while (setupAttempts < maxSetupAttempts && !dataContext) {
        setupAttempts++;
        
        try {
            Log.info(`Data context setup attempt ${setupAttempts}/${maxSetupAttempts} for mode: ${finalMode}`);
            
            if (finalMode === TestMode.ISOLATED || finalMode === TestMode.DUAL) {
                // Validate database context manager is available
                if (!databaseContextManager) {
                    throw new Error('DatabaseContextManager is not available for isolated/dual mode');
                }
                
                dataContext = await databaseContextManager.setupContext(finalMode, testConfig);
                Log.info(`Database context setup completed for ${finalMode} mode`);
                
            } else if (finalMode === TestMode.PRODUCTION) {
                // Validate production test data manager is available
                if (!productionTestDataManager) {
                    throw new Error('ProductionTestDataManager is not available for production mode');
                }
                
                dataContext = await productionTestDataManager.setupContext(finalMode, testConfig);
                Log.info(`Production test data context setup completed`);
            }
            
            if (dataContext) {
                // Enhanced context validation with detailed error reporting
                Log.info(`Validating data context for mode: ${finalMode}`);
                const isValid = await (finalMode === TestMode.PRODUCTION ? 
                    productionTestDataManager.validateContext(dataContext) : 
                    databaseContextManager.validateContext(dataContext));
                
                if (!isValid) {
                    const validationError = `Data context validation failed for mode: ${finalMode}`;
                    Log.error(validationError);
                    
                    // Clean up invalid context
                    try {
                        await dataContext.cleanup();
                    } catch (cleanupError) {
                        Log.error(`Failed to cleanup invalid context: ${cleanupError.message}`);
                    }
                    
                    dataContext = null;
                    throw new Error(validationError);
                }
                
                // Store context for cleanup
                activeContexts.set(testId, dataContext);
                
                // Attach context to test world
                this.testMode = finalMode;
                this.dataContext = dataContext;
                this.testConfig = { ...testConfig, mode: finalMode };
                
                Log.info(`Data context validated and attached to test world for mode: ${finalMode}`);
                break; // Success, exit the retry loop
            }
            
        } catch (error) {
            Log.error(`Data context setup attempt ${setupAttempts} failed for mode ${finalMode}: ${error.message}`);
            
            // Attempt fallback to next available mode
            const fallbackMode = modeDetector.getFallbackMode(finalMode);
            
            if (fallbackMode && setupAttempts < maxSetupAttempts) {
                Log.info(`Attempting fallback from ${finalMode} to ${fallbackMode} mode (attempt ${setupAttempts + 1})`);
                finalMode = fallbackMode;
                testConfig.mode = fallbackMode;
                
                // Add delay before retry to allow for transient issues to resolve
                if (setupAttempts > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * setupAttempts));
                }
                
            } else if (setupAttempts >= maxSetupAttempts) {
                // All attempts exhausted
                const errorMessage = `All ${maxSetupAttempts} setup attempts failed. Last mode attempted: ${finalMode}. Original mode: ${detectedMode}`;
                Log.error(errorMessage);
                throw new Error(errorMessage);
                
            } else {
                // No fallback available - create comprehensive error report
                const errorMessage = `No fallback mode available for ${finalMode}. Setup failed: ${error.message}`;
                const finalError = new Error(errorMessage);
                const failureReport = ModeFailureReporter.createFailureReport(
                    testContext,
                    detectedMode,
                    finalMode,
                    finalError,
                    modeResult
                );
                
                Log.error(errorMessage);
                throw finalError;
            }
        }
    }

    // Final validation that we have a working context
    if (!dataContext) {
        const finalError = new Error(`Failed to establish data context after ${setupAttempts} attempts. Original mode: ${detectedMode}, Final mode: ${finalMode}`);
        const failureReport = ModeFailureReporter.createFailureReport(
            testContext,
            detectedMode,
            finalMode,
            finalError,
            modeResult
        );
        
        throw finalError;
    }
    
    // Create browser context and page
    this.context = await browser.newContext({
        viewport: null,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        recordVideo: process.env.RECORD_VIDEO === "true" ? { dir: './test-results/videos' } : undefined,
    });
    this.page = await this.context?.newPage();
    this.web = new UIActions(this.page);
    this.rest = new RESTRequest(this.page);
    this.soap = new SOAPRequest();
    
    // Add mode-specific debugging information to page context
    if (this.dataContext) {
        await this.page.addInitScript((contextInfo) => {
            (window as any).__TEST_CONTEXT__ = contextInfo;
        }, {
            mode: this.testMode,
            testId: testId,
            testRunId: this.dataContext.testData.metadata.testRunId,
            hasTestData: !!this.dataContext.testData
        });
    }
});

// Cleanup after each scenario with dual-mode support
After(async function ({ result, pickle, gherkinDocument }: ITestCaseHookParameter) {
    const { line } = formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle })
    const status = result.status;
    const scenario = pickle.name;
    const testId = `${scenario}-${line}`;
    const videoPath = await this.page?.video()?.path();
    
    // Check if this is a navigation test for enhanced artifact collection
    const isNavigationTest = pickle.tags?.some(tag => tag.name === '@navigation');
    
    // Enhanced error reporting with mode-specific information
    if (status === Status.FAILED) {
        // Enhanced screenshot naming with mode information
        const modePrefix = this.testMode ? `${this.testMode}-` : '';
        const screenshotName = isNavigationTest 
            ? `navigation-error-${modePrefix}${scenario.toLowerCase().replace(/\s+/g, '-')}-${line}`
            : `${modePrefix}${scenario} (${line})`;
            
        if (this.page) {
            const image = await this.page.screenshot({ 
                path: `./test-results/screenshots/${screenshotName}.png`, 
                fullPage: true 
            });
            await this.attach(image, 'image/png');
        }

        // Enhanced failure diagnostics
        Log.error('');
        Log.error('🔍 ENHANCED FAILURE DIAGNOSTICS:');
        Log.error(`   Test Mode: ${this.testMode || 'unknown'}`);
        Log.error(`   Test ID: ${testId}`);
        Log.error(`   Failure Time: ${new Date().toISOString()}`);
        
        if (result.message) {
            Log.error(`   Error Details: ${result.message}`);
        }
        
        // Collect mode-specific debugging information
        if (this.testMode && this.dataContext) {
            try {
                Log.info(`Test failed in ${this.testMode} mode`);
                Log.info(`Test run ID: ${this.dataContext.testData.metadata.testRunId}`);
                Log.info(`Data context connection: ${this.dataContext.connectionInfo.host}`);
                
                // Capture test context information from page
                const testContextInfo = await this.page?.evaluate(() => {
                    return (window as any).__TEST_CONTEXT__ || null;
                });
                
                if (testContextInfo) {
                    Log.info(`Test context info: ${JSON.stringify(testContextInfo)}`);
                }
                
                // Mode-specific debugging
                if (this.testMode === TestMode.PRODUCTION) {
                    Log.info(`Production test data customers: ${this.dataContext.testData.customers?.length || 0}`);
                    Log.info(`Production test data routes: ${this.dataContext.testData.routes?.length || 0}`);
                } else if (this.testMode === TestMode.ISOLATED) {
                    Log.info(`Isolated database state loaded: ${this.dataContext.testData.metadata.version}`);
                }
                
            } catch (debugError) {
                Log.error(`Failed to collect mode-specific debugging info: ${debugError.message}`);
            }
        }
        
        // Collect additional navigation-specific debugging info
        if (isNavigationTest) {
            try {
                // Capture current URL for navigation debugging
                const currentUrl = this.page?.url();
                Log.info(`Navigation test failed - Current URL: ${currentUrl}`);
                
                // Capture viewport information
                const viewport = this.page?.viewportSize();
                Log.info(`Navigation test failed - Viewport: ${JSON.stringify(viewport)}`);
                
                // Capture page title for validation debugging
                const pageTitle = await this.page?.title();
                Log.info(`Navigation test failed - Page Title: ${pageTitle}`);
                
                // Capture console errors if any
                const consoleMessages = await this.page?.evaluate(() => {
                    return window.console ? 'Console available' : 'No console';
                });
                Log.info(`Navigation test failed - Console status: ${consoleMessages}`);
                
            } catch (debugError) {
                Log.error(`Failed to collect navigation debugging info: ${debugError.message}`);
            }
        }
        
        Log.error(`${scenario}: ${line} - ${status} (Mode: ${this.testMode || 'unknown'})\n${result.message}`);
    } else {
        // Log successful test completion with mode information
        Log.info(`${scenario}: ${line} - ${status} (Mode: ${this.testMode || 'unknown'})`);
    }
    
    // Guaranteed cleanup of data context
    const dataContext = activeContexts.get(testId);
    if (dataContext) {
        try {
            if (this.testMode === TestMode.PRODUCTION || this.testMode === TestMode.DUAL) {
                await productionTestDataManager.cleanupContext(dataContext);
            } else if (this.testMode === TestMode.ISOLATED) {
                await databaseContextManager.cleanupContext(dataContext);
            }
            Log.info(`Data context cleanup completed for ${this.testMode} mode`);
        } catch (cleanupError) {
            Log.error(`Failed to cleanup data context: ${cleanupError.message}`);
            // Don't throw here to avoid masking the original test failure
        } finally {
            activeContexts.delete(testId);
        }
    }
    
    // Browser cleanup
    await this.page?.close();
    await this.context?.close();
    
    // Video handling with mode information
    if (process.env.RECORD_VIDEO === "true") {
        if (status === Status.FAILED) {
            const modePrefix = this.testMode ? `${this.testMode}-` : '';
            const videoName = isNavigationTest 
                ? `navigation-error-${modePrefix}${scenario.toLowerCase().replace(/\s+/g, '-')}-${line}.webm`
                : `${modePrefix}${scenario}(${line}).webm`;
                
            fse.renameSync(videoPath, `./test-results/videos/${videoName}`);            
            await this.attach(fse.readFileSync(`./test-results/videos/${videoName}`), 'video/webm');
        } else {
            fse.unlinkSync(videoPath);
        }
    }
    
    Log.testEnd(`${scenario}: ${line}`, status);
});