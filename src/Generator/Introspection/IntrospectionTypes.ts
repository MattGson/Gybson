import { ColumnDefinition, ColumnType, EnumDefinition, RelationDefinition } from '../../TypeTruth/TypeTruth';

export interface Introspection {
    getTableTypes(table: string, enumTypes: EnumDefinitions): Promise<TableDefinition>;
    getTableKeys(table: string): Promise<KeyDefinition[]>;
    getForwardRelations(table: string): Promise<RelationDefinition[]>;
    getBackwardRelations(table: string): Promise<RelationDefinition[]>;
    getSchemaTables(): Promise<string[]>;
    getEnumTypesForTable(table: string): Promise<EnumDefinitions>;
    getTsTypeForColumn(tableName: string, columnName: string, dbType: string, customTypes: EnumDefinitions): ColumnType;
}

export interface KeyDefinition {
    tableName: string;
    columnName: string;
    constraintName: string;
    constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE';
}

export interface TableDefinition {
    [columnName: string]: ColumnDefinition;
}

export interface EnumDefinitions {
    [enumName: string]: EnumDefinition;
}
