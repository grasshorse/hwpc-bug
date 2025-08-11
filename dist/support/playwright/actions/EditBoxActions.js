"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Log_1 = __importDefault(require("../../logger/Log"));
const UIElementActions_1 = __importDefault(require("./UIElementActions"));
class EditBoxActions extends UIElementActions_1.default {
    /**
     * Sets the selector with description
     * @param selector
     * @param description
     * @returns
     */
    setEditBox(selector, description) {
        this.setElement(selector, description);
        return this;
    }
    /**
     * Sets the locator with description
     * @param locator
     * @returns
     */
    setLocator(locator, description) {
        super.setLocator(locator, description);
        return this;
    }
    /**
     * Clear and enter text
     * @param value
     * @returns
     */
    async fill(value) {
        Log_1.default.info(`Entering ${this.description} as ${value}`);
        await this.getLocator().fill(value);
        return this;
    }
    /**
     * Types the value to text field
     * @param value
     * @returns
     */
    async type(value) {
        Log_1.default.info(`Typing ${this.description} as ${value}`);
        await this.getLocator().type(value);
        return this;
    }
    /**
     * Enter text and hit tab key
     * @param value
     * @returns
     */
    async fillAndTab(value) {
        Log_1.default.info(`Entering ${this.description} as ${value} and Tab`);
        await this.getLocator().fill(value);
        await this.getLocator().press("Tab");
        return this;
    }
    /**
     * Typing text and hit tab key
     * @param value
     * @returns
     */
    async typeAndTab(value) {
        Log_1.default.info(`Entering ${this.description} as ${value} and Tab`);
        await this.getLocator().type(value);
        await this.getLocator().press("Tab");
        return this;
    }
}
exports.default = EditBoxActions;
//# sourceMappingURL=EditBoxActions.js.map