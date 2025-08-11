"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
class DateUtil {
    /**
     * Generates date based on the input
     * @param format date format
     * @param days increment OR decrement the days
     * @param months increment OR decrement the months
     * @param years increment OR decrement the years
     * @returns
     */
    static dateGenerator(format, days, months, years) {
        const date = (0, moment_1.default)().add(days, 'd').add(months, 'M').add(years, 'y').format(format);
        return date;
    }
    /**
     * Customizes the date that has been given as input based on other input parameter
     * @param date to be customized
     * @param format date format
     * @param days increment OR decrement the days
     * @param months increment OR decrement the months
     * @param years increment OR decrement the years
     * @returns
     */
    static dateCustomizer(date, format, days, months, years) {
        const customDate = (0, moment_1.default)(date, format).add(days, 'd').add(months, 'M').add(years, 'y').format(format);
        return customDate;
    }
    /**
     * Generates time in hr:min format based on the input
     * @param format time format
     * @param hours increment OR decrement the hours
     * @param minutes increment OR decrement the minutes
     * @returns
     */
    static timeGenerator(format, hours, minutes) {
        const time = (0, moment_1.default)().add(minutes, 'm').add(hours, 'h').format(format);
        return time;
    }
}
exports.default = DateUtil;
//# sourceMappingURL=DateUtil.js.map