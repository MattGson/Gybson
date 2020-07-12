import { DBTables } from '../Gen';
import { PoolConnection } from 'promise-mysql';
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
export declare function softDeleteByConditions<Tbl extends keyof DBTables, Condition extends Partial<DBTables[Tbl]>>(connection: PoolConnection, table: Tbl, conditions: Condition): Promise<number>;
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
export declare function updateByConditions<Tbl extends keyof DBTables, Row extends Partial<DBTables[Tbl]>, Condition extends Partial<DBTables[Tbl]>>(connection: PoolConnection, table: Tbl, values: Row, conditions: Condition): Promise<number>;
