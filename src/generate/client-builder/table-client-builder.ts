import { TableSchemaDefinition } from 'relational-schema';
import { PascalCase } from '../printer';
import { TableTypeBuilder, TableTypeNames } from './table-type-builder';

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

    // private get softDeleteColumn() {
    //     return this.schema.softDelete;
    // }

    public async build(): Promise<string> {
        // await this.buildLoadersForTable();
        await this.buildTableTypes();
        return this.buildTemplate();
    }

    private buildTemplate() {
        const {
            rowTypeName,
            columnMapTypeName,
            whereTypeName,
            loadOneWhereTypeName,
            loadManyWhereTypeName,
            orderByTypeName,
            paginationTypeName,
            requiredRowTypeName,
        } = this.typeNames;
        return `
            import { ClientEngine } from '${this.options.gybsonLibPath}';            
            import schema from './relational-schema';
            import Knex from 'knex';
            import winston from 'winston';

            ${this.types}

             export default class ${this.className} extends QueryClient<${rowTypeName}, 
                    ${columnMapTypeName}, 
                    ${whereTypeName}, 
                    ${loadOneWhereTypeName}, 
                    ${loadManyWhereTypeName}, 
                    ${orderByTypeName}, 
                    ${paginationTypeName}, 
                    ${requiredRowTypeName}> {
                    
                    constructor(params: {
                        knex: Knex<any, unknown>;
                        logger: winston.Logger;
                        engine: ClientEngine;
                    }) {
                        const { knex, logger, engine } = params;
                        super({ 
                            tableName: '${this.tableName}', 
                            schema: schema as any,
                            knex,
                            logger,
                            engine,
                        });
                    }
                ${this.loaders.join(`
        
                `)}
            }
            `;
    }

    // private async buildLoadersForTable() {
    //     const { orderByTypeName } = this.typeNames;

    //     const unique = this.schema.uniqueKeyCombinations;
    //     const nonUnique = this.schema.nonUniqueKeyCombinations;

    //     // build single row loaders
    //     unique.forEach((key) => {
    //         const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k]);
    //         for (let col of keyColumns) {
    //             // for now only accept loaders on string and number column types
    //             if (col.tsType !== 'string' && col.tsType !== 'number') return;
    //         }

    //         this.loaders.push(
    //             BatchLoaderBuilder.getOneByColumnLoader({
    //                 loadColumns: keyColumns,
    //                 softDeleteColumn: this.softDeleteColumn || undefined,
    //             }),
    //         );
    //     });

    //     // build multi-row loaders
    //     nonUnique.forEach((key) => {
    //         const keyColumns: ColumnDefinition[] = key.map((k) => this.schema.columns[k]);
    //         for (let col of keyColumns) {
    //             // for now only accept loaders on string and number column types
    //             if (col.tsType !== 'string' && col.tsType !== 'number') return;
    //         }

    //         this.loaders.push(
    //             BatchLoaderBuilder.getManyByColumnLoader({
    //                 loadColumns: keyColumns,
    //                 orderByTypeName,
    //                 softDeleteColumn: this.softDeleteColumn || undefined,
    //             }),
    //         );
    //     });
    // }

    private buildTableTypes() {
        const {
            rowTypeName,
            columnMapTypeName,
            whereTypeName,
            loadOneWhereTypeName,
            loadManyWhereTypeName,
            orderByTypeName,
            paginationTypeName,
            relationFilterTypeName,
            requiredRowTypeName,
        } = this.typeNames;

        const { columns, relations, enums, uniqueKeyCombinations } = this.schema;

        const rels = relations?.filter((r) => r.type !== 'manyToMany');

        this.types = `
                ${TableTypeBuilder.buildTypeImports({
                    tableName: this.tableName,
                    // @ts-ignore -TODO:
                    relations: rels,
                    gybsonLibPath: this.options.gybsonLibPath,
                })}
                
                ${TableTypeBuilder.buildEnumTypes({ enums })}
               
                ${TableTypeBuilder.buildRowType({ table: columns, rowTypeName })}
                
                ${TableTypeBuilder.buildRequiredRowType({ table: columns, requiredRowTypeName })}
 
                ${TableTypeBuilder.buildColumnMapType({ columnMapTypeName, columns })}
                
                ${TableTypeBuilder.buildRelationFilterType({ relationFilterTypeName, whereTypeName })}
                
                
                ${
                    // @ts-ignore -TODO:
                    TableTypeBuilder.buildWhereType({ columns, whereTypeName, relations: rels })
                }
                
                ${TableTypeBuilder.buildLoadOneWhereType({
                    columns,
                    uniqueKeys: uniqueKeyCombinations,
                    loadOneWhereTypeName,
                })}
                
                ${TableTypeBuilder.buildLoadManyWhereType({
                    columns,
                    uniqueKeys: uniqueKeyCombinations,
                    loadManyWhereTypeName,
                })}
                
                ${TableTypeBuilder.buildOrderType({ orderByTypeName, columns })}
                
                ${TableTypeBuilder.buildPaginateType({ rowTypeName, paginationTypeName })}
        `;
    }
}
