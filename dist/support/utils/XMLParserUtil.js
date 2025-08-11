"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-var-requires */
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
class XMLParserUtil {
    /**
     * Get content of tag in XML using xpath
     * @param xPathExpression xpath for the tag
     * @param xml as string
     */
    static getTagContentByXpath(xml, xPathExpression) {
        const doc = new Dom().parseFromString(xml);
        const text = xpath.select(`string(${xPathExpression})`, doc);
        return text;
    }
    /**
     * Get value of attribute in XML using xpath
     * @param xPathExpression xpath for the attribute
     * @param xml as string
     */
    static getAttributeValueByXpath(xml, xPathExpression) {
        const doc = new Dom().parseFromString(xml);
        const text = xpath.select1(xPathExpression, doc).value;
        return text;
    }
}
exports.default = XMLParserUtil;
//# sourceMappingURL=XMLParserUtil.js.map