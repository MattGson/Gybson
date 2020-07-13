import { PoolConnection } from 'promise-mysql';
import { knex } from '../index';
import _logger from '../lib/logging';

const SOFT_DELETE_COLUMN = 'deleted';

/**
 * Type-safe multi upsert function
 * Inserts all rows. If duplicate key then will update specified columns for that row.
 *     * Pass a constant column (usually primary key) to ignore duplicates without updating any rows.
 * Can automatically remove soft deletes if desired instead of specifying the column and values manually.
 *     * This should be set to false if the table does not support soft deletes
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param params
 */
export async function upsert<TblRow, TblColumn extends string>(params: {
    connection: PoolConnection;
    tableName: string;
    values: Partial<TblRow>[];
    reinstateSoftDeletedRows: boolean;
    updateColumns: TblColumn[];
}): Promise<number | null> {
    const { tableName, values, connection, reinstateSoftDeletedRows, updateColumns } = params;

    let insertRows = values;
    if (insertRows.length < 1) {
        _logger.warn('Persistors.upsert: No values passed.');
        return null;
    }
    if (updateColumns.length < 1 && !reinstateSoftDeletedRows) {
        _logger.warn('Persistor.upsert: No reinstateSoftDelete nor updateColumns. Use insert.');
        return null;
    }

    const columnsToUpdate: string[] = updateColumns;
    // add deleted column to all records
    if (reinstateSoftDeletedRows) {
        columnsToUpdate.push(SOFT_DELETE_COLUMN);
        insertRows = insertRows.map((value) => {
            return {
                ...value,
                [SOFT_DELETE_COLUMN]: false,
            };
        });
    }

    // Knex Normalizes empty (undefined) keys to DEFAULT on multi-row insert:
    // knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
    // Outputs:
    //    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)
    // Note that we are passing a custom connection:
    //    This connection MUST be added last to work with the duplicateUpdateExtension
    const query = knex()(tableName)
        .insert(insertRows)
        .onDuplicateUpdate(...columnsToUpdate)
        .connection(connection);

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, insertRows);

    // knex seems to return 0 for insertId on upsert?
    return (await query)[0].insertId;
}

/**
 * Type-safe multi insert function
 * Inserts all rows. Fails on duplicate key error
 *     * use upsert if you wish to ignore duplicate rows
 * Will replace undefined keys or values with DEFAULT which will use a default column value if available.
 * Will take the superset of all columns in the insert values
 * @param params
 */
export async function insert<TblRow>(params: {
    connection: PoolConnection;
    tableName: string;
    values: TblRow[];
}): Promise<number | null> {
    const { values, tableName, connection } = params;
    if (values.length < 1) return null;

    let query = knex()(tableName).insert(values);

    _logger.debug('Executing SQL: %j with keys: %j', query.toSQL().sql, values);
    const result = await query.connection(connection);

    // seems to return 0 for non-auto-increment inserts
    return result[0];
}
