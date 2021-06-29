import { flatten } from 'lodash';
import { DatabaseSchema, RelationDefinition, TransitiveRelationDefinition } from 'relational-schema';
import { LoadOptions, Paginate, RecordAny } from '../../types';
import { BatchQuery } from './batch-client';
import { QueryTable } from './query-table';

export interface TraveralLink<T = any> {
    rootLoad?: 'uniq' | 'many';
    table: string;
    // intialise a link already resolved
    resolveData?: T;
    relation?: RelationDefinition | TransitiveRelationDefinition; // identifier for the relation that links to the parent
    options: {
        where?: RecordAny;
        orderBy?: RecordAny;
        loadOptions?: LoadOptions;
    };
    // nested relations to include
    with?: TraveralLink[];
    paginate?: Paginate;
}

export type FluentExecutors = 'first' | 'all';
export type FluentFilters = 'where' | 'whereUnique';
export type FluentListOperators = 'orderBy' | 'paginate' | 'all';
export type FluentPlaceholder = '__';

export type FluentMethods = FluentExecutors | FluentFilters | FluentListOperators | FluentPlaceholder;

// export type FluentWithoutFilters<T> = Omit<T, FluentFilters>;
// export type FluentWithoutExecutors<T> = Omit<T, FluentExecutors>;
// export type FluentWithoutListOperators<T> = Omit<T, FluentListOperators>;
// export type FluentWithoutOrderBy<T> = Omit<T, 'orderBy'>;
// export type FluentWithoutPaginate<T> = Omit<T, 'paginate'>;

export abstract class FluentInterface<T> {
    protected relationMap = new Map<string, RelationDefinition | TransitiveRelationDefinition>();
    constructor(protected traversal: FluentTraversal, protected schema: DatabaseSchema, protected tableName: string) {
        schema.tables[tableName].relations.forEach((r) => {
            this.relationMap.set(r.alias, r);
        });
    }

    /**
     * un-nest filters i.e. team_id__user_id: { ... } -> team_id: ..., user_id: ...,
     * helpful for whereUnique
     * @param where
     */
    protected unNestFilters(where: RecordAny): RecordAny {
        const filter: any = {};
        Object.entries(where).map(([k, v]) => {
            if (v instanceof Object) Object.assign(filter, v);
            else filter[k] = v;
        });
        return filter;
    }

    async first(): Promise<T | null> {
        const result = await this.traversal.resolve<T>();
        return result?.[0] ?? null;
    }
    async all(): Promise<T[]> {
        return await this.traversal.resolve<T>();
    }
}

export class FluentTraversal {
    // save tables as a minor memory improvement
    private tables: Map<string, QueryTable> = new Map();

    constructor(private batchClient: BatchQuery, private schema: DatabaseSchema) {}

    private taversalChain: TraveralLink[] = [];
    // maintain a pointer to current link for ease of use
    private currentLink: TraveralLink | undefined;

    private getQueryTable(table: string): QueryTable {
        let queryTable = this.tables.get(table);
        if (!queryTable) {
            queryTable = new QueryTable(table, this.schema);
            this.tables.set(table, queryTable);
        }
        return queryTable;
    }

    // /**
    //  * Get a tableClient
    //  * @param type
    //  */
    // private getTableClient(type: string): QueryClient<any, any, any, any, any, any> {
    //     const tblClient = this.clientFactory(type);
    //     if (!tblClient) throw new Error('[Gybson] unexpected error. No client found for ' + type);
    //     return tblClient;
    // }
    // private getClient(type: string) {
    //     // return new UserClient({});
    //     return {
    //         // can probably generalise loadOne, loadMany, findMany into a generic batch loader which performs all optimisations possible
    //         // for now maybe exlude findMany
    //         batchFind(args: { where?: any; orderBy?: any; loadOptions?: LoadOptions }): Promise<any> {
    //             //...
    //         },
    //         findMany(_args: { whereIn: any[]; where: any }) {
    //             return [];
    //         },
    //     };
    // }

    public pushLink(link: TraveralLink): void {
        this.taversalChain.push(link);
        this.currentLink = link;
    }

    public addWhere(whereClause: RecordAny): void {
        if (!this.currentLink) throw new Error('No links in traversal yet, cannot add where clause');
        this.currentLink.options.where = {
            ...this.currentLink.options.where,
            ...whereClause,
        };
    }

    public addOrder(_order: any): void {
        return;
    }

    public addPaginate(_order: any): void {
        return;
    }

    public addWith(withClause: TraveralLink, chain?: any): void {
        if (!this.currentLink) throw new Error('No links in traversal yet, cannot add nested relation');
        this.currentLink.with ? this.currentLink.with.push(withClause) : (this.currentLink.with = [withClause]);
    }

    // public addWith(with: RecordAny) {
    // const with = this.traversalChain?.[this.traversalChain.length -1].with
    //     this.traversalChain?.[this.traversalChain.length -1].with
    // }

    /**
     * Resolve the fluent traversal chain
     * Iteratively executes the tree layer by layer
     * Database round-trips is O(N) where N is length of chain
     * This complexity extends to parallel executions of the same edges/nodes by a different Traveral instance
     *  i.e. parallel resolve trees in a GraphQL API
     */
    public async resolve<T>(): Promise<T[]> {
        // load the chain layer by layer

        // result from last edge traversal
        let prevResult: RecordAny[] = [];

        // parent link in the traveral chain (easier to memoize than to search)
        let parentLink: TraveralLink | null = null;

        for (const link of this.taversalChain) {
            console.log('Load link ', link);

            let result: RecordAny[] = [];

            // link is already resolved
            if (link.resolveData) {
                result = [link.resolveData];

                // loading the root of the tree
            } else if (parentLink == null) {
                const table = this.getQueryTable(link.table);

                const { where, orderBy, loadOptions } = link.options;

                result = await this.batchClient.loadMany(table, {
                    where,
                    orderBy,
                    ...loadOptions,
                });

                // if (link.rootLoad === 'uniq') {
                //     result = [
                //         await client.loadOne({
                //             where: {
                //                 ...(link.options.where ?? {}),
                //             },
                //             includeDeleted: link.options?.includeDeleted ?? undefined,
                //         }),
                //     ];
                // }
                // if (link.rootLoad === 'many') {
                //     result = await client.loadMany({
                //         ...link.options,
                //     });
                // }
            } else {
                // traversing an edge

                // if (parentLink == null) throw new Error('Impossible'); // keeping the type checker happy

                let loads: any = [];

                // get relationship info - note this is the relationship from parent table
                const relationship = link.relation;
                if (!relationship)
                    throw new Error(`Relationship not found between ${link.table} && ${parentLink.table}`);

                // transitive edges must be loaded in 2 steps
                if (relationship?.type === 'manyToMany') {
                    // for (const resolve of prev) {
                    //     let filter = node.filter?.where ?? {};
                    //     for (const join of relationship.joinFrom) {
                    //     }
                    //     transitiveResolves.push(
                    //         cl.loadMany({
                    //             where: {
                    //                 ...(node.filter?.where ?? {})
                    //             },
                    //         }),
                    //     );
                    // }
                }
                if (
                    relationship?.type === 'belongsTo' ||
                    relationship.type === 'hasMany' ||
                    relationship.type === 'hasOne'
                ) {
                    const table = this.getQueryTable(link.table);

                    const { where, orderBy, loadOptions } = link.options;

                    const batchable = true;

                    if (batchable) {
                        // alternative 1 - global batching
                        // TODO:- note the problem here,  would require in mem sort to guarantee global order...

                        // load relations for each previous node (fan out graph traversal)
                        loads = await Promise.all(
                            prevResult.map(async (ent) => {
                                const filters = where ?? {};

                                // build the join key filters

                                relationship.joins.map((j) => {
                                    filters[j.toColumn] = ent[j.fromColumn];
                                });

                                return this.batchClient.loadMany(table, {
                                    // how to handle filters that are not batchable?
                                    where: filters,
                                    // how to handle global ordering?
                                    // maybe should batch these loads internally? After depth 2?
                                    orderBy,
                                    ...loadOptions,
                                });
                            }),
                        );
                        result = flatten(await Promise.all(loads));
                    } else {
                        // alternative 2 - within chain batching
                        // can be applied to more complex filters like gt, like etc
                        // works because we can guarantee all filters other than joins are the same constants within all nodes in chain
                        // const sharedFilters = link.options.where ?? {};
                        // build the join key filters
                        // const inFilters = prevResult.map((ent) => {
                        //     const filters: any = {};
                        //     relationship.joins.map((j) => {
                        //         filters[j.toColumn] = ent[j.fromColumn];
                        //     });
                        //     return filters;
                        // });
                        // need the stable multi-column where-in logic here
                        // result = await client.findMany({ whereIn: inFilters, where: sharedFilters });
                    }
                }
            }
            parentLink = link;
            prevResult = result;
            console.log('LINK RESULT ', result);
        }
        // last link will be the correct result
        return prevResult as T[];
    }
}
