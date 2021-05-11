import Knex from 'knex';
import { ClientEngine, LogLevel } from 'src/types';
import winston from 'winston';
import { Connection, GybsonConfig } from '..';
import { buildLogger, logger } from '../lib/logging';

export class GybsonBase {
    private logger: winston.Logger;
    private engine: ClientEngine;

    constructor(private knex: Knex<any, unknown>, private config?: GybsonConfig) {
        this.logger = buildLogger({ logLevel: config?.logLevel ?? LogLevel.debug });
        this.engine = knex.client.config.client;
        if (this.engine !== 'pg' && this.engine !== 'mysql') {
            this.logger.error(
                `Client option not recognised. Please configure knex with either 'pg' or 'mysql' for the client.`,
            );
            throw new Error('Failed to initialise');
        }
        this.logger.info('Initialising Gybson...');
    }

    public async close() {
        await this.knex.destroy();
        this.logger.info('Gybson connection closed');
    }

    /**
     * Run a function as a transaction
     * @param fn
     * @returns
     */
    public async transaction<T>(fn: (conn: Connection) => T): Promise<T> {
        let conn = await this.knex.client.acquireConnection();

        try {
            await this.knex.raw('START TRANSACTION').connection(conn);
            const result = await fn(conn);
            await this.knex.raw('COMMIT').connection(conn);
            conn.end();
            return result;
        } catch (err) {
            logger().debug('Transaction failed. Rolling back...');
            await this.knex.raw('ROLLBACK').connection(conn);
            conn.end();
            throw err;
        }
    }
}
