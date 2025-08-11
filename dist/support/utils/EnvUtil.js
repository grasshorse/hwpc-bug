"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EnvUtil {
    static setEnv() {
        require('dotenv').config({
            path: process.env.TEST_ENV ? `.env.${process.env.TEST_ENV}` : '.env',
            override: process.env.TEST_ENV ? true : false,
        });
    }
}
exports.default = EnvUtil;
//# sourceMappingURL=EnvUtil.js.map