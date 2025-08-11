"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonpath_1 = __importDefault(require("jsonpath"));
const Log_1 = __importDefault(require("../../logger/Log"));
class RESTResponse {
    constructor(headers, body, status, description) {
        this.headers = headers;
        this.body = body;
        this.status = status;
        this.description = description;
    }
    /**
     * Get content of tag in response body using JSON path
     * @param jsonPath
     * @param description
     * @returns
     */
    async getTagContentByJsonPath(jsonPath, description) {
        Log_1.default.info(`Getting content of ${description}`);
        // eslint-disable-next-line prefer-destructuring
        return jsonpath_1.default.query(JSON.parse(this.body), jsonPath)[0];
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
        return this.headers;
    }
}
exports.default = RESTResponse;
//# sourceMappingURL=RESTResponse.js.map