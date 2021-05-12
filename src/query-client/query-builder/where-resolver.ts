import { Knex } from 'knex';
import { RelationFilters, Combiners, Operators, RecordAny } from '../../types';
import { Comparable, RelationDefinition, DatabaseSchema } from 'relational-schema';

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
            //  TODO:- filter soft delete on relations?
            if (possibleRelation) {
                const childTable = possibleRelation.toTable;
                const childTableAlias = childTable + depth;
                const aliasClause = `${childTable} as ${childTableAlias}`;
                const joins = possibleRelation.joins;

                if (typeof filterValue !== 'object') {
                    throw new Error('relation filters expected an object for field ' + field);
                }

                for (const [relationFilter, clause] of Object.entries(filterValue as RecordAny)) {
                    switch (relationFilter) {
                        case RelationFilters.existsWhere:
                            builder.whereExists(function () {
                                // join the child table in a correlated sub-query for exists
                                this.select(`${childTableAlias}.*`).from(aliasClause);
                                for (const { toColumn, fromColumn } of joins) {
                                    this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                }
                                // resolve for child table
                                context.resolveWhere({
                                    subQuery: clause,
                                    builder: this,
                                    depth: depth + 1,
                                    table: childTable,
                                    tableAlias: childTableAlias,
                                });
                            });
                            break;
                        case RelationFilters.notExistsWhere:
                            builder.whereNotExists(function () {
                                // join the child table in a correlated sub-query for exists
                                this.select(`${childTableAlias}.*`).from(aliasClause);
                                for (const { toColumn, fromColumn } of joins) {
                                    this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                }
                                // resolve for child table
                                context.resolveWhere({
                                    subQuery: clause,
                                    builder: this,
                                    depth: depth + 1,
                                    table: childTable,
                                    tableAlias: childTableAlias,
                                });
                            });
                            break;
                        case RelationFilters.whereEvery:
                            // Use double negation TODO:- change this?
                            // WHERE NOT EXISTS ( SELECT where NOT ...)
                            builder.whereNotExists(function () {
                                // join the child table in a correlated sub-query for exists
                                this.select(`${childTableAlias}.*`).from(aliasClause);
                                for (const { toColumn, fromColumn } of joins) {
                                    this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                }
                                const negation = {
                                    NOT: [clause],
                                };
                                // resolve for child table
                                context.resolveWhere({
                                    subQuery: negation,
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
