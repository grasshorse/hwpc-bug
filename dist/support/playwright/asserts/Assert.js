"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const Log_1 = __importDefault(require("../../logger/Log"));
class Assert {
    /**
     * To verify that condition passed as input is true
     * @param condition - boolean condition
     * @param description - description of element that is being validated
     * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertTrue(condition, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is true`);
        try {
            (0, test_1.expect)(condition, `Expected is 'True' & Actual is '${condition}'`).toBeTruthy();
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify that value1 contains value2
     * @param value1 - string input
     * @param value2 - should be present in value1
     * @param description - description of element that is being validated
     * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertContains(value1, value2, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description}: '${value1}' contains text '${value2}'`);
        try {
            (0, test_1.expect)(value1, `'${value1}' is expected to CONTAIN '${value2}'`).toContain(value2);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
    * To verify that value1 contains value1 ignoring case
    * @param value1 - string input
    * @param value2 - should be present in value1
    * @param description - description of element that is being validated
    * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
    */
    static async assertContainsIgnoreCase(value1, value2, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description}: '${value1}' contains text '${value2}'`);
        try {
            (0, test_1.expect)(value1.toLowerCase(), `'${value1}' is expected to CONTAIN '${value2}'`).toContain(value2.toLowerCase());
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
   * To verify that actual contains expected ignoring case
   * @param actual - string input
   * @param expected - string input
   * @param description - description of element that is being validated
   * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
   */
    static async assertEqualsIgnoreCase(actual, expected, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} has text ${expected}`);
        try {
            (0, test_1.expect)(actual.toLowerCase(), `Expected '${expected}' should be EQUAL to Actual '${actual}'`)
                .toEqual(expected.toLowerCase());
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify actual equals expected
     * @param value1 any object
     * @param value2 any object to compare
     * @param description object description
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertEquals(actual, expected, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} has text '${expected}'`);
        try {
            (0, test_1.expect)(actual, `Expected '${expected}' should be EQUAL to Actual '${actual}'`).toEqual(expected);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify that actual passed as input is false
     * @param condition boolean
     * @param description description of element that is being validated
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertFalse(condition, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is false`);
        try {
            (0, test_1.expect)(condition, `Expected is 'false' & Acutal is '${condition}'`).toBeFalsy();
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
    * To verify that element not contains expected
    * @param actual any value
    * @param expected any value
    * @param description description of element that is being validated
    * @param softAssert for soft asserts this has to be set to true, else this can be ignored
    */
    static async assertNotContains(actual, expected, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} does not contain '${expected}'`);
        try {
            await (0, test_1.expect)(actual, `'${actual}' should NOT CONTAIN '${expected}'`).not.toContain(expected);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify actual not equals to expected
     * @param actual any object
     * @param expected any object to compare
     * @param description object description
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertNotEquals(actual, expected, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is not equals to ${expected}`);
        try {
            (0, test_1.expect)(actual, `Expected '${expected}' should NOT be EQUAL to Actual '${actual}'`).not.toEqual(expected);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify value not equals to null
     * @param value any value
     * @param description description of the value
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertNotNull(value, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is not null`);
        try {
            (0, test_1.expect)(value, `Expected is 'NOT null' & Actual is '${value}'`).not.toEqual(null);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To validate that value is not null
     * @param value any value
     * @param description description of the element
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertNull(value, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is equals to null`);
        try {
            (0, test_1.expect)(value, `Expected is 'null' & Actual is '${value}'`).toEqual(null);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
    * To validate that value is Undefined
    * @param value any value
    * @param description description of the element
    * @param softAssert for soft asserts this has to be set to true, else this can be ignored
    */
    static async assertUndefined(value, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is undefined`);
        try {
            (0, test_1.expect)(value, `Expected is 'Undefined' & Actual is '${value}'`).toEqual(typeof undefined);
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To validate that element is empty
     * @param value any element
     * @param description description of the element
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    static async assertToBeEmpty(value, description, softAssert = false) {
        Log_1.default.info(`Verifying that ${description} is empty`);
        try {
            await (0, test_1.expect)(value, `Expected is 'Empty' & Actual is '${value}'`).toBeEmpty();
        }
        catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
}
exports.default = Assert;
//# sourceMappingURL=Assert.js.map