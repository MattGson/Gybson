import { QueryBuilder } from 'knex';
import { RelationFilters, Combiners, Operators, Primitives, TableRelations } from '../../TypeTruth/TypeTruth';

export class WhereResolver {
    /**
     * Resolve a where clause
     * @param params
     */
    public static resolveWhereClause<TblWhere>(params: {
        queryBuilder: QueryBuilder;
        where: TblWhere;
        relations: TableRelations;
        tableName: string;
        tableAlias: string;
    }): QueryBuilder {
        const { queryBuilder, where, relations, tableName, tableAlias } = params;

        // resolves a single where block like:
        // user_id: {
        //      not_in: [3, 4],
        //      gte: 1
        // }
        // These are the leafs in the recursion
        const buildWhereLeafClause = (column: string, value: any, builder: QueryBuilder, tableAlias: string) => {
            const valueType: string = typeof value;
            const columnAlias = `${tableAlias}.${column}`;
            // @ts-ignore - can't index
            if (Primitives[valueType]) {
                // is a primitive so use equals clause
                builder.where(columnAlias, value);
            } else if (valueType === 'object') {
                //is an object so need to work out operators
                for (let [operator, val] of Object.entries(value)) {
                    switch (operator) {
                        case Operators.equals:
                            //@ts-ignore
                            builder.where(columnAlias, val);
                            break;
                        case Operators.not:
                            //@ts-ignore
                            builder.whereNot(columnAlias, val);
                            break;
                        case Operators.notIn:
                            // @ts-ignore
                            builder.whereNotIn(columnAlias, val);
                            break;
                        case Operators.lt:
                            // @ts-ignore
                            builder.where(columnAlias, '<', val);
                            break;
                        case Operators.lte:
                            // @ts-ignore
                            builder.where(columnAlias, '<=', val);
                            break;
                        case Operators.gt:
                            // @ts-ignore
                            builder.where(columnAlias, '>', val);
                            break;
                        case Operators.gte:
                            // @ts-ignore
                            builder.whereNot(columnAlias, '>=', val);
                            break;
                        case Operators.contains:
                            // @ts-ignore
                            builder.where(columnAlias, 'like', `$%{val}%`);
                            break;
                        case Operators.startsWith:
                            // @ts-ignore
                            builder.where(columnAlias, 'like', `${val}%`);
                            break;
                        case Operators.endsWith:
                            // @ts-ignore
                            builder.where(columnAlias, 'like', `$%{val}`);
                            break;
                        default:
                            break;
                    }
                }
            }
        };

        // const resolveWhereRelation = (subQuery: any, builder: QueryBuilder) => {};

        // resolve each where clause
        // can be either a where leaf or a combiner
        // recurse the where tree
        // depth is used to unique table alias'
        const resolveWhere = (params: {
            subQuery: any;
            builder: QueryBuilder;
            depth: number;
            table: string;
            tableAlias: string;
        }) => {
            const { subQuery, builder, depth, table, tableAlias } = params;
            for (let [field, value] of Object.entries(subQuery)) {
                // @ts-ignore
                if (!Combiners[field] && !RelationFilters[field] && !relations[field]) {
                    // resolve leaf node
                    buildWhereLeafClause(field, value, builder, tableAlias);
                    continue;
                }
                // if a combiner need to resolve each sub block recursively
                switch (field) {
                    case Combiners.AND:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                resolveWhere({ subQuery: clause, builder: this, depth: depth + 1, table, tableAlias });
                            }
                        });
                        break;
                    case Combiners.OR:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.orWhere(function () {
                                    resolveWhere({
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
                            // @ts-ignore
                            for (let clause of value) {
                                this.andWhereNot(function () {
                                    resolveWhere({
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
                // TODO:- multiple relations at same query level breaks query - maybe just good error message?
                //  TODO:- filter soft delete on relations?
                // if a relation (join) need to recurse
                if (relations[field]) {
                    const childTable = field;
                    const childTableAlias = childTable + depth;
                    const aliasClause = `${childTable} as ${childTableAlias}`;
                    const joins = relations[table][childTable];
                    // @ts-ignore
                    for (let [relationFilter, clause] of Object.entries(value)) {
                        switch (relationFilter) {
                            case RelationFilters.existsWhere:
                                builder.whereExists(function () {
                                    // join the child table in a correlated sub-query for exists
                                    this.select(`${childTableAlias}.*`).from(aliasClause);
                                    for (let { toColumn, fromColumn } of joins) {
                                        this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                    }
                                    // resolve for child table
                                    resolveWhere({
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
                                    for (let { toColumn, fromColumn } of joins) {
                                        this.whereRaw(`${childTableAlias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                    }
                                    // resolve for child table
                                    resolveWhere({
                                        subQuery: clause,
                                        builder: this,
                                        depth: depth + 1,
                                        table: childTable,
                                        tableAlias: childTableAlias,
                                    });
                                });
                                break;
                            case RelationFilters.innerJoinWhere:
                                // join child table as inner join
                                builder.innerJoin(aliasClause, function () {
                                    for (let { toColumn, fromColumn } of joins) {
                                        this.on(`${childTableAlias}.${toColumn}`, '=', `${tableAlias}.${fromColumn}`);
                                    }
                                });
                                // resolve for child table
                                resolveWhere({
                                    subQuery: clause,
                                    builder: builder,
                                    depth: depth + 1,
                                    table: childTable,
                                    tableAlias: childTableAlias,
                                });
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        };
        resolveWhere({ subQuery: where, builder: queryBuilder, depth: 1, table: tableName, tableAlias: tableAlias });
        return queryBuilder;
    }
}
