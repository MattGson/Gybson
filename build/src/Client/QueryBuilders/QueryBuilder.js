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
exports.QueryBuilder = void 0;
const index_1 = require("../index");
const logging_1 = __importDefault(require("../lib/logging"));
const lodash_1 = __importDefault(require("lodash"));
// TODO:- auto connection handling
class QueryBuilder {
    constructor(tableName, softDeleteColumn) {
        this.tableName = tableName;
        this.softDeleteColumn = softDeleteColumn;
    }
    hasSoftDelete() {
        return this.softDeleteColumn != null;
    }
    get softDeleteColumnString() {
        return this.softDeleteColumn;
    }
    /**
     * Bulk loader function
     * Types arguments against the table schema for safety
     * Loads one row per input key
     * Ensures order is preserved
     * For example get users [1, 2, 4] returns users [1, 2, 4]
     * @param params
     */
    byColumnLoader(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { column, keys } = params;
            let query = index_1.knex()(this.tableName).select().whereIn(column, lodash_1.default.uniq(keys));
            logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
            const rows = yield query;
            const keyed = lodash_1.default.keyBy(rows, column);
            return keys.map((k) => {
                if (keyed[k])
                    return keyed[k];
                logging_1.default.debug(`Missing row for ${this.tableName}:${column} ${k}`);
                return null;
            });
        });
    }
    /**
     * Bulk loader function
     * Uses table schema for typing
     * Loads multiple rows per input key
     * Ensures order is preserved
     * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
     * @param params
     */
    manyByColumnLoader(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { column, keys, orderBy, filterSoftDelete } = params;
            let query = index_1.knex()(this.tableName).select().whereIn(column, lodash_1.default.uniq(keys));
            if (filterSoftDelete && this.hasSoftDelete())
                query.where({ [this.softDeleteColumnString]: false });
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
    /**
     * Complex find rows from a table
     * @param params
     *      * // TODO:-
     *              - cursor pagination,
     *              - ordering - multiple directions and columns?, remove string constants?
     *              - Joins (join filtering), eager load?
     *              type defs
     *               - gen more comprehensive types for each table i.e. SelectionSet
     *                  - Split the type outputs by table maybe? Alias to more usable names
     */
    findMany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { orderBy, where, includeDeleted } = params;
            let query = index_1.knex()(this.tableName).select();
            if (where) {
                query.where(where);
            }
            if (orderBy) {
                // const { asc, desc, columns } = orderBy;
                for (let [column, direction] of Object.entries(orderBy)) {
                    query.orderBy(column, direction);
                }
                // let direction = 'asc';
                // if (desc && !asc) direction = 'desc';
                // for (let order of columns) query.orderBy(order, direction);
            }
            if (!includeDeleted && this.hasSoftDelete())
                query.where({ [this.softDeleteColumnString]: false });
            logging_1.default.debug('Executing SQL: %j', query.toSQL().sql);
            return query;
        });
    }
    /**
     * Type-safe multi upsert function
     * Inserts all rows. If duplicate key then will update specified columns for that row.
     *     * Pass a constant column (usually primary key) to ignore duplicates without updating any rows.
     * Can automatically remove soft deletes if desired instead of specifying the column and values manually.
     *     * This should be set to false if the table does not support soft deletes
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    upsert(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { values, connection, reinstateSoftDeletedRows, updateColumns } = params;
            let insertRows = values;
            if (insertRows.length < 1) {
                logging_1.default.warn('Persistors.upsert: No values passed.');
                return null;
            }
            if (updateColumns.length < 1 && !reinstateSoftDeletedRows) {
                logging_1.default.warn('Persistor.upsert: No reinstateSoftDelete nor updateColumns. Use insert.');
                return null;
            }
            const columnsToUpdate = updateColumns;
            // add deleted column to all records
            if (reinstateSoftDeletedRows && this.hasSoftDelete()) {
                columnsToUpdate.push(this.softDeleteColumnString);
                insertRows = insertRows.map((value) => {
                    return Object.assign(Object.assign({}, value), { [this.softDeleteColumnString]: false });
                });
            }
            // Knex Normalizes empty (undefined) keys to DEFAULT on multi-row insert:
            // knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
            // Outputs:
            //    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)
            // Note that we are passing a custom connection:
            //    This connection MUST be added last to work with the duplicateUpdateExtension
            const query = index_1.knex()(this.tableName)
                .insert(insertRows)
                .onDuplicateUpdate(...columnsToUpdate)
                .connection(connection);
            logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, insertRows);
            // knex seems to return 0 for insertId on upsert?
            return (yield query)[0].insertId;
        });
    }
    /**
     * Type-safe insert function
     * Inserts row. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    insertOne(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value, connection } = params;
            let query = index_1.knex()(this.tableName).insert(value);
            logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, value);
            const result = yield query.connection(connection);
            // seems to return 0 for non-auto-increment inserts
            return result[0];
        });
    }
    /**
     * Type-safe multi insert function
     * Inserts all rows. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    insertMany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { values, connection } = params;
            if (values.length < 1)
                return null;
            let query = index_1.knex()(this.tableName).insert(values);
            logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, values);
            const result = yield query.connection(connection);
            // seems to return 0 for non-auto-increment inserts
            return result[0];
        });
    }
    /**
     * Type-safe soft delete function
     * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      softDeleteByConditions(conn, 'users', { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET deleted = true WHERE user_id = 3 AND email = 'steve'
     * @param params
     */
    softDelete(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { where, connection } = params;
            if (!this.hasSoftDelete())
                throw new Error(`Cannot soft delete for table: ${this.tableName}`);
            if (Object.keys(where).length < 1)
                throw new Error('Must have at least one where condition');
            const query = index_1.knex()(this.tableName)
                .where(where)
                .update({ [this.softDeleteColumnString]: true })
                .connection(connection);
            logging_1.default.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where);
            return query;
        });
    }
    /**
     * Type-safe update function
     * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
     */
    update(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { values, connection, where } = params;
            if (Object.keys(values).length < 1)
                throw new Error('Must have at least one updated column');
            if (Object.keys(where).length < 1)
                throw new Error('Must have at least one where condition');
            const query = index_1.knex()(this.tableName).where(where).update(values).connection(connection);
            logging_1.default.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where, values);
            return query;
        });
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map