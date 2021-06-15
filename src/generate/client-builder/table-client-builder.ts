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
                return `

             /**
              * Load the ${chainableMethod} for the ${this.humanDocName}
              */
            ${chainableMethod}(args?: LoadOptions): ${relatedEnt}Fluent {
                this.traversal.pushLink({
                    table: '${r.toTable}',
                    relation: this.relationMap.get('${r.toTable}'),
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
            import { DatabaseSchema } from 'relational-schema';

            ${this.types}
            
             export class ${this.className} {
                    
                private queryClient: QueryClient<${rowTypeName}, 
                ${columnMapTypeName}, 
                ${whereTypeName}, 
                ${loadOneWhereTypeName}, 
                ${loadManyWhereTypeName}, 
                ${orderByTypeName}, 
                ${paginationTypeName}, 
                ${requiredRowTypeName}>;

                
                constructor(params: {
                    knex: Knex<any, unknown>;
                    logger: Logger;
                    engine: ClientEngine;
                }) {
                    const { knex, logger, engine } = params;
                
                    this.queryClient = new QueryClient({
                        tableName: '${this.tableName}',
                        schema: schema as any,
                        knex,
                        logger,
                        engine,
                    });
                }
                
                // Overwrite method signatures to improve IDE type inference speed and helpfulness over generics

                /**
                 * Begin query for ${this.humanDocName}
                 * @param args - configure load behvaiour
                 */
                find(args?: LoadOptions): ${this.fluentClassName} {
                    const traversal = new FluentTraversal();
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
                from(data: User | null):  FluentWithoutListOperators<FluentWithoutFilters<${this.fluentClassName}>> {
                    const traversal = new FluentTraversal();
                    traversal.pushLink({
                        // rootLoad: 'many',
                        // TODO:
                        rootData: data, // avoid re-loading same data?
                        table: 'users',
                        options: {},
                    });
                    return new ${this.fluentClassName}(traversal, schema as unknown as DatabaseSchema);
                }

                
                /**
                 * Clear cache
                 */
                public async purge(): Promise<void> {
                    await this.queryClient.purge();
                }
                
                /**
                 * Batch load a single-row
                 * @param params
                 */
                public async loadOne(params: { where: ${loadOneWhereTypeName} } & SoftDeleteQueryFilter): Promise<${rowTypeName} | null> {
                    return this.queryClient.loadOne(params);
                }

                /**
                 * Batch load many-rows
                 * @param params
                 */
                public async loadMany(
                    params: { where: ${loadManyWhereTypeName} } & SoftDeleteQueryFilter & OrderQueryFilter<${orderByTypeName}>,
                ): Promise<${rowTypeName}[]> {
                    return this.queryClient.loadMany(params);
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
                    return this.queryClient.findMany(params);
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
                    return this.queryClient.upsert(params);
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
                    return this.queryClient.insert(params);
                }
                
                    /**
                 * Update
                 * Updates all rows matching conditions
                 * Note:- pg uses a weird update join syntax which isn't properly supported in knex.
                 *        In pg, a sub-query is used to get around this. MySQL uses regular join syntax.
                 */
                public async update(params: { values: Partial<${rowTypeName}>; where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                    return this.queryClient.update(params);
                }
                
                    /**
                 * Soft delete
                 * Sets deleted flag for all rows matching conditions
                 * Note:- pg uses a weird update join syntax which isn't properly supported in knex.
                 *        In pg, a sub-query is used to get around this. MySQL uses regular join syntax.
                 * @param params
                 */
                public async softDelete(params: { where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                    return this.queryClient.softDelete(params);
                }
                
                    /**
                 * Delete
                 * Deletes all rows matching conditions
                 * Note:- due to the inconsistency with how PG and MySQL handle updates and deletes
                 *        with joins, the query uses a nested sub-query to get the correct rows to delete
                 * @param params
                 */
                public async delete(params: {  where: ${whereTypeName} } & ProvideConnection): Promise<unknown> {
                    return this.queryClient.delete(params);
                }
                
                    /**
                 * Truncate a table
                 * @param params
                 */
                public async truncate(params: ProvideConnection): Promise<unknown> {
                    return this.queryClient.truncate(params);
                }
            }


            export class ${this.fluentClassName} extends FluentInterface<${rowTypeName}> {

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
                 * @param args - the where filter
                 */
                where(args?: ${whereTypeName}): ${this.fluentClassName} {
                    // additive where like knex
                    // this.traversal.
                    return this;
                }


                /**
                 * Filter for a single ${this.entityName}
                 * This is just a convenience method to provide typings for unique filters
                 * @param args - the where filter
                 */
                whereUnique(args?: ${loadOneWhereTypeName}): FluentWithoutListOperators<${this.fluentClassName}> {
                    // additive where like knex
                    // this.traversal.
                    return this;
                }

                /**
                 * Order results
                 * @param args - ordering
                 */
                orderBy(args: ${orderByTypeName}): FluentWithoutOrderBy<${this.fluentClassName}> {
                    //
                    return this;
                }

                /**
                 * Paginate the results
                 * @param args - paginate options
                 */
                paginate(args: Paginate<Partial<${rowTypeName}>>): FluentWithoutPaginate<${this.fluentClassName}> {
                    //
                    return this;
                }
            

                // long return type but basically just helping the user out.
                // - It makes no sense to add a withX clause other than at the end of chain
                // - makes no sense to use same with twice
                // so we remove all chainables and this method
                // TODO:- should we remove nested chainables? Or is that a feature? Enrich with arbritrary data?
                // TODO:- how to chain the Omit?
                // withComments(
                //     chain?: (c: Omit<FluentWithoutFilters<CommentFluent>, CommentChainables>) => FluentInterface<any>,
                // ): Omit<PostFluent<T & { comments: Comment[] }>, 'withComments' | PostChainables> {
                //     this.traversal.addWith({
                //         table: 'comments',
                //         // need to use the correct relation in case there are multiple relations to the same table
                //         // TODO:- should do this for where filters as well?
                //         relation: this.relationMap.get('comments'),
                //         options: {
                //             where: args?.where,
                //         },
                //         mixin: chain,
                //         paginate,
                //     });
                //     // no point recreating it
                //     return this as unknown as PostFluent<T & { comments: Comment[] }>;
                // }
            
                // // Note:- small interface improvement - remove methods that can't sensibly be used more than once
                // withAuthor(args?: { where?: { name?: string } }): Omit<PostFluent<T & { author: User }>, 'withAuthor'> {
                //     this.traversal.addWith({
                //         table: 'users',
                //         // need to use the correct relation in case there are multiple relations to the same table
                //         // TODO:- should do this for where filters as well?
                //         relation: this.relationMap.get('author'),
                //         options: {
                //             where: args?.where,
                //         },
                //     });
                //     // no point recreating it
                //     return this as unknown as PostFluent<T & { author: User }>;
                // }
            
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
