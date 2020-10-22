import Knex from 'knex';
import { buildSchema } from './buildSchema';
import { Connection } from '../../src/Generator/Introspection';
import { Connection as PGConn } from 'pg-promise/typescript/pg-subset';
import { Connection as MySQLConn } from 'promise-mysql';
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
    client: 'postgres',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'mattgoodson',
        password: '',
        database: 'mattgoodson',
    },
};

const state: any = {
    knex: undefined,
};

// helpers for testing manual connection handling
export const getPoolConnection = async () => state.knex.client.acquireConnection();
export const closePoolConnection = async (connection: PoolConnection) => state.knex.client.releaseConnection(connection);

export const knex = (): Knex => state.knex;
export const closeConnection = async () => state.knex.destroy();

export const buildDBSchemas = async () => {
    const mysqlKnex = Knex(mysqlConnection);
    const pgKnex = Knex(pgConnection);
    state.knex = mysqlKnex;
    await buildSchema(mysqlKnex);
    await buildSchema(pgKnex);
};
