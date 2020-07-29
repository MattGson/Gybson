// This file holds the shared truth of types between the Generator and the Client
// It is not strictly necessary but aids in making sure they match up when using string templating

import { ColumnDefinition } from '../Generator/Introspection/IntrospectionTypes';
import _ from 'lodash';

// relations map
export interface JoinDefinition {
    // name of column to join from
    fromColumn: string;
    // name of column to join to
    toColumn: string;
}

export interface RelationDefinition {
    // name of table to join to
    toTable: string;
    // name of relation i.e. posts -> users would be 'author'
    alias: string;
    // columns to complete the join
    joins: JoinDefinition[];
}

export interface TableSchemaDefinition {
    primaryKey: string[];
    relations: RelationDefinition[];
}

export interface DatabaseSchema {
    [tableName: string]: TableSchemaDefinition;
}

export declare type Enumerable<T> = Array<T>;

// These are just for helping write the query builder
export type OrderBy = { [column: string]: Order | undefined };
export type Paginate = {
    limit?: number;
    afterCursor?: { [column: string]: any };
    afterCount?: number;
};

export type Order = 'asc' | 'desc';

export const buildOrderForTable = (params: { orderByTypeName: string; columns: ColumnDefinition[] }) => {
    const { orderByTypeName, columns } = params;
    return `export type ${orderByTypeName} = {
                ${columns.map((col) => `${col.columnName}?: Order;`).join(' ')}
            };`;
};

export const buildPaginateForTable = (params: { paginationTypeName: string; rowTypeName: string }) => {
    const { paginationTypeName, rowTypeName } = params;
    return `export type ${paginationTypeName} = {
                    limit?: number;
                    afterCursor?: Partial<${rowTypeName}>;
                    afterCount?: number;
            };`;
};

export enum Primitives {
    string = 'string',
    number = 'number',
    bigint = 'bigint',
    boolean = 'boolean',
    Date = 'Date',
}

export enum RelationFilters {
    existsWhere = 'existsWhere',
    notExistsWhere = 'notExistsWhere',
    innerJoinWhere = 'innerJoinWhere',
}

export const buildRelationFilterForTable = (params: { relationFilterTypeName: string; whereTypeName: string }) => {
    const { relationFilterTypeName, whereTypeName } = params;
    return `export type ${relationFilterTypeName} = {
                existsWhere?: ${whereTypeName};
                notExistsWhere?: ${whereTypeName};
                innerJoinWhere?: ${whereTypeName};
            }`;
};

export enum Combiners {
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
}

export const buildWhereCombinersForTable = (params: { whereTypeName: string }) => {
    const { whereTypeName } = params;
    return `
        AND?: Enumerable<${whereTypeName}>;
        OR?: Enumerable<${whereTypeName}>;
        NOT?: Enumerable<${whereTypeName}>;
    `;
};

export enum Operators {
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

export const buildWhereTypeForColumn = (col: ColumnDefinition) => {
    const type = `${col.columnName}?: ${col.tsType}`;

    // don't have where clause for enum and set types
    // @ts-ignore
    if (!col.tsType || !Primitives[col.tsType]) return type;
    // add where options to type
    return `${type} | ${_.upperFirst(col.tsType)}Where${col.nullable ? 'Nullable | null' : ''}`;
};

export type NumberWhere = {
    equals?: number;
    not?: number | NumberWhere;
    in?: Enumerable<number>;
    notIn?: Enumerable<number>;
    lt?: number;
    lte?: number;
    gt?: number;
    gte?: number;
};

export type NumberWhereNullable = {
    equals?: number | null;
    not?: number | null | NumberWhereNullable;
    in?: Enumerable<number | null>;
    notIn?: Enumerable<number | null>;
    lt?: number | null;
    lte?: number | null;
    gt?: number | null;
    gte?: number | null;
};

export type StringWhere = {
    equals?: string;
    not?: string | StringWhere;
    in?: Enumerable<string>;
    notIn?: Enumerable<string>;
    lt?: string;
    lte?: string;
    gt?: string;
    gte?: string;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
};

export type StringWhereNullable = {
    equals?: string | null;
    not?: string | null | StringWhereNullable;
    in?: Enumerable<string | null>;
    notIn?: Enumerable<string | null>;
    lt?: string | null;
    lte?: string | null;
    gt?: string | null;
    gte?: string | null;
    contains?: string | null;
    startsWith?: string | null;
    endsWith?: string | null;
};

export type BooleanWhere = {
    equals?: boolean;
    not?: boolean | BooleanWhere;
};

export type BooleanWhereNullable = {
    equals?: boolean | null;
    not?: boolean | BooleanWhere | null;
};

export type DateWhereNullable = {
    equals?: Date | string | null;
    not?: Date | string | null | DateWhereNullable;
    in?: Enumerable<Date | string | null>;
    notIn?: Enumerable<Date | string | null>;
    lt?: Date | string | null;
    lte?: Date | string | null;
    gt?: Date | string | null;
    gte?: Date | string | null;
};

export type DateWhere = {
    equals?: Date | string;
    not?: Date | string | DateWhere;
    in?: Enumerable<Date | string | null>;
    notIn?: Enumerable<Date | string | null>;
    lt?: Date | string | null;
    lte?: Date | string | null;
    gt?: Date | string | null;
    gte?: Date | string | null;
};
