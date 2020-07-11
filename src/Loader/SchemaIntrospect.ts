import _, { mapValues } from 'lodash';
import { IndexDefinition, Indices, KeyColumn, TableDefinition, TableKeys } from './types';
import { PoolConnection } from 'promise-mysql';

export class SchemaIntrospect {
    private readonly schemaName: string;
    private connection: PoolConnection;

    public constructor(connection: PoolConnection, schemaName?: string) {
        this.connection = connection;
        if (schemaName) {
            this.schemaName = schemaName;
        } else {
            this.schemaName = 'public';
        }
    }

    // uses the type mappings from https://github.com/mysqljs/ where sensible
    private static mapTableDefinitionToType(tableDefinition: TableDefinition): TableDefinition {
        return mapValues(tableDefinition, column => {
            switch (column.dbType) {
                case 'char':
                case 'varchar':
                case 'text':
                case 'tinytext':
                case 'mediumtext':
                case 'longtext':
                case 'time':
                case 'geometry':
                case 'set':
                case 'enum':
                    // keep set and enum defaulted to string if custom type not mapped
                    column.tsType = 'string';
                    return column;
                case 'integer':
                case 'int':
                case 'smallint':
                case 'mediumint':
                case 'bigint':
                case 'double':
                case 'decimal':
                case 'numeric':
                case 'float':
                case 'year':
                    column.tsType = 'number';
                    return column;
                case 'tinyint':
                    column.tsType = 'boolean';
                    return column;
                case 'json':
                    column.tsType = 'Object';
                    return column;
                case 'date':
                case 'datetime':
                case 'timestamp':
                    column.tsType = 'Date';
                    return column;
                case 'tinyblob':
                case 'mediumblob':
                case 'longblob':
                case 'blob':
                case 'binary':
                case 'varbinary':
                case 'bit':
                    column.tsType = 'Buffer';
                    return column;
                default:
                    console.log(
                        `Type [${column.dbType}] has been mapped to [any] because no specific type has been found.`,
                    );
                    column.tsType = 'any';
                    return column;
            }
        });
    }

    public async getTableDefinition(tableName: string, tableSchema: string) {
        let tableDefinition: TableDefinition = {};

        const tableColumns = await this.connection.query(
            'SELECT column_name, data_type, is_nullable ' +
                'FROM information_schema.columns ' +
                'WHERE table_name = ? and table_schema = ?',
            [tableName, tableSchema],
        );
        tableColumns.map((schemaItem: { column_name: string; data_type: string; is_nullable: string }) => {
            const columnName = schemaItem.column_name;
            const dataType = schemaItem.data_type;
            tableDefinition[columnName] = {
                dbType: dataType,
                nullable: schemaItem.is_nullable === 'YES',
                columnName,
            };
        });
        return tableDefinition;
    }

    public async getTableTypes(tableName: string) {
        return SchemaIntrospect.mapTableDefinitionToType(await this.getTableDefinition(tableName, this.schemaName));
    }

    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = await this.connection.query(
            'SELECT table_name ' +
                'FROM information_schema.columns ' +
                'WHERE table_schema = ? ' +
                'GROUP BY table_name',
            [this.schemaName],
        );
        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }

    public async getIndices(): Promise<Indices> {
        const rows = await this.connection.query(
            `
               SELECT table_name, non_unique, index_name, column_name
                 FROM information_schema.statistics
                 WHERE table_schema = ?
            `,
            [this.schemaName],
        );
        const indices = rows.map(
            (row: {
                table_name: string;
                non_unique: number;
                index_name: string;
                column_name: string;
            }): IndexDefinition => {
                return {
                    unique: !row.non_unique,
                    columnName: row.column_name,
                    indexName: row.index_name,
                    tableName: row.table_name,
                };
            },
        );
        return _.groupBy(indices, 'tableName');
    }

    public async getKeys(): Promise<TableKeys> {
        const rows = await this.connection.query(
            `
                SELECT
                    table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE table_schema = ?
            `,
            [this.schemaName],
        );
        const keys: KeyColumn[] = rows.map(
            (row: { table_name: string; constraint_name: string; column_name: string }) => {
                return {
                    columnName: row.column_name,
                    constraintName: row.constraint_name,
                    tableName: row.table_name,
                };
            },
        );

        return _.groupBy(keys, 'tableName');
    }

    public async getPrimaryKeys(): Promise<TableKeys> {
        const rows = await this.connection.query(
            `
                SELECT
                    table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE table_schema = ? AND constraint_name = 'PRIMARY'
            `,
            [this.schemaName],
        );
        const keys: KeyColumn[] = rows.map(
            (row: { table_name: string; constraint_name: string; column_name: string }) => {
                return {
                    columnName: row.column_name,
                    constraintName: row.constraint_name,
                    tableName: row.table_name,
                };
            },
        );

        return _.groupBy(keys, 'tableName');
    }

    public getDefaultSchema(): string {
        return this.schemaName;
    }
}
