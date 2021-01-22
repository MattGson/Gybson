import { knex } from '../index';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { logger } from '../lib/logging';

type Connection = PGConn | MySQLConn;

/**
 * run a function with parameters as a single database transaction
 * //TODO - postgres compatibility check
 * // TODO:- cannot release connections - careful of memory
 * @param fn, a function that executes queries, takes arguments (connection, params)
 * @return Promise<any>
 */
export const runTransaction = async <T>(fn: (conn: Connection) => T): Promise<T> => {
    let conn = await knex().client.acquireConnection();

    try {
        await knex().raw('START TRANSACTION').connection(conn);
        const result = await fn(conn);
        await knex().raw('COMMIT').connection(conn);
        // conn.release();
        return result;
    } catch (err) {
        logger().debug('Transaction failed. Rolling back...');
        await knex().raw('ROLLBACK').connection(conn);
        // conn.release();
        throw err;
    }
};
