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
 * // TODO:- maybe not
 * Assumes all keys passed into a request are for the same load angle (i.e. split by method such as Users.oneByUserId)
 * Could later be generalised to automatically split loads by load angle
 */
export class Loader<T extends SoftDeletable, F = Partial<T>> {
    public constructor(
        private loaders: {
            oneLoaders: Record<string, DataLoader<any, T | null>>;
            manyLoaders: Record<string, DataLoader<any, T[]>>;
        },
        private dataSource: LoaderDataSource<T>,
    ) {}

    /**
     * Generate a unique hash key for a filter combination (used for loaders)
     * @param filter
     */
    private filterHashKey(filter: F) {
        return keyify(filter).sort().join(':');
    }

    // Build data loader options
    //  cacheKeyFn -> an object safe cache key function, utilises the fact that object.values order is stable in js
    private getDataLoaderOptions() {
        return { cacheKeyFn: (k: F) => Object.values(k).join(':') };
    }

    // /**
    //  * Data loader helper for loading a single row per key
    //  * @param keys
    //  */
    // private loadSingles(keys: readonly F[]) {
    //     return this.dataSource.getOnes({ keys });
    // }

    /**
     * Data loader helper for loading many rows per key
     * @param keys
     */
    // private loadMultiples(keys: readonly F[]) {
    //     const [{ orderBy }] = keys;
    //     const order = { ...orderBy }; // copy to retain
    //     keys.map((k) => delete k.orderBy); // remove key so its not included as a load param
    //     // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
    //     return this.dataSource.getMultis({ keys, orderBy: order });
    // }

    /**
     * Loads multiple rows for the input filter.
     * @param where
     * @param options
     */
    public async loadMany(where: F, options: SoftDeleteQueryFilter & OrderQueryFilter) {
        const { orderBy } = options;

        // different loader for each orderBy
        const loadAngle = this.filterHashKey({ ...where, ...orderBy });
        const loader = this.loaders.manyLoaders[loadAngle];

        if (!loader) {
            // create new loader
            logger().debug(`No loader for key ${loadAngle}. Creating loader.`);
            this.loaders.manyLoaders[loadAngle] = new DataLoader<F, T[], string>(
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
     * @param where
     * @param options
     */
    public async loadOne(where: F, options: SoftDeleteQueryFilter) {
        const loadAngle = this.filterHashKey(where);
        const loader = this.loaders.oneLoaders[loadAngle];

        if (!loader) {
            // create new loader
            logger().debug(`No loader for key ${loadAngle}. Creating loader.`);
            this.loaders.oneLoaders[loadAngle] = new DataLoader<F, T | null, string>(
                (keys) => this.dataSource.getOnes({ keys }),
                this.getDataLoaderOptions(),
            );
        }
        const row = await loader.load(where);

        const [result] = runMiddleWares([row], options);
        return result || null;
    }
}
