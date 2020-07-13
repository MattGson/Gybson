/**
 * Bulk loader function
 * Types arguments against the table schema for safety
 * Loads one row per input key
 * Ensures order is preserved
 * For example get users [1, 2, 4] returns users [1, 2, 4]
 * @param params
 */
export declare function byColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
    tableName: string;
    column: TblColumn;
    keys: readonly TblKey[];
    filterSoftDelete: boolean;
}): Promise<(TblRow | null)[]>;
/**
 * Bulk loader function
 * Uses table schema for typing
 * Loads multiple rows per input key
 * Ensures order is preserved
 * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
 * @param params
 */
export declare function manyByColumnLoader<TblRow, TblColumn extends string, TblKey extends string | number>(params: {
    tableName: string;
    column: TblColumn;
    keys: readonly TblKey[];
    orderBy: TblColumn[];
    filterSoftDelete?: boolean;
}): Promise<TblRow[][]>;
/**
 * Complex find rows from a table
 * @param params
 */
export declare function findManyLoader(params: {
    tableName: string;
    options: {
        orderBy?: {
            columns: string[];
            asc?: boolean;
            desc?: boolean;
        };
        where?: any;
        includeDeleted?: boolean;
    };
    hasSoftDelete: boolean;
}): Promise<any[]>;
