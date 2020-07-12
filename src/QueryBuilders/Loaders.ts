import _, { Dictionary } from 'lodash';
import { poolConnection } from '../transaction';
import { DBTables } from './Types';
import { knex } from '../db';
import { QueryBuilder } from 'knex';

const SOFT_DELETE_COLUMN = 'deleted';

/**
 * Basic sql validation for loader requirements
 * Does not guarantee sql is correct
 * @param query
 * @param many - loading many rows for a key?
 */
const validateQuery = (query: QueryBuilder, many: boolean): void => {
    const sql = query.toSQL().sql.toLowerCase();
    _logger.debug('validating sql %j', sql);
    if (!sql.includes('select')) throw new Error('Invalid SQL. Loaders must use `SELECT` clause');
    if (!sql.includes(' in (?')) throw new Error('Invalid SQL. Loaders must use `IN` directive');
    if (many && !sql.includes('order by'))
        throw new Error('Invalid SQL. Multi-row loaders must use `ORDER BY` directive to ensure deterministic order');
};

/**
 * Execute a by column loader with custom SQL
 * Loads a single row per input key
 * maps rows back to input keys
 * Should only use this when necessary - prefer byColumnLoader as it is type safe against db schema
 * @param query - knex query
 * @param keyColumn - column to key by - should match keys
 * @param keys - list of keys to load
 */
export async function customByColumnLoader<RowType>(
    query: QueryBuilder,
    keyColumn: string,
    keys: readonly (number | string)[],
): Promise<(RowType | null)[]> {
    validateQuery(query, false);

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query.connection(poolConnection());

    // map rows back to input keys
    const keyed = _.keyBy(rows, keyColumn);
    return keys.map(k => {
        if (keyed[k]) return keyed[k];
        _logger.debug(`Missing row for ${keyColumn} ${k}`);
        return null;
    });
}

/**
 * Execute a many by column loader with custom SQL
 * Loads multiple rows per input key
 * maps rows back to input keys
 * Should only use this when necessary - prefer manyByColumnLoader as it is type safe against db schema
 * @param query - knex query
 * @param keyColumn - column to key by - should match keys
 * @param keys - list of keys to load
 */
export async function customManyByColumnLoader<RowType>(
    query: QueryBuilder,
    keyColumn: string,
    keys: readonly (number | string)[],
): Promise<RowType[][]> {
    validateQuery(query, true);

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query.connection(poolConnection());

    // map rows back to input keys
    const grouped = _.groupBy(rows, keyColumn);
    return keys.map(id => grouped[id] || []);
}

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
export async function byColumnLoader<
    Tbl extends keyof DBTables,
    Column extends Extract<keyof DBTables[Tbl], string>,
    KeyType extends Extract<DBTables[Tbl][Column], string | number>
>(table: Tbl, column: Column, keys: readonly KeyType[], filterSoftDelete: boolean): Promise<(DBTables[Tbl] | null)[]> {
    let query = knex(table)
        .select()
        .whereIn(column, _.uniq(keys))
        .connection(poolConnection());

    if (filterSoftDelete) query.where({ [SOFT_DELETE_COLUMN]: false });

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query;

    const keyed: Dictionary<DBTables[Tbl] | null> = _.keyBy(rows, column);
    return keys.map(k => {
        if (keyed[k]) return keyed[k];
        _logger.debug(`Missing row for ${table}:${column} ${k}`);
        return null;
    });
}
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
export async function manyByColumnLoader<
    Tbl extends keyof DBTables,
    Column extends Extract<keyof DBTables[Tbl], string>,
    KeyType extends Extract<DBTables[Tbl][Column], string | number>
>(
    table: Tbl,
    column: Column,
    keys: readonly KeyType[],
    orderBy: Column[],
    filterSoftDelete?: boolean,
): Promise<DBTables[Tbl][][]> {
    let query = knex(table)
        .select()
        .whereIn(column, _.uniq(keys))
        .connection(poolConnection());

    if (filterSoftDelete) query.where({ [SOFT_DELETE_COLUMN]: false });
    if (orderBy.length < 1) query.orderBy(column, 'asc');
    for (let order of orderBy) query.orderBy(order, 'asc');

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    const rows = await query;

    // map rows back to input keys
    const grouped = _.groupBy(rows, column);
    return keys.map(id => grouped[id] || []);
}

/**
 * Bulk loader function
 * Loads all rows from a table
 * Useful for loading edges and public collections
 * @param table
 * @param orderBy - should specify order by to ensure deterministic pagination etc
 * @param filterSoftDelete
 */
export async function allLoader<Tbl extends keyof DBTables, Column extends Extract<keyof DBTables[Tbl], string>>(
    table: Tbl,
    orderBy: Column[],
    filterSoftDelete: boolean,
): Promise<DBTables[Tbl][]> {
    let query = knex(table)
        .select()
        .connection(poolConnection());
    if (filterSoftDelete) query.where({ [SOFT_DELETE_COLUMN]: false });
    for (let order of orderBy) query.orderBy(order, 'asc');

    _logger.debug('Executing SQL: %j', query.toSQL().sql);
    return query;
}

/**
 * Complex find rows from a table
 * @param table
 * @param options - should specify order by to ensure deterministic pagination etc
 * @param hasSoftDelete
 */
export async function findManyLoader<
    Tbl extends keyof DBTables,
    Column extends Extract<keyof DBTables[Tbl], string>,
    Conditions extends Partial<DBTables[Tbl]>
>(
    table: Tbl,
    options: {
        orderBy?: { columns: Column[]; asc?: boolean; desc?: boolean };
        where?: Conditions;
        includeDeleted?: boolean;
    },
    hasSoftDelete: boolean,
): Promise<DBTables[Tbl][]> {
    const { orderBy, where, includeDeleted } = options;
    let query = knex(table)
        .select()
        .connection(poolConnection());

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
