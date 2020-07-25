import { PoolConnection } from 'promise-mysql';
import { knex, OrderByBase, PaginateBase, WhereBase } from '../index';
import { logger } from '../lib/logging';
import _ from 'lodash';
import { WhereResolver } from './WhereResolver';

export interface JoinColumn {
    fromColumn: string;
    toColumn: string;
}

export interface RelationTables {
    [tableName: string]: JoinColumn[];
}

export abstract class SQLQueryBuilder<
    TblRow,
    TblColumnMap,
    TblWhere extends WhereBase,
    TblOrderBy extends OrderByBase,
    TblPaginate extends PaginateBase,
    PartialTblRow = Partial<TblRow>
> {
    private tableName: string;
    private softDeleteColumn?: string;
    private relationTables: RelationTables;

    protected constructor(params: { tableName: string; softDeleteColumn?: string; relations: RelationTables }) {
        this.tableName = params.tableName;
        this.softDeleteColumn = params.softDeleteColumn;
        this.relationTables = params.relations;
    }

    private hasSoftDelete(): boolean {
        return this.softDeleteColumn != null;
    }

    private get softDeleteColumnString(): string {
        return this.softDeleteColumn as string;
    }

    /**
     * Load multiple rows for each input compound key
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected async manyByCompoundColumnLoader(params: {
        keys: readonly PartialTblRow[];
        includeSoftDeleted?: boolean;
        orderBy?: TblOrderBy;
    }): Promise<TblRow[][]> {
        const { keys, includeSoftDeleted, orderBy } = params;

        // get the key columns to load on
        const columns = Object.keys(keys[0]);

        // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [user_id, post_id], [3, 5]
        const loadValues = keys.map<(string | number)[]>((k) => {
            // @ts-ignore
            return columns.map((col) => k[col]);
        });

        // build query
        let query = knex()(this.tableName).select().whereIn(columns, loadValues);
        if (!includeSoftDeleted && this.hasSoftDelete()) query.where({ [this.softDeleteColumnString]: false });

        if (orderBy) {
            for (let [column, direction] of Object.entries(orderBy)) {
                query.orderBy(column, direction);
            }
        }

        logger().debug('SQL executing loading: %s with keys %j', query.toSQL().sql, loadValues);

        const rows = await query;

        // join multiple keys into a unique string to allow mapping to dictionary
        // again map columns to make sure order is preserved
        // @ts-ignore
        const sortKeys = keys.map((k) => columns.map((col) => k[col]).join(':'));

        // map rows back to input keys ensuring order is preserved
        const grouped = _.groupBy(rows, (row) => columns.map((col) => row[col]).join(':'));
        return sortKeys.map((key) => grouped[key] || []);
    }

    /**
     * Load a single row for each input compound key
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected async byCompoundColumnLoader(params: { keys: readonly PartialTblRow[] }): Promise<(TblRow | null)[]> {
        const { keys } = params;

        // get the key columns to load on
        const columns = Object.keys(keys[0]);

        // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [user_id, post_id], [3, 5]
        const loadValues = keys.map<(string | number)[]>((k) => {
            // @ts-ignore
            return columns.map((col) => k[col]);
        });

        let query = knex()(this.tableName).select().whereIn(columns, loadValues);

        logger().debug('SQL executing loading: %s with keys %j', query.toSQL().sql, loadValues);

        const rows = await query;

        // join multiple keys into a unique string to allow mapping to dictionary
        // again map columns to make sure order is preserved
        // @ts-ignore
        const sortKeys = keys.map((k) => columns.map((col) => k[col]).join(':'));
        // map rows to dictionary against the same key strings - again preserving key order
        const keyed = _.keyBy(rows, (row) => columns.map((col) => row[col]).join(':'));

        // map rows back to key order
        return sortKeys.map((k) => {
            if (keyed[k]) return keyed[k];
            logger().debug(`Missing row for ${this.tableName}, columns: ${columns.join(':')}, key: ${k}`);
            return null;
        });
    }

    /**
     * Complex find rows from a table
     * @param params
     *      * // TODO:-
     *              - cursor pagination,
     *              - Joins (join filtering (every - left join, some - inner join, none - outer join)), eager load?
     *
     */
    public async findMany(params: {
        where?: TblWhere;
        limit?: number;
        paginate?: TblPaginate;
        orderBy?: TblOrderBy;
        includeDeleted?: boolean;
    }): Promise<TblRow[]> {
        const { orderBy, paginate, where, includeDeleted } = params;
        let query = knex()(this.tableName).select();

        if (where) {
            WhereResolver.resolveWhereClause({ where, queryBuilder: query, relations: this.relationTables });
        }

        if (orderBy) {
            for (let [column, direction] of Object.entries(orderBy)) {
                query.orderBy(column, direction);
            }
        }

        if (paginate) {
            const { limit, afterCursor, afterCount } = paginate;

            if (limit) query.limit(limit);
            if (afterCount) query.offset(afterCount);
            if (afterCursor) {
                Object.entries(afterCursor).forEach(([column, value]) => {
                    query.where(column, '>', value);
                });
            }
        }

        if (paginate && paginate.afterCursor && orderBy) {
            for (let key of Object.keys(paginate.afterCursor)) {
                if (!orderBy[key])
                    logger().warn(
                        'You are ordering by different keys to your cursor. This may lead to unexpected results',
                    );
            }
        }

        if (!includeDeleted && this.hasSoftDelete()) query.where({ [this.softDeleteColumnString]: false });

        logger().debug('Executing SQL: %j', query.toSQL().sql);
        return query;
    }
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
    public async upsert(params: {
        connection?: PoolConnection;
        values: PartialTblRow[];
        reinstateSoftDeletedRows?: boolean;
        updateColumns: Partial<TblColumnMap>;
    }): Promise<number | null> {
        const { values, connection, reinstateSoftDeletedRows, updateColumns } = params;

        const columnsToUpdate: string[] = [];
        for (let [column, update] of Object.entries(updateColumns)) {
            if (update) columnsToUpdate.push(column);
        }

        let insertRows = values;
        if (insertRows.length < 1) {
            logger().warn('Persistors.upsert: No values passed.');
            return null;
        }
        if (columnsToUpdate.length < 1 && !reinstateSoftDeletedRows) {
            logger().warn('Persistor.upsert: No reinstateSoftDelete nor updateColumns. Use insert.');
            return null;
        }

        // add deleted column to all records
        if (reinstateSoftDeletedRows && this.hasSoftDelete()) {
            columnsToUpdate.push(this.softDeleteColumnString);
            insertRows = insertRows.map((value) => {
                return {
                    ...value,
                    [this.softDeleteColumnString]: false,
                };
            });
        }

        // Knex Normalizes empty (undefined) keys to DEFAULT on multi-row insert:
        // knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
        // Outputs:
        //    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)
        // Note that we are passing a custom connection:
        //    This connection MUST be added last to work with the duplicateUpdateExtension
        const query = knex()(this.tableName)
            .insert(insertRows)
            .onDuplicateUpdate(...columnsToUpdate);

        if (connection) query.connection(connection);

        logger().debug('Executing SQL: %j with keys: %j', query.toSQL().sql, insertRows);

        // knex seems to return 0 for insertId on upsert?
        return (await query)[0].insertId;
    }

    /**
     * Type-safe multi insert function
     * Inserts all rows. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    public async insert(params: { connection?: PoolConnection; values: PartialTblRow[] }): Promise<number | null> {
        const { values, connection } = params;
        if (values.length < 1) return null;

        // TODO:- add returning() to support postgres
        let query = knex()(this.tableName).insert(values);
        if (connection) query.connection(connection);

        logger().debug('Executing SQL: %j with keys: %j', query.toSQL().sql, values);
        const result = await query;

        // seems to return 0 for non-auto-increment inserts
        return result[0];
    }

    /**
     * Type-safe soft delete function
     * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      softDeleteByConditions(conn, 'users', { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET deleted = true WHERE user_id = 3 AND email = 'steve'
     * @param params
     */
    public async softDelete(params: { connection?: PoolConnection; where: TblWhere }) {
        const { where, connection } = params;
        if (!this.hasSoftDelete()) throw new Error(`Cannot soft delete for table: ${this.tableName}`);
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName).update({ [this.softDeleteColumnString]: true });

        WhereResolver.resolveWhereClause({ queryBuilder: query, where, relations: this.relationTables });

        if (connection) query.connection(connection);

        logger().debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where);

        return query;
    }

    /**
     * Type-safe update function
     * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
     */
    public async update(params: { connection?: PoolConnection; values: PartialTblRow; where: TblWhere }) {
        const { values, connection, where } = params;
        if (Object.keys(values).length < 1) throw new Error('Must have at least one updated column');
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName).update(values);
        WhereResolver.resolveWhereClause({ queryBuilder: query, where, relations: this.relationTables });
        if (connection) query.connection(connection);

        logger().debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where, values);

        return query;
    }
}
