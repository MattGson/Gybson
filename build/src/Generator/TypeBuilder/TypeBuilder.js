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
exports.TypeBuilder = void 0;
class TypeBuilder {
    constructor(tables, enums, options) {
        this.tables = tables;
        this.options = options;
        this.enums = enums;
    }
    /**
     * Build types for schema
     * @param introspection
     */
    build(introspection) {
        return __awaiter(this, void 0, void 0, function* () {
            let content = ``;
            content += TypeBuilder.generateEnumType(this.enums);
            for (let table of this.tables) {
                const columns = yield introspection.getTableTypes(table);
                const tableTypes = yield this.generateTableTypes(table, columns);
                const tableRow = yield this.generateTableInterface(table, columns);
                content += tableTypes;
                content += tableRow;
            }
            content += this.generateTableList();
            return content;
        });
    }
    /**
     * Change names of types to remove any reserved words
     * @param name
     */
    static normalizeName(name) {
        const reservedKeywords = ['string', 'number', 'package', 'symbol'];
        const reserved = reservedKeywords.indexOf(name) !== -1;
        if (reserved) {
            return name + '_';
        }
        else {
            return name;
        }
    }
    /**
     * Get the field type map for a table
     * @param tableName
     * @param tableDefinition
     */
    generateTableTypes(tableName, tableDefinition) {
        let fields = '';
        Object.keys(tableDefinition).forEach((columnName) => {
            let type = tableDefinition[columnName].tsType;
            let nullable = tableDefinition[columnName].nullable ? '| null' : '';
            fields += `export type ${TypeBuilder.normalizeName(columnName)} = ${type}${nullable};\n`;
        });
        return `
        export namespace ${tableName}Fields {
        ${fields}
        }
    `;
    }
    /**
     * Get the row typing for a table
     * @param tableName
     * @param tableDefinition
     */
    generateTableInterface(tableName, tableDefinition) {
        let members = '';
        Object.keys(tableDefinition).forEach((columnName) => {
            members += `${columnName}: ${tableName}Fields.${TypeBuilder.normalizeName(columnName)};\n`;
        });
        return `
        export interface ${TypeBuilder.normalizeName(tableName)} {
        ${members}
        }
    `;
    }
    /**
     * Convert enum object to type definitions
     * @param enumObject
     */
    static generateEnumType(enumObject) {
        let enumString = '';
        for (let enumName in Object.keys(enumObject)) {
            enumString += `export type ${enumName} = `;
            enumString += enumObject[enumName].map((v) => `'${v}'`).join(' | ');
            enumString += ';\n';
        }
        return enumString;
    }
    /**
     * Get list of all tables with types
     */
    generateTableList() {
        return __awaiter(this, void 0, void 0, function* () {
            const tableRows = this.tables.reduce((result, tbl) => {
                return result.concat(`${tbl}: dbt.${tbl};`);
            }, []);
            return `
      export interface DBTables {
        ${tableRows.join('\n')}
      }

      export type DBTableName = Extract<keyof DBTables, string>;
    `;
        });
    }
}
exports.TypeBuilder = TypeBuilder;
//# sourceMappingURL=TypeBuilder.js.map