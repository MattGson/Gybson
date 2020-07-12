"use strict";
/**
 * Created by Matt Goodson
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableTypes = exports.generateEnumType = exports.generateTableInterface = void 0;
function nameIsReservedKeyword(name) {
    const reservedKeywords = ['string', 'number', 'package', 'symbol'];
    return reservedKeywords.indexOf(name) !== -1;
}
function normalizeName(name, _options) {
    if (nameIsReservedKeyword(name)) {
        return name + '_';
    }
    else {
        return name;
    }
}
function generateTableInterface(tableNameRaw, tableDefinition, options) {
    const tableName = options.transformTypeName(tableNameRaw);
    let members = '';
    Object.keys(tableDefinition)
        .map((c) => options.transformColumnName(c))
        .forEach((columnName) => {
        members += `${columnName}: ${tableName}Fields.${normalizeName(columnName, options)};\n`;
    });
    return `
        export interface ${normalizeName(tableName, options)} {
        ${members}
        }
    `;
}
exports.generateTableInterface = generateTableInterface;
function generateEnumType(enumObject, options) {
    let enumString = '';
    for (let enumNameRaw in enumObject) {
        const enumName = options.transformTypeName(enumNameRaw);
        enumString += `export type ${enumName} = `;
        enumString += enumObject[enumNameRaw].map((v) => `'${v}'`).join(' | ');
        enumString += ';\n';
    }
    return enumString;
}
exports.generateEnumType = generateEnumType;
function generateTableTypes(tableNameRaw, tableDefinition, options) {
    const tableName = options.transformTypeName(tableNameRaw);
    let fields = '';
    Object.keys(tableDefinition).forEach((columnNameRaw) => {
        let type = tableDefinition[columnNameRaw].tsType;
        let nullable = tableDefinition[columnNameRaw].nullable ? '| null' : '';
        const columnName = options.transformColumnName(columnNameRaw);
        fields += `export type ${normalizeName(columnName, options)} = ${type}${nullable};\n`;
    });
    return `
        export namespace ${tableName}Fields {
        ${fields}
        }
    `;
}
exports.generateTableTypes = generateTableTypes;
//# sourceMappingURL=typescript.js.map