// This file holds the shared truth of types between the Generator and the Client
// It is not strictly necessary to be separate but aids in making sure they match up when using string templating

export enum Comparable {
    string = 'string',
    number = 'number',
    bigint = 'bigint',
    boolean = 'boolean',
    Date = 'Date',
}

export enum NonComparable {
    Object = 'Object',
    Array = 'Array',
    Buffer = 'Buffer',
    any = 'any',
}

export type EnumType = string;

export type ColumnType = NonComparable | Comparable | EnumType;

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

export interface ColumnDefinition {
    dbType: string;
    nullable: boolean;
    tsType?: ColumnType;
    columnName: string;
}

export interface EnumDefinition {
    columnName: string;
    enumName: string;
    values: string[];
}

export interface TableSchemaDefinition {
    primaryKey: string[];
    columns: {
        [columnName: string]: ColumnDefinition;
    };
    enums: {
        [enumName: string]: EnumDefinition;
    };
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
    beforeCursor?: { [column: string]: any };
    offset?: number;
};

export type Order = 'asc' | 'desc';

export enum RelationFilters {
    existsWhere = 'existsWhere',
    notExistsWhere = 'notExistsWhere',
    whereEvery = 'whereEvery',
}

export enum Combiners {
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
}

export enum Operators {
    equals = 'equals',
    not = 'not',
    in = 'in',
    notIn = 'notIn',
    lt = 'lt',
    lte = 'lte',
    gt = 'gt',
    gte = 'gte',
    contains = 'contains',
    startsWith = 'startsWith',
    endsWith = 'endsWith',
}

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
