import { EnumDefinitions, Introspection, KeyDefinition, TableDefinition } from './IntrospectionTypes';
import Knex = require('knex');
export declare class MySQLIntrospection implements Introspection {
    private readonly schemaName;
    private knex;
    constructor(knex: Knex, schemaName?: string);
    /**
     * Map the MySQL schema to a typescript schema
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    private static getTsTypeForColumn;
    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    private static parseMysqlEnumeration;
    /**
     * Get name of enum
     * @param tableName
     * @param columnName
     */
    private static getEnumName;
    /**
     * Get the enum types from the database schema
     * Note: - SET type is supported as well as ENUM but should rarely be used
     */
    getEnumTypes(): Promise<EnumDefinitions>;
    /**
     * Load the schema for a table
     * @param tableName
     * @param enumTypes
     */
    private getTableDefinition;
    /**
     * Get the type definition for a table
     * @param tableName
     * @param enumTypes
     */
    getTableTypes(tableName: string, enumTypes: EnumDefinitions): Promise<TableDefinition>;
    getTableKeys(tableName: string): Promise<KeyDefinition[]>;
    /**
     * Get a list of all table names in schema
     */
    getSchemaTables(): Promise<string[]>;
}
