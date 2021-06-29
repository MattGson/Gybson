import { camelCase } from 'lodash';
import { plural } from 'pluralize';
import { RelationDefinition, TableSchemaDefinition } from 'relational-schema';
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
    public readonly fluentClassName: string;
    public readonly humanDocName: string;
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
        this.fluentClassName = `${this.entityName}Fluent`;
        this.humanDocName = plural(this.entityName);
        this.options = options;
        this.typeNames = TableTypeBuilder.typeNamesForTable({ tableName: table });
    }

    public async build(): Promise<string> {
        await this.buildTableTypes();
        return this.buildTemplate();
    }

    private getFluentChainables() {
        // TODO:- ignore many to many for now
        return this.schema.relations
            .filter((r) => r.type !== 'manyToMany')
            .map((r) => {
                const relatedEnt = TableTypeBuilder.tableNameAlias(r.toTable);
                const chainableMethod = camelCase(r.alias);

                const returnType = `${relatedEnt}Fluent<${relatedEnt}, FluentPlaceholder>`;

                return `
                /**
                 * Load the ${chainableMethod} for the ${this.humanDocName}
                 */
                ${chainableMethod}(args?: LoadOptions): ${returnType} {
                    this.traversal.pushLink({
                        table: '${r.toTable}',
                        relation: this.relationMap.get('${r.alias}'),
                        options: {
                            loadOptions: args,
                        }, 
                    });
                    return new ${relatedEnt}Fluent(this.traversal, this.schema);
                }
            `;
            })
            .join('');
    }

    private getEagerRelations() {
        const { chainableRelationsTypeName } = this.typeNames;

        // TODO:- ignore many to many for now
        return this.schema.relations
            .filter((r) => r.type !== 'manyToMany')
            .map((r) => {
                const relatedEnt = TableTypeBuilder.tableNameAlias(r.toTable);
                const rTypes = TableTypeBuilder.typeNamesForTable({ tableName: r.toTable });
                const withMethod = camelCase(`with_${r.alias}`);

                const relatedFluent = `${relatedEnt}Fluent`;

                const nestedType =
                    r.type === 'hasMany'
                        ? `{ ${camelCase(r.alias)}: ${relatedEnt}[] }`
                        : `{ ${camelCase(r.alias)}: ${relatedEnt} }`;

                // Cannot execut
                const omitSubChain =
                    r.type === 'hasMany'
                        ? `FluentExecutors | ${rTypes.chainableRelationsTypeName}`
                        : `FluentExecutors | FluentListOperators | ${rTypes.chainableRelationsTypeName}`;

                const subChainBuilderType = ` (c: Omit<${relatedFluent}<${rTypes.rowTypeName}, ${omitSubChain}>, ${omitSubChain}>
                    ) => FluentInterface<any>`;

                const omitMainChain = `'${withMethod}' | ${chainableRelationsTypeName}`;
                // TODO:- how to include the nested type properly?
                const returnType = `Omit<${this.fluentClassName}<${this.entityName} & ${nestedType}, ${omitMainChain}>, ${omitMainChain}>`;

                return `
                // long return type but basically just helping the user out.
                // - It makes no sense to add a withX clause other than at the end of chain
                // - makes no sense to use same with twice
                // so we remove all chainables and this method
                // TODO:- should we remove nested chainables? Or is that a feature? Enrich with arbritrary data?
                // TODO:- how to chain the Omit?
                /**
                 * Eager load the ${camelCase(r.alias)} for the ${this.humanDocName}
                 */
                ${withMethod}(
                     chain?: ${subChainBuilderType}
                ): ${returnType} {
                     this.traversal.addWith({
                         table: '${r.toTable}',
                         relation: this.relationMap.get('${r.toTable}'),
                         options: {}
                     }, chain);
                     return this as any;
                }
                `;
            })
            .join('');
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
            fluentMethodsTypeName,
        } = this.typeNames;

        const baseFluentReturn = `Omit<${this.fluentClassName}<T, O>, O>`;

        return `
            import { ClientEngine, Logger } from '${this.options.gybsonLibPath}';
            
            // TODO:- rather than import this in each client, should it be copied in during generate?
            import schema from './relational-schema';
            import { Knex } from 'knex';
            import { DatabaseSchema } from 'relational-schema';

            ${this.types}
            
             export class ${this.className} extends QueryClient<${rowTypeName}, 
                ${columnMapTypeName}, 
                ${whereTypeName}, 
                ${orderByTypeName}, 
                ${paginationTypeName}, 
                ${requiredRowTypeName}> {
                
                constructor(params: {
                    knex: Knex<any, unknown>;
                    batchClient: BatchQuery; 
                    logger: Logger;
                    engine: ClientEngine;
                }) {
                    const { knex, batchClient, logger, engine } = params;
                    super(
                        {
                            tableName: '${this.tableName}',
                            schema: schema as any,
                            knex,
                            batchClient,
                            logger,
                            engine,
                        }
                    )
                }
                
                // Overwrite method signatures to improve IDE type inference speed and helpfulness over generics

                /**
                 * Begin query for ${this.humanDocName}
                 * @param args - configure load behvaiour
                 */
                find(args?: LoadOptions): ${this.fluentClassName}<${this.entityName}, FluentPlaceholder> {
                    const traversal = new FluentTraversal(this.batchClient, schema as any);
                    traversal.pushLink({
                        rootLoad: 'many',
                        table: 'users',
                        options: {
                            loadOptions: args,
                        },
                    });
                    return new ${this.fluentClassName}(traversal, schema as unknown as DatabaseSchema);
                }

                /**
                 * Continue a query chain from a ${this.entityName} object
                 * @param data - the object to start the chain
                 */

                 // this type is clever
                 // omits the methods and passes the omits in as generic param
                 // so that future fluent links can additively omit
                from(data: ${this.entityName} | null):  
                 Omit<${this.fluentClassName}<${this.entityName}, FluentMethods>, FluentMethods> {
                    const traversal = new FluentTraversal(this.batchClient, schema as any);
                    traversal.pushLink({
                        resolveData: data, // avoid re-loading same data?
                        table: 'users',
                        options: {},
                    });
                    return new ${this.fluentClassName}(traversal, schema as unknown as DatabaseSchema);
                }

                
                // /**
                //  * Clear cache
                //  */
                // public async purge(): Promise<void> {
                //     await this.queryClient.purge();
                // }
                
                // /**
                //  * Batch load a single-row
                //  * @param params
                //  */
                // public async loadOne(params: { where: ${loadOneWhereTypeName} } & SoftDeleteQueryFilter): Promise<${rowTypeName} | null> {
                //     return this.queryClient.loadOne(params);
                // }

                // /**
                //  * Batch load many-rows
                //  * @param params
                //  */
                // public async loadMany(
                //     params: { where: ${loadManyWhereTypeName} } & SoftDeleteQueryFilter & OrderQueryFilter<${orderByTypeName}>,
                // ): Promise<${rowTypeName}[]> {
                //     return this.queryClient.loadMany(params);
                // }
            
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


            export class ${this.fluentClassName}
            <T extends ${this.entityName}, O extends ${fluentMethodsTypeName}> 
            extends FluentInterface<${rowTypeName}> {

                constructor(traversal: FluentTraversal, schema: DatabaseSchema) {
                    super(traversal, schema, '${this.tableName}');
                }

                /**
                 * Get the first matching ${this.entityName}
                 */
                async first(): Promise<${rowTypeName} | null> {
                    return super.first();
                }

                /**
                 * Get a list of ${this.humanDocName}
                 */
                async all(): Promise<${rowTypeName}[]> {
                    return super.all();
                }


                /**
                 * Filter which ${this.humanDocName} are returned
                 * Additive
                 * @param args - the where filter
                 */
                where(args: ${loadManyWhereTypeName}): ${baseFluentReturn} {
                    // additive where like knex

                    this.traversal.addWhere(args);

                    return this;
                }


                /**
                 * Filter for a single ${this.entityName}
                 * Additive
                 * This is just a convenience method to provide typings for unique filters
                 * @param args - the where filter
                 */
                // TODO:- Question: What if unique is used deep in the chain? Leads to a question of de-duplication? .distinct() maybe?
                whereUnique(args: ${loadOneWhereTypeName}): 
                 Omit<${this.fluentClassName}<T, O | FluentListOperators>, O | FluentListOperators> {
                    // additive where like knex
                    const filters = this.unNestFilters(args);
                    this.traversal.addWhere(filters);

                    return this as any;
                }

                /**
                 * Order results
                 * Additive
                 * @param args - ordering
                 */
                orderBy(args: ${orderByTypeName}): ${baseFluentReturn} {
                    //
                    this.traversal.addOrder(args);

                    return this;
                }

                /**
                 * Paginate the results
                 * @param args - paginate options
                 */
                paginate(args: Paginate<Partial<${rowTypeName}>>): 
                 Omit<${this.fluentClassName}<T, O | 'paginate'>, O | 'paginate'> {
                    //
                    this.traversal.addPaginate(args);

                    return this as any;
                }
            

                ${this.getEagerRelations()}

                ${this.getFluentChainables()}
              
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
            chainableRelationsTypeName,
            eagerRelationsTypeName,
            fluentMethodsTypeName,
        } = this.typeNames;

        const { columns, relations, enums, uniqueKeyCombinations } = this.schema;

        const rels = relations?.filter((r) => r.type !== 'manyToMany');

        this.types = `
                ${TableTypeBuilder.buildTypeImports({
                    tableName: this.tableName,
                    relations: rels as RelationDefinition[],
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

                ${TableTypeBuilder.buildChainableRelations({
                    chainableRelationsTypeName,
                    fluentMethodsTypeName,
                    eagerRelationsTypeName,
                    relations: rels as RelationDefinition[],
                })}
                
                
                ${TableTypeBuilder.buildWhereType({ columns, whereTypeName, relations: rels as RelationDefinition[] })}
                
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
