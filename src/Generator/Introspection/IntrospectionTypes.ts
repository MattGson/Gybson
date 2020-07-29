export interface Introspection {
    getTableTypes(table: string, enumTypes: EnumDefinitions): Promise<TableDefinition>;
    getTableKeys(table: string): Promise<KeyDefinition[]>;
    getForwardRelations(table: string): Promise<RelationDefinition[]>;
    getBackwardRelations(table: string): Promise<RelationDefinition[]>;
    getSchemaTables(): Promise<string[]>;
    getEnumTypesForTable(table: string): Promise<EnumDefinitions>;
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

export interface EnumDefinitions {
    [enumName: string]: string[];
}

// export interface RelationColumn {
//     constraintName: string;
//     fromColumnName: string;
//     fromTableName: string;
//     toColumnName: string;
//     toTableName: string;
// }
//
// export interface RelationDefinitions {
//     [constraintName: string]: RelationColumn[];
// }

// export interface JoinColumns {
//     fromColumn: string;
//     toColumn: string;
// }

// export interface RelationDefinition {
//     // name of table to join to
//     toTable: string;
//     // name of column to join from
//     fromColumn: string;
//     // name of column to join to
//     toColumn: string;
//     // name of relation i.e. posts -> users would be 'author'
//     relationAlias: string;
// }