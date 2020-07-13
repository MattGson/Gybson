import { Introspection, EnumDefinitions } from '../Introspection/IntrospectionTypes';
interface BuilderOptions {
    rowTypeSuffix: string;
    softDeleteColumn?: string;
}
/**
 * Builds db client methods for a table
 */
export declare class TableClientBuilder {
    readonly entityName: string;
    readonly typeNames: {
        rowTypeName: string;
        columnTypeName: string;
        valueTypeName: string;
    };
    readonly className: string;
    readonly table: string;
    private readonly enums;
    private readonly options;
    private softDeleteColumn?;
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
     * @param softDeleteFilter
     */
    private loaderPublicMethod;
    /** // TODO:- add compound key loaders i.e. orgMembers.byOrgIdAndUserId()
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     */
    private addByColumnLoader;
    /**
     * Build a loader to load many rows for each key
     * At the moment, this always filters out soft deleted rows
     * @param column
     */
    private addManyByColumnLoader;
}
export {};
