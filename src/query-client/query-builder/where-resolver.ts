import type { Knex } from 'knex';
import { Comparable, DatabaseSchema, RelationDefinition } from 'relational-schema';
import {
    Combiners,
    HasManyRelationFilter,
    HasOneRelationFilter,
    HasOneRequiredRelationFilter,
    Operators,
    RecordAny,
} from '../../types';

export class WhereResolver {
    constructor(private schema: DatabaseSchema) {}

    /**
     * Get a relation if it exists for a given table and alias
     * @param alias
     * @param table
     */
    private getRelationFromAlias(alias: string, table: string): RelationDefinition | null {
        if (!this.schema.tables[table]) return null;

        for (const relation of this.schema.tables[table].relations) {
            // TODO:- ignore transitive for now
            if (relation.type === 'manyToMany') continue;
            if (relation.alias === alias) return relation;
        }
        return null;
    }

    /**
     * Get a soft delete filter for a table
     * @param tableAlias
     * @param tableName
     * @returns
     */
    private getSoftDeleteFilter(tableAlias: string, tableName: string): RecordAny | null {
        const definition = this.schema.tables[tableName];
        const column = definition.softDelete;
        if (!column) return null;

        const columnAlias = `${tableAlias}.${column.columnName}`;

        const type = column?.tsType;
        if (type === Comparable.Date) return { [columnAlias]: null };
        if (type === Comparable.boolean) return { [columnAlias]: false };
        return null;
    }

    /**
     * Check if a field is a combiner
     * @param field
     * @private
     */
    private isCombiner(field: string): field is keyof typeof Combiners {
        return !!Object.values(Combiners).find((f) => f === field);
    }

    /**
     * Check if a field is a comparable
     * @private
     * @param value
     */
    private isComparable(value: any): boolean {
        const valueType: string = typeof value;
        if (Object.values(Comparable).find((f) => f === valueType)) return true;
        return value instanceof Date;
    }

    /**
     * Check whether a clause is a leaf or a block
     * @param value
     * @private
     */
    private isBlock(value: any): value is RecordAny {
        return typeof value === 'object';
    }

    /**
     * Build a deterministic alias for a given table at a depth and branch in the query tree
     * @param tablename
     * @param depth
     * @param logical_branch - branch in logical combiner such as AND, OR
     * @param clause_branch - branch within a clause
     * @returns
     */
    private joinTableAlias(tablename: string, depth: number, logical_branch: number, clause_branch: number): string {
        return `${tablename}_${depth}_${logical_branch}_${clause_branch}`;
    }

