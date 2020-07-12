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
exports.updateByConditions = exports.softDeleteByConditions = void 0;
const index_1 = require("../index");
const logging_1 = __importDefault(require("../lib/logging"));
const SOFT_DELETE_COLUMN = 'deleted';
/**
 * Type-safe soft delete function
 * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
 * Usage:
 *      softDeleteByConditions(conn, 'users', { user_id: 3, email: 'steve' }
 *      -> UPDATE users SET deleted = true WHERE user_id = 3 AND email = 'steve'
 * @param connection
 * @param table
 * @param conditions
 */
function softDeleteByConditions(connection, table, conditions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Object.keys(conditions).length < 1)
            throw new Error('Must have at least one where condition');
        const query = index_1.knex()(table)
            .where(conditions)
            .update({ [SOFT_DELETE_COLUMN]: true })
            .connection(connection);
        logging_1.default.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions);
        return query;
    });
}
exports.softDeleteByConditions = softDeleteByConditions;
/**
 * Type-safe update function
 * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
 * Usage:
 *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
 *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
 * @param connection
 * @param table
 * @param values
 * @param conditions
 */
function updateByConditions(connection, table, values, conditions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Object.keys(values).length < 1)
            throw new Error('Must have at least one updated column');
        if (Object.keys(conditions).length < 1)
            throw new Error('Must have at least one where condition');
        const query = index_1.knex()(table).where(conditions).update(values).connection(connection);
        logging_1.default.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions, values);
        return query;
    });
}
exports.updateByConditions = updateByConditions;
//# sourceMappingURL=Updaters.js.map