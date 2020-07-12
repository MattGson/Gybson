import { Indices, TableDefinition, TableKeys } from './types';
import { PoolConnection } from 'promise-mysql';
export declare class SchemaIntrospect {
    private readonly schemaName;
    private connection;
    constructor(connection: PoolConnection, schemaName?: string);
    private static mapTableDefinitionToType;
    getTableDefinition(tableName: string, tableSchema: string): Promise<TableDefinition>;
    getTableTypes(tableName: string): Promise<TableDefinition>;
    getSchemaTables(): Promise<string[]>;
    getIndices(): Promise<Indices>;
    getKeys(): Promise<TableKeys>;
    getPrimaryKeys(): Promise<TableKeys>;
    getDefaultSchema(): string;
}
