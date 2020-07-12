import { DBTables } from './Types';
import { PoolConnection } from 'promise-mysql';
import { knex } from '../db';

const SOFT_DELETE_COLUMN = 'deleted';

/**
 * Type-safe multi soft delete function
 * Updates all rows to be soft deleted matching a column filter i.e. WHERE column IN (keys).
 * @param connection
 * @param table
 * @param column
 * @param keys
 */
export async function softDeleteByColumn<
    Tbl extends keyof DBTables,
    Column extends Extract<keyof DBTables[Tbl], string>,
    KeyType extends Extract<DBTables[Tbl][Column], string | number>
>(connection: PoolConnection, table: Tbl, column: Column, keys: readonly KeyType[]): Promise<number | null> {
    if (keys.length < 1) return null;

    const query = knex(table)
        .whereIn(column, keys)
        .update({
            [SOFT_DELETE_COLUMN]: true,
        })
        .connection(connection);

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
    return query.connection(connection);
}

/**
 * Type-safe multi update function
 * Updates all rows matching a column filter i.e. WHERE column IN (keys).
 * @param connection
 * @param table
 * @param values
 * @param columns
 * @param keys
 */
export async function multiUpdateByColumn<
    Tbl extends keyof DBTables,
    Row extends Partial<DBTables[Tbl]>,
    Column extends Extract<keyof DBTables[Tbl], string>,
    KeyType extends Extract<DBTables[Tbl][Column], string | number>
>(
    connection: PoolConnection,
    table: Tbl,
    values: Row,
    column: Column,
    keys: readonly KeyType[],
): Promise<number | null> {
    if (keys.length < 1 || !values) return null;

    return knex(table)
        .whereIn(column, keys)
        .update(values)
        .connection(connection);
}

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
export async function updateByConditions<
    Tbl extends keyof DBTables,
    Row extends Partial<DBTables[Tbl]>,
    Condition extends Partial<DBTables[Tbl]>
>(connection: PoolConnection, table: Tbl, values: Row, conditions: Condition) {
    if (Object.keys(values).length < 1) throw new Error('Must have at least one updated column');
    if (Object.keys(conditions).length < 1) throw new Error('Must have at least one where condition');

    const query = knex(table)
        .where(conditions)
        .update(values)
        .connection(connection);

    _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions, values);

    return query;
}
