import DataLoader from 'dataloader';
import { OrderBy, OrderQueryFilter, RecordAny, SoftDeleteQueryFilter } from '../../types';
import { logger } from '../lib/logging';

interface LoaderDataSource<RowType, KeyType = Partial<RowType>, Order = OrderBy> {
    getOnes: (params: { keys: readonly KeyType[]; includeDeleted?: boolean }) => Promise<(RowType | null)[]>;
    getMultis: (params: {
        keys: readonly KeyType[];
        orderBy?: Order;
        includeDeleted?: boolean;
    }) => Promise<RowType[][]>;
}

type LoaderKey = RecordAny;

/**
 * Helper to extract all nested key paths from an object i.e user.post.id
 */
const keyify = (obj: RecordAny, prefix = ''): string[] =>
    Object.keys(obj)
        .sort()
        .reduce((res: string[], el: string) => {
            if (typeof obj[el] === 'object' && obj[el] !== null) {
                return [...res, ...keyify(obj[el], el + '.')];
            }
            return [...res, prefix + el];
        }, []);

/**
 * A generalised loader implementation.
 * Dynamically builds a map of data-loaders for a given table
 * Could later be generalised to automatically split loads by load angle
 */
export class Loader<RowType extends Record<string, unknown>, Filter = Partial<RowType>, Order = OrderBy> {
    private loaders: {
        oneLoaders: Record<string, DataLoader<LoaderKey, RowType | null>>;
        manyLoaders: Record<string, DataLoader<LoaderKey, RowType[]>>;
    } = { oneLoaders: {}, manyLoaders: {} };

    public constructor(private dataSource: LoaderDataSource<RowType, Filter, Order>) {}

    /**
     * Generate a unique hash key for a filter combination (used for loaders)
     * This determines which loads will be batched together
     * @param filter
     * @param extras
     */
    private filterHashKey<K extends { filter: Filter }>(
        filter: K,
        extras?: SoftDeleteQueryFilter & OrderQueryFilter<Order>,
    ) {
        let filterKey = keyify(filter).sort().join(':');
        if (extras?.orderBy) {
            // we need to make sure different orderings on the same filter are batched separately
            // stringify is a good enough key here
            filterKey += ':orderBy.';
            filterKey += JSON.stringify(extras.orderBy);
        }
        if (extras?.includeDeleted) {
            filterKey += ':includeDeleted.true';
        }
        return filterKey;
    }

    /**
     * Build data loader options
     * cacheKeyFn -> an object safe cache key function, utilises the fact that object.values order is stable in js
     *            -> makes sure objects with same value are compared equally in the cache
     * @returns
     */
    private getDataLoaderOptions() {
        return { cacheKeyFn: (k: RecordAny) => Object.values(k).join(':') };
    }

    /**
     * Clear the load cache
     */
    public async purge(): Promise<void> {
        return new Promise<void>((res) => {
            Object.values(this.loaders.manyLoaders).forEach((l) => l.clearAll());
            Object.values(this.loaders.oneLoaders).forEach((l) => l.clearAll());
            res();
        });
    }

    /**
     * Batch Loads multiple rows for the input filter.
     * @param params
     */
    public async loadMany(
        params: { filter: Filter } & OrderQueryFilter<Order> & SoftDeleteQueryFilter,
    ): Promise<RowType[]> {
        const { filter, orderBy, includeDeleted } = params;

        // different loader for each param combination
        const loadAngle = this.filterHashKey({ filter }, { includeDeleted, orderBy });
        let loader = this.loaders.manyLoaders[loadAngle];

        if (!loader) {
            logger().debug(`No many-loader for key ${loadAngle}. Creating loader.`);
            loader = this.loaders.manyLoaders[loadAngle] = new DataLoader<Filter, RowType[], string>(
                // TODO:- check if this scope capture has memory implications?
                (keys) => this.dataSource.getMultis({ keys, orderBy, includeDeleted }),
                {
                    // disable cache on multi-loads to reduce memory consumption, not usually that useful anyway
                    cache: false,
                },
            );
        }
        return loader.load(filter);
    }

    /**
     * Batch Loads a single row for the input filter.
     * @param params
     */
    public async loadOne(params: { filter: Filter } & SoftDeleteQueryFilter): Promise<RowType | null> {
        const { filter, includeDeleted } = params;

        // different loader for each param combination
        const loadAngle = this.filterHashKey({ filter }, { includeDeleted });
        let loader = this.loaders.oneLoaders[loadAngle];

        if (!loader) {
            logger().debug(`No single-loader for key ${loadAngle}. Creating loader.`);
            loader = this.loaders.oneLoaders[loadAngle] = new DataLoader<Filter, RowType | null, string>(
                // TODO:- check if this scope capture has memory implications?
                (keys) => this.dataSource.getOnes({ keys, includeDeleted }),
                this.getDataLoaderOptions(),
            );
        }
        return loader.load(filter);
    }
}
