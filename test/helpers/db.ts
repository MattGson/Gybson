import { knex, Knex } from 'knex';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { mysqlConnection, pgConnection } from 'test/config';
import { DB } from './helpers';
type PoolConnection = PGConn | MySQLConn;

const state: any = {
    knex: undefined,
};

// helpers for testing manual connection handling
export const closePoolConnection = async (connection: PoolConnection): Promise<void> =>
    state.knex.client.releaseConnection(connection);

export const getKnex = (): Knex => state.knex;
export const closeConnection = async (): Promise<void> => state.knex.destroy();
export const getPoolConnection = async () => state.knex.client.acquireConnection();

export const openConnection = async (): Promise<Knex<any, unknown>> => {
    if (state.knex) return state.knex;
    if (DB() === 'pg') {
        state.knex = knex(pgConnection);
        return state.knex;
    }
    if (DB() === 'mysql') {
        state.knex = knex(mysqlConnection);
        return state.knex;
    }
    throw new Error('No db specified while opening connection');
};

// export const buildDBSchemas = async (): Promise<Knex<any, unknown>> => {
//     const conn = await openConnection();
//     await migrateDb(state.knex, DB() === 'pg');
//     return conn;
// };
