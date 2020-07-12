import { DBTables } from '../Gen';
/**
 * Bulk loader function
 * Loads one row per input key
 * Ensures order is preserved
 * For example get users [1, 2, 4] returns users [1, 2, 4]
 * @param table
 * @param column
 * @param keys
 * @param filterSoftDelete
 */
export declare function byColumnLoader<Tbl extends keyof DBTables, Column extends Extract<keyof DBTables[Tbl], string>, KeyType extends Extract<DBTables[Tbl][Column], string | number>>(table: Tbl, column: Column, keys: readonly KeyType[], filterSoftDelete: boolean): Promise<(DBTables[Tbl] | null)[]>;
/**
 * Bulk loader function
 * Loads multiple rows per input key
 * Ensures order is preserved
 * For example get team_members for users [1, 2, 4] returns team_members for each user [[3,4], [4,5], [4]]
 * @param table
 * @param column
 * @param keys
 * @param orderBy - default order is by 'column'. Pass [] for default order.
 * @param filterSoftDelete
 */
export declare function manyByColumnLoader<Tbl extends keyof DBTables, Column extends Extract<keyof DBTables[Tbl], string>, KeyType extends Extract<DBTables[Tbl][Column], string | number>>(table: Tbl, column: Column, keys: readonly KeyType[], orderBy: Column[], filterSoftDelete?: boolean): Promise<DBTables[Tbl][][]>;
/**
 * Complex find rows from a table
 * @param table
 * @param options - should specify order by to ensure deterministic pagination etc
 * @param hasSoftDelete
 */
export declare function findManyLoader<Tbl extends keyof DBTables, Column extends Extract<keyof DBTables[Tbl], string>, Conditions extends Partial<DBTables[Tbl]>>(table: Tbl, options: {
    orderBy?: {
        columns: Column[];
        asc?: boolean;
        desc?: boolean;
    };
    where?: Conditions;
    includeDeleted?: boolean;
}, hasSoftDelete: boolean): Promise<DBTables[Tbl][]>;
