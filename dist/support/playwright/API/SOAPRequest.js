"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const easy_soap_request_1 = __importDefault(require("easy-soap-request"));
const xml_formatter_1 = __importDefault(require("xml-formatter"));
const fs_1 = __importDefault(require("fs"));
const SOAPResponse_1 = __importDefault(require("./SOAPResponse"));
const StringUtil_1 = __importDefault(require("../../utils/StringUtil"));
const CommonConstants_1 = __importDefault(require("../../constants/CommonConstants"));
const Log_1 = __importDefault(require("../../logger/Log"));
class SOAPRequest {
    /**
     * Creates request body by replacing the input parameters
     * @param xmlFileName
     * @param data
     * @returns
     */
    async createRequestBody(attach, xmlFileName, data) {
        let xml = fs_1.default.readFileSync(CommonConstants_1.default.SOAP_XML_REQUEST_PATH + xmlFileName, 'utf-8');
        xml = StringUtil_1.default.formatStringValue(xml, data);
        Log_1.default.attachText(attach, `SOAP request : \n${(0, xml_formatter_1.default)(xml, { collapseContent: true })}`);
        return xml;
    }
    /**
     * Make POST request and return response
     * @param endPoint
     * @param requestHeader
     * @param fileName
     * @param gData
     * @param data
     * @param description
     * @returns
     */
    async post(attach, endPoint, requestHeader, fileName, requestData, description) {
        Log_1.default.info(`Making SOAP request for ${description}`);
        Log_1.default.attachText(attach, `URL: ${endPoint}`);
        const xml = await this.createRequestBody(attach, fileName, requestData);
        const { response } = await (0, easy_soap_request_1.default)({ url: endPoint, headers: requestHeader, xml: xml });
        const { headers, body, statusCode } = response;
        Log_1.default.attachText(attach, `SOAP Response: \n${(0, xml_formatter_1.default)(body, { collapseContent: true })}`);
        return new SOAPResponse_1.default(headers, body, statusCode, description);
    }
}
exports.default = SOAPRequest;
//# sourceMappingURL=SOAPRequest.js.map