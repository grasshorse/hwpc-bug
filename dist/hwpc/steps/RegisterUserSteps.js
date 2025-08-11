"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const StringUtil_1 = __importDefault(require("../../support/utils/StringUtil"));
const CommonPage_1 = __importDefault(require("../pages/CommonPage"));
const RegisterUserPage_1 = __importDefault(require("../pages/RegisterUserPage"));
(0, cucumber_1.Given)('user navigate to registration page', async function () {
    await new CommonPage_1.default(this.web).navigateToRegisterUser();
});
(0, cucumber_1.When)('the user enters the registration details {string}, {string}, {string}, {string}, {string}, {string}, {string}', async function (firstName, lastName, email, telephone, password, confirmPassword, subscribe) {
    email = StringUtil_1.default.formatString(email, StringUtil_1.default.randomNumberString(5));
    await new RegisterUserPage_1.default(this.web).enterRegistrationDetails(firstName, lastName, email, telephone, password, confirmPassword, subscribe);
    await new RegisterUserPage_1.default(this.web).agreePrivacyPolicy();
    await new RegisterUserPage_1.default(this.web).clickContinueButton();
});
(0, cucumber_1.Then)('user should see a message {string}', async function (message) {
    await new CommonPage_1.default(this.web).verifyTitleMessage(message);
});
(0, cucumber_1.Then)('user logs out of application', async function () {
    await new CommonPage_1.default(this.web).logout();
});
// catNotes add pause
(0, cucumber_1.When)('I pause for debugging', async function () {
    // This will pause the execution and open Playwright Inspector
    await this.page.pause();
});
//# sourceMappingURL=RegisterUserSteps.js.map