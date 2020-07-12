import { DBTables } from '../Gen';
import { PoolConnection } from 'promise-mysql';
import { knex } from '../index';

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
export async function softDeleteByConditions<Tbl extends keyof DBTables, Condition extends Partial<DBTables[Tbl]>>(
    connection: PoolConnection,
    table: Tbl,
    conditions: Condition,
) {
    if (Object.keys(conditions).length < 1) throw new Error('Must have at least one where condition');

    const query = knex()(table)
        .where(conditions)
        .update({ [SOFT_DELETE_COLUMN]: true })
        .connection(connection);

    _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions);

    return query;
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

    const query = knex()(table).where(conditions).update(values).connection(connection);

    _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions, values);

    return query;
}
