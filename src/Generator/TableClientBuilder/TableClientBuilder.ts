import { Introspection } from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';
import { ColumnDefinition, TableSchemaDefinition } from '../../TypeTruth/TypeTruth';
import { TableTypeBuilder, TableTypeNames } from './TableTypeBuilder';
import { PascalCase } from '../lib';
import { BatchLoaderBuilder } from './BatchLoaderBuilder';

interface BuilderOptions {
    rowTypeSuffix: string;
    softDeleteColumn?: string;
    libPath: string;
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
            import { schema } from './gybson.schema';

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
        const { rowTypeName, orderByTypeName } = this.typeNames;

        // build single row loaders
        unique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.loaders.push(
                BatchLoaderBuilder.getOneByColumnLoader({
                    loadColumns: keyColumns,
                    rowTypeName,
                    softDeleteColumn: this.softDeleteColumn,
                }),
            );
        });

        // build multi-row loaders
        nonUnique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k.columnName]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.loaders.push(
                BatchLoaderBuilder.getManyByColumnLoader({
                    loadColumns: keyColumns,
                    rowTypeName,
                    orderByTypeName,
                    softDeleteColumn: this.softDeleteColumn,
                }),
            );
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
                ${TableTypeBuilder.buildTypeImports({
                    tableName: this.tableName,
                    relations,
                    libPath: this.options.libPath,
                })}
                
                ${TableTypeBuilder.buildEnumTypes({ enums })}
               
                ${TableTypeBuilder.buildRowType({ table: columns, rowTypeName })}
 
                ${TableTypeBuilder.buildColumnMapType({ columnMapTypeName, columns })}
                
                ${TableTypeBuilder.buildRelationFilterType({ relationFilterTypeName, whereTypeName })}
                
                ${TableTypeBuilder.buildWhereType({ columns, whereTypeName, relations })}
                
                ${TableTypeBuilder.buildOrderType({ orderByTypeName, columns })}
                
                ${TableTypeBuilder.buildPaginateType({ rowTypeName, paginationTypeName })}
        `;
    }
}
