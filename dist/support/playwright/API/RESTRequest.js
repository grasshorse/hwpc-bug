"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const fetch_to_curl_1 = __importDefault(require("fetch-to-curl"));
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const StringUtil_1 = __importDefault(require("../../utils/StringUtil"));
const RESTResponse_1 = __importDefault(require("./RESTResponse"));
const Log_1 = __importDefault(require("../../logger/Log"));
class RESTRequest {
    constructor(page) {
        this.page = page;
    }
    /**
     * Creates request body from JSON file by replacing the input parameters
     * @param jsonFileName
     * @param data
     * @returns
     */
    async createRequestBody(jsonFileName, data) {
        let json = fs_1.default.readFileSync(CommonConstants_1.default.REST_JSON_REQUEST_PATH + jsonFileName, 'utf-8');
        json = StringUtil_1.default.formatStringValue(json, data);
        return json;
    }
    /**
     * Make POST request and return response
     * @param endPoint
     * @param requestHeader
     * @param jsonAsString
     * @param description
     * @returns
     */
    async post(attach, endPoint, requestHeader, jsonAsString, description) {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log_1.default.info(`Making POST request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'post');
        const response = await this.page.request.post(endPoint, { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Sets the API Response into RestResponse object
     * @param response
     * @param description
     * @returns RestResponse object
     */
    async setRestResponse(attach, response, description) {
        const body = await response.text();
        const headers = response.headers();
        const statusCode = response.status();
        const restResponse = new RESTResponse_1.default(headers, body, statusCode, description);
        const responseBody = body === CommonConstants_1.default.BLANK ? CommonConstants_1.default.BLANK : JSON.stringify(JSON.parse(body), undefined, 2);
        Log_1.default.attachText(attach, `Response body: ${responseBody}`);
        return restResponse;
    }
    /**
     * Make Get request and return response
     * @param endPoint
     * @param requestHeader
     * @param description
     * @returns
     */
    async get(attach, endPoint, requestHeader, description) {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log_1.default.info(`Making GET request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, null, 'get');
        const response = await this.page.request.get(endPoint, { headers: headersAsJson });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Put request and return response
     * @param endPoint
     * @param requestHeader
     * @param jsonAsString
     * @param description
     * @returns
     */
    async put(attach, endPoint, requestHeader, jsonAsString, description) {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log_1.default.info(`Making PUT request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'put');
        const response = await this.page.request.put(endPoint, { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Patch request and return response
     * @param endPoint
     * @param requestHeader
     * @param jsonAsString
     * @param description
     * @returns
     */
    async patch(attach, endPoint, requestHeader, jsonAsString, description) {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log_1.default.info(`Making PATCH request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'patch');
        const response = await this.page.request.patch(endPoint, { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Delete request and return response
     * @param endPoint
     * @param requestHeader
     * @param description
     * @returns
     */
    async delete(attach, endPoint, requestHeader, description) {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log_1.default.info(`Making DELETE request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, null, 'delete');
        const response = await this.page.request.delete(endPoint, { headers: headersAsJson });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Prints the API request on console in curl format
     * @param endPoint
     * @param requestHeader
     * @param jsonRequestBody
     * @param method
     */
    printRequest(attach, endPoint, requestHeader, jsonRequestBody, method) {
        let requestBody = jsonRequestBody;
        if (jsonRequestBody !== null) {
            requestBody = JSON.stringify(JSON.parse(jsonRequestBody), undefined, 2);
        }
        Log_1.default.attachText(attach, `Request:  ${(0, fetch_to_curl_1.default)({
            url: endPoint,
            headers: requestHeader,
            body: requestBody,
            method: method,
        })}`);
    }
}
exports.default = RESTRequest;
//# sourceMappingURL=RESTRequest.js.map