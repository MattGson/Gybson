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
        columnMapTypeName: string;
        columnTypeName: string;
        valueTypeName: string;
        whereTypeName: string;
        orderByTypeName: string;
    };
    readonly className: string;
    readonly table: string;
    private readonly enums;
    private readonly options;
    private softDeleteColumn?;
    private loaders;
    private types?;
    /**
     *
     * @param table - name of the table
     * @param enums - Definitions for DB enums
     * @param options - preferences for code gen
     */
    constructor(table: string, enums: EnumDefinitions, options: BuilderOptions);
    private static PascalCase;
    build(introspection: Introspection): Promise<string>;
    private buildTemplate;
    private buildQueryTypes;
    /**
     * Build a public interface for a loader
     * Can optionally include soft delete filtering
     * @param column
     * @param loaderName
     * @param softDeleteFilter
     */
    private loaderPublicMethod;
    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    private addCompoundByColumnLoader;
    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    private addCompoundManyByColumnLoader;
}
export {};
