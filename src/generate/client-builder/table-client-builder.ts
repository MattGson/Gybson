import { TableSchemaDefinition } from 'relational-schema';
import { TableTypeBuilder, TableTypeNames } from './table-type-builder';

interface BuilderOptions {
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
        this.entityName = TableTypeBuilder.tableNameAlias(table);
        this.schema = schema;
        this.tableName = table;
        this.className = `${this.entityName}Client`;
        this.options = options;
        this.typeNames = TableTypeBuilder.typeNamesForTable({ tableName: table });
    }

    public async build(): Promise<string> {
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
            import { ClientEngine, Logger } from '${this.options.gybsonLibPath}';            
            import schema from './relational-schema';
            import { Knex } from 'knex';

            ${this.types}

             export class ${this.className} extends QueryClient<${rowTypeName}, 
                    ${columnMapTypeName}, 
                    ${whereTypeName}, 
                    ${loadOneWhereTypeName}, 
                    ${loadManyWhereTypeName}, 
                    ${orderByTypeName}, 
                    ${paginationTypeName}, 
                    ${requiredRowTypeName}> {
                    
                    constructor(params: {
                        knex: Knex<any, unknown>;
                        logger: Logger;
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

    private buildTableTypes() {
        const {
            rowTypeName,
            columnMapTypeName,
            whereTypeName,
            loadOneWhereTypeName,
            loadManyWhereTypeName,
            orderByTypeName,
            paginationTypeName,
            hasOneRelationFilterTypeName,
            hasManyRelationFilterTypeName,
            hasOneRequiredRelationFilterTypeName,
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
                
                ${TableTypeBuilder.buildRelationFilterTypes({
                    hasOneRelationFilterTypeName,
                    hasManyRelationFilterTypeName,
                    hasOneRequiredRelationFilterTypeName,
                    whereTypeName,
                })}
                
                
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