    /**
     * Resolve a leaf where clause
     * like:
     *  user_id: 2
     * OR
     * user_id: {
     *    not_in: [3, 4],
     *    gte: 1
     * }
     * @param column
     * @param value
     * @param builder
     * @param tableAlias
     */
    private resolveWhereLeaf(column: string, value: any, builder: Knex.QueryBuilder, tableAlias: string) {
        const columnAlias = `${tableAlias}.${column}`;

        if (this.isComparable(value)) {
            // is a primitive so use equals clause
            builder.where(columnAlias, value);
        } else if (this.isBlock(value)) {
            //is an object so need to work out operators for each
            for (const [operator, val] of Object.entries(value)) {
                switch (operator) {
                    case Operators.equals:
                        builder.where(columnAlias, val);
                        break;
                    case Operators.not:
                        builder.whereNot(columnAlias, val);
                        break;
                    case Operators.in:
                        builder.whereIn(columnAlias, val);
                        break;
                    case Operators.notIn:
                        builder.whereNotIn(columnAlias, val);
                        break;
                    case Operators.lt:
                        builder.where(columnAlias, '<', val);
                        break;
                    case Operators.lte:
                        builder.where(columnAlias, '<=', val);
                        break;
                    case Operators.gt:
                        builder.where(columnAlias, '>', val);
                        break;
                    case Operators.gte:
                        builder.where(columnAlias, '>=', val);
                        break;
                    case Operators.contains:
                        builder.where(columnAlias, 'like', `%${val}%`);
                        break;
                    case Operators.startsWith:
                        builder.where(columnAlias, 'like', `${val}%`);
                        break;
                    case Operators.endsWith:
                        builder.where(columnAlias, 'like', `%${val}`);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Recursive clause resolver
     * Resolves each filter clause
     * @param params
     * @private
     */
    private resolveFilters(params: {
        subQuery: RecordAny;
        builder: Knex.QueryBuilder;
        depth: number;
        branch: number;
        table: string;
        tableAlias: string;
    }) {
        // capture context as knex creates it's own sub-contexts
        const context = this;

        const { subQuery, builder, depth, branch, table, tableAlias } = params;

        // keep track of branches within a clause in case of join conflcits (same table referenced)
        let clause_branch = 0;

        for (const [field, filterValue] of Object.entries(subQuery)) {
            clause_branch++;

            const relation = this.getRelationFromAlias(field, table);

            if (!this.isCombiner(field) && !relation) {
                this.resolveWhereLeaf(field, filterValue, builder, tableAlias);
                continue;
            }
            if (this.isCombiner(field)) {
                switch (field) {
                    case Combiners.AND:
                        builder.where(function () {
                            for (let branch = 0; branch < filterValue.length; branch++) {
                                const clause = filterValue[branch];
                                context.resolveFilters({
                                    subQuery: clause,
                                    builder: this,
                                    depth: depth + 1,
                                    branch,
                                    table,
                                    tableAlias,
                                });
                            }
                        });
                        break;
                    case Combiners.OR:
                        builder.where(function () {
                            for (let branch = 0; branch < filterValue.length; branch++) {
                                const clause = filterValue[branch];
                                this.orWhere(function () {
                                    context.resolveFilters({
                                        subQuery: clause,
                                        builder: this,
                                        depth: depth + 1,
                                        branch,
                                        table,
                                        tableAlias,
                                    });
                                });
                            }
                        });
                        break;
                    case Combiners.NOT:
                        builder.where(function () {
                            for (let branch = 0; branch < filterValue.length; branch++) {
                                const clause = filterValue[branch];
                                this.andWhereNot(function () {
                                    context.resolveFilters({
                                        subQuery: clause,
                                        builder: this,
                                        depth: depth + 1,
                                        branch,
                                        table,
                                        tableAlias,
                                    });
                                });
                            }
                        });
                        break;
                    default:
                        break;
                }
            } else if (relation) {
                if (!this.isBlock(filterValue)) {
                    throw new Error('relation filters expected an object for field ' + field);
                }

                const childTable = relation.toTable;
                const childTableDefinition = this.schema.tables[childTable];
                const childTableAlias = this.joinTableAlias(childTable, depth, branch, clause_branch);

                const childSoftDeleteFilter = this.getSoftDeleteFilter(childTableAlias, childTable);
                const childPrimarySelect = `${childTableAlias}.${
                    childTableDefinition.primaryKey?.columnNames[0] ?? '*'
                }`;

                /**
                 * Each clause i.e. exists, where, whereEvery
                 */
                for (const [relationFilter, clause] of Object.entries(filterValue as RecordAny)) {
                    switch (relationFilter) {
                        case HasOneRelationFilter.exists:
                        case HasManyRelationFilter.exists:
                            // accept any truthy value for exists
                            if (clause) {
                                if (childSoftDeleteFilter) builder.where(childSoftDeleteFilter);
                                builder.whereNotNull(childPrimarySelect);
                            } else {
                                // doesn't exist if either is null or is soft deleted
                                builder.where(function () {
                                    this.whereNull(childPrimarySelect);
                                    if (childSoftDeleteFilter) this.orWhereNot(childSoftDeleteFilter);
                                });
                            }
                            break;
                        case HasOneRelationFilter.where:
                        case HasOneRequiredRelationFilter.where:
                        case HasManyRelationFilter.where:
                            if (childSoftDeleteFilter) builder.where(childSoftDeleteFilter);

                            context.resolveFilters({
                                subQuery: clause,
                                builder,
                                depth: depth + 1,
                                branch,
                                table: childTable,
                                tableAlias: childTableAlias,
                            });

                            break;

                        case HasManyRelationFilter.whereEvery:
                            // Use double negation in sub-query as this is hard to implement with joins
                            builder.whereNotExists(function () {
                                this.select(childPrimarySelect).from({ [childTableAlias]: childTable });
                                for (const { toColumn, fromColumn } of relation.joins) {
                                    this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                }
                                if (childSoftDeleteFilter) this.where(childSoftDeleteFilter);
                                context.resolveFilters({
                                    subQuery: {
                                        NOT: [clause],
                                    },
                                    builder: this,
                                    depth: depth + 1,
                                    branch,
                                    table: childTable,
                                    tableAlias: childTableAlias,
                                });
                            });
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    /**
     * Add all relation joins (recursive)
     * Note:- it's important that this method uses the same
     *  mechanism (depth, branch, clause_branch) to alias tables
     *  as resolveFilters() else the alias' will not match up
     * @param params
     */
    private buildJoins(params: {
        subQuery: RecordAny;
        builder: Knex.QueryBuilder;
        depth: number;
        branch: number;
        table: string;
        tableAlias: string;
    }) {
        const { subQuery, builder, depth, branch, table, tableAlias } = params;

        // can't be a relation
        if (typeof subQuery !== 'object') return;

        // keep track of branches within a clause in case of join conflcits (same table referenced)
        let clause_branch = 0;

        for (const [field, filterValue] of Object.entries(subQuery)) {
            clause_branch++;
            const relation = this.getRelationFromAlias(field, table);

            if (this.isCombiner(field)) {
                // check each combiner branch for relations
                for (let branch = 0; branch < filterValue.length; branch++) {
                    const clause = filterValue[branch];
                    this.buildJoins({
                        subQuery: clause,
                        builder,
                        depth: depth + 1,
                        branch,
                        table,
                        tableAlias,
                    });
                }
            } else if (relation) {
                const childTable = relation.toTable;
                const childTableAlias = this.joinTableAlias(childTable, depth, branch, clause_branch);
                const aliasClause = `${childTable} as ${childTableAlias}`;
                const joins = relation.joins;

                if (typeof filterValue !== 'object') {
                    throw new Error('relation filters expected an object for field ' + field);
                }

                // just join each related table only once per depth
                builder.leftJoin(aliasClause, function () {
                    for (const { toColumn, fromColumn } of joins) {
                        this.on(`${childTableAlias}.${toColumn}`, `${tableAlias}.${fromColumn}`);
                    }
                });

                for (const [_clause, body] of Object.entries(filterValue as RecordAny)) {
                    if (typeof body === 'object') {
                        // recurse to check for nested relations
                        this.buildJoins({
                            subQuery: body,
                            builder: builder,
                            depth: depth + 1,
                            branch: 0,
                            table: childTable,
                            tableAlias: childTableAlias,
                        });
                    }
                }
            }
        }
    }

    /**
     * Resolve a where clause
     * @param params
     */
    public resolveWhereClause<TblWhere>(params: {
        queryBuilder: Knex.QueryBuilder;
        where: TblWhere;
        tableName: string;
        tableAlias: string;
    }): Knex.QueryBuilder {
        const { queryBuilder, where, tableName, tableAlias } = params;

        const tableSchema = this.schema.tables[tableName];

        // build all relation joins in each sub-clause recursively
        this.buildJoins({
            subQuery: where,
            builder: queryBuilder,
            depth: 1,
            branch: 0,
            table: tableName,
            tableAlias: tableAlias,
        });

        // Resolve the filters in each sub-clause recursively
        this.resolveFilters({
            subQuery: where,
            builder: queryBuilder,
            depth: 1,
            branch: 0,
            table: tableName,
            tableAlias: tableAlias,
        });

        // remove any duplicates caused by joins
        const groupColumns = tableSchema.primaryKey?.columnNames?.map((c) => `${tableAlias}.${c}`) ?? [];
        queryBuilder.groupBy(groupColumns);

        return queryBuilder;
    }
}
