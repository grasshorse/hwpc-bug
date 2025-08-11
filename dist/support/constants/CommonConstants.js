"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommonConstants {
}
exports.default = CommonConstants;
CommonConstants.SEMICOLON = ';';
CommonConstants.BLANK = '';
CommonConstants.ZERO = 0;
CommonConstants.ONE = 1;
CommonConstants.TWO = 2;
CommonConstants.THREE = 3;
CommonConstants.HALF = 0.5;
CommonConstants.ONE_THOUSAND = 1000;
CommonConstants.DOWNLOAD_PATH = "./test-results/downloads/";
CommonConstants.SOAP_XML_REQUEST_PATH = "src/resources/API/SOAP/";
CommonConstants.REST_JSON_REQUEST_PATH = "src/resources/API/REST/";
CommonConstants.TEST_FOLDER_PATH = "../../tests/";
CommonConstants.TEST_SUITE_FILE_FORMAT = ".test.ts";
CommonConstants.PARALLEL_MODE = "parallel";
CommonConstants.SERIAL_MODE = "serial";
CommonConstants.REPORT_TITLE = "Test Execution Report";
CommonConstants.RESULTS_PATH = "./test-results/results";
CommonConstants.JUNIT_RESULTS_PATH = `${CommonConstants.RESULTS_PATH}/results.xml`;
CommonConstants.SIXTY = 60;
CommonConstants.WAIT = parseInt(process.env.WAIT_TIME, 10) * CommonConstants.ONE_THOUSAND * CommonConstants.SIXTY;
//# sourceMappingURL=CommonConstants.js.map