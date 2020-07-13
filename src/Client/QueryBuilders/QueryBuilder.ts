import { PoolConnection } from 'promise-mysql';
import { knex } from '../index';
import _logger from '../lib/logging';
import _, { Dictionary } from 'lodash';

// TODO:- auto connection handling

export abstract class QueryBuilder<TblRow, PartialTblRow, TblColumn extends string, TblKey extends string | number> {
    private tableName: string;
    private softDeleteColumn?: string;

    protected constructor(tableName: string, softDeleteColumn: string) {
        this.tableName = tableName;
        this.softDeleteColumn = softDeleteColumn;
    }

    private hasSoftDelete(): boolean {
        return this.softDeleteColumn != null;
    }

    private get softDeleteColumnString(): string {
        return this.softDeleteColumn as string;
    }

    /**
     * Bulk loader function
     * Types arguments against the table schema for safety
     * Loads one row per input key
     * Ensures order is preserved
     * For example get users [1, 2, 4] returns users [1, 2, 4]
     * @param params
     */
    public async byColumnLoader(params: { column: TblColumn; keys: readonly TblKey[] }): Promise<(TblRow | null)[]> {
        const { column, keys } = params;

        let query = knex()(this.tableName).select().whereIn(column, _.uniq(keys));

        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = await query;

        const keyed: Dictionary<TblRow | null> = _.keyBy(rows, column);
        return keys.map((k) => {
            if (keyed[k]) return keyed[k];
            _logger.debug(`Missing row for ${this.tableName}:${column} ${k}`);
            return null;
        });
    }

    /**
     * Bulk loader function
     * Uses table schema for typing
     * Loads multiple rows per input key
     * Ensures order is preserved
     * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
     * @param params
     */
    public async manyByColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
        column: TblColumn;
        keys: readonly TblKey[];
        orderBy: TblColumn[];
        filterSoftDelete?: boolean;
    }): Promise<TblRow[][]> {
        const { column, keys, orderBy, filterSoftDelete } = params;
        let query = knex()(this.tableName).select().whereIn(column, _.uniq(keys));

        if (filterSoftDelete && this.hasSoftDelete()) query.where({ [this.softDeleteColumnString]: false });
        if (orderBy.length < 1) query.orderBy(column, 'asc');
        for (let order of orderBy) query.orderBy(order, 'asc');

        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, keys);
        const rows = await query;

        // map rows back to input keys
        const grouped = _.groupBy(rows, column);
        return keys.map((id) => grouped[id] || []);
    }

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
    public async findMany(params: {
        orderBy?: { columns: TblColumn[]; asc?: boolean; desc?: boolean };
        where?: PartialTblRow;
        includeDeleted?: boolean;
    }): Promise<TblRow[]> {
        const { orderBy, where, includeDeleted } = params;
        let query = knex()(this.tableName).select();

        if (where) {
            query.where(where);
        }

        if (orderBy) {
            const { asc, desc, columns } = orderBy;
            let direction = 'asc';
            if (desc && !asc) direction = 'desc';
            for (let order of columns) query.orderBy(order, direction);
        }

        if (!includeDeleted && this.hasSoftDelete()) query.where({ [this.softDeleteColumnString]: false });

        _logger.debug('Executing SQL: %j', query.toSQL().sql);
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
     * @param params
     */
    public async upsert(params: {
        connection?: PoolConnection;
        values: PartialTblRow[];
        reinstateSoftDeletedRows: boolean;
        updateColumns: TblColumn[];
    }): Promise<number | null> {
        const { values, connection, reinstateSoftDeletedRows, updateColumns } = params;

        let insertRows = values;
        if (insertRows.length < 1) {
            _logger.warn('Persistors.upsert: No values passed.');
            return null;
        }
        if (updateColumns.length < 1 && !reinstateSoftDeletedRows) {
            _logger.warn('Persistor.upsert: No reinstateSoftDelete nor updateColumns. Use insert.');
            return null;
        }

        const columnsToUpdate: string[] = updateColumns;
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
            .onDuplicateUpdate(...columnsToUpdate)
            .connection(connection);

        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, insertRows);

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

        let query = knex()(this.tableName).insert(values);

        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, values);
        const result = await query.connection(connection);

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
    public async softDelete(params: { connection: PoolConnection; conditions: PartialTblRow }) {
        const { conditions, connection } = params;
        if (!this.hasSoftDelete()) throw new Error(`Cannot soft delete for table: ${this.tableName}`);
        if (Object.keys(conditions).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName)
            .where(conditions)
            .update({ [this.softDeleteColumnString]: true })
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
     */
    public async update(params: { connection: PoolConnection; values: TblRow; conditions: PartialTblRow }) {
        const { values, connection, conditions } = params;
        if (Object.keys(values).length < 1) throw new Error('Must have at least one updated column');
        if (Object.keys(conditions).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName).where(conditions).update(values).connection(connection);

        _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, conditions, values);

        return query;
    }
}
