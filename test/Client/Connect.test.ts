import { buildMySQLSchema, closeConnection } from '../Setup/buildMySQL';

import Gybson from '../../src/Client';

describe('Connect', () => {
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    it('Can initialise a connection to MySQL', async () => {
        await Gybson.init({
            client: 'mysql',
            connection: {
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
            },
        });
        await Gybson.close();
    });
});
