export interface Introspection {
    getTableTypes(table: string): Promise<TableDefinition>;
    getTableKeys(table: string): Promise<KeyDefinition[]>;
    getSchemaTables(): Promise<string[]>;
}

export interface ColumnDefinition {
    dbType: string;
    nullable: boolean;
    tsType?: string;
    columnName: string;
}

export interface KeyDefinition {
    tableName: string;
    columnName: string;
    constraintName: string;
}

export interface TableDefinition {
    [columnName: string]: ColumnDefinition;
}
