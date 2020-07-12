"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLIntrospection = void 0;
const lodash_1 = require("lodash");
class MySQLIntrospection {
    constructor(knex, schemaName) {
        this.knex = knex;
        if (schemaName)
            this.schemaName = schemaName;
        else
            this.schemaName = 'public';
    }
    /**
     * Map the MySQL schema to a typescript schema
     * @param tableDefinition
     */
    mapTableDefinitionToType(tableDefinition) {
        return lodash_1.mapValues(tableDefinition, (column) => {
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
                    _logger.info(`Type [${column.dbType}] has been mapped to [any] because no specific type has been found.`);
                    column.tsType = 'any';
                    return column;
            }
        });
    }
    /**
     * Load the schema for a table
     * @param tableName
     */
    getTableDefinition(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            let tableDefinition = {};
            // const tableColumns = await this.connection.query(
            //     'SELECT column_name, data_type, is_nullable ' +
            //         'FROM information_schema.columns ' +
            //         'WHERE table_name = ? and table_schema = ?',
            //     [tableName, tableSchema],
            // );
            const tableColumns = yield this.knex('information_schema.columns')
                .select('column_name', 'data_type', 'is_nullable')
                .where({ table_name: tableName, table_schema: this.schemaName });
            tableColumns.map((schemaItem) => {
                const columnName = schemaItem.column_name;
                const dataType = schemaItem.data_type;
                tableDefinition[columnName] = {
                    dbType: dataType,
                    nullable: schemaItem.is_nullable === 'YES',
                    columnName,
                };
            });
            return tableDefinition;
        });
    }
    /**
     * Get the type definition for a table
     * @param tableName
     */
    getTableTypes(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapTableDefinitionToType(yield this.getTableDefinition(tableName));
        });
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
    getTableKeys(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.knex('information_schema.key_column_usage')
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
            return rows.map((row) => {
                return {
                    columnName: row.column_name,
                    constraintName: row.constraint_name,
                    tableName: row.table_name,
                };
            });
        });
    }
    /**
     * Get a list of all table names in schema
     */
    getSchemaTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const schemaTables = yield this.knex('information_schema.columns')
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
            return schemaTables.map((schemaItem) => schemaItem.table_name);
        });
    }
}
exports.MySQLIntrospection = MySQLIntrospection;
//# sourceMappingURL=MySQLIntrospection.js.map