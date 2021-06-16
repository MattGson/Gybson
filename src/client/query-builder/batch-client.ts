import { Knex } from 'knex';
import _ from 'lodash';
import { OrderBy, RecordAny, Logger } from '../../types';
import { Loader } from './loader';
import { QueryTable } from './query-table';

export class BatchQuery<
    TblRow extends RecordAny,
    // TblColumnMap,
    // TblWhere,
    // TblUniqueWhere,
    // TblNonUniqueWhere,
    TblOrderBy extends OrderBy,
    // TblPaginate extends Paginate<TblRow>,
    // RequiredTblRow,
    PartialTblRow = Partial<TblRow>,
> {
    constructor(private queryTable: QueryTable, private knex: Knex<any, unknown>, private logger: Logger) {}

    private readonly loader = new Loader<TblRow, PartialTblRow, TblOrderBy>({
        getMultis: (args) => this.stableGetMany(args),
        // getOnes: (args) => this.stableGetSingles(args),
    });

    /**
     * Load multiple rows for each input compound key (stable ordering)
     * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
     * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
     */
    private async stableGetMany(params: {
        keys: readonly PartialTblRow[];
        orderBy?: TblOrderBy;
        includeDeleted?: boolean;
    }): Promise<TblRow[][]> {
        const { keys, orderBy, includeDeleted } = params;

        // get the key columns to load on
        const columns = Object.keys(keys[0]);

        // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [3, 5]
        const loadValues = keys.map<(string | number | Date)[]>((k: any) => {
            return columns.map((col) => k[col]);
        });
        // reduce number of keys sent to DB
        const uniqueLoads = _.uniqBy(loadValues, (value) => value.join(':'));

        const query = this.knex(this.queryTable.aliasedTable).select().whereIn(columns, uniqueLoads);

        if (!includeDeleted && this.queryTable.hasSoftDelete) query.where(this.queryTable.softDeleteFilter(true));

        if (orderBy) {
            for (const [column, direction] of Object.entries(orderBy)) {
                query.orderBy(column, direction);
            }
        }

        this.logger.debug('Executing many load: %s with keys %j', query.toSQL().sql, uniqueLoads);

        const rows = await query;

        // join multiple keys into a unique string to allow mapping to dictionary
        // i.e. [{ user_id: 3, post_id: 5 }, { user_id: 6, post_id: 7 }] -> ["3:5", "6:7"]
        // again map columns to make sure order is preserved
        const sortKeys = keys.map((k: any) =>
            columns
                .map((col) => k[col])
                .join(':')
                .toLowerCase(),
        );

        // map rows back to input keys to ensure order is preserved as required by data-loader
        const grouped = _.groupBy(rows, (row) =>
            columns
                .map((col) => row[col])
                .join(':')
                .toLowerCase(),
        );
        return sortKeys.map((key) => grouped[key] || []);
    }

    // /**
    //  * Load a single row for each input compound key (stable ordering)
    //  * make use of the tuple style WHERE IN clause i.e. WHERE (user_id, post_id) IN ((1,2), (2,3))
    //  * @param params.keys - the load key i.e. { user_id: 3, post_id: 5 }[]
    //  */
    // private async stableGetSingles(params: {
    //     keys: readonly PartialTblRow[];
    //     includeDeleted?: boolean;
    // }): Promise<(TblRow | null)[]> {
    //     const { keys, includeDeleted } = params;

    //     // get the key columns to load on
    //     const columns = Object.keys(keys[0]);

    //     // Need to make sure order of values matches order of columns in WHERE i.e. { user_id: 3, post_id: 5 } -> [3, 5]
    //     const loadValues = keys.map<(string | number)[]>((k: any) => {
    //         return columns.map((col) => k[col]);
    //     });

    //     // reduce number of keys sent to DB
    //     const uniqueLoads = _.uniqBy(loadValues, (value) => value.join(':'));

    //     const query = this.knex(this.queryTable.aliasedTable).select().whereIn(columns, uniqueLoads);
    //     if (!includeDeleted && this.queryTable.hasSoftDelete) query.where(this.queryTable.softDeleteFilter(true));

    //     this.logger.debug('Executing single load: %s with keys %j', query.toSQL().sql, uniqueLoads);

    //     const rows = await query;

    //     // join multiple keys into a unique string to allow mapping to dictionary
    //     // i.e. [{ user_id: 3, post_id: 5 }, { user_id: 6, post_id: 7 }] -> ["3:5", "6:7"]
    //     // again map columns to make sure order is preserved
    //     const sortKeys = keys.map((k: any) =>
    //         columns
    //             .map((col) => k[col])
    //             .join(':')
    //             .toLowerCase(),
    //     );
    //     // map rows to dictionary against the same key strings - again preserving key column order
    //     // -> Notice that keys are compared case-insensitive
    //     const keyed = _.keyBy(rows, (row) =>
    //         columns
    //             .map((col) => row[col])
    //             .join(':')
    //             .toLowerCase(),
    //     );

    //     // map rows back to key order
    //     return sortKeys.map((k) => {
    //         if (keyed[k]) return keyed[k];
    //         this.logger.debug(`Missing row for ${this.queryTable.tableName}, columns: ${columns.join(':')}, key: ${k}`);
    //         return null;
    //     });
    // }
}
