import Knex from 'knex';
import { buildSchema } from './buildSchema';

const buildMySQLSchema = async () => {
    const knex = Knex({
        client: 'mysql',
        connection: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'gybson_test',
            multipleStatements: true,
        },
    });

    await buildSchema(knex);
};
