"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const Browser_1 = __importDefault(require("../manager/Browser"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const UIActions_1 = __importDefault(require("../playwright/actions/UIActions"));
const Log_1 = __importDefault(require("../logger/Log"));
const RESTRequest_1 = __importDefault(require("../playwright/API/RESTRequest"));
const SOAPRequest_1 = __importDefault(require("../playwright/API/SOAPRequest"));
const timeInMin = 60 * 1000;
(0, cucumber_1.setDefaultTimeout)(Number.parseInt(process.env.TEST_TIMEOUT, 10) * timeInMin);
let browser;
// launch the browser
(0, cucumber_1.BeforeAll)(async function () {
    browser = await Browser_1.default.launch();
});
// close the browser
(0, cucumber_1.AfterAll)(async function () {
    await browser.close();
});
// Create a new browser context and page per scenario
(0, cucumber_1.Before)(async function ({ pickle, gherkinDocument }) {
    const { line } = cucumber_1.formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle });
    Log_1.default.testBegin(`${pickle.name}: ${line}`);
    this.context = await browser.newContext({
        viewport: null,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        recordVideo: process.env.RECORD_VIDEO === "true" ? { dir: './test-results/videos' } : undefined,
    });
    this.page = await this.context?.newPage();
    this.web = new UIActions_1.default(this.page);
    this.rest = new RESTRequest_1.default(this.page);
    this.soap = new SOAPRequest_1.default();
});
// Cleanup after each scenario
(0, cucumber_1.After)(async function ({ result, pickle, gherkinDocument }) {
    const { line } = cucumber_1.formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle });
    const status = result.status;
    const scenario = pickle.name;
    const videoPath = await this.page?.video()?.path();
    // Check if this is a navigation test for enhanced artifact collection
    const isNavigationTest = pickle.tags?.some(tag => tag.name === '@navigation');
    if (status === cucumber_1.Status.FAILED) {
        // Enhanced screenshot naming for navigation tests
        const screenshotName = isNavigationTest
            ? `navigation-error-${scenario.toLowerCase().replace(/\s+/g, '-')}-${line}`
            : `${scenario} (${line})`;
        const image = await this.page?.screenshot({
            path: `./test-results/screenshots/${screenshotName}.png`,
            fullPage: true
        });
        await this.attach(image, 'image/png');
        // Collect additional navigation-specific debugging info
        if (isNavigationTest) {
            try {
                // Capture current URL for navigation debugging
                const currentUrl = this.page?.url();
                Log_1.default.info(`Navigation test failed - Current URL: ${currentUrl}`);
                // Capture viewport information
                const viewport = this.page?.viewportSize();
                Log_1.default.info(`Navigation test failed - Viewport: ${JSON.stringify(viewport)}`);
                // Capture page title for validation debugging
                const pageTitle = await this.page?.title();
                Log_1.default.info(`Navigation test failed - Page Title: ${pageTitle}`);
                // Capture console errors if any
                const consoleMessages = await this.page?.evaluate(() => {
                    return window.console ? 'Console available' : 'No console';
                });
                Log_1.default.info(`Navigation test failed - Console status: ${consoleMessages}`);
            }
            catch (debugError) {
                Log_1.default.error(`Failed to collect navigation debugging info: ${debugError.message}`);
            }
        }
        Log_1.default.error(`${scenario}: ${line} - ${status}\n${result.message}`);
    }
    await this.page?.close();
    await this.context?.close();
    if (process.env.RECORD_VIDEO === "true") {
        if (status === cucumber_1.Status.FAILED) {
            const videoName = isNavigationTest
                ? `navigation-error-${scenario.toLowerCase().replace(/\s+/g, '-')}-${line}.webm`
                : `${scenario}(${line}).webm`;
            fs_extra_1.default.renameSync(videoPath, `./test-results/videos/${videoName}`);
            await this.attach(fs_extra_1.default.readFileSync(`./test-results/videos/${videoName}`), 'video/webm');
        }
        else {
            fs_extra_1.default.unlinkSync(videoPath);
        }
    }
    Log_1.default.testEnd(`${scenario}: ${line}`, status);
});
//# sourceMappingURL=hooks.js.map