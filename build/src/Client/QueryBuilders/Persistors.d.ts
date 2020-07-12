import { DBTables } from '../Gen';
import { PoolConnection } from 'promise-mysql';
/**
 * Type-safe multi upsert function
 * Inserts all rows. If duplicate key then will update specified columns for that row.
 *     * Pass a constant column (usually primary key) to ignore duplicates without updating any rows.
 * Can automatically remove soft deletes if desired instead of specifying the column and values manually.
 *     * This should be set to false if the table does not support soft deletes
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param connection
 * @param table
 * @param values
 * @param updateColumns
 * @param reinstateSoftDeletedRows, set true to reinstate any soft deleted rows
 */
export declare function upsert<Tbl extends keyof DBTables, Row extends Partial<DBTables[Tbl]>, Column extends Extract<keyof DBTables[Tbl], string>>(connection: PoolConnection, table: Tbl, values: Row[], reinstateSoftDeletedRows: boolean, ...updateColumns: Column[]): Promise<number | null>;
/**
 * Type-safe multi insert function
 * Inserts all rows. Fails on duplicate key error
 *     * use upsert if you wish to ignore duplicate rows
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param connection
 * @param table
 * @param values
 */
export declare function insert<Tbl extends keyof DBTables, Row extends Partial<DBTables[Tbl]>>(connection: PoolConnection, table: Tbl, values: Row[]): Promise<number | null>;
