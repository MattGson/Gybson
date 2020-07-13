import { EnumDefinitions, Introspection } from '../Introspection/IntrospectionTypes';
interface BuilderOptions {
    rowTypeSuffix: string;
}
export declare class TypeBuilder {
    private readonly tables;
    private readonly enums;
    private readonly options;
    constructor(tables: string[], enums: EnumDefinitions, options: BuilderOptions);
    /**
     * Build types for schema
     * @param introspection
     */
    build(introspection: Introspection): Promise<string>;
    /**
     * Change names of types to remove any reserved words
     * @param name
     */
    private static normalizeName;
    /**
     * Get the field type map for a table
     * @param tableName
     * @param tableDefinition
     */
    private generateTableTypes;
    /**
     * Get the row typing for a table
     * @param tableName
     * @param tableDefinition
     */
    private generateTableInterface;
    /**
     * Convert enum object to type definitions
     * @param enumObject
     */
    private static generateEnumType;
    /**
     * Get list of all tables with types
     */
    private generateTableList;
}
export {};
