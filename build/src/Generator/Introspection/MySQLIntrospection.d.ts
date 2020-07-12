import { Introspection, KeyDefinition, TableDefinition } from './IntrospectionTypes';
import Knex = require('knex');
export declare class MySQLIntrospection implements Introspection {
    private readonly schemaName;
    private knex;
    constructor(knex: Knex, schemaName?: string);
    /**
     * Map the MySQL schema to a typescript schema
     * @param tableDefinition
     */
    private mapTableDefinitionToType;
    /**
     * Load the schema for a table
     * @param tableName
     */
    private getTableDefinition;
    /**
     * Get the type definition for a table
     * @param tableName
     */
    getTableTypes(tableName: string): Promise<TableDefinition>;
    getTableKeys(tableName: string): Promise<KeyDefinition[]>;
    /**
     * Get a list of all table names in schema
     */
    getSchemaTables(): Promise<string[]>;
}
