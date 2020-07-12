"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const DEFAULT_OPTIONS = {
    writeHeader: true,
    camelCase: false
};
class Options {
    constructor(options = {}) {
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
    }
    transformTypeName(typename) {
        return this.options.camelCase ? lodash_1.upperFirst(lodash_1.camelCase(typename)) : typename;
    }
    transformColumnName(columnName) {
        return this.options.camelCase ? lodash_1.camelCase(columnName) : columnName;
    }
}
exports.default = Options;
//# sourceMappingURL=options.js.map