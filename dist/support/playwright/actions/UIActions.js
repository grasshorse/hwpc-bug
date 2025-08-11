"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const Log_1 = __importDefault(require("../../logger/Log"));
const AlertActions_1 = __importDefault(require("./AlertActions"));
const CheckBoxActions_1 = __importDefault(require("./CheckBoxActions"));
const DropDownActions_1 = __importDefault(require("./DropDownActions"));
const EditBoxActions_1 = __importDefault(require("./EditBoxActions"));
const UIElementActions_1 = __importDefault(require("./UIElementActions"));
class UIActions {
    constructor(page) {
        this.page = page;
        this.elementAction = new UIElementActions_1.default(page);
        this.editBoxAction = new EditBoxActions_1.default(page);
        this.checkboxAction = new CheckBoxActions_1.default();
        this.dropdownAction = new DropDownActions_1.default();
        this.alertAction = new AlertActions_1.default(this.page);
    }
    /**
     * Returns page object
     * @returns
     */
    getPage() {
        return this.page;
    }
    /**
     * Sets the page
     * @param page
     */
    setPage(page) {
        this.page = page;
        this.elementAction = new UIElementActions_1.default(page);
        this.editBoxAction = new EditBoxActions_1.default(page);
        this.alertAction = new AlertActions_1.default(this.page);
    }
    /**
     * Close page
     * @returns
     */
    closePage() {
        this.page.close();
    }
    /**
     * Returns the instance of Alert
     * @returns
     */
    alert() {
        return this.alertAction;
    }
    /**
     * Returns the instance of editbox actions
     * @param selector
     * @param description
     * @returns
     */
    editBox(selector, description) {
        return this.editBoxAction.setEditBox(selector, description);
    }
    /**
     * Returns the instance of UIElements actions
     * @param selector
     * @param description
     * @returns
     */
    element(selector, description) {
        return this.elementAction.setElement(selector, description);
    }
    /**
     * Returns the instance of Dropdown actions
     * @param selector
     * @param description
     * @returns
     */
    dropdown(selector, description) {
        return this.dropdownAction.setLocator(this.elementAction.setElement(selector, description).getLocator(), description);
    }
    /**
     * Returns the instance of CheckBox actions
     * @param selector
     * @param description
     * @returns
     */
    checkbox(selector, description) {
        return this.checkboxAction.setLocator(this.elementAction.setElement(selector, description).getLocator(), description);
    }
    /**
     * Navigate to specified URL
     * @param URL
     * @param description
     */
    async goto(URL, description) {
        Log_1.default.info(`Navigate to ${description}`);
        await this.page.goto(URL, { timeout: CommonConstants_1.default.WAIT, waitUntil: "load" });
    }
    /**
     * Navigate to previous URL
     * @param description
     */
    async goBack(description) {
        Log_1.default.info(`Go to the previous ${description}`);
        await this.page.goBack({ timeout: CommonConstants_1.default.WAIT, waitUntil: "load" });
    }
    /**
     * Navigate to next URL
     * @param description
     */
    async goForward(description) {
        Log_1.default.info(`Go to the next ${description}`);
        await this.page.goForward({ timeout: CommonConstants_1.default.WAIT, waitUntil: "load" });
    }
    /**
     * Page Refresh
     */
    async pageRefresh() {
        Log_1.default.info(`Page Refresh`);
        await this.page.reload({ timeout: CommonConstants_1.default.WAIT, waitUntil: "load" });
    }
    /**
     * Press a key on web page
     * @param key
     * @param description
     */
    async keyPress(key, description) {
        Log_1.default.info(`Pressing ${description}`);
        await this.page.keyboard.press(key);
    }
    /**
     * Waits for the main frame navigation and returns the main resource response.
     */
    async waitForNavigation() {
        Log_1.default.info(`Waiting for navigation`);
        await this.page.waitForNavigation();
    }
    /**
     * Returns when the required load state has been reached.
     */
    async waitForLoadState() {
        Log_1.default.info(`Waiting for load event`);
        await this.page.waitForLoadState("load", { timeout: CommonConstants_1.default.WAIT });
    }
    /**
     * Returns when the required dom content is in loaded state.
     */
    async waitForDomContentLoaded() {
        Log_1.default.info(`Waiting for load event`);
        await this.page.waitForLoadState("domcontentloaded", { timeout: CommonConstants_1.default.WAIT });
    }
    /**
     * Gets the handle of the new window
     * @param selector
     * @param description
     */
    async switchToNewWindow(selector, description) {
        let [newPage] = [this.page];
        Log_1.default.info(`Opening  ${description} Window`);
        [newPage] = await Promise.all([
            this.page.context().waitForEvent("page"),
            await this.elementAction.setElement(selector, description).click(),
        ]);
        await this.waitForDomContentLoaded();
        return newPage;
    }
    /**
     * Clicks the an element, accepts the alert and returns the alert message
     * @param selector  selector of the element
     * @param description description of element
     * @returns alert message
     */
    async acceptAlertOnElementClick(selector, description) {
        const message = this.alert().accept();
        return this.handleAlert(selector, description, message);
    }
    /**
     * Clicks the an element, dismisses the alert and returns the alert message
     * @param selector  selector of the element
     * @param description description of element
     * @returns alert message
     */
    async dismissAlertOnElementClick(selector, description) {
        const message = this.alert().dismiss();
        return this.handleAlert(selector, description, message);
    }
    /**
     * Clicks the an element, accepts the alert prompt and returns the alert message
     * @param selector  selector of the element
     * @param description description of element
     * @param promptText A text to enter in prompt.
     * @returns alert message
     */
    async acceptPromptOnElementClick(selector, description, promptText) {
        const message = this.alert().accept(promptText);
        return this.handleAlert(selector, description, message);
    }
    async handleAlert(selector, description, message) {
        await this.elementAction.setElement(selector, description).click();
        return message;
    }
    /**
     * Gets the page Title
     * @returns
     */
    async getPageTitle() {
        let title;
        title = await this.page.title();
        Log_1.default.info(`Getting Page Title: ${title}`);
        return title;
    }
    /**
     * Downloads the file and returns the downloaded file name
     * @param selector element that results in file download
     * @param description description of the element
     * @returns downloaded file name
     */
    async downloadFile(selector, description) {
        let fileName;
        Log_1.default.info(`Downloading ${description} file`);
        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: CommonConstants_1.default.WAIT }),
            await this.page.locator(selector).click({ modifiers: ["Alt"] }),
        ]);
        fileName = download.suggestedFilename();
        const filePath = `${CommonConstants_1.default.DOWNLOAD_PATH}${fileName}`;
        await download.saveAs(filePath);
        await download.delete();
        return fileName;
    }
    /**
     * Pause the execution in seconds
     * @param sec
     */
    async pauseInSecs(sec) {
        // eslint-disable-next-line no-promise-executor-return
        return new Promise((resolve) => setTimeout(resolve, sec * CommonConstants_1.default.ONE_THOUSAND));
    }
}
exports.default = UIActions;
//# sourceMappingURL=UIActions.js.map