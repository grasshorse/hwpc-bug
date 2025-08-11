"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const Log_1 = __importDefault(require("../../logger/Log"));
class UIElementActions {
    constructor(page) {
        this.page = page;
    }
    /**
     * Returns the first locator
     * @returns
     */
    getLocator() {
        return this.locator.first();
    }
    /**
     * Returns the all the locators
     * @returns
     */
    getLocators() {
        return this.locator;
    }
    /**
     * Sets the locator using the selector *
     * @param selector
     * @param description
     * @returns
     */
    setElement(selector, description) {
        this.selector = selector;
        this.locator = this.page.locator(this.selector);
        this.description = description;
        return this;
    }
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
     * Click on element
     * @returns
     */
    async click() {
        Log_1.default.info(`Clicking on ${this.description}`);
        await this.getLocator().click();
        return this;
    }
    /**
     * Double click on element
     * @returns
     */
    async doubleClick() {
        Log_1.default.info(`Double Clicking ${this.description}`);
        await this.getLocator().dblclick();
        return this;
    }
    /**
     * scroll element into view, unless it is completely visible
     * @returns
     */
    async scrollIntoView() {
        Log_1.default.info(`Scroll to element ${this.description}`);
        await this.getLocator().scrollIntoViewIfNeeded();
        return this;
    }
    /**
     * Wait for element to be invisible
     * @returns
     */
    async waitTillInvisible() {
        Log_1.default.info(`Waiting for ${this.description} to be invisible`);
        await this.getLocator().waitFor({ state: "hidden", timeout: CommonConstants_1.default.WAIT });
        return this;
    }
    /**
     * wait for element not to be present in DOM
     * @returns
     */
    async waitTillDetached() {
        Log_1.default.info(`Wait for ${this.description} to be detached from DOM`);
        await this.getLocator().waitFor({ state: "detached", timeout: CommonConstants_1.default.WAIT });
        return this;
    }
    /**
     * wait for element to be visible
     * @returns
     */
    async waitTillVisible() {
        Log_1.default.info(`Wait for ${this.description} to be visible in DOM`);
        await this.getLocator().waitFor({ state: "visible", timeout: CommonConstants_1.default.WAIT });
        return this;
    }
    /**
     * wait for element to be attached to DOM
     * @returns
     */
    async waitForPresent() {
        Log_1.default.info(`Wait for ${this.description} to attach to DOM`);
        await this.getLocator().waitFor({ state: "attached", timeout: CommonConstants_1.default.WAIT });
        return this;
    }
    /**
     * This method hovers over the element
     */
    async hover() {
        Log_1.default.info(`Hovering on ${this.description}`);
        await this.getLocator().hover();
        return this;
    }
    /**
     * Returns input.value for <input> or <textarea> or <select> element.
     * @returns
     */
    async getInputValue() {
        Log_1.default.info(`Getting input value of ${this.description}`);
        await this.waitTillVisible();
        return await this.getLocator().inputValue();
    }
    /**
     * Gets the text content
     * @returns
     */
    async getTextContent() {
        Log_1.default.info(`Getting text content of ${this.description}`);
        await this.waitTillVisible();
        return (await this.getLocator().textContent()).trim();
    }
    /**
     * Get Attribute value
     * @param attributeName
     * @returns
     */
    async getAttribute(attributeName) {
        Log_1.default.info(`Getting attribute value of ${this.description}`);
        await this.waitTillVisible();
        return (await this.getLocator().getAttribute(attributeName)).trim();
    }
    /**
     * Get innerHTML
     * @returns
     */
    async getInnerHTML() {
        Log_1.default.info(`Get innerHTML of ${this.description}`);
        await this.waitTillVisible();
        return (await this.getLocator().innerHTML()).trim();
    }
    /**
     * Get inner text
     * @returns
     */
    async getInnerText() {
        Log_1.default.info(`Get inner text of ${this.description}`);
        const element = this.getLocator();
        await this.waitTillVisible();
        return (await element.innerText()).trim();
    }
    /**
     * checks if element is editable
     * @param sec
     * @returns
     */
    async isEditable(sec) {
        Log_1.default.info(`Checking if ${this.description} is editable`);
        const element = this.getLocator();
        return await element.isEditable({ timeout: sec * CommonConstants_1.default.ONE_THOUSAND });
    }
    /**
     * checks if element is enabled
     * @param sec
     * @returns Promise<boolean>
     */
    async isEnabled(sec) {
        Log_1.default.info(`Checking if ${this.description} is enabled`);
        const element = this.getLocator();
        return await element.isEnabled({ timeout: sec * CommonConstants_1.default.ONE_THOUSAND });
    }
    /**
     * checks if element is visible
     * @param sec time for element to be visible
     * @returns Promise<boolean>
     */
    async isVisible(sec) {
        let visibility;
        Log_1.default.info(`Checking if ${this.description} is visible`);
        try {
            visibility = await this.getLocator().isVisible({ timeout: sec * CommonConstants_1.default.ONE_THOUSAND });
        }
        catch (error) {
            visibility = false;
        }
        return visibility;
    }
    /**
     * Press a key on web element
     * @param key
     */
    async keyPress(key) {
        Log_1.default.info(`Pressing ${this.description}`);
        await this.getLocator().press(key);
        return this;
    }
    /**
     * Get all the text Content
     * @returns
     */
    async getAllTextContent() {
        Log_1.default.info(`Getting all the text content of ${this.description}`);
        await this.waitTillVisible();
        return await this.getLocators().allTextContents();
    }
    /**
     * Get the count of
     * @returns
     */
    async getCount() {
        Log_1.default.info(`Getting the count of ${this.description}`);
        return await this.getLocators().count();
    }
    /**
     * Performs mouse click action on the element
     * @returns
     */
    async mouseClick() {
        Log_1.default.info(`Clicking on ${this.description}`);
        await this.getLocator().scrollIntoViewIfNeeded();
        const box = await this.getLocator().boundingBox();
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        return this;
    }
    /**
     * Click on element using js
     * @returns
     */
    async jsClick() {
        Log_1.default.info(`Clicking on ${this.description}`);
        await this.waitTillVisible();
        await this.getLocator().evaluate((node) => { node.click(); });
        return this;
    }
}
exports.default = UIElementActions;
//# sourceMappingURL=UIElementActions.js.map