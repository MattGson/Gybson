import Knex from 'knex';
import { GybsonClient } from 'test/tmp';

describe('Connect', () => {
    it('Can initialise a connection to MySQL', async () => {
        const knex = Knex({
            client: 'mysql',
            connection: {
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                database: 'tests',
            },
        });

        const gybson = new GybsonClient(knex);
        await gybson.close();
    });
    it('Can initialise a connection to Postgres', async () => {
        const knex = Knex({
            client: 'pg',
            connection: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: '',
                database: 'tests',
            },
        });

        const gybson = new GybsonClient(knex);
        await gybson.close();
    });
});
