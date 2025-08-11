"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Assert_1 = __importDefault(require("../../support/playwright/asserts/Assert"));
const StringUtil_1 = __importDefault(require("../../support/utils/StringUtil"));
const Constants_1 = __importDefault(require("../constants/Constants"));
class RegisterUserPage {
    constructor(web) {
        this.web = web;
        this.FIRST_NAME_TEXTBOX = "#input-firstname";
        this.LAST_NAME_TEXTBOX = "#input-lastname";
        this.EMAIL_TEXTBOX = "#input-email";
        this.TELEPHONE_TEXTBOX = "#input-telephone";
        this.PASSWORD_TEXTBOX = "#input-password";
        this.CONFIRM_PASSWORD_TEXTBOX = "#input-confirm";
        this.SUBSCRIBE_RADIO = "[for='input-newsletter-{0}']";
        this.PRIVACY_POLICY_CHECKBOX = "[for='input-agree']";
        this.PRIVACY_POLICY_LINK = "//a/b[text()='Privacy Policy']";
        this.CONTINUE_BUTTON = "[value='Continue']";
    }
    async enterRegistrationDetails(firstName, lastName, email, telephone, password, confirmPassword, subscribe) {
        await this.web.editBox(this.FIRST_NAME_TEXTBOX, Constants_1.default.FIRST_NAME).fill(firstName);
        await this.web.editBox(this.LAST_NAME_TEXTBOX, Constants_1.default.LAST_NAME).fill(lastName);
        await this.web.editBox(this.EMAIL_TEXTBOX, Constants_1.default.EMAIL).fill(email);
        await this.web.editBox(this.TELEPHONE_TEXTBOX, Constants_1.default.TELEPHONE).fill(telephone);
        await this.web.editBox(this.PASSWORD_TEXTBOX, Constants_1.default.PASSWORD).fill(password);
        await this.web.editBox(this.CONFIRM_PASSWORD_TEXTBOX, Constants_1.default.CONFIRM_PASSWORD).fill(confirmPassword);
        await this.web.element(StringUtil_1.default.formatString(this.SUBSCRIBE_RADIO, subscribe.toLowerCase()), subscribe.toUpperCase()).click();
    }
    async agreePrivacyPolicy() {
        await Assert_1.default.assertTrue(await this.web.element(this.PRIVACY_POLICY_LINK, Constants_1.default.PRIVACY_POLICY).isVisible(1), Constants_1.default.PRIVACY_POLICY);
        await this.web.element(this.PRIVACY_POLICY_CHECKBOX, Constants_1.default.PRIVACY_POLICY).click();
    }
    async clickContinueButton() {
        await this.web.element(this.CONTINUE_BUTTON, Constants_1.default.CONTINUE).click();
    }
}
exports.default = RegisterUserPage;
//# sourceMappingURL=RegisterUserPage.js.map