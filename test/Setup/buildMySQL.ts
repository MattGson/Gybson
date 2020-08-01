import Knex from 'knex';
import { buildSchema } from './buildSchema';
import { Connection } from '../../src/Generator';

export const schemaName = 'gybson_test';
export const connection: Connection = {
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

const state: any = {
    knex: undefined,
};

export const knex = (): Knex => state.knex;

export const closeConnection = async () => state.knex.destroy();

export const buildMySQLSchema = async () => {
    const knex = Knex(connection);

    state.knex = knex;

    await buildSchema(knex);
};
