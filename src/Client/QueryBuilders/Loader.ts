import { logger } from '../lib/logging';
import DataLoader from 'dataloader';
import { runMiddleWares } from './RowMiddleware';
import { SoftDeleteQueryFilter, SoftDeletable, OrderQueryFilter } from '../../TypeTruth';

interface LoaderDataSource<T> {
    getOnes: (params: { keys: readonly any[] }) => Promise<(T | null)[]>;
    getMultis: (params: { keys: readonly any[]; orderBy?: any }) => Promise<T[][]>;
}

/**
 * Helper to extract all nested key paths from an object i.e user.post.id
 */
const keyify = (obj: any, prefix = ''): string[] =>
    Object.keys(obj)
        .sort()
        .reduce((res: string[], el: any) => {
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
export class Loader<T extends object, F = Partial<T>> {
    private loaders: {
        oneLoaders: Record<string, DataLoader<any, T | null>>;
        manyLoaders: Record<string, DataLoader<any, T[]>>;
    } = { oneLoaders: {}, manyLoaders: {} };

    public constructor(private dataSource: LoaderDataSource<T>) {}

    /**
     * Generate a unique hash key for a filter combination (used for loaders)
     * @param filter
     */
    private filterHashKey<K extends { where: F }>(filter: K) {
        return keyify(filter).sort().join(':');
    }

    // Build data loader options
    //  cacheKeyFn -> an object safe cache key function, utilises the fact that object.values order is stable in js
    private getDataLoaderOptions() {
        return { cacheKeyFn: (k: F) => Object.values(k).join(':') };
    }

    /**
     * Clear the load cache
     */
    public async purge() {
        return new Promise((res) => {
            Object.values(this.loaders.manyLoaders).forEach((l) => l.clearAll());
            Object.values(this.loaders.oneLoaders).forEach((l) => l.clearAll());
            res();
        });
    }

    /**
     * Loads multiple rows for the input filter.
     * @param where
     * @param options
     */
    public async loadMany(where: F, options: SoftDeleteQueryFilter & OrderQueryFilter) {
        const { orderBy } = options;

        // different loader for each orderBy
        const loadAngle = this.filterHashKey({ where, orderBy });
        let loader = this.loaders.manyLoaders[loadAngle];

        if (!loader) {
            // create new loader
            logger().debug(`No loader for key ${loadAngle}. Creating loader.`);
            loader = this.loaders.manyLoaders[loadAngle] = new DataLoader<F, T[], string>(
                // TODO - this will use the same order for all? Even in the future - should work right?
                (keys) => this.dataSource.getMultis({ keys, orderBy }),
                this.getDataLoaderOptions(),
            );
        }
        const rows = await loader.load(where);

        const result = runMiddleWares(rows, options);
        return result || null;
    }

    /**
     * Loads a single row for the input filter.
     * @param params
     */
    public async loadOne(params: { where: F }) {
        const { where, ...options } = params;
        const loadAngle = this.filterHashKey({ where });
        let loader = this.loaders.oneLoaders[loadAngle];

        // un-nest filters
        const filter: any = {};
        Object.entries(where).map(([k, v]) => {
            if (v instanceof Object) Object.assign(filter, v);
            else filter[k] = v;
        });

        if (!loader) {
            // create new loader
            logger().debug(`No loader for key ${loadAngle}. Creating loader.`);
            loader = this.loaders.oneLoaders[loadAngle] = new DataLoader<F, T | null, string>(
                (keys) => this.dataSource.getOnes({ keys }),
                this.getDataLoaderOptions(),
            );
        }
        const row = await loader.load(filter);

        // TODO:- move this to QQ?
        const [result] = runMiddleWares([row], options);
        return result || null;
    }
}
