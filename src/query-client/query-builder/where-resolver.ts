import { Knex } from 'knex';
import {
    HasOneRelationFilter,
    HasOneRequiredRelationFilter,
    HasManyRelationFilter,
    Combiners,
    Operators,
    RecordAny,
} from '../../types';
import { Comparable, RelationDefinition, DatabaseSchema, TableSchemaDefinition } from 'relational-schema';

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
     * @param params
     * @private
     */
    private resolveWhere(params: {
        subQuery: RecordAny;
        builder: Knex.QueryBuilder;
        depth: number;
        table: string;
        tableAlias: string;
    }) {
        // capture context as knex creates it's own sub-contexts
        const context = this;

        const { subQuery, builder, depth, table, tableAlias } = params;

        for (const [field, filterValue] of Object.entries(subQuery)) {
            const possibleRelation = this.getRelationFromAlias(field, table);

            if (!this.isCombiner(field) && !possibleRelation) {
                this.resolveWhereLeaf(field, filterValue, builder, tableAlias);
                continue;
            }
            if (this.isCombiner(field)) {
                switch (field) {
                    case Combiners.AND:
                        builder.where(function () {
                            for (const clause of filterValue) {
                                context.resolveWhere({
                                    subQuery: clause,
                                    builder: this,
                                    depth: depth + 1,
                                    table,
                                    tableAlias,
                                });
                            }
                        });
                        break;
                    case Combiners.OR:
                        builder.where(function () {
                            for (const clause of filterValue) {
                                this.orWhere(function () {
                                    context.resolveWhere({
                                        subQuery: clause,
                                        builder: this,
                                        depth: depth + 1,
                                        table,
                                        tableAlias,
                                    });
                                });
                            }
                        });
                        break;
                    case Combiners.NOT:
                        builder.where(function () {
                            for (const clause of filterValue) {
                                this.andWhereNot(function () {
                                    context.resolveWhere({
                                        subQuery: clause,
                                        builder: this,
                                        depth: depth + 1,
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
            }
            // TODO:- multiple relations at same query level breaks query - maybe just need a good error message?
            if (possibleRelation) {
                const childTable = possibleRelation.toTable;
                const childTableDefinition = this.schema.tables[childTable];
                const childTableAlias = childTable + depth;
                const aliasClause = `${childTable} as ${childTableAlias}`;
                const joins = possibleRelation.joins;
                const softDeleteFilter = this.getSoftDeleteFilter(childTableAlias, childTable);

                if (typeof filterValue !== 'object') {
                    throw new Error('relation filters expected an object for field ' + field);
                }

                for (const [relationFilter, clause] of Object.entries(filterValue as RecordAny)) {
                    switch (relationFilter) {
                        case HasOneRelationFilter.exists:
                        case HasManyRelationFilter.exists:
                            // accept any truthy value for exists
                            if (clause) {
                                builder.leftJoin(aliasClause, function () {
                                    for (const { toColumn, fromColumn } of joins) {
                                        this.on(`${childTableAlias}.${toColumn}`, `${tableAlias}.${fromColumn}`);
                                    }
                                });
                                if (softDeleteFilter) builder.where(softDeleteFilter);
                                builder.whereNotNull(
                                    `${childTableAlias}.${childTableDefinition.primaryKey?.columnNames[0] ?? '*'}`,
                                );
                            } else {
                                builder.leftJoin(aliasClause, function () {
                                    for (const { toColumn, fromColumn } of joins) {
                                        this.on(`${childTableAlias}.${toColumn}`, `${tableAlias}.${fromColumn}`);
                                    }
                                });
                                builder.whereNull(
                                    `${childTableAlias}.${childTableDefinition.primaryKey?.columnNames[0] ?? '*'}`,
                                );
                            }
                            break;
                        case HasOneRelationFilter.where:
                        case HasOneRequiredRelationFilter.where:
                        case HasManyRelationFilter.where:
                            builder.leftJoin(aliasClause, function () {
                                for (const { toColumn, fromColumn } of joins) {
                                    this.on(`${childTableAlias}.${toColumn}`, `${tableAlias}.${fromColumn}`);
                                }
                            });
                            if (softDeleteFilter) builder.where(softDeleteFilter);
                            context.resolveWhere({
                                subQuery: clause,
                                builder: builder,
                                depth: depth + 1,
                                table: childTable,
                                tableAlias: childTableAlias,
                            });
                            break;

                        case HasManyRelationFilter.whereEvery:
                            // Use double negation
                            builder.whereNotExists(function () {
                                this.select(`${childTableAlias}.*`).from(aliasClause);
                                for (const { toColumn, fromColumn } of joins) {
                                    this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                }
                                if (softDeleteFilter) this.where(softDeleteFilter);
                                context.resolveWhere({
                                    subQuery: {
                                        NOT: [clause],
                                    },
                                    builder: this,
                                    depth: depth + 1,
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

        // Resolve each sub-clause recursively
        // Clause can be either a where-leaf, a combiner or a relation
        // Depth is used to create unique table alias'
        this.resolveWhere({
            subQuery: where,
            builder: queryBuilder,
            depth: 1,
            table: tableName,
            tableAlias: tableAlias,
        });
        return queryBuilder;
    }
}
