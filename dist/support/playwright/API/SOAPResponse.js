"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Log_1 = __importDefault(require("../../logger/Log"));
const XMLParserUtil_1 = __importDefault(require("../../utils/XMLParserUtil"));
class SOAPResponse {
    constructor(headers, body, status, description) {
        this.headers = headers;
        this.body = body;
        this.status = status;
        this.description = description;
    }
    /**
     * Get content of tag in response body using xpath
     * @param xPathExpression xpath for the tag
     * @param description
     */
    async getTagContentByXpath(xPathExpression, description) {
        Log_1.default.info(`Getting tag value of action ${description}`);
        return XMLParserUtil_1.default.getTagContentByXpath(this.body, xPathExpression);
    }
    /**
     * Get value of attribute in response body using xpath
     * @param xPathExpression xpath for the attribute
     * @param description
     */
    async getAttributeValueByXpath(xPathExpression, description) {
        Log_1.default.info(`Getting attribute value of action ${description}`);
        return XMLParserUtil_1.default.getAttributeValueByXpath(this.body, xPathExpression);
    }
    /**
     * Get header value by header key
     * @param key
     * @returns
     */
    async getHeaderValueByKey(key) {
        Log_1.default.info(`Getting header value of ${key}`);
        const jsonHeaders = await JSON.parse(JSON.stringify(this.headers));
        return jsonHeaders[key];
    }
    /**
     * Get response status code
     * @returns
     */
    async getStatusCode() {
        Log_1.default.info(`Getting status code of ${this.description}`);
        return this.status;
    }
    /**
     * Get response body
     * @returns
     */
    async getBody() {
        Log_1.default.info(`Getting response body of ${this.description}`);
        return this.body;
    }
    /**
     * Get response headers
     * @returns
     */
    async getHeaders() {
        Log_1.default.info(`Getting response Headers of ${this.description}`);
        return JSON.stringify(this.headers);
    }
}
exports.default = SOAPResponse;
//# sourceMappingURL=SOAPResponse.js.map