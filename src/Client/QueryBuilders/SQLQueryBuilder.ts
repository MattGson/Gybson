import { PoolConnection } from 'promise-mysql';
import { Enumerable, knex, NumberWhere, OrderByBase, WhereBase } from '../index';
import _logger from '../lib/logging';
import _, { Dictionary } from 'lodash';
import { QueryBuilder } from 'knex';

// TODO:- auto connection handling

export abstract class SQLQueryBuilder<
    TblRow,
    TblColumn extends string,
    TblKey extends string | number,
    TblWhere extends WhereBase,
    TblOrderBy extends OrderByBase,
    PartialTblRow = Partial<TblRow>
> {
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
     *              - Joins (join filtering (every - left join, some - inner join, none - outer join)), eager load?
     *              type defs
     *               - gen more comprehensive types for each table i.e. SelectionSet
     *                  - Split the type outputs by table maybe? Alias to more usable names
     */
    public async findMany(params: {
        where?: TblWhere;
        first?: number;
        after?: TblColumn;
        orderBy?: TblOrderBy;
        includeDeleted?: boolean;
    }): Promise<TblRow[]> {
        const { orderBy, where, includeDeleted } = params;
        let query = knex()(this.tableName).select();

        enum operators {
            equals = 'equals',
            not = 'not',
            notIn = 'notIn',
            lt = 'lt',
            lte = 'lte',
            gt = 'gt',
            gte = 'gte',
        }

        const combiners = {
            AND: 'AND',
            OR: 'OR',
            NOT: 'NOT',
        };

        const primitives = {
            string: true,
            number: true,
            bigint: true,
            boolean: true,
            date: true,
        };

        // resolves a single where block like:
        // user_id: {
        //      not_in: [3, 4],
        //      gte: 1
        // }
        // These are the leafs in the recursion
        const buildWhereBlock = (column: string, value: any, builder: QueryBuilder) => {
            const valueType: string = typeof value;
            // @ts-ignore - can't index
            if (primitives[valueType]) {
                // is a primitive so use equals clause
                builder.where(column, value);
            } else if (valueType === 'object') {
                //is an object so need to work out operators
                for (let [operator, val] of Object.entries(value)) {
                    switch (operator) {
                        case operators.equals:
                            //@ts-ignore
                            builder.where(column, val);
                            break;
                        case operators.not:
                            //@ts-ignore
                            builder.whereNot(column, val);
                            break;
                        case operators.notIn:
                            // @ts-ignore
                            builder.whereNotIn(column, val);
                            break;
                        case operators.lt:
                            // @ts-ignore
                            builder.where(column, '<', val);
                            break;
                        case operators.lte:
                            // @ts-ignore
                            builder.where(column, '<=', val);
                            break;
                        case operators.gt:
                            // @ts-ignore
                            builder.where(column, '>', val);
                            break;
                        case operators.gte:
                            // @ts-ignore
                            builder.whereNot(column, '>=', val);
                            break;
                        default:
                            break;
                    }
                }
            }
        };

        //query.where(function() {
        //
        //                 this.where('post_messages.message', 'like', search)
        //                     .orWhere('users.fname', 'like', sargableSearch)
        //                     .orWhere('users.lname', 'like', sargableSearch);
        //             });

        // resolve each where clause
        // can be either a where block or a combiner
        const resolveWhere = (subQuery: any, builder: QueryBuilder) => {
            console.log(subQuery);
            for (let [column, value] of Object.entries(subQuery)) {
                console.log('CLAUSE: ', column, value);

                // @ts-ignore
                if (!combiners[column]) {
                    // resolve leaf node
                    buildWhereBlock(column, value, builder);
                    continue;
                }
                // is a combiner so need to resolve each sub block recursively
                switch (column) {
                    case combiners.AND:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                console.log('CLAUSE: ', clause);
                                resolveWhere(clause, this);
                            }
                        });
                        break;
                    default:
                        break;
                }
            }
        };

        // const buildWhere = (key: keyof WhereBase, value: any) => {
        //     if (typeof value === 'string') {
        //         query.andWhere;
        //     }
        // };

        if (where) {
            resolveWhere(where, query);
        }

        if (orderBy) {
            for (let [column, direction] of Object.entries(orderBy)) {
                query.orderBy(column, direction);
            }
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
     * Type-safe insert function
     * Inserts row. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    public async insertOne(params: { connection?: PoolConnection; value: PartialTblRow }): Promise<number | null> {
        const { value, connection } = params;

        let query = knex()(this.tableName).insert(value);

        _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, value);
        const result = await query.connection(connection);

        // seems to return 0 for non-auto-increment inserts
        return result[0];
    }

    /**
     * Type-safe multi insert function
     * Inserts all rows. Fails on duplicate key error
     *     * use upsert if you wish to ignore duplicate rows
     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
     * Will take the superset of all columns in the insert values
     * @param params
     */
    public async insertMany(params: { connection?: PoolConnection; values: PartialTblRow[] }): Promise<number | null> {
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
    public async softDelete(params: { connection: PoolConnection; where: PartialTblRow }) {
        const { where, connection } = params;
        if (!this.hasSoftDelete()) throw new Error(`Cannot soft delete for table: ${this.tableName}`);
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName)
            .where(where)
            .update({ [this.softDeleteColumnString]: true })
            .connection(connection);

        _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where);

        return query;
    }

    /**
     * Type-safe update function
     * Updates all rows matching conditions i.e. WHERE a = 1 AND b = 2;
     * Usage:
     *      updateByConditions(conn, 'users', { fname: 'joe' }, { user_id: 3, email: 'steve' }
     *      -> UPDATE users SET fname = 'joe' WHERE user_id = 3 AND email = 'steve'
     */
    public async update(params: { connection: PoolConnection; values: PartialTblRow; where: PartialTblRow }) {
        const { values, connection, where } = params;
        if (Object.keys(values).length < 1) throw new Error('Must have at least one updated column');
        if (Object.keys(where).length < 1) throw new Error('Must have at least one where condition');

        const query = knex()(this.tableName).where(where).update(values).connection(connection);

        _logger.debug('Executing update: %s with conditions %j and values %j', query.toSQL().sql, where, values);

        return query;
    }
}