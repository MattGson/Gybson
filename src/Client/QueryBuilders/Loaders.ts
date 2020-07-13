import _, { Dictionary } from 'lodash';
import { knex } from '../index';
import _logger from '../lib/logging';

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
export async function byColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
    tableName: string;
    column: TblColumn;
    keys: readonly TblKey[];
    filterSoftDelete: boolean;
}): Promise<(TblRow | null)[]> {
    const { tableName, column, keys, filterSoftDelete } = params;

    let query = knex()(tableName).select().whereIn(column, _.uniq(keys));

    if (filterSoftDelete) query.where({ [SOFT_DELETE_COLUMN]: false });

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query;

    const keyed: Dictionary<TblRow | null> = _.keyBy(rows, column);
    return keys.map((k) => {
        if (keyed[k]) return keyed[k];
        _logger.debug(`Missing row for ${tableName}:${column} ${k}`);
        return null;
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
export async function manyByColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
    tableName: string;
    column: TblColumn;
    keys: readonly TblKey[];
    orderBy: TblColumn[];
    filterSoftDelete?: boolean;
}): Promise<TblRow[][]> {
    const { tableName, column, keys, orderBy, filterSoftDelete } = params;
    let query = knex()(tableName).select().whereIn(column, _.uniq(keys));

    if (filterSoftDelete) query.where({ [SOFT_DELETE_COLUMN]: false });
    if (orderBy.length < 1) query.orderBy(column, 'asc');
    for (let order of orderBy) query.orderBy(order, 'asc');

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query;

    // map rows back to input keys
    const grouped = _.groupBy(rows, column);
    return keys.map((id) => grouped[id] || []);
}

/**
 * Complex find rows from a table
 * @param params
 */
export async function findManyLoader<TblRow, TblColumn extends string, Conditions = Partial<TblRow>>(params: {
    tableName: string;
    options: {
        orderBy?: { columns: TblColumn[]; asc?: boolean; desc?: boolean };
        where?: Conditions;
        includeDeleted?: boolean;
    };
    hasSoftDelete: boolean;
}): Promise<TblRow[]> {
    const { tableName, options, hasSoftDelete } = params;
    const { orderBy, where, includeDeleted } = options;
    let query = knex()(tableName).select();

    if (where) {
        query.where(where);
    }

    if (orderBy) {
        const { asc, desc, columns } = orderBy;
        let direction = 'asc';
        if (desc && !asc) direction = 'desc';
        for (let order of columns) query.orderBy(order, direction);
    }

    if (hasSoftDelete) {
        if (!includeDeleted) query.where({ [SOFT_DELETE_COLUMN]: false });
    }

    _logger.debug('Executing SQL: %j', query.toSQL().sql);
    return query;
}
