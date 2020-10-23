import { closeConnection } from '../Setup/build-test-db';

import Gybson from '../../src/Client';
import { buildDBSchemas } from '../Setup/build-test-db';

describe('Connect', () => {
    beforeAll(
        async (): Promise<void> => {
            await buildDBSchemas();
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
