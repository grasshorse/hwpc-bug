"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestHeader {
    constructor() {
        this.map = new Map();
    }
    set(key, value) {
        this.map.set(key, value);
        return this;
    }
    get() {
        return Object.fromEntries(this.map);
    }
}
exports.default = RequestHeader;
//# sourceMappingURL=RequestHeader.js.map