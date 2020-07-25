import { PoolConnection } from 'promise-mysql';
import { logger } from '../lib/logging';
import { knex } from '../index';

const openTransaction = async (connection: PoolConnection) => {
    await knex().raw(`START TRANSACTION`).connection(connection);
};

const commitTransaction = async (connection: PoolConnection) => {
    await knex().raw(`COMMIT`).connection(connection);
};

const rollbackTransaction = async (connection: PoolConnection) => {
    await knex().raw(`ROLLBACK`).connection(connection);
};

/**
 * Run a function as a transaction
 * @param fn
 */
export const transaction = async <T>(fn: (connection: PoolConnection) => T): Promise<T> => {
    let connection: PoolConnection;
    try {
        logger().debug('Starting transaction...');

        connection = knex().client.acquireConnection();

        await openTransaction(connection);
        const result = await fn(connection);

        logger().debug('Committing transaction...');
        await commitTransaction(connection);
        connection.release();

        return result;
    } catch (err) {
        logger().debug('Transaction failed. Rolling back...');
        // @ts-ignore
        if (connection) {
            await rollbackTransaction(connection);
            connection.release();
        }
        throw err;
    }
};
