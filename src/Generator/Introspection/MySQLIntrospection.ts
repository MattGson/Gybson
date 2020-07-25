import {
    EnumDefinitions,
    Introspection,
    KeyDefinition,
    RelationDefinitions,
    TableDefinition,
} from './IntrospectionTypes';
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
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    private static getTsTypeForColumn(
        tableName: string,
        columnName: string,
        dbType: string,
        customTypes: EnumDefinitions,
    ): string {
        switch (dbType) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'time':
            case 'geometry':
                // case 'set':
                // case 'enum': - these are handled in the default case
                return 'string';
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
                return 'number';
            case 'tinyint':
                return 'boolean';
            case 'json':
                return 'Object';
            case 'date':
            case 'datetime':
            case 'timestamp':
                return 'Date';
            case 'tinyblob':
            case 'mediumblob':
            case 'longblob':
            case 'blob':
            case 'binary':
            case 'varbinary':
            case 'bit':
                return 'Buffer';
            default:
                const possibleEnum = MySQLIntrospection.getEnumName(tableName, columnName);
                if (customTypes[possibleEnum]) {
                    return possibleEnum;
                } else {
                    console.log(
                        `Type [${columnName}] has been mapped to [any] because no specific type has been found.`,
                    );
                    return 'any';
                }
        }
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
     * @param columnName
     */
    private static getEnumName(tableName: string, columnName: string): string {
        return `${tableName}_${columnName}`;
    }

    /**
     * Get the enum types for a table
     * Note: - SET type is supported as well as ENUM but should rarely be used
     */
    public async getEnumTypesForTable(tableName: string): Promise<EnumDefinitions> {
        let enums: { [enumName: string]: string[] } = {};

        const rawEnumRecords = await this.knex('information_schema.columns')
            .select('table_name', 'column_name', 'column_type')
            .whereIn('data_type', ['enum', 'set'])
            .where({ table_schema: this.schemaName, table_name: tableName });

        rawEnumRecords.forEach((enumItem: { table_name: string; column_name: string; column_type: string }) => {
            const enumName = MySQLIntrospection.getEnumName(enumItem.table_name, enumItem.column_name);
            enums[enumName] = MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type);
        });
        return enums;
    }

    /**
     * Load the schema for a table
     * @param tableName
     * @param enumTypes
     */
    private async getTableDefinition(tableName: string, enumTypes: EnumDefinitions) {
        let tableDefinition: TableDefinition = {};

        const tableColumns = await this.knex('information_schema.columns')
            .select('column_name', 'data_type', 'is_nullable')
            .where({ table_name: tableName, table_schema: this.schemaName });

        tableColumns.map((schemaItem: { column_name: string; data_type: string; is_nullable: string }) => {
            const columnName = schemaItem.column_name;
            const dbType = schemaItem.data_type;
            tableDefinition[columnName] = {
                dbType,
                nullable: schemaItem.is_nullable === 'YES',
                columnName,
                tsType: MySQLIntrospection.getTsTypeForColumn(tableName, columnName, dbType, enumTypes),
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
        return await this.getTableDefinition(tableName, enumTypes);
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
     * Get all relations where the given table holds the constraint (1-N)
     * @param tableName
     */
    public async getForwardRelations(tableName: string): Promise<RelationDefinitions> {
        const rows = await this.knex('information_schema.key_column_usage')
            .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
            .where({ table_name: tableName, table_schema: this.schemaName });

        let relations: RelationDefinitions = {};
        rows.forEach((row) => {
            const { column_name, referenced_table_name, referenced_column_name } = row;
            if (referenced_table_name == null || referenced_column_name == null) return;
            if (!relations[referenced_table_name]) relations[referenced_table_name] = [];
            relations[referenced_table_name].push({
                fromColumn: column_name,
                toColumn: referenced_column_name,
            });
        });
        return relations;
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
