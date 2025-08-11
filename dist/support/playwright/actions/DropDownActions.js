"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const HTMLConstants_1 = __importDefault(require("../../constants/HTMLConstants"));
const Log_1 = __importDefault(require("../../logger/Log"));
class DropDownActions {
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
     * Select the dropdown by value
     * @param value
     * @returns
     */
    async selectByValue(value) {
        Log_1.default.info(`Selecting value ${value} from ${this.description}`);
        await this.locator.selectOption({ value });
        return this;
    }
    /**
     * Select the dropdown by Label
     * @param text
     * @returns
     */
    async selectByVisibleText(text) {
        Log_1.default.info(`Selecting text ${text} from ${this.description}`);
        await this.locator.selectOption({ label: text });
        return this;
    }
    /**
     * Select the dropdown by index
     * @param index
     * @returns
     */
    async selectByIndex(index) {
        Log_1.default.info(`Selecting index ${index} of ${this.description}`);
        await this.locator.selectOption({ index });
        return this;
    }
    /**
     * Gets all the options in dropdown
     * @param index
     * @returns
     */
    async getAllOptions() {
        Log_1.default.info(`Getting all the options of ${this.description}`);
        await this.locator.waitFor({ state: "visible", timeout: CommonConstants_1.default.WAIT });
        return await this.locator.locator(HTMLConstants_1.default.OPTION).allTextContents();
    }
    /**
     * Gets all the selected options in dropdown
     * @param index
     * @returns
     */
    async getAllSelectedOptions() {
        Log_1.default.info(`Getting all the selected options of ${this.description}`);
        await this.locator.waitFor({ state: "visible", timeout: CommonConstants_1.default.WAIT });
        return await this.locator.locator(HTMLConstants_1.default.SELECTED_OPTION).allTextContents();
    }
}
exports.default = DropDownActions;
//# sourceMappingURL=DropDownActions.js.map