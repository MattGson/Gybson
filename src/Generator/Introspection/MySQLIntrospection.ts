import { mapValues } from 'lodash';
import {Introspection, KeyDefinition, TableDefinition} from './IntrospectionTypes';
import Knex = require('knex');

export class MySQLIntrospection implements Introspection {
    private readonly schemaName: string;
    private knex: Knex;

    public constructor(knex: Knex, schemaName?: string) {
        this.knex = knex;
        if (schemaName) this.schemaName = schemaName;
        else this.schemaName = 'public';
    }

    /**
     * Map the MySQL schema to a typescript schema
     * @param tableDefinition
     */
    private mapTableDefinitionToType(tableDefinition: TableDefinition): TableDefinition {
        return mapValues(tableDefinition, (column) => {
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
                    _logger.info(
                        `Type [${column.dbType}] has been mapped to [any] because no specific type has been found.`,
                    );
                    column.tsType = 'any';
                    return column;
            }
        });
    }

    /**
     * Load the schema for a table
     * @param tableName
     */
    private async getTableDefinition(tableName: string) {
        let tableDefinition: TableDefinition = {};

        // const tableColumns = await this.connection.query(
        //     'SELECT column_name, data_type, is_nullable ' +
        //         'FROM information_schema.columns ' +
        //         'WHERE table_name = ? and table_schema = ?',
        //     [tableName, tableSchema],
        // );
        const tableColumns = await this.knex('information_schema.columns')
            .select('column_name', 'data_type', 'is_nullable')
            .where({ table_name: tableName, table_schema: this.schemaName });

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

    /**
     * Get the type definition for a table
     * @param tableName
     */
    public async getTableTypes(tableName: string): Promise<TableDefinition> {
        return this.mapTableDefinitionToType(await this.getTableDefinition(tableName));
    }

    // public async getIndices(): Promise<Indices> {
    //     const rows = await this.connection.query(
    //         `
    //            SELECT table_name, non_unique, index_name, column_name
    //              FROM information_schema.statistics
    //              WHERE table_schema = ?
    //         `,
    //         [this.schemaName],
    //     );
    //     const indices = rows.map(
    //         (row: {
    //             table_name: string;
    //             non_unique: number;
    //             index_name: string;
    //             column_name: string;
    //         }): IndexDefinition => {
    //             return {
    //                 unique: !row.non_unique,
    //                 columnName: row.column_name,
    //                 indexName: row.index_name,
    //                 tableName: row.table_name,
    //             };
    //         },
    //     );
    //     return _.groupBy(indices, 'tableName');
    // }

    public async getTableKeys(tableName: string): Promise<KeyDefinition[]> {
        const rows = await this.knex('information_schema.key_column_usage')
            .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
            .where({ table_name: tableName, table_schema: this.schemaName });
        // const rows = await this.connection.query(
        //     `
        //         SELECT
        //             table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
        //         FROM
        //             INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        //          WHERE table_schema = ?
        //     `,
        //     [this.schemaName],
        // );
        return rows.map((row: { table_name: string; constraint_name: string; column_name: string }) => {
            return {
                columnName: row.column_name,
                constraintName: row.constraint_name,
                tableName: row.table_name,
            };
        });
    }

    /**
     * Get a list of all table names in schema
     */
    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = await this.knex('information_schema.columns')
            .select('table_name')
            .where({ table_schema: this.schemaName })
            .groupBy('table_name');

        // const schemaTables = await this.connection.query(
        //     'SELECT table_name ' +
        //         'FROM information_schema.columns ' +
        //         'WHERE table_schema = ? ' +
        //         'GROUP BY table_name',
        //     [this.schemaName],
        // );
        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }

    // public async getPrimaryKeys(): Promise<TableKeys> {
    //     const rows = await this.connection.query(
    //         `
    //             SELECT
    //                 table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
    //             FROM
    //                 INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    //              WHERE table_schema = ? AND constraint_name = 'PRIMARY'
    //         `,
    //         [this.schemaName],
    //     );
    //     const keys: KeyColumn[] = rows.map(
    //         (row: { table_name: string; constraint_name: string; column_name: string }) => {
    //             return {
    //                 columnName: row.column_name,
    //                 constraintName: row.constraint_name,
    //                 tableName: row.table_name,
    //             };
    //         },
    //     );
    //
    //     return _.groupBy(keys, 'tableName');
    // }

    // public getDefaultSchema(): string {
    //     return this.schemaName;
    // }
}
