import { mapValues, isEqual } from 'lodash';
import { EnumDefinitions, Introspection, KeyDefinition, TableDefinition } from './IntrospectionTypes';
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
     * @param customTypes - enum and set types
     */
    private mapTableDefinitionToType(tableDefinition: TableDefinition, customTypes: string[]): TableDefinition {
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
                    if (customTypes.indexOf(column.columnName) !== -1) {
                        column.tsType = column.columnName;
                        return column;
                    } else {
                        console.log(
                            `Type [${column.columnName}] has been mapped to [any] because no specific type has been found.`,
                        );
                        column.tsType = 'any';
                        return column;
                    }
            }
        });
    }

    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    private static parseMysqlEnumeration(mysqlEnum: string): string[] {
        return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`);
    }

    /**
     * Get name of enum
     * @param tableName
     * @param dataType
     * @param columnName
     */
    private static getEnumName(tableName: string, dataType: string, columnName: string): string {
        return `${tableName}_${dataType}_${columnName}`;
    }

    /**
     * Get the enum types from the database schema
     */
    public async getEnumTypes(): Promise<EnumDefinitions> {
        let enums: { [enumName: string]: string[] } = {};
        // let enumSchemaWhereClause: string;
        // let params: string[];
        // if (schema) {
        //         //     enumSchemaWhereClause = `and table_schema = ?`;
        //         //     params = [schema];
        //         // } else {
        //         //     enumSchemaWhereClause = '';
        //         //     params = [];
        //         // }
        //         // const rawEnumRecords = await this.queryAsync(
        //         //     'SELECT column_name, column_type, data_type ' +
        //         //         'FROM information_schema.columns ' +
        //         //         `WHERE data_type IN ('enum', 'set') ${enumSchemaWhereClause}`,
        //         //     params,
        //         // );

        const rawEnumRecords = await this.knex('information_schema.columns')
            .select('table_name', 'column_name', 'column_type', 'data_type')
            .whereIn('data_type', ['enum', 'set'])
            .where({ table_schema: this.schemaName });

        rawEnumRecords.forEach(
            (enumItem: { table_name: string; column_name: string; column_type: string; data_type: string }) => {
                const enumName = MySQLIntrospection.getEnumName(
                    enumItem.table_name,
                    enumItem.data_type,
                    enumItem.column_name,
                );
                const enumValues = MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type);

                // make sure no duplicates
                if (enums[enumName] && !isEqual(enums[enumName], enumValues)) {
                    const errorMsg =
                        `Multiple enums with the same name and contradicting types were found: ` +
                        `${enumItem.column_name}: ${JSON.stringify(enums[enumName])} and ${JSON.stringify(enumValues)}`;
                    throw new Error(errorMsg);
                }
                enums[enumName] = enumValues;
            },
        );
        return enums;
    }

    /**
     * Load the schema for a table
     * @param tableName
     */
    private async getTableDefinition(tableName: string) {
        let tableDefinition: TableDefinition = {};

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
     * @param enumTypes
     */
    public async getTableTypes(tableName: string, enumTypes: EnumDefinitions): Promise<TableDefinition> {
        let customTypes = Object.keys(enumTypes);
        return this.mapTableDefinitionToType(await this.getTableDefinition(tableName), customTypes);
    }

    public async getTableKeys(tableName: string): Promise<KeyDefinition[]> {
        const rows = await this.knex('information_schema.key_column_usage')
            .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
            .where({ table_name: tableName, table_schema: this.schemaName });

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

        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }
}
