import type { Knex } from 'knex';
import type { Connection, GybsonConfig, Logger } from '..';
import { ClientEngine, LogLevel } from '../../types';
import { buildLogger, logger } from '../lib/logging';

export class GybsonBase {
    protected readonly logger: Logger;
    protected readonly engine: ClientEngine;
    protected clients: Map<string, any> = new Map();

    constructor(protected readonly knex: Knex<any, unknown>, protected readonly config?: GybsonConfig) {
        this.logger = config?.logger ? config.logger : buildLogger({ logLevel: config?.logLevel ?? LogLevel.debug });
        this.engine = knex.client.config.client;
        if (this.engine !== 'pg' && this.engine !== 'mysql') {
            this.logger.error(`Client option not recognised. Please configure knex with either 'pg' or 'mysql' for the client.`);
            throw new Error('Failed to initialise');
        }
        this.logger.info('Initialising Gybson...');
    }

    protected lazyClient<T>(name: string, ClientClass: any): T {
        let client = this.clients.get(name);
        if (client) return client;
        client = new ClientClass(this.clientConfig);
        this.clients.set(name, client);
        return client;
    }

    protected get clientConfig(): { knex: Knex<any, unknown>; logger: Logger; engine: ClientEngine } {
        return { knex: this.knex, logger: this.logger, engine: this.engine };
    }

    /**
     * Close the inner knex connection
     */
    public async _close(): Promise<void> {
        await this.knex.destroy();
        this.logger.info('Gybson connection closed');
    }
    /**
     * Run a function as a transaction
     * @param fn
     * @returns
     */
    public async _transaction<T>(fn: (conn: Connection) => T): Promise<T> {
        const conn = await this.knex.client.acquireConnection();
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
