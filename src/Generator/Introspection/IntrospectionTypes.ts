import { ColumnDefinition, EnumDefinition, RelationDefinition } from '../../TypeTruth/TypeTruth';

export interface Introspection {
    getTableTypes(table: string, enumTypes: EnumDefinitions): Promise<TableDefinition>;
    getTableKeys(table: string): Promise<KeyDefinition[]>;
    getForwardRelations(table: string): Promise<RelationDefinition[]>;
    getBackwardRelations(table: string): Promise<RelationDefinition[]>;
    getSchemaTables(): Promise<string[]>;
    getEnumTypesForTable(table: string): Promise<EnumDefinitions>;
}

export interface KeyDefinition {
    tableName: string;
    columnName: string;
    constraintName: string;
}

export interface TableDefinition {
    [columnName: string]: ColumnDefinition;
}

export interface EnumDefinitions {
    [enumName: string]: EnumDefinition;
}
