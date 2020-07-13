"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findManyLoader = exports.manyByColumnLoader = exports.byColumnLoader = void 0;
const lodash_1 = __importDefault(require("lodash"));
const index_1 = require("../index");
const logging_1 = __importDefault(require("../lib/logging"));
// TODO:- configurable?
const SOFT_DELETE_COLUMN = 'deleted';
/**
 * Bulk loader function
 * Types arguments against the table schema for safety
 * Loads one row per input key
 * Ensures order is preserved
 * For example get users [1, 2, 4] returns users [1, 2, 4]
 * @param params
 */
function byColumnLoader(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tableName, column, keys, filterSoftDelete } = params;
        let query = index_1.knex()(tableName).select().whereIn(column, lodash_1.default.uniq(keys));
        if (filterSoftDelete)
            query.where({ [SOFT_DELETE_COLUMN]: false });
        logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = yield query;
        const keyed = lodash_1.default.keyBy(rows, column);
        return keys.map((k) => {
            if (keyed[k])
                return keyed[k];
            logging_1.default.debug(`Missing row for ${tableName}:${column} ${k}`);
            return null;
        });
    });
}
exports.byColumnLoader = byColumnLoader;
/**
 * Bulk loader function
 * Uses table schema for typing
 * Loads multiple rows per input key
 * Ensures order is preserved
 * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
 * @param params
 */
function manyByColumnLoader(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tableName, column, keys, orderBy, filterSoftDelete } = params;
        let query = index_1.knex()(tableName).select().whereIn(column, lodash_1.default.uniq(keys));
        if (filterSoftDelete)
            query.where({ [SOFT_DELETE_COLUMN]: false });
        if (orderBy.length < 1)
            query.orderBy(column, 'asc');
        for (let order of orderBy)
            query.orderBy(order, 'asc');
        logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = yield query;
        // map rows back to input keys
        const grouped = lodash_1.default.groupBy(rows, column);
        return keys.map((id) => grouped[id] || []);
    });
}
exports.manyByColumnLoader = manyByColumnLoader;
/**
 * Complex find rows from a table
 * @param params
 */
function findManyLoader(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tableName, options, hasSoftDelete } = params;
        const { orderBy, where, includeDeleted } = options;
        let query = index_1.knex()(tableName).select();
        if (where) {
            query.where(where);
        }
        if (orderBy) {
            const { asc, desc, columns } = orderBy;
            let direction = 'asc';
            if (desc && !asc)
                direction = 'desc';
            for (let order of columns)
                query.orderBy(order, direction);
        }
        if (hasSoftDelete) {
            if (!includeDeleted)
                query.where({ [SOFT_DELETE_COLUMN]: false });
        }
        logging_1.default.debug('Executing SQL: %j', query.toSQL().sql);
        return query;
    });
}
exports.findManyLoader = findManyLoader;
//# sourceMappingURL=Loaders.js.map