import { PoolConnection } from 'promise-mysql';
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
export declare function upsert<TblRow, TblColumn extends string>(params: {
    connection: PoolConnection;
    tableName: string;
    values: Partial<TblRow>[];
    reinstateSoftDeletedRows: boolean;
    updateColumns: TblColumn[];
}): Promise<number | null>;
/**
 * Type-safe multi insert function
 * Inserts all rows. Fails on duplicate key error
 *     * use upsert if you wish to ignore duplicate rows
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param params
 */
export declare function insert<TblRow>(params: {
    connection: PoolConnection;
    tableName: string;
    values: TblRow[];
}): Promise<number | null>;
