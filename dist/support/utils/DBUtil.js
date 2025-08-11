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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
const sql = __importStar(require("mssql"));
const oracledb_1 = __importDefault(require("oracledb"));
const CommonConstants_1 = __importDefault(require("../constants/CommonConstants"));
const DBConstants_1 = __importDefault(require("../constants/DBConstants"));
class DBUtil {
    /**
     * Executes the query on MSSQL database
     * @param dbConfig data base configuration
     * @param query to be executed
     * @returns record set
     */
    static async executeMSSQLQuery(dbConfig, query) {
        try {
            const pool = await sql.connect(`${dbConfig}${DBConstants_1.default.CERTIFICATE}`);
            const result = await pool.request().query(query);
            return { rows: result.recordset, rowsAffected: result.rowsAffected };
        }
        catch (err) {
            throw new Error(`Error while executing query\n${err.message}`);
        }
    }
    /**
     * Executes the query on Oracle database
     * @param dbConfig data base configuration
     * @param query to be executed
     * @returns record set
     */
    static async executeOracleQuery(dbConfig, query) {
        const configs = dbConfig.split(CommonConstants_1.default.SEMICOLON);
        const config = {
            user: configs[0].replace(DBConstants_1.default.USER, CommonConstants_1.default.BLANK).trim(),
            password: configs[1].replace(DBConstants_1.default.PASSWORD, CommonConstants_1.default.BLANK).trim(),
            connectString: configs[2].replace(DBConstants_1.default.CONNECTION_STRING, CommonConstants_1.default.BLANK).trim(),
        };
        let connection;
        try {
            connection = await oracledb_1.default.getConnection(config);
            const result = await connection.execute(query);
            return { rows: result.rows, rowsAffected: result.rowsAffected };
        }
        catch (err) {
            throw new Error(`Error while executing query\n${err.message}`);
        }
        finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    }
    /**
     * Executes the query on DB2 database
     * @param dbConfig data base configuration
     * @param query to be executed
     * @returns record set
     */
    static async executeDB2Query(dbConfig, query) {
        const ibmdb = require('ibm_db');
        let connection;
        try {
            connection = ibmdb.openSync(`${dbConfig}${DBConstants_1.default.PROTOCOL}`);
            const result = connection.querySync(query);
            return { rows: result, rowsAffected: result.length };
        }
        catch (error) {
            throw new Error(`Error while executing query\n${error.message}`);
        }
        finally {
            if (connection) {
                try {
                    connection.closeSync();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    }
}
exports.default = DBUtil;
//# sourceMappingURL=DBUtil.js.map