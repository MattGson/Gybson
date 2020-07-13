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
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    static getTsTypeForColumn(tableName, columnName, dbType, customTypes) {
        if (dbType === 'enum')
            console.log('ENUM: ', columnName, dbType);
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
                console.log(possibleEnum);
                console.log(customTypes);
                if (customTypes[possibleEnum]) {
                    return possibleEnum;
                }
                else {
                    console.log(`Type [${columnName}] has been mapped to [any] because no specific type has been found.`);
                    return 'any';
                }
        }
    }
    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    static parseMysqlEnumeration(mysqlEnum) {
        return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`);
    }
    /**
     * Get name of enum
     * @param tableName
     * @param columnName
     */
    static getEnumName(tableName, columnName) {
        return `${tableName}_${columnName}`;
    }
    /**
     * Get the enum types from the database schema
     * Note: - SET type is supported as well as ENUM but should rarely be used
     */
    getEnumTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            let enums = {};
            const rawEnumRecords = yield this.knex('information_schema.columns')
                .select('table_name', 'column_name', 'column_type')
                .whereIn('data_type', ['enum', 'set'])
                .where({ table_schema: this.schemaName });
            rawEnumRecords.forEach((enumItem) => {
                const enumName = MySQLIntrospection.getEnumName(enumItem.table_name, enumItem.column_name);
                const enumValues = MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type);
                // make sure no duplicates
                if (enums[enumName] && !lodash_1.isEqual(enums[enumName], enumValues)) {
                    const errorMsg = `Multiple enums with the same name and contradicting types were found: ` +
                        `${enumItem.column_name}: ${JSON.stringify(enums[enumName])} and ${JSON.stringify(enumValues)}`;
                    throw new Error(errorMsg);
                }
                enums[enumName] = enumValues;
            });
            return enums;
        });
    }
    /**
     * Load the schema for a table
     * @param tableName
     * @param enumTypes
     */
    getTableDefinition(tableName, enumTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            let tableDefinition = {};
            const tableColumns = yield this.knex('information_schema.columns')
                .select('column_name', 'data_type', 'is_nullable')
                .where({ table_name: tableName, table_schema: this.schemaName });
            tableColumns.map((schemaItem) => {
                const columnName = schemaItem.column_name;
                const dbType = schemaItem.data_type;
                tableDefinition[columnName] = {
                    dbType,
                    nullable: schemaItem.is_nullable === 'YES',
                    columnName,
                    tsType: MySQLIntrospection.getTsTypeForColumn(tableName, columnName, dbType, enumTypes),
                };
            });
            if (tableName === 'plan_user_roles')
                console.log(tableDefinition);
            return tableDefinition;
        });
    }
    /**
     * Get the type definition for a table
     * @param tableName
     * @param enumTypes
     */
    getTableTypes(tableName, enumTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getTableDefinition(tableName, enumTypes);
        });
    }
    getTableKeys(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.knex('information_schema.key_column_usage')
                .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
                .where({ table_name: tableName, table_schema: this.schemaName });
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
            return schemaTables.map((schemaItem) => schemaItem.table_name);
        });
    }
}
exports.MySQLIntrospection = MySQLIntrospection;
//# sourceMappingURL=MySQLIntrospection.js.map