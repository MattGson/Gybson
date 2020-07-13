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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableClientBuilder = void 0;
const lodash_1 = __importDefault(require("lodash"));
const CardinalityResolver_1 = require("./CardinalityResolver");
const SOFT_DELETE_COLUMN = 'deleted';
/**
 * Builds db client methods for a table
 */
class TableClientBuilder {
    constructor(table, enums, options) {
        this.loaders = [];
        this.entityName = TableClientBuilder.PascalCase(table);
        this.table = table;
        this.enums = enums;
        this.className = `${this.entityName}`;
        this.options = options;
        this.typeNames = {
            rowTypeName: `${this.className}${options.rowTypeSuffix || 'Row'}`,
            columnTypeName: `${this.className}Column`,
            valueTypeName: `${this.className}Value`,
        };
    }
    static PascalCase(name) {
        return lodash_1.default.upperFirst(lodash_1.default.camelCase(name));
    }
    build(introspection) {
        return __awaiter(this, void 0, void 0, function* () {
            const columns = yield introspection.getTableTypes(this.table, this.enums);
            // if a soft delete column is given, check if it exists on the table
            this.softDeleteColumn =
                this.options.softDeleteColumn && columns[this.options.softDeleteColumn]
                    ? this.options.softDeleteColumn
                    : undefined;
            const tableKeys = yield introspection.getTableKeys(this.table);
            // filter duplicate columns
            const uniqueKeys = lodash_1.default.keyBy(tableKeys, 'columnName');
            Object.values(uniqueKeys).forEach((key) => {
                const { columnName } = key;
                const column = columns[columnName];
                // for now only accept loaders on string and number column types
                if (column.tsType !== 'string' && column.tsType !== 'number')
                    return;
                const isMany = CardinalityResolver_1.CardinalityResolver.isToMany(columnName, tableKeys);
                if (!isMany)
                    this.addByColumnLoader(column);
                else
                    this.addManyByColumnLoader(column);
            });
            return this.buildTemplate(this.loaders.join(`
        
        `));
        });
    }
    buildTemplate(content) {
        // TODO:- this should be in type gen
        const { rowTypeName, columnTypeName, valueTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { QueryBuilder } from 'nodent';
            import { ${this.table} } from './db-schema';

            export type ${rowTypeName} = ${this.table};
            export type ${columnTypeName} = Extract<keyof ${rowTypeName}, string>;
            export type  ${valueTypeName} = Extract<${rowTypeName}[${columnTypeName}], string | number>;

             export default class ${this.className} extends QueryBuilder<${rowTypeName}, ${columnTypeName}, ${valueTypeName}> {
                    constructor() {
                        super('${this.table}', ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined});
                    }
                ${content}
            }
            `;
    }
    /**
     * Build a public interface for a loader
     * Can optionally include soft delete filtering
     * @param column
     * @param loaderName
     * @param softDeleteFilter
     */
    loaderPublicMethod(column, loaderName, softDeleteFilter) {
        const { columnName, tsType } = column;
        if (softDeleteFilter && this.softDeleteColumn)
            return `
            public async by${TableClientBuilder.PascalCase(columnName)}(${columnName}: ${tsType}, includeDeleted = false) {
                    const row = await this.${loaderName}.load(${columnName});
                    if (row?.${this.softDeleteColumn} && !includeDeleted) return null;
                    return row;
                }
        `;
        return `
            public by${TableClientBuilder.PascalCase(columnName)}(${columnName}: ${tsType}) {
                    return this.${loaderName}.load(${columnName});
                }
        `;
    }
    /** // TODO:- add compound key loaders i.e. orgMembers.byOrgIdAndUserId()
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     */
    addByColumnLoader(column) {
        const { rowTypeName } = this.typeNames;
        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;
        this.loaders.push(`
              /* Notice that byColumn loader might return null for some keys */
                 private readonly ${loaderName} = new DataLoader<${column.tsType}, ${rowTypeName} | null>(ids => {
                    return this.byColumnLoader({ column: '${columnName}', keys: ids });
                });
                
                ${this.loaderPublicMethod(column, loaderName, true)}
            `);
    }
    /**
     * Build a loader to load many rows for each key
     * At the moment, this always filters out soft deleted rows
     * @param column
     */
    addManyByColumnLoader(column) {
        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;
        this.loaders.push(`
                private readonly ${loaderName} = new DataLoader<${column.tsType}, ${this.typeNames.rowTypeName}[]>(ids => {
                return this.manyByColumnLoader({ column: '${columnName}', keys: ids, orderBy: ['${columnName}'], filterSoftDelete: ${this.softDeleteColumn ? 'true' : 'false'} });
             });
             
            ${this.loaderPublicMethod(column, loaderName, false)}

        `);
    }
}
exports.TableClientBuilder = TableClientBuilder;
//# sourceMappingURL=TableClientBuilder.js.map