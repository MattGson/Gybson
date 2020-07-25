import _ from 'lodash';
import {
    Introspection,
    KeyDefinition,
    ColumnDefinition,
    EnumDefinitions,
    TableDefinition,
} from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';

interface BuilderOptions {
    rowTypeSuffix: string;
    softDeleteColumn?: string;
}

/**
 * Builds db client methods for a table
 */
export class TableClientBuilder {
    private readonly introspection: Introspection;
    public readonly entityName: string;
    public readonly typeNames: {
        rowTypeName: string;
        columnMapTypeName: string;
        columnTypeName: string;
        valueTypeName: string;
        whereTypeName: string;
        orderByTypeName: string;
    };
    public readonly className: string;
    public readonly tableName: string;
    private readonly enums: EnumDefinitions;
    private readonly options: BuilderOptions;
    private softDeleteColumn?: string;
    private loaders: string[] = [];
    private types?: string;

    /**
     *
     * @param table - name of the table
     * @param dbIntrospection
     * @param enums - Definitions for DB enums
     * @param options - preferences for code gen
     */
    public constructor(table: string, dbIntrospection: Introspection, enums: EnumDefinitions, options: BuilderOptions) {
        this.entityName = TableClientBuilder.PascalCase(table);
        this.introspection = dbIntrospection;
        this.tableName = table;
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

    private static PascalCase(name: string) {
        return _.upperFirst(_.camelCase(name));
    }

    /**
     * Change names of types to remove any reserved words
     * @param name
     */
    private static normalizeName(name: string): string {
        const reservedKeywords = ['string', 'number', 'package', 'symbol'];
        const reserved = reservedKeywords.indexOf(name) !== -1;

        if (reserved) {
            return name + '_';
        } else {
            return name;
        }
    }

    public async build(): Promise<string> {
        const columns = await this.introspection.getTableTypes(this.tableName, this.enums);

        // if a soft delete column is given, check if it exists on the table
        this.softDeleteColumn =
            this.options.softDeleteColumn && columns[this.options.softDeleteColumn]
                ? this.options.softDeleteColumn
                : undefined;

        await this.buildLoadersForTable(columns);
        await this.buildTableTypes(columns);

        return this.buildTemplate();
    }

    private buildTemplate() {
        const { rowTypeName, columnTypeName, columnMapTypeName, whereTypeName, orderByTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { 
                    SQLQueryBuilder,
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
                } from 'gybson';
            
            ${this.types}

             export default class ${
                 this.className
             } extends SQLQueryBuilder<${rowTypeName}, ${columnTypeName}, ${columnMapTypeName}, ${whereTypeName}, ${orderByTypeName}> {
                    constructor() {
                        super('${this.tableName}', ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined});
                    }
                ${this.loaders.join(`
        
                `)}
            }
            `;
    }

    private async buildLoadersForTable(columns: TableDefinition) {
        const tableKeys = await this.introspection.getTableKeys(this.tableName);
        const unique = CardinalityResolver.getUniqueKeys(tableKeys);
        const nonUnique = CardinalityResolver.getNonUniqueKey(tableKeys);

        unique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.addCompoundByColumnLoader(keyColumns);
        });

        nonUnique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.addCompoundManyByColumnLoader(keyColumns);
        });
    }

    /**
     * Convert enum object to type definitions
     * @param enumObject
     */
    private static generateEnumType(enumObject: EnumDefinitions) {
        let enumString = '';
        for (let enumName of Object.keys(enumObject)) {
            enumString += `export type ${enumName} = `;
            enumString += enumObject[enumName].map((v: string) => `'${v}'`).join(' | ');
            enumString += ';\n';
        }
        return enumString;
    }

    private buildTableTypes(table: TableDefinition) {
        const {
            rowTypeName,
            columnTypeName,
            columnMapTypeName,
            valueTypeName,
            whereTypeName,
            orderByTypeName,
        } = this.typeNames;

        const primitives = {
            string: true,
            number: true,
            bigint: true,
            boolean: true,
            date: true,
        };
        const whereTypeForColumn = (col: ColumnDefinition) => {
            // @ts-ignore - don't have where clause for special (enum) types
            if (!col.tsType || !primitives[col.tsType]) return '';
            return ` | ${TableClientBuilder.PascalCase(col.tsType)}Where${col.nullable ? 'Nullable | null' : ''}`;
        };

        this.types = `
                
                // TODO:- split this by table?
                ${TableClientBuilder.generateEnumType(this.enums)}
               
                export namespace ${this.tableName}Fields {
                    ${Object.entries(table).map(([columnName, columnDefinition]) => {
                        let type = columnDefinition.tsType;
                        let nullable = columnDefinition.nullable ? '| null' : '';
                        return `export type ${TableClientBuilder.normalizeName(columnName)} = ${type}${nullable};`;
                    }).join(' ')}
                }
                    
                 export interface ${this.typeNames.rowTypeName} {
                    ${Object.keys(table).map((columnName) => {
                        return `${columnName}: ${this.tableName}Fields.${TableClientBuilder.normalizeName(
                            columnName,
                        )};`;
                    }).join(' ')}
                }
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
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    private addCompoundByColumnLoader(columns: ColumnDefinition[]) {
        const { rowTypeName } = this.typeNames;

        const colNames = columns.map((col) => col.columnName);
        const keyType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)} }`;
        const paramType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)}; ${
            this.softDeleteColumn ? 'includeDeleted?: boolean' : ''
        } }`;
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
    private addCompoundManyByColumnLoader(columns: ColumnDefinition[]) {
        const { rowTypeName, orderByTypeName } = this.typeNames;

        const colNames = columns.map((col) => col.columnName);
        const keyType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        const paramType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)}; ${
            this.softDeleteColumn ? 'includeDeleted?: boolean;' : ''
        }`;

        const loadKeyName = colNames.map((name) => TableClientBuilder.PascalCase(name)).join('And');
        const loaderName = `${this.entityName}By${loadKeyName}Loader`;

        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<{ ${keyType} orderBy: ${orderByTypeName} | undefined; }, ${rowTypeName}[]>(keys => {
                    const [first] = keys;
                    keys.map(k => delete k.orderBy); // remove key so its not included as a load param
                    // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
                    return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
                }, {
                    // ignore order for cache equivalency TODO - re-assess - will this compare objects properly?
                    cacheKeyFn: (k => ({...k, orderBy: {}}))
                });
                
                 public async by${loadKeyName}({ ${colNames.join(
            ',',
        )}, orderBy }: { ${paramType} orderBy?: ${orderByTypeName} }) {
                    return this.${loaderName}.load({ ${colNames.join(',')}, orderBy });
                }
                
            `);
    }
}
