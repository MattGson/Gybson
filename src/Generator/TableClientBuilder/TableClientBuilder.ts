import _ from 'lodash';
import {
    ColumnDefinition,
    EnumDefinitions,
    Introspection,
    RelationDefinitions,
    TableDefinition,
} from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';
import {
    buildOrderForTable,
    buildPaginateForTable,
    buildRelationFilterForTable,
    buildWhereCombinersForTable,
    buildWhereTypeForColumn,
} from '../../TypeTruth/TypeTruth';

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
        paginationTypeName: string;
        relationFilterTypeName: string;
    };
    public readonly className: string;
    public readonly tableName: string;
    private relatedTables: string[] = [];
    private readonly options: BuilderOptions;
    private softDeleteColumn?: string;
    private loaders: string[] = [];
    private types?: string;
    private relations?: string;

    /**
     * Get the name of a relation type
     * @param tableName
     */
    private static getRelationFilterName(tableName: string) {
        return `${this.PascalCase(tableName)}RelationFilter`;
    }

    /**
     *
     * @param params
     */
    public constructor(params: { table: string; dbIntrospection: Introspection; options: BuilderOptions }) {
        const { table, dbIntrospection, options } = params;
        this.entityName = TableClientBuilder.PascalCase(table);
        this.introspection = dbIntrospection;
        this.tableName = table;
        this.className = `${this.entityName}`;
        this.options = options;
        this.typeNames = {
            rowTypeName: `${this.className}${options.rowTypeSuffix || 'Row'}`,
            columnTypeName: `${this.className}Column`,
            columnMapTypeName: `${this.className}ColumnMap`,
            valueTypeName: `${this.className}Value`,
            whereTypeName: `${this.className}Where`,
            orderByTypeName: `${this.className}OrderBy`,
            paginationTypeName: `${this.className}Paginate`,
            relationFilterTypeName: TableClientBuilder.getRelationFilterName(this.tableName),
        };
    }

    private static PascalCase(name: string) {
        return _.upperFirst(_.camelCase(name));
    }

    public async build(): Promise<string> {
        const enums = await this.introspection.getEnumTypesForTable(this.tableName);
        const columns = await this.introspection.getTableTypes(this.tableName, enums);
        const forwardRelations = await this.introspection.getForwardRelations(this.tableName);

        this.relatedTables = Object.keys(forwardRelations);

        // if a soft delete column is given, check if it exists on the table
        this.softDeleteColumn =
            this.options.softDeleteColumn && columns[this.options.softDeleteColumn]
                ? this.options.softDeleteColumn
                : undefined;

        await this.buildLoadersForTable(columns);
        await this.buildTableTypes(columns, enums);
        await this.buildRelationsForTable(forwardRelations);

        return this.buildTemplate();
    }

    private buildTemplate() {
        const { rowTypeName, columnMapTypeName, whereTypeName, orderByTypeName, paginationTypeName } = this.typeNames;
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
                
            ${this.relatedTables
                .map((tbl) => {
                    return `import { ${TableClientBuilder.getRelationFilterName(
                        tbl,
                    )} } from "./${TableClientBuilder.PascalCase(tbl)}"`;
                })
                .join(';')}

            ${this.relations}
            ${this.types}

             export default class ${
                 this.className
             } extends SQLQueryBuilder<${rowTypeName}, ${columnMapTypeName}, ${whereTypeName}, ${orderByTypeName}, ${paginationTypeName}> {
                    constructor() {
                        super({ 
                            tableName: '${this.tableName}', 
                            relations, 
                            softDeleteColumn: ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined} 
                        });
                    }
                ${this.loaders.join(`
        
                `)}
            }
            `;
    }

    private async buildRelationsForTable(relations: RelationDefinitions) {
        this.relations = `
            const relations = ${JSON.stringify(relations)};
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

    private buildTableTypes(table: TableDefinition, enums: EnumDefinitions) {
        const {
            rowTypeName,
            columnTypeName,
            columnMapTypeName,
            valueTypeName,
            whereTypeName,
            orderByTypeName,
            paginationTypeName,
            relationFilterTypeName,
        } = this.typeNames;

        this.types = `
                
                // Enums
                ${Object.entries(enums).map(([name, values]) => {
                    return `export type ${name} = ${values.map((v) => `'${v}'`).join(' | ')}`;
                })}
               
               // Row types
                export interface ${rowTypeName} {
                    ${Object.entries(table)
                        .map(([columnName, columnDefinition]) => {
                            let type = columnDefinition.tsType;
                            let nullable = columnDefinition.nullable ? '| null' : '';
                            return `${columnName}: ${type}${nullable};`;
                        })
                        .join(' ')}
                }

                //  Columns types
                //  export type ${columnTypeName} = Extract<keyof ${rowTypeName}, string>;
                //  export type  ${valueTypeName} = Extract<${rowTypeName}[${columnTypeName}], string | number>;
 
                export type ${columnMapTypeName} = {
                    ${Object.values(table)
                        .map((col) => `${col.columnName}: boolean;`)
                        .join(' ')}
                }
                
                ${buildRelationFilterForTable({ relationFilterTypeName, whereTypeName })}
                
                // Where types
                export type ${whereTypeName} = {
                    ${Object.values(table)
                        .map((col) => buildWhereTypeForColumn(col))
                        .join('; ')}
                    ${buildWhereCombinersForTable({ whereTypeName })}
                    ${this.relatedTables.map((toTable) => {
                        return `${toTable}?: ${TableClientBuilder.getRelationFilterName(toTable)} | null`;
                    })}
                };
                
                // Order by types
                ${buildOrderForTable({ orderByTypeName, columns: Object.values(table) })}
                
                //Pagination types
                ${buildPaginateForTable({ rowTypeName, paginationTypeName })}
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
