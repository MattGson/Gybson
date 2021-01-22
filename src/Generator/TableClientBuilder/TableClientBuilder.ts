import { ColumnDefinition, TableSchemaDefinition } from '../../TypeTruth';
import { TableTypeBuilder, TableTypeNames } from './TableTypeBuilder';
import { PascalCase } from '../lib';
import { BatchLoaderBuilder } from './BatchLoaderBuilder';

interface BuilderOptions {
    rowTypeSuffix: string;
    gybsonLibPath: string;
}

/**
 * Builds db client methods for a table
 */
export class TableClientBuilder {
    public readonly entityName: string;
    public readonly typeNames: TableTypeNames;
    public readonly className: string;
    public readonly tableName: string;
    private readonly options: BuilderOptions;
    private loaders: string[] = [];
    private types?: string;
    private readonly schema: TableSchemaDefinition;

    /**
     *
     * @param params
     */
    public constructor(params: { table: string; schema: TableSchemaDefinition; options: BuilderOptions }) {
        const { table, options, schema } = params;
        this.entityName = PascalCase(table);
        this.schema = schema;
        this.tableName = table;
        this.className = `${this.entityName}`;
        this.options = options;
        this.typeNames = TableTypeBuilder.typeNamesForTable({ tableName: table, rowTypeSuffix: options.rowTypeSuffix });
    }

    private get softDeleteColumn() {
        return this.schema.softDelete;
    }

    public async build(): Promise<string> {
        await this.buildLoadersForTable();
        await this.buildTableTypes();
        return this.buildTemplate();
    }

    private buildTemplate() {
        const {
            rowTypeName,
            columnMapTypeName,
            whereTypeName,
            orderByTypeName,
            paginationTypeName,
            requiredRowTypeName,
        } = this.typeNames;
        return `
            import { schema } from './gybson.schema';

            ${this.types}

             export default class ${
                 this.className
             } extends QueryClient<${rowTypeName}, ${columnMapTypeName}, ${whereTypeName}, ${orderByTypeName}, ${paginationTypeName}, ${requiredRowTypeName}> {
                    
                    constructor() {
                        super({ 
                            tableName: '${this.tableName}', 
                            schema,
                        });
                    }
                ${this.loaders.join(`
        
                `)}
            }
            `;
    }

    private async buildLoadersForTable() {
        const { rowTypeName, orderByTypeName } = this.typeNames;

        const unique = this.schema.uniqueKeyCombinations;
        const nonUnique = this.schema.nonUniqueKeyCombinations;

        // build single row loaders
        unique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.loaders.push(
                BatchLoaderBuilder.getOneByColumnLoader({
                    loadColumns: keyColumns,
                    softDeleteColumn: this.softDeleteColumn || undefined,
                }),
            );
        });

        // build multi-row loaders
        nonUnique.forEach((key) => {
            const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k]);
            for (let col of keyColumns) {
                // for now only accept loaders on string and number column types
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.loaders.push(
                BatchLoaderBuilder.getManyByColumnLoader({
                    loadColumns: keyColumns,
                    rowTypeName,
                    orderByTypeName,
                    softDeleteColumn: this.softDeleteColumn || undefined,
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
            requiredRowTypeName,
        } = this.typeNames;

        const { columns, relations, enums } = this.schema;

        this.types = `
                ${TableTypeBuilder.buildTypeImports({
                    tableName: this.tableName,
                    relations,
                    gybsonLibPath: this.options.gybsonLibPath,
                })}
                
                ${TableTypeBuilder.buildEnumTypes({ enums })}
               
                ${TableTypeBuilder.buildRowType({ table: columns, rowTypeName })}
                
                ${TableTypeBuilder.buildRequiredRowType({ table: columns, requiredRowTypeName })}
 
                ${TableTypeBuilder.buildColumnMapType({ columnMapTypeName, columns })}
                
                ${TableTypeBuilder.buildRelationFilterType({ relationFilterTypeName, whereTypeName })}
                
                ${TableTypeBuilder.buildWhereType({ columns, whereTypeName, relations })}
                
                ${TableTypeBuilder.buildOrderType({ orderByTypeName, columns })}
                
                ${TableTypeBuilder.buildPaginateType({ rowTypeName, paginationTypeName })}
        `;
    }
}
