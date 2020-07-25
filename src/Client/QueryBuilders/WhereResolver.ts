import { QueryBuilder } from 'knex';
import { WhereBase } from './QueryTypes';
import {RelationTables} from "./SQLQueryBuilder";

export class WhereResolver {
    /**
     * Resolve a where clause
     * @param params
     */
    public static resolveWhereClause<TblWhere extends WhereBase>(params: {
        queryBuilder: QueryBuilder;
        where: TblWhere;
        relations: RelationTables;
    }): QueryBuilder {
        const { queryBuilder, where } = params;
        enum operators {
            equals = 'equals',
            not = 'not',
            notIn = 'notIn',
            lt = 'lt',
            lte = 'lte',
            gt = 'gt',
            gte = 'gte',
            contains = 'contains',
            startsWith = 'startsWith',
            endsWith = 'endsWith',
        }

        const combiners = {
            AND: 'AND',
            OR: 'OR',
            NOT: 'NOT',
        };

        const relationFilters = {
            exists: 'exists',
            notExists: 'notExists',
            innerJoin: 'innerJoin',
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
        const buildWhereLeafClause = (column: string, value: any, builder: QueryBuilder) => {
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
                        case operators.contains:
                            // @ts-ignore
                            builder.where(column, 'like', `$%{val}%`);
                            break;
                        case operators.startsWith:
                            // @ts-ignore
                            builder.where(column, 'like', `${val}%`);
                            break;
                        case operators.endsWith:
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
            for (let [column, value] of Object.entries(subQuery)) {
                // @ts-ignore
                if (!combiners[column] && !relationFilters[column]) {
                    // resolve leaf node
                    buildWhereLeafClause(column, value, builder);
                    continue;
                }
                // if a combiner need to resolve each sub block recursively
                switch (column) {
                    case combiners.AND:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                resolveWhere(clause, this);
                            }
                        });
                        break;
                    case combiners.OR:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                this.orWhere(function () {
                                    resolveWhere(clause, this);
                                });
                            }
                        });
                        break;
                    case combiners.NOT:
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
                // if a relation filter need to recurse
                switch (column) {
                    case combiners.AND:
                        builder.where(function () {
                            // @ts-ignore
                            for (let clause of value) {
                                resolveWhere(clause, this);
                            }
                        });
                        break;
                    default:
                        break;
                }
            }
        };
        resolveWhere(where, queryBuilder);
        return queryBuilder;
    }
}
