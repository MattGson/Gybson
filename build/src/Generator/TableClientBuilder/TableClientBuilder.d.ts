import { Introspection, EnumDefinitions } from '../Introspection/IntrospectionTypes';
interface BuilderOptions {
    rowTypeSuffix: string;
}
/**
 * Builds db client methods for a table
 */
export declare class TableClientBuilder {
    readonly entityName: string;
    readonly rowTypeName: string;
    readonly className: string;
    readonly table: string;
    private readonly enums;
    private loaders;
    constructor(table: string, enums: EnumDefinitions, options: BuilderOptions);
    private static PascalCase;
    build(introspection: Introspection): Promise<string>;
    private buildTemplate;
    /**
     * Build a public interface for a loader
     * Can optionally include soft delete filtering
     * @param column
     * @param loaderName
     * @param hasSoftDelete
     */
    private static loaderPublicMethod;
    /** // TODO:- add compound key loaders i.e. orgMembers.byOrgIdAndUserId()
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     * @param hasSoftDelete
     */
    private addByColumnLoader;
    /**
     * Build a loader to load many rows for each key
     * At the moment, this always filters out soft deleted rows
     * @param column
     * @param hasSoftDelete
     */
    private addManyByColumnLoader;
    /**
     * Build a loader to query rows from a table.
     * Doesn't use batching or caching as this is very hard to support.
     * Gives the option of including soft deleted rows
     * // TODO:-
     *     - cursor pagination,
     *     - ordering - multiple directions and columns?, remove string constants?
     *     - Joins (join filtering), eager load?
     *     type defs
     *      - import schemats project
     *      - gen more comprehensive types for each table i.e. SelectionSet
     *      - Split the type outputs by table maybe?)
     * @param hasSoftDelete
     */
    private addFindMany;
}
export {};
