"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CLIUtil {
    /**
     * Gets the value of command line argument
     * @param argumentName
     * @returns
     */
    static getValueOf(argumentName) {
        const argv = process.argv[2];
        if (argv === undefined) {
            throw new Error(`${argumentName} is not defined, please send ${argumentName} through CLI`);
        }
        if (argv.toUpperCase().includes(argumentName)) {
            return argv.split("=")[1];
        }
        throw new Error(`Please send command line argument ${argumentName} with value`);
    }
}
exports.default = CLIUtil;
//# sourceMappingURL=CLIUtil.js.map