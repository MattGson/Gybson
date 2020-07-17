// Standard query types - not used yet
export declare type Enumerable<T> = Array<T>;
export type Order = 'asc' | 'desc';

// These are just for helping write the query builder
export type OrderByBase = { [column: string]: Order | undefined };
export type WhereBase = { [column: string]: any } & {
    AND?: Enumerable<WhereBase>;
    OR?: Enumerable<WhereBase>;
    NOT?: Enumerable<WhereBase>;
};

// Types for where conditions
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
