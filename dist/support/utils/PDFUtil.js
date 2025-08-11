"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
class PDFUtil {
    /**
     * Gets the text content of the pdf file
     * @param filePath File path
     * @returns PDF as text
     */
    static async getText(filePath) {
        const buffer = fs_1.default.readFileSync(filePath);
        try {
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.text;
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Gets number of pages in pdf file
     * @param filePath File path
     * @returns Number of pages
     */
    static async getNumberOfPages(filePath) {
        const buffer = fs_1.default.readFileSync(filePath);
        try {
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.numpages;
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Gets the information about the pdf file
     * @param filePath File path
     * @returns PDF document info
     */
    static async getInfo(filePath) {
        const buffer = fs_1.default.readFileSync(filePath);
        try {
            const data = await (0, pdf_parse_1.default)(buffer);
            return data.info;
        }
        catch (err) {
            throw new Error(err);
        }
    }
}
exports.default = PDFUtil;
//# sourceMappingURL=PDFUtil.js.map