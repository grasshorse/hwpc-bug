"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const Log_1 = __importDefault(require("../../logger/Log"));
class CheckBoxActions {
    /**
     * Sets the locator with description
     * @param locator
     * @param description
     * @returns
     */
    setLocator(locator, description) {
        this.locator = locator;
        this.description = description;
        return this;
    }
    /**
     * check checkbox or radio button
     */
    async check() {
        Log_1.default.info(`Check ${this.description}`);
        await this.locator.check();
        return this;
    }
    /**
     * uncheck checkbox or radio button
     */
    async uncheck() {
        Log_1.default.info(`Uncheck ${this.description}`);
        await this.locator.uncheck();
        return this;
    }
    /**
     * Returns the status of the checkbox
     * @returns
     */
    async isChecked() {
        Log_1.default.info(`Checking status of checkbox ${this.description}`);
        const element = this.locator;
        await element.waitFor({ state: "visible", timeout: CommonConstants_1.default.WAIT });
        return await this.locator.isChecked();
    }
}
exports.default = CheckBoxActions;
//# sourceMappingURL=CheckBoxActions.js.map