"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SchemaIntrospect = void 0;
const lodash_1 = __importStar(require("lodash"));
class SchemaIntrospect {
    constructor(connection, schemaName) {
        this.connection = connection;
        if (schemaName) {
            this.schemaName = schemaName;
        }
        else {
            this.schemaName = 'public';
        }
    }
    // uses the type mappings from https://github.com/mysqljs/ where sensible
    static mapTableDefinitionToType(tableDefinition) {
        return lodash_1.mapValues(tableDefinition, column => {
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
                    console.log(`Type [${column.dbType}] has been mapped to [any] because no specific type has been found.`);
                    column.tsType = 'any';
                    return column;
            }
        });
    }
    getTableDefinition(tableName, tableSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            let tableDefinition = {};
            const tableColumns = yield this.connection.query('SELECT column_name, data_type, is_nullable ' +
                'FROM information_schema.columns ' +
                'WHERE table_name = ? and table_schema = ?', [tableName, tableSchema]);
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
    getTableTypes(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            return SchemaIntrospect.mapTableDefinitionToType(yield this.getTableDefinition(tableName, this.schemaName));
        });
    }
    getSchemaTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const schemaTables = yield this.connection.query('SELECT table_name ' +
                'FROM information_schema.columns ' +
                'WHERE table_schema = ? ' +
                'GROUP BY table_name', [this.schemaName]);
            return schemaTables.map((schemaItem) => schemaItem.table_name);
        });
    }
    getIndices() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.connection.query(`
               SELECT table_name, non_unique, index_name, column_name
                 FROM information_schema.statistics
                 WHERE table_schema = ?
            `, [this.schemaName]);
            const indices = rows.map((row) => {
                return {
                    unique: !row.non_unique,
                    columnName: row.column_name,
                    indexName: row.index_name,
                    tableName: row.table_name,
                };
            });
            return lodash_1.default.groupBy(indices, 'tableName');
        });
    }
    getKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.connection.query(`
                SELECT
                    table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE table_schema = ?
            `, [this.schemaName]);
            const keys = rows.map((row) => {
                return {
                    columnName: row.column_name,
                    constraintName: row.constraint_name,
                    tableName: row.table_name,
                };
            });
            return lodash_1.default.groupBy(keys, 'tableName');
        });
    }
    getPrimaryKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.connection.query(`
                SELECT
                    table_name,column_name,constraint_name, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE table_schema = ? AND constraint_name = 'PRIMARY'
            `, [this.schemaName]);
            const keys = rows.map((row) => {
                return {
                    columnName: row.column_name,
                    constraintName: row.constraint_name,
                    tableName: row.table_name,
                };
            });
            return lodash_1.default.groupBy(keys, 'tableName');
        });
    }
    getDefaultSchema() {
        return this.schemaName;
    }
}
exports.SchemaIntrospect = SchemaIntrospect;
//# sourceMappingURL=SchemaIntrospect.js.map