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
                    
                    // Overwrite method signatures to improve IDE type inference speed and helpfulness over generics
                    
                    /**
                     * Batch load a single-row
                     * @param params
                     */
                    public async loadOne(params: { where: ${loadOneWhereTypeName} } & SoftDeleteQueryFilter): Promise<${rowTypeName} | null> {
                        return super.loadOne(params);
                    }

                    /**
                     * Batch load many-rows
                     * @param params
                     */
                    public async loadMany(
                        params: { where: ${loadManyWhereTypeName} } & SoftDeleteQueryFilter & OrderQueryFilter<${orderByTypeName}>,
                    ): Promise<${rowTypeName}[]> {
                        return super.loadMany(params);
                    }
                
                    /**
                     * Find rows from a table
                     * Supports filtering, ordering, pagination
                     * @param params
                     */
                    public async findMany(params: {
                        where?: ${whereTypeName};
                        paginate?: ${paginationTypeName};
                    } & ProvideConnection & SoftDeleteQueryFilter & OrderQueryFilter<${orderByTypeName}>
                    ): Promise<${rowTypeName}[]> {
                        return super.findMany(params);
                    }
                    
                    /**
                     * Upsert function
                     * Inserts all rows. If duplicate key then will update specified columns for that row.
                     * Can automatically remove soft deletes if desired instead of specifying the column and values manually.
                     *     * This should be set to false if the table does not support soft deletes
                     * Will replace undefined values with DEFAULT which will use a default column value if available.
                     * Supports merge and update strategies.
                     *  Merge -> will merge the new values into the conflicting row for the specified columns
                     *  Update -> will update the specified values on conflicting rows
                     * @param params
                     */
                    public async upsert(params: {
                        values: ${requiredRowTypeName} | ${requiredRowTypeName}[];
                        reinstateSoftDeletes?: boolean;
                        mergeColumns?: Partial<${columnMapTypeName}>;
                        update?: Partial<${rowTypeName}>;
                    } & ProvideConnection): Promise<number> {
                        return super.upsert(params);
                    }
                    
                     /**
                     * Insert function
                     * Inserts all rows. Fails on duplicate key error
                     *     * use ignoreDuplicates if you wish to ignore duplicate rows
                     * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
                     * @param params
                     */
                    public async insert(params: {
                        values: ${requiredRowTypeName} | ${requiredRowTypeName}[];
                        ignoreDuplicates?: boolean;
                    } & ProvideConnection): Promise<number> {
                        return super.insert(params);
                    }
                    
                     /**
                     * Update
                     * Updates all rows matching conditions
                     * Note:- pg uses a weird update join syntax which isn't properly supported in knex.
                     *        In pg, a sub-query is used to get around this. MySQL uses regular join syntax.
                     */
                    public async update(params: { values: Partial<${rowTypeName}>; where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                        return super.update(params);
                    }
                    
                     /**
                     * Soft delete
                     * Sets deleted flag for all rows matching conditions
                     * Note:- pg uses a weird update join syntax which isn't properly supported in knex.
                     *        In pg, a sub-query is used to get around this. MySQL uses regular join syntax.
                     * @param params
                     */
                    public async softDelete(params: { where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                       return super.softDelete(params);
                    }
                    
                     /**
                     * Delete
                     * Deletes all rows matching conditions
                     * Note:- due to the inconsistency with how PG and MySQL handle updates and deletes
                     *        with joins, the query uses a nested sub-query to get the correct rows to delete
                     * @param params
                     */
                    public async delete(params: {  where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                       return super.delete(params);
                    }
                    
                     /**
                     * Truncate a table
                     * @param params
                     */
                    public async truncate(params: ProvideConnection): Promise<unknown> {
                        return super.truncate(params);
                    }
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
