import Knex, { Transaction } from 'knex';
import _ from 'lodash';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { ColumnDefinition, Comparable, DatabaseSchema } from 'relational-schema';
import winston from 'winston';
import { ClientEngine, OrderBy, Paginate } from '../../types';
import { Loader, OrderQueryFilter, runMiddleWares, SoftDeleteQueryFilter } from '../index';
import { WhereResolver } from './where-resolver';

type Connection = PGConn | MySQLConn;

export abstract class QueryClient<
    TblRow extends object,
    TblColumnMap,
    TblWhere,
    TblUniqueWhere,
    TblNonUniqueWhere,
    TblOrderBy extends OrderBy,
    TblPaginate extends Paginate,
    RequiredTblRow,
    PartialTblRow = Partial<TblRow>,
> {
    private readonly tableName: string;
    private readonly tableAlias: string;
    private readonly schema: DatabaseSchema;
    private readonly knex: Knex<any, unknown>;
    private readonly logger: winston.Logger;
    private readonly engine: ClientEngine;

    protected loader = new Loader<TblRow>({
        getMultis: (args) => this.stableGetMany(args),
        getOnes: (args) => this.stableGetSingles(args),
    });

    protected constructor(params: {
        tableName: string;
        schema: DatabaseSchema;
        knex: Knex<any, unknown>;
        logger: winston.Logger;
        engine: ClientEngine;
    }) {
        const { tableName, schema, knex, logger, engine } = params;
        this.engine = engine;
        this.knex = knex;
        this.logger = logger;
        this.tableName = tableName;
        this.schema = schema;
        this.tableAlias = `${this.tableName}_q_root`;
    }

    private get primaryKey(): string[] {
        return this.schema.tables[this.tableName].primaryKey?.columnNames || [];
    }

    private get aliasedTable(): string {
        return `${this.tableName} as ${this.tableAlias}`;
    }

    private aliasedColumn(column: string) {
        return `${this.tableAlias}.${column}`;
    }

    private get softDeleteColumn(): ColumnDefinition | null {
        return this.schema.tables[this.tableName].softDelete;
    }

    private get hasSoftDelete(): boolean {
        return this.softDeleteColumn != null;
    }

    private get aliasedSoftDeleteColumn(): string | null {
        const column = this.softDeleteColumn;
        if (!column) return null;
        return `${this.aliasedColumn(column.columnName)}`;
    }

    private softDeleteFilter(alias: boolean = false): Record<string, Date | boolean | null> {
        const colAlias = this.aliasedSoftDeleteColumn;
        const column = this.softDeleteColumn;
        if (!colAlias || !column) return {};

        let colName = alias ? colAlias : column.columnName;
        const type = column?.tsType;
        if (type === Comparable.Date) return { [colName]: null };
        if (type === Comparable.boolean) return { [colName]: false };
        return {};
    }

    /**
     * un-nest filters i.e. team_id__user_id: { ... } -> team_id: ..., user_id: ...,
     * @param where
     */
    private unNestFilters(where: TblUniqueWhere | TblNonUniqueWhere) {
        const filter: any = {};
        Object.entries(where).map(([k, v]) => {
            if (v instanceof Object) Object.assign(filter, v);
            else filter[k] = v;
        });
        return filter;
    }

    /**
     * Clear cache
     */
    public async purge(): Promise<void> {
        await this.loader.purge();
    }

    /**
     * Batch load a single-row
     * @param params
     */
    public async loadOne(params: { where: TblUniqueWhere } & SoftDeleteQueryFilter): Promise<TblRow | null> {
        const { where, ...options } = params;

        const filter = this.unNestFilters(where);
        const row = await this.loader.loadOne({ filter });

        // TODO:- why can't soft delete filter run at DB layer? Can just add `includeDeleted` to filterHash like orderBy ?
        const [result] = runMiddleWares([row], options);
        return result || null;
    }

    /**
     * Batch load many-rows
     * @param params
     */
    public async loadMany(
        params: { where: TblNonUniqueWhere } & SoftDeleteQueryFilter & OrderQueryFilter,
    ): Promise<TblRow[]> {
        const { where, orderBy, ...options } = params;

        const filter = this.unNestFilters(where);
        const rows = await this.loader.loadMany({ filter, orderBy });

        const result = runMiddleWares(rows, options);
        return result || null;
    }

    /**
     * Load multiple rows for each input compound key (stable ordering)
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected async stableGetMany(params: {
        keys: readonly PartialTblRow[];
        orderBy?: TblOrderBy;
    }): Promise<TblRow[][]> {
        const { keys, orderBy } = params;

        // get the key columns to load on
        const columns = Object.keys(keys[0]);

        // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [3, 5]
        const loadValues = keys.map<(string | number)[]>((k) => {
            // @ts-ignore - k[col] typing
            return columns.map((col) => k[col]);
        });

        // build query
        let query = this.knex(this.tableName).select().whereIn(columns, loadValues);

        if (orderBy) {
            for (let [column, direction] of Object.entries(orderBy)) {
                query.orderBy(column, direction);
            }
        }

        this.logger.debug('Executing loading: %s with keys %j', query.toSQL().sql, loadValues);

        const rows = await query;

        // join multiple keys into a unique string to allow mapping to dictionary
        // again map columns to make sure order is preserved
        // @ts-ignore
        const sortKeys = keys.map((k) =>
            columns
                // @ts-ignore
                .map((col) => k[col])
                .join(':')
                .toLowerCase(),
        );

        // map rows back to input keys to ensure order is preserved as required by data-loader
        const grouped = _.groupBy(rows, (row) =>
            columns
                .map((col) => row[col])
                .join(':')
                .toLowerCase(),
        );
        return sortKeys.map((key) => grouped[key] || []);
    }

    /**
     * Load a single row for each input compound key (stable ordering)
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    protected async stableGetSingles(params: { keys: readonly PartialTblRow[] }): Promise<(TblRow | null)[]> {
        const { keys } = params;

        // get the key columns to load on
        const columns = Object.keys(keys[0]);

        // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [3, 5]
        const loadValues = keys.map<(string | number)[]>((k) => {
            // @ts-ignore
            return columns.map((col) => k[col]);
        });

        let query = this.knex(this.tableName).select().whereIn(columns, loadValues);

        this.logger.debug('Executing single load: %s with keys %j', query.toSQL().sql, loadValues);

        const rows = await query;

        // join multiple keys into a unique string to allow mapping to dictionary
        // again map columns to make sure order is preserved
        const sortKeys = keys.map((k) =>
            columns
                // @ts-ignore
                .map((col) => k[col])
                .join(':')
                .toLowerCase(),
        );
        // map rows to dictionary against the same key strings - again preserving key column order
        // -> Notice that keys are compared case-insensitive
        const keyed = _.keyBy(rows, (row) =>
            columns
                .map((col) => row[col])
                .join(':')
                .toLowerCase(),
        );

        // map rows back to key order
        return sortKeys.map((k) => {
            if (keyed[k]) return keyed[k];
            this.logger.debug(`Missing row for ${this.tableName}, columns: ${columns.join(':')}, key: ${k}`);
            return null;
        });
    }

    /**
     * Find rows from a table
     * Supports filtering, ordering, pagination
     * @param params
     */
    public async findMany(params: {
        connection?: Connection;
        where?: TblWhere;
        paginate?: TblPaginate;
        orderBy?: TblOrderBy;
        includeDeleted?: boolean;
    }): Promise<TblRow[]> {
        const { orderBy, paginate, where, includeDeleted, connection } = params;
        let query = this.knex(this.aliasedTable).select(`${this.tableAlias}.*`);

        if (where) {
            WhereResolver.resolveWhereClause({
                where,
                queryBuilder: query,
                schema: this.schema,
                tableName: this.tableName,
                tableAlias: this.tableAlias,
            });
        }

        if (!includeDeleted && this.hasSoftDelete) query.where(this.softDeleteFilter(true));

        if (orderBy) {
            for (let [column, direction] of Object.entries(orderBy)) {
                query.orderBy(this.aliasedColumn(column), direction);
            }
        }

        if (paginate) {
            const { limit, afterCursor, beforeCursor, offset } = paginate;

            if (limit) query.limit(limit);
            if (offset) query.offset(offset);
            if (afterCursor) {
                Object.entries(afterCursor).forEach(([column, value]) => {
                    query.where(this.aliasedColumn(column), '>', value);
                });
            }
            if (beforeCursor) {
                Object.entries(beforeCursor).forEach(([column, value]) => {
                    query.where(this.aliasedColumn(column), '<', value);
                });
            }
        }

        if (paginate && paginate.afterCursor && orderBy) {
            for (let key of Object.keys(paginate.afterCursor)) {
                if (!orderBy[key])
                    this.logger.warn(
                        'You are ordering by different keys to your cursor. This may lead to unexpected results',
                    );
            }
        }
        if (connection) query.connection(connection);

        this.logger.debug('Executing findMany: %s', query.toSQL().sql);
        return query;
    }
    /**
     * Upsert function
     * Inserts all rows. If duplicate key then will update specified columns for that row.
     *     * Pass a constant column (usually primary key) to ignore duplicates without updating any rows.
     * Can automatically remove soft deletes if desired instead of specifying the column and values manually.
     *     * This should be set to false if the table does not support soft deletes
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    public async upsert(params: {
        transact?: Transaction;
        connection?: Connection;
        values: RequiredTblRow | RequiredTblRow[];
        reinstateSoftDeletedRows?: boolean;
        updateColumns: Partial<TblColumnMap>;
    }): Promise<number> {
        const { values, transact, connection, reinstateSoftDeletedRows, updateColumns } = params;

        const columnsToUpdate: string[] = [];
        for (let [column, update] of Object.entries(updateColumns)) {
            if (update) columnsToUpdate.push(column);
        }

        let insertRows: RequiredTblRow[];
        if (Array.isArray(values)) insertRows = values;
        else insertRows = [values];

        if (insertRows.length < 1) {
            throw new Error('Upsert: No values passed.');
        }
        if (columnsToUpdate.length < 1 && !reinstateSoftDeletedRows) {
            throw new Error('Upsert: No reinstateSoftDelete nor updateColumns. Use insert.');
        }

        // add deleted column to all records
        if (reinstateSoftDeletedRows && this.softDeleteColumn) {
            columnsToUpdate.push(this.softDeleteColumn.columnName);
            insertRows = insertRows.map((value) => {
                return {
                    ...value,
                    // set soft delete value back to default
                    ...this.softDeleteFilter(false),
                };
            });
        }

        // Knex Normalizes empty (undefined) keys to DEFAULT on multi-row insert:
        // knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
        // Outputs:
        //    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)
        // Note that we are passing a custom connection:
        //    This connection MUST be added last to work with the duplicateUpdate Extensions

        // TODO:- onConflict only works on the primary key of the table (MySQL behvaiour, PG limitation)

        const query = this.knex(this.tableName).insert(insertRows).onConflict(this.primaryKey).merge(columnsToUpdate);

        if (connection) query.connection(connection);
        if (transact) query.transacting(transact);

        this.logger.debug('Executing upsert: %s with values: %j', query.toSQL().sql, insertRows);
        const result: any = await query;

        if (this.engine == 'pg') return Object.values(result.rows[0])[0] as number;
        return result[0].insertId;
    }

    /**
     * Insert function
     * Inserts all rows. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    public async insert(params: {
        transact?: Transaction;
        connection?: Connection;
        values: RequiredTblRow | RequiredTblRow[];
        ignoreDuplicates?: boolean;
    }): Promise<number> {
        const { values, transact, connection, ignoreDuplicates } = params;

        let insertRows: RequiredTblRow[];
        if (Array.isArray(values)) insertRows = values;
        else insertRows = [values];

        if (insertRows.length < 1) {
            throw new Error('Insert: No values passed.');
        }

        const query = this.knex(this.tableName).insert(values);
        if (ignoreDuplicates) query.onConflict(this.primaryKey).ignore();

        if (this.engine === 'pg') query.returning(this.primaryKey);
        if (connection) query.connection(connection);
        if (transact) query.transacting(transact);

        this.logger.debug('Executing insert: %s with values: %j', query.toSQL().sql, values);
        const result = await query;
        // seems to return 0 for non-auto-increment inserts

        if (this.engine === 'pg') return Object.values(result[0])[0] as number;
        return result[0];
    }

    /**
     * Soft delete
     * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * @param params
     */
    public async softDelete(params: { transact?: Transaction; connection?: Connection; where: TblWhere }) {
        const { where, transact, connection } = params;
        if (!this.hasSoftDelete) throw new Error(`Cannot soft delete for table: ${this.tableName}`);
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = this.knex(this.aliasedTable);

        // support both soft delete types
        // Note, cannot use alias on update due to PG
        const colAlias = this.softDeleteColumn!.columnName;
        const type = this.softDeleteColumn?.tsType;
        if (type === Comparable.Date) query.update({ [colAlias]: new Date() });
        if (type === Comparable.boolean) query.update({ [colAlias]: true });

        WhereResolver.resolveWhereClause({
            queryBuilder: query,
            where,
            schema: this.schema,
            tableName: this.tableName,
            tableAlias: this.tableAlias,
        });

        if (transact) query.transacting(transact);
        if (connection) query.connection(connection);

        this.logger.debug('Executing soft delete: %s', query.toSQL().sql);

        return query;
    }

    /**
     * Delete
     * Deletes all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * @param params
     */
    public async delete(params: { transact?: Transaction; connection?: Connection; where: TblWhere }) {
        const { where, transact, connection } = params;
        if (this.hasSoftDelete)
            this.logger.warn(`Running delete for table: "${this.tableName}" which has a soft delete column`);
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = this.knex(this.tableName).del();

        // Note - can't use an alias with delete statement in knex
        WhereResolver.resolveWhereClause({
            queryBuilder: query,
            where,
            schema: this.schema,
            tableName: this.tableName,
            tableAlias: this.tableName,
        });
        if (connection) query.connection(connection);
        if (transact) query.transacting(transact);

        this.logger.debug('Executing delete: %s', query.toSQL().sql);

        return query;
    }

    /**
     * Update
     * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     */
    public async update(params: {
        transact?: Transaction;
        connection?: Connection;
        values: PartialTblRow;
        where: TblWhere;
    }) {
        const { values, transact, connection, where } = params;
        if (Object.keys(values).length < 1) throw new Error('Must update least one column');
        if (Object.keys(where).length < 1) this.logger.warn('Running update without a where clause');

        // @ts-ignore - PartialTblRow extends object
        // Note cannot use col aliases as PG does not support on update

        const query = this.knex(this.aliasedTable).update(values);
        if (where) {
            WhereResolver.resolveWhereClause({
                queryBuilder: query,
                where,
                schema: this.schema,
                tableName: this.tableName,
                tableAlias: this.tableAlias,
            });
        }
        if (connection) query.connection(connection);
        if (transact) query.transacting(transact);

        this.logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where, values);

        return query;
    }
}
