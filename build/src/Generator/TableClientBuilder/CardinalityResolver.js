"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardinalityResolver = void 0;
const lodash_1 = __importDefault(require("lodash"));
class CardinalityResolver {
    /**
     * True if key column can map to many rows in the table
     */
    static isToMany(column, tableKeys) {
        const primary = tableKeys.filter((key) => key.constraintName === 'PRIMARY');
        const primaryMap = lodash_1.default.keyBy(primary, 'columnName');
        // column is singular PK so can't map to many rows
        if (primaryMap[column] && primary.length === 1)
            return false;
        // column is part of compound PK so should map to many rows else PK is over-specified
        if (primaryMap[column] && primary.length > 1)
            return true;
        // assume non-primary keys are non-unique in table
        return true;
    }
}
exports.CardinalityResolver = CardinalityResolver;
//# sourceMappingURL=CardinalityResolver.js.map