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
            columnMapTypeName: `${this.className}ColumnMap`,
            valueTypeName: `${this.className}Value`,
            whereTypeName: `${this.className}Where`,
            orderByTypeName: `${this.className}OrderBy`,
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
            // TODO:- work out where this goes
            this.types = this.buildQueryTypes(columns);
            const tableKeys = yield introspection.getTableKeys(this.table);
            const unique = CardinalityResolver_1.CardinalityResolver.getUniqueKeys(tableKeys);
            const nonUnique = CardinalityResolver_1.CardinalityResolver.getNonUniqueKey(tableKeys);
            unique.forEach((key) => {
                // for now only accept loaders on string and number column types
                const keyColumns = key.map((k) => columns[k.columnName]);
                for (let col of keyColumns) {
                    if (col.tsType !== 'string' && col.tsType !== 'number')
                        return;
                }
                this.addCompoundByColumnLoader(keyColumns);
            });
            nonUnique.forEach((key) => {
                // for now only accept loaders on string and number column types
                const keyColumns = key.map((k) => columns[k.columnName]);
                for (let col of keyColumns) {
                    if (col.tsType !== 'string' && col.tsType !== 'number')
                        return;
                }
                this.addCompoundManyByColumnLoader(keyColumns);
            });
            return this.buildTemplate(this.loaders.join(`
        
        `));
        });
    }
    buildTemplate(content) {
        const { rowTypeName, columnTypeName, columnMapTypeName, whereTypeName, orderByTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { SQLQueryBuilder } from 'nodent';
            import { ${this.table}, ${Object.keys(this.enums).join(',')} } from './db-schema';
            
            ${this.types}

             export default class ${this.className} extends SQLQueryBuilder<${rowTypeName}, ${columnTypeName}, ${columnMapTypeName}, ${whereTypeName}, ${orderByTypeName}> {
                    constructor() {
                        super('${this.table}', ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined});
                    }
                ${content}
            }
            `;
    }
    // TODO:- where should this go?
    buildQueryTypes(table) {
        const { rowTypeName, columnTypeName, columnMapTypeName, valueTypeName, whereTypeName, orderByTypeName, } = this.typeNames;
        const primitives = {
            string: true,
            number: true,
            bigint: true,
            boolean: true,
            date: true,
        };
        const whereTypeForColumn = (col) => {
            // @ts-ignore - don't have where clause for special (enum) types
            if (!col.tsType || !primitives[col.tsType])
                return '';
            return ` | ${TableClientBuilder.PascalCase(col.tsType)}Where${col.nullable ? 'Nullable | null' : ''}`;
        };
        return `
                
                import { 
                    Order, 
                    Enumerable, 
                    NumberWhere, 
                    NumberWhereNullable, 
                    StringWhere, 
                    StringWhereNullable, 
                    BooleanWhere, 
                    BooleanWhereNullable, 
                    DateWhere, 
                    DateWhereNullable 
                } from 'nodent';
               
                export type ${rowTypeName} = ${this.table};
                export type ${columnTypeName} = Extract<keyof ${rowTypeName}, string>;
                export type  ${valueTypeName} = Extract<${rowTypeName}[${columnTypeName}], string | number>;
                
                export type ${columnMapTypeName} = {
                    ${Object.values(table)
            .map((col) => {
            return `${col.columnName}: boolean;`;
        })
            .join(' ')}
                }
                
                export type ${whereTypeName} = {
                    ${Object.values(table)
            .map((col) => {
            return `${col.columnName}?: ${col.tsType} ${whereTypeForColumn(col)};`;
        })
            .join(' ')}
                    AND?: Enumerable<${whereTypeName}>;
                    OR?: Enumerable<${whereTypeName}>;
                    NOT?: Enumerable<${whereTypeName}>;
                };
                
                
                export type ${orderByTypeName} = {
                    ${Object.values(table)
            .map((col) => {
            return `${col.columnName}?: Order;`;
        })
            .join(' ')}
                };
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
    /**
     *   // TODO:- compound loader is a more general case so maybe don't need this?
     * //  TODO  - Localise public methods
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     */
    // private addByColumnLoader(column: ColumnDefinition) {
    //     const { rowTypeName } = this.typeNames;
    //
    //     const { columnName } = column;
    //     const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;
    //
    //     this.loaders.push(`
    //              private readonly ${loaderName} = new DataLoader<${column.tsType}, ${rowTypeName} | null>(ids => {
    //                 return this.byColumnLoader({ column: '${columnName}', keys: ids });
    //             });
    //
    //             ${this.loaderPublicMethod(column, loaderName, true)}
    //         `);
    // }
    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    addCompoundByColumnLoader(columns) {
        const { rowTypeName } = this.typeNames;
        const colNames = columns.map((col) => col.columnName);
        const keyType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)} }`;
        const paramType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)}; ${this.softDeleteColumn ? 'includeDeleted?: boolean' : ''} }`;
        const paramNames = `{ ${colNames.join(',')} ${this.softDeleteColumn ? ', includeDeleted' : ''} }`;
        const loadKeyName = colNames.map((name) => TableClientBuilder.PascalCase(name)).join('And');
        const loaderName = `${this.entityName}By${loadKeyName}Loader`;
        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<${keyType}, ${rowTypeName} | null>(keys => {
                    return this.byCompoundColumnLoader({ keys });
                });
                
                 public async by${loadKeyName}(${paramNames}: ${paramType}) {
                    const row = await this.${loaderName}.load({ ${colNames.join(',')} });
                    ${this.softDeleteColumn ? `if (row?.${this.softDeleteColumn} && !includeDeleted) return null;` : ''}
                    return row;
                }
                
            `);
    }
    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    addCompoundManyByColumnLoader(columns) {
        const { rowTypeName } = this.typeNames;
        const colNames = columns.map((col) => col.columnName);
        const keyType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)}; orderBy: ${this.typeNames.orderByTypeName}; }`;
        const paramType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)}; orderBy: ${this.typeNames.orderByTypeName}; ${this.softDeleteColumn ? 'includeDeleted?: boolean' : ''} }`;
        const loadKeyName = colNames.map((name) => TableClientBuilder.PascalCase(name)).join('And');
        const loaderName = `${this.entityName}By${loadKeyName}Loader`;
        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<${keyType}, ${rowTypeName}[]>(keys => {
                    const [first] = keys;
                    // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
                    return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
                }, {
                    // ignore order for cache equivalency TODO - re-assess
                    cacheKeyFn: (k => ({...k, orderBy: {}}))
                });
                
                 public async by${loadKeyName}({ ${colNames.join(',')}, orderBy }: ${paramType}) {
                    return this.${loaderName}.load({ ${colNames.join(',')}, orderBy });
                }
                
            `);
    }
}
exports.TableClientBuilder = TableClientBuilder;
//# sourceMappingURL=TableClientBuilder.js.map