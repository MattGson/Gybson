import { QueryBuilder } from 'knex';
import { RelationTables } from './SQLQueryBuilder';
import { RelationFilters, Combiners, Operators, Primitives } from '../../TypeTruth/TypeTruth';

export class WhereResolver {
    /**
     * Resolve a where clause
     * @param params
     */
    public static resolveWhereClause<TblWhere>(params: {
        queryBuilder: QueryBuilder;
        where: TblWhere;
        relations: RelationTables;
        tableName: string;
    }): QueryBuilder {
        const { queryBuilder, where, relations, tableName } = params;

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
        const resolveWhere = (subQuery: any, builder: QueryBuilder, depth: number, tableAlias: string) => {
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
                                resolveWhere(clause, this, depth + 1, tableAlias);
                            }
                        });
                        break;
                    case Combiners.OR:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.orWhere(function () {
                                    resolveWhere(clause, this, depth + 1, tableAlias);
                                });
                            }
                        });
                        break;
                    case Combiners.NOT:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.andWhereNot(function () {
                                    resolveWhere(clause, this, depth + 1, tableAlias);
                                });
                            }
                        });
                        break;
                    default:
                        break;
                }
                // if a relation (join) need to recurse
                if (relations[field]) {
                    const table = field;
                    const alias = table + depth;
                    const columns = relations[field];
                    // @ts-ignore
                    for (let [relationFilter, clause] of Object.entries(value)) {
                        switch (relationFilter) {
                            case RelationFilters.existsWhere:
                                builder.whereExists(function () {
                                    // TODO:- probably need the parent table to alias the joins
                                    this.select(`${alias}.*`).from(`${table} as ${alias}`);
                                    for (let { toColumn, fromColumn } of columns) this.whereRaw(`${alias}.${toColumn} = ${tableAlias}.${fromColumn}`);
                                    resolveWhere(clause, this, depth + 1, alias);
                                });
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        };
        resolveWhere(where, queryBuilder, 1, tableName);
        return queryBuilder;
    }
}
