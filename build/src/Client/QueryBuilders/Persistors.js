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
exports.insert = exports.upsert = void 0;
const index_1 = require("../index");
const logging_1 = __importDefault(require("../lib/logging"));
const SOFT_DELETE_COLUMN = 'deleted';
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
function upsert(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tableName, values, connection, reinstateSoftDeletedRows, updateColumns } = params;
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
        if (reinstateSoftDeletedRows) {
            columnsToUpdate.push(SOFT_DELETE_COLUMN);
            insertRows = insertRows.map((value) => {
                return Object.assign(Object.assign({}, value), { [SOFT_DELETE_COLUMN]: false });
            });
        }
        // Knex Normalizes empty (undefined) keys to DEFAULT on multi-row insert:
        // knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
        // Outputs:
        //    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)
        // Note that we are passing a custom connection:
        //    This connection MUST be added last to work with the duplicateUpdateExtension
        const query = index_1.knex()(tableName)
            .insert(insertRows)
            .onDuplicateUpdate(...columnsToUpdate)
            .connection(connection);
        logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, insertRows);
        // knex seems to return 0 for insertId on upsert?
        return (yield query)[0].insertId;
    });
}
exports.upsert = upsert;
/**
 * Type-safe multi insert function
 * Inserts all rows. Fails on duplicate key error
 *     * use upsert if you wish to ignore duplicate rows
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param params
 */
function insert(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { values, tableName, connection } = params;
        if (values.length < 1)
            return null;
        let query = index_1.knex()(tableName).insert(values);
        logging_1.default.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, values);
        const result = yield query.connection(connection);
        // seems to return 0 for non-auto-increment inserts
        return result[0];
    });
}
exports.insert = insert;
//# sourceMappingURL=Persistors.js.map