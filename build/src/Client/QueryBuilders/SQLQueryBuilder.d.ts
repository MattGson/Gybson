import { PoolConnection } from 'promise-mysql';
import { OrderByBase, WhereBase } from '../index';
export declare abstract class SQLQueryBuilder<TblRow, TblColumn extends string, TblColumnMap, TblWhere extends WhereBase, TblOrderBy extends OrderByBase, PartialTblRow = Partial<TblRow>> {
    private tableName;
    private softDeleteColumn?;
    protected constructor(tableName: string, softDeleteColumn?: string);
    private hasSoftDelete;
    private get softDeleteColumnString();
    /** // TODO:- make order optional?
     * Load multiple rows for each input compound key
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected manyByCompoundColumnLoader(params: {
        keys: readonly PartialTblRow[];
        includeSoftDeleted?: boolean;
        orderBy?: TblOrderBy;
    }): Promise<TblRow[][]>;
    /**
     * Load a single row for each input compound key
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected byCompoundColumnLoader(params: {
        keys: readonly PartialTblRow[];
    }): Promise<(TblRow | null)[]>;
    /**
     * Resolve a where clause
     * @param params
     */
    private resolveWhereClause;
    /**
     * Complex find rows from a table
     * @param params
     *      * // TODO:-
     *              - cursor pagination,
     *              - Joins (join filtering (every - left join, some - inner join, none - outer join)), eager load?
     *              type defs
     *               - gen more comprehensive types for each table i.e. SelectionSet
     */
    findMany(params: {
        where?: TblWhere;
        first?: number;
        after?: TblColumn;
        orderBy?: TblOrderBy;
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
     * @param params // TODO:- return type
     */
    upsert(params: {
        connection?: PoolConnection;
        values: PartialTblRow[];
        reinstateSoftDeletedRows?: boolean;
        updateColumns: Partial<TblColumnMap>;
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
        connection?: PoolConnection;
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
        connection?: PoolConnection;
        values: PartialTblRow;
        where: TblWhere;
    }): Promise<number>;
}
