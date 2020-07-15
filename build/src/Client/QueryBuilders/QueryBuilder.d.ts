import { PoolConnection } from 'promise-mysql';
export declare abstract class QueryBuilder<TblRow, TblColumn extends string, TblKey extends string | number, PartialTblRow = Partial<TblRow>> {
    private tableName;
    private softDeleteColumn?;
    protected constructor(tableName: string, softDeleteColumn: string);
    private hasSoftDelete;
    private get softDeleteColumnString();
    /**
     * Bulk loader function
     * Types arguments against the table schema for safety
     * Loads one row per input key
     * Ensures order is preserved
     * For example get users [1, 2, 4] returns users [1, 2, 4]
     * @param params
     */
    byColumnLoader(params: {
        column: TblColumn;
        keys: readonly TblKey[];
    }): Promise<(TblRow | null)[]>;
    /**
     * Bulk loader function
     * Uses table schema for typing
     * Loads multiple rows per input key
     * Ensures order is preserved
     * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
     * @param params
     */
    manyByColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
        column: TblColumn;
        keys: readonly TblKey[];
        orderBy: TblColumn[];
        filterSoftDelete?: boolean;
    }): Promise<TblRow[][]>;
    /**
     * Complex find rows from a table
     * @param params
     *      * // TODO:-
     *              - cursor pagination,
     *              - ordering - multiple directions and columns?, remove string constants?
     *              - Joins (join filtering), eager load?
     *              type defs
     *               - gen more comprehensive types for each table i.e. SelectionSet
     *                  - Split the type outputs by table maybe? Alias to more usable names
     */
    findMany(params: {
        orderBy?: {
            columns: TblColumn[];
            asc?: boolean;
            desc?: boolean;
        };
        where?: PartialTblRow;
        includeDeleted?: boolean;
    }): Promise<TblRow[]>;
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
    upsert(params: {
        connection?: PoolConnection;
        values: PartialTblRow[];
        reinstateSoftDeletedRows: boolean;
        updateColumns: TblColumn[];
    }): Promise<number | null>;
    /**
     * Type-safe insert function
     * Inserts row. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    insertOne(params: {
        connection?: PoolConnection;
        value: PartialTblRow;
    }): Promise<number | null>;
    /**
     * Type-safe multi insert function
     * Inserts all rows. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    insertMany(params: {
        connection?: PoolConnection;
        values: PartialTblRow[];
    }): Promise<number | null>;
    /**
     * Type-safe soft delete function
     * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      softDeleteByConditions(conn, 'users', { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET deleted = true WHERE user_id = 3 AND email = 'steve'
     * @param params
     */
    softDelete(params: {
        connection: PoolConnection;
        where: PartialTblRow;
    }): Promise<number>;
    /**
     * Type-safe update function
     * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
     */
    update(params: {
        connection: PoolConnection;
        values: PartialTblRow;
        where: PartialTblRow;
    }): Promise<number>;
}
