"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston = __importStar(require("winston"));
const Logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.uncolorize({ level: true, message: true, raw: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.align(), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
        }),
        new winston.transports.File({
            filename: 'test-results/logs/execution.log',
            format: winston.format.combine(winston.format.uncolorize({ level: true, message: true, raw: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.align(), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
        }),
    ],
});
const TEST_SEPARATOR = "##############################################################################";
class Log {
    static testBegin(scenario) {
        this.printLogs(`Scenario: ${scenario} - Started`, TEST_SEPARATOR);
    }
    static testEnd(scenario, status) {
        this.printLogs(`Scenario: ${scenario} - ${status}`, TEST_SEPARATOR);
    }
    static printLogs(msg, separator) {
        Logger.info(separator);
        Logger.info(`${msg.toUpperCase()}`);
        Logger.info(separator);
    }
    static info(message) {
        Logger.info(message);
    }
    static error(error) {
        Logger.error(error);
    }
    static attachText(attach, message) {
        Logger.info(message);
        attach(message);
    }
}
exports.default = Log;
//# sourceMappingURL=Log.js.map