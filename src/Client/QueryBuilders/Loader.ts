import { logger } from '../lib/logging';
import DataLoader = require('dataloader');
import { runMiddleWares } from './RowMiddleware';
import { SharedQueryFilters } from '../../TypeTruth/QueryTypes';

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
export class Loader<T extends { deleted?: boolean; deleted_at?: Date }, F extends Partial<T>> {
    public constructor(
        private loaders: {
            oneLoaders: Record<string, DataLoader<any, T | null>>;
            manyLoaders: Record<string, DataLoader<any, T | null>>;
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

    /**
     * Data loader helper for loading a single row per key
     * @param keys
     */
    private loadSingles(keys: readonly F[]) {
        return this.dataSource.getOnes({ keys });
    }

    /**
     * Data loader helper for loading many rows per key
     * @param keys
     */
    private loadMultiples(keys: readonly any[]) {
        const [{ orderBy }] = keys;
        const order = { ...orderBy }; // copy to retain
        keys.map((k) => delete k.orderBy); // remove key so its not included as a load param
        // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
        return this.dataSource.getMultis({ keys, orderBy: order });
    }

    // TODO abstraction makes no sense - we pass the loaders in but the loaders have to call the datasource?
    /**
     * Loads a single row per input key.
     * @param where
     * @param options
     */
    public async loadOne(where: F, options: SharedQueryFilters) {
        // const loadKey = Object.keys(where).sort().join(':');

        const loadAngle = this.filterHashKey(where);
        const loader = this.loaders.oneLoaders[loadAngle];

        let { includeDeleted, ...rest } = options;
        if (!loader) {
            // create new loader
            logger().debug(`No loader for key ${loadAngle}. Creating loader.`);
            this.loaders.oneLoaders[loadAngle] = new DataLoader<F, T | null, string>(
                (keys) => this.loadSingles(keys),
                this.getDataLoaderOptions(),
            );
        }
        const row = await loader.load(where);

        const [result] = runMiddleWares([row], options);
        return result || null;
    }
}
