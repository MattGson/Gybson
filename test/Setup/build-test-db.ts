import Knex from 'knex';
import { migrateDb } from './migrate-db';
import { Connection } from '../../src/Generator/Introspection';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { DB } from './test.env';
type PoolConnection = PGConn | MySQLConn;

export const schemaName = 'gybson_test';
export const mysqlConnection: Connection = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: schemaName,
        multipleStatements: true,
    },
};

export const pgConnection: Connection = {
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: schemaName,
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
export const getPoolConnection = async () => state.knex.client.acquireConnection();
export const closePoolConnection = async (connection: PoolConnection) =>
    state.knex.client.releaseConnection(connection);

export const knex = (): Knex => state.knex;
export const closeConnection = async () => state.knex.destroy();

export const buildDBSchemas = async (): Promise<Connection> => {
    if (DB() === 'pg') {
        state.knex = Knex(pgConnection);
        await migrateDb(state.knex, true);
        return pgConnection;
    }
    if (DB() === 'mysql') {
        state.knex = Knex(mysqlConnection);
        await migrateDb(state.knex, false);
        return mysqlConnection;
    }
    throw new Error('No db specified');
};
