import { Introspection } from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';
import { ColumnDefinition, TableSchemaDefinition } from '../../TypeTruth/TypeTruth';
import { TableTypeBuilder, TableTypeNames } from './TableTypeBuilder';
import { PascalCase } from '../lib';

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
    public readonly typeNames: TableTypeNames;
    public readonly className: string;
    public readonly tableName: string;
    private readonly options: BuilderOptions;
    private softDeleteColumn?: string;
    private loaders: string[] = [];
    private types?: string;
    private readonly schema: TableSchemaDefinition;

    /**
     *
     * @param params
     */
    public constructor(params: {
        table: string;
        schema: TableSchemaDefinition;
        dbIntrospection: Introspection;
        options: BuilderOptions;
    }) {
        const { table, dbIntrospection, options, schema } = params;
        this.entityName = PascalCase(table);
        this.schema = schema;
        this.introspection = dbIntrospection;
        this.tableName = table;
        this.className = `${this.entityName}`;
        this.options = options;
        this.typeNames = TableTypeBuilder.typeNamesForTable({ tableName: table, rowTypeSuffix: options.rowTypeSuffix });
    }

    public async build(): Promise<string> {
        // if a soft delete column is given, check if it exists on the table
        this.softDeleteColumn =
            this.options.softDeleteColumn && this.schema.columns[this.options.softDeleteColumn]
                ? this.options.softDeleteColumn
                : undefined;

        await this.buildLoadersForTable();
        await this.buildTableTypes();
        return this.buildTemplate();
    }

    private buildTemplate() {
        const { rowTypeName, columnMapTypeName, whereTypeName, orderByTypeName, paginationTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { schema } from './schemaRelations';

            ${this.types}

             export default class ${
                 this.className
             } extends SQLQueryBuilder<${rowTypeName}, ${columnMapTypeName}, ${whereTypeName}, ${orderByTypeName}, ${paginationTypeName}> {
                    constructor() {
                        super({ 
                            tableName: '${this.tableName}', 
                            schema,
                            softDeleteColumn: ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined} 
                        });
                    }
                ${this.loaders.join(`
        
                `)}
            }
            `;
    }

    private async buildLoadersForTable() {
        const tableKeys = await this.introspection.getTableKeys(this.tableName);
        const unique = CardinalityResolver.getUniqueKeyCombinations(tableKeys);
        const nonUnique = CardinalityResolver.getNonUniqueKeyCombinations(tableKeys);

        unique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.addCompoundByColumnLoader(keyColumns);
        });

        nonUnique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.addCompoundManyByColumnLoader(keyColumns);
        });
    }

    private buildTableTypes() {
        const {
            rowTypeName,
            columnMapTypeName,
            whereTypeName,
            orderByTypeName,
            paginationTypeName,
            relationFilterTypeName,
        } = this.typeNames;

        const { columns, relations, enums } = this.schema;

        this.types = `
                ${TableTypeBuilder.buildTypeImports({ tableName: this.tableName, relations })}
                
                ${TableTypeBuilder.buildEnumTypes({ enums })}
               
                ${TableTypeBuilder.buildRowType({ table: columns, rowTypeName })}
 
                ${TableTypeBuilder.buildColumnMapType({ columnMapTypeName, columns })}
                
                ${TableTypeBuilder.buildRelationFilterType({ relationFilterTypeName, whereTypeName })}
                
                ${TableTypeBuilder.buildWhereType({ columns, whereTypeName, relations })}
                
                ${TableTypeBuilder.buildOrderType({ orderByTypeName, columns })}
                
                ${TableTypeBuilder.buildPaginateType({ rowTypeName, paginationTypeName })}
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

        const loadKeyName = colNames.map((name) => PascalCase(name)).join('And');
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

        const loadKeyName = colNames.map((name) => PascalCase(name)).join('And');
        const loaderName = `${this.entityName}By${loadKeyName}Loader`;

        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<{ ${keyType} orderBy: ${orderByTypeName} | undefined; }, ${rowTypeName}[]>(keys => {
                    const [first] = keys;
                    keys.map(k => delete k.orderBy); // remove key so its not included as a load param
                    // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
                    return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
                }, {
                    // ignore order for cache equivalency - re-assess - will this compare objects properly?
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
