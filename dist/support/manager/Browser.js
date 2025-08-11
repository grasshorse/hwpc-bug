"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const BrowserConstants_1 = __importDefault(require("../constants/BrowserConstants"));
const browserOptions = {
    slowMo: 50,
    args: ["--start-maximized", "--disable-extensions", "--disable-plugins"],
    firefoxUserPrefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
    },
    headless: false,
    timeout: Number.parseInt(process.env.BROWSER_LAUNCH_TIMEOUT, 10),
    downloadsPath: "./test-results/downloads",
};
class Browser {
    static async launch() {
        const browserType = process.env.BROWSER;
        let browser;
        if (BrowserConstants_1.default.FIREFOX === browserType) {
            browser = await test_1.firefox.launch(browserOptions);
        }
        else if (BrowserConstants_1.default.WEBKIT === browserType) {
            browser = await test_1.webkit.launch(browserOptions);
        }
        else {
            browser = await test_1.chromium.launch(browserOptions);
        }
        return browser;
    }
}
exports.default = Browser;
//# sourceMappingURL=Browser.js.map