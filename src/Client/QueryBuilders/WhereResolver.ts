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
    }): QueryBuilder {
        const { queryBuilder, where, relations } = params;

        // resolves a single where block like:
        // user_id: {
        //      not_in: [3, 4],
        //      gte: 1
        // }
        // These are the leafs in the recursion
        const buildWhereLeafClause = (column: string, value: any, builder: QueryBuilder) => {
            const valueType: string = typeof value;
            // @ts-ignore - can't index
            if (Primitives[valueType]) {
                // is a primitive so use equals clause
                builder.where(column, value);
            } else if (valueType === 'object') {
                //is an object so need to work out operators
                for (let [operator, val] of Object.entries(value)) {
                    switch (operator) {
                        case Operators.equals:
                            //@ts-ignore
                            builder.where(column, val);
                            break;
                        case Operators.not:
                            //@ts-ignore
                            builder.whereNot(column, val);
                            break;
                        case Operators.notIn:
                            // @ts-ignore
                            builder.whereNotIn(column, val);
                            break;
                        case Operators.lt:
                            // @ts-ignore
                            builder.where(column, '<', val);
                            break;
                        case Operators.lte:
                            // @ts-ignore
                            builder.where(column, '<=', val);
                            break;
                        case Operators.gt:
                            // @ts-ignore
                            builder.where(column, '>', val);
                            break;
                        case Operators.gte:
                            // @ts-ignore
                            builder.whereNot(column, '>=', val);
                            break;
                        case Operators.contains:
                            // @ts-ignore
                            builder.where(column, 'like', `$%{val}%`);
                            break;
                        case Operators.startsWith:
                            // @ts-ignore
                            builder.where(column, 'like', `${val}%`);
                            break;
                        case Operators.endsWith:
                            // @ts-ignore
                            builder.where(column, 'like', `$%{val}`);
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
        const resolveWhere = (subQuery: any, builder: QueryBuilder) => {
            for (let [field, value] of Object.entries(subQuery)) {
                // @ts-ignore
                if (!Combiners[field] && !RelationFilters[field] && !relations[field]) {
                    // resolve leaf node
                    buildWhereLeafClause(field, value, builder);
                    continue;
                }
                // if a combiner need to resolve each sub block recursively
                switch (field) {
                    case Combiners.AND:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                resolveWhere(clause, this);
                            }
                        });
                        break;
                    case Combiners.OR:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.orWhere(function () {
                                    resolveWhere(clause, this);
                                });
                            }
                        });
                        break;
                    case Combiners.NOT:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.andWhereNot(function () {
                                    resolveWhere(clause, this);
                                });
                            }
                        });
                        break;
                    default:
                        break;
                }
                // if a relation (join) need to recurse
                if (relations[field]) {
                }
                // if a relation filter need to recurse
                // @ts-ignore
                if (RelationFilters[field]) {

                }
            }
        };
        resolveWhere(where, queryBuilder);
        return queryBuilder;
    }
}
