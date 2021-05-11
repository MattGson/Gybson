import { knex, Knex } from 'knex';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { migrateDb } from './migrate-db';
import { DB } from './helpers';
type PoolConnection = PGConn | MySQLConn;

export const databaseName = 'tests';
export const mysqlConnection = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: databaseName,
        multipleStatements: true,
    },
};

export const pgConnection = {
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: databaseName,
        schema: 'public',
    },
    pool: {
        min: 2,
        max: 50,
    },
};

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

export const buildDBSchemas = async (): Promise<Knex<any, unknown>> => {
    const conn = await openConnection();
    await migrateDb(state.knex, DB() === 'pg');
    return conn;
};
