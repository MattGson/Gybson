import {knex} from '../index';
import {Connection as PGConn} from 'pg';
import {Connection as MySQLConn} from 'promise-mysql';
import {logger} from '../lib/logging';

type Connection = PGConn | MySQLConn;

/**
 * run a function with parameters as a single database transaction
 * //TODO - postgres compatibility check
 * @param fn, a function that executes queries, takes arguments (connection, params)
 * @return Promise<any>
 */
export const runTransaction = async <T>(fn: (conn: Connection) => T): Promise<T> => {
    let conn = knex().client.acquireConnection();

    try {
        conn = await knex().client.acquireConnection().getConnection();
        await conn.query('START TRANSACTION');

        const result = await fn(conn);

        await conn.query('COMMIT');
        conn.release();
        return result;
    } catch (err) {
        logger().debug('Transaction failed. Rolling back...');
        conn.query('ROLLBACK');
        conn.release();
        throw err;
    }
};
