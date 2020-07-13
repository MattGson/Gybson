import { PoolConnection } from 'promise-mysql';
/**
 * Type-safe soft delete function
 * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
 * Usage:
 *      softDeleteByConditions(conn, 'users', { user_id: 3, email: 'steve' }
 *      -> UPDATE users SET deleted = true WHERE user_id = 3 AND email = 'steve'
 * @param params
 */
export declare function softDeleteByConditions<PartialTblRow>(params: {
    connection: PoolConnection;
    tableName: string;
    conditions: PartialTblRow;
}): Promise<number>;
/**
 * Type-safe update function
 * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
 * Usage:
 *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
 *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
 */
export declare function updateByConditions<TblRow, PartialTblRow>(params: {
    connection: PoolConnection;
    tableName: string;
    values: TblRow;
    conditions: PartialTblRow;
}): Promise<number>;
