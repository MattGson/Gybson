import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import { DatabaseSchema } from '../../src/Client';

import Gybson from '../../src/Client';
import Users from "../Gen/Users";

describe('Query', () => {
    let schema: DatabaseSchema;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            // const intro = new MySQLIntrospection(knex(), schemaName);
            // const schemaBuilder = new TableSchemaBuilder('users', intro);
            // const usersSchema = await schemaBuilder.buildTableDefinition();
            // schema = {
            //     users: usersSchema,
            // };
            await Gybson.init(connection);
        },
    );
    afterAll(async () => {
        await closeConnection();
        await Gybson.close();

    });
    describe('one by column load', () => {
        it('Can initialise a connection to MySQL', async () => {
            const user = new Users();

            const loadOne = await user.oneByUserId({ user_id: 1 });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: 1,
                }),
            );
        });
    });
});
