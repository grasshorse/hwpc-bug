"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const randomstring_1 = __importDefault(require("randomstring"));
const string_format_1 = __importDefault(require("string-format"));
class StringUtil {
    /**
     * This method will return the formatted String by replacing value in {\d}
     * @param str : String to be formatted
     * @param replaceValue : value to replaced in formatted string
     * @returns str
     */
    static formatString(str, ...replaceValue) {
        for (let i = 0; i < replaceValue.length; i++) {
            // eslint-disable-next-line no-param-reassign
            str = str.split(`{${i}}`).join(replaceValue[i]);
        }
        return str;
    }
    /**
     * This method will return the formatted String by replacing value in {key}
     * @param str : String to be formatted
     * @param replaceValue : value to replaced in formatted string
     * @returns str
     */
    static formatStringValue(str, replaceValue) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(replaceValue)) {
            // eslint-disable-next-line no-param-reassign
            str = str.split(`{${key}}`).join(`${value}`);
        }
        return str;
    }
    /**
     * Replaces text in a string, using an string that supports replacement within a string.
     * @param str Original string
     * @param searchValue searches for and replace matches within the string.
     * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
     * @returns
     */
    static replaceAll(str, searchValue, replaceValue) {
        const replacer = new RegExp(searchValue, 'g');
        const replacedStr = str.replace(replacer, replaceValue);
        return replacedStr;
    }
    /**
     * replaces the regex with string value
     * @param str
     * @param regex
     * @param value
     * @returns
     */
    static getRegXLocator(str, regex, value) {
        return str.replace(regex, value);
    }
    /**
     * Generates random alphanumeric string of given length
     * @param length
     * @returns
     */
    static randomAlphanumericString(length) {
        const str = randomstring_1.default.generate(length);
        return str;
    }
    /**
     * Generates random string of given length
     * @param length
     * @returns
     */
    static randomAlphabeticString(length) {
        const str = randomstring_1.default.generate({ length: length, charset: 'alphabetic' });
        return str;
    }
    /**
     * Generates random string of given length with all letters a as uppercase
     * @param length
     * @returns
     */
    static randomUppercaseString(length) {
        const str = randomstring_1.default.generate({ length: length, charset: 'alphabetic', capitalization: "uppercase" });
        return str;
    }
    /**
     * Generates random string of given length with all letters a as lowercase
     * @param length
     * @returns
     */
    static randomLowercaseString(length) {
        const str = randomstring_1.default.generate({ length: length, charset: 'alphabetic', capitalization: "lowercase" });
        return str;
    }
    /**
     * Generates random number string of given length
     * @param length
     * @returns
     */
    static randomNumberString(length) {
        const str = randomstring_1.default.generate({ length: length, charset: 'numeric' });
        return str;
    }
    /**
     * This method will return the formatted String by replacing value in {key} from Object
     * @param str
     * @param obj
     * @returns
     */
    static formatStringFromObject(str, obj) {
        return (0, string_format_1.default)(str, obj);
    }
}
exports.default = StringUtil;
//# sourceMappingURL=StringUtil.js.map