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
const SOFT_DELETE_COLUMN = 'deleted';
/**
 * Bulk loader function
 * Loads one row per input key
 * Ensures order is preserved
 * For example get users [1, 2, 4] returns users [1, 2, 4]
 * @param table
 * @param column
 * @param keys
 * @param filterSoftDelete
 */
function byColumnLoader(table, column, keys, filterSoftDelete) {
    return __awaiter(this, void 0, void 0, function* () {
        let query = index_1.knex()(table).select().whereIn(column, lodash_1.default.uniq(keys));
        if (filterSoftDelete)
            query.where({ [SOFT_DELETE_COLUMN]: false });
        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = yield query;
        const keyed = lodash_1.default.keyBy(rows, column);
        return keys.map((k) => {
            if (keyed[k])
                return keyed[k];
            _logger.debug(`Missing row for ${table}:${column} ${k}`);
            return null;
        });
    });
}
exports.byColumnLoader = byColumnLoader;
/**
 * Bulk loader function
 * Loads multiple rows per input key
 * Ensures order is preserved
 * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
 * @param table
 * @param column
 * @param keys
 * @param orderBy - default order is by 'column'. Pass [] for default order.
 * @param filterSoftDelete
 */
function manyByColumnLoader(table, column, keys, orderBy, filterSoftDelete) {
    return __awaiter(this, void 0, void 0, function* () {
        let query = index_1.knex()(table).select().whereIn(column, lodash_1.default.uniq(keys));
        if (filterSoftDelete)
            query.where({ [SOFT_DELETE_COLUMN]: false });
        if (orderBy.length < 1)
            query.orderBy(column, 'asc');
        for (let order of orderBy)
            query.orderBy(order, 'asc');
        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = yield query;
        // map rows back to input keys
        const grouped = lodash_1.default.groupBy(rows, column);
        return keys.map((id) => grouped[id] || []);
    });
}
exports.manyByColumnLoader = manyByColumnLoader;
/**
 * Complex find rows from a table
 * @param table
 * @param options - should specify order by to ensure deterministic pagination etc
 * @param hasSoftDelete
 */
function findManyLoader(table, options, hasSoftDelete) {
    return __awaiter(this, void 0, void 0, function* () {
        const { orderBy, where, includeDeleted } = options;
        let query = index_1.knex()(table).select();
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
        _logger.debug('Executing SQL: %j', query.toSQL().sql);
        return query;
    });
}
exports.findManyLoader = findManyLoader;
//# sourceMappingURL=Loaders.js.map