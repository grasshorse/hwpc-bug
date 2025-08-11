"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AlertActions {
    constructor(page) {
        this.page = page;
    }
    /**
     * Accept alert and return alert message
     * @param promptText A text to enter in prompt. It is optional for alerts.
     * @returns alert message
     */
    async accept(promptText) {
        return this.page.waitForEvent("dialog").then(async (dialog) => {
            if (dialog.type() === "prompt") {
                await dialog.accept(promptText);
            }
            else {
                await dialog.accept();
            }
            return dialog.message().trim();
        });
    }
    /**
     * Dismiss alert and return alert message
     * @returns alert message
     */
    async dismiss() {
        return this.page.waitForEvent("dialog").then(async (d) => {
            await d.dismiss();
            return d.message().trim();
        });
    }
}
exports.default = AlertActions;
//# sourceMappingURL=AlertActions.js.map