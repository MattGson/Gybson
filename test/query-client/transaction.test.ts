import { GybsonClient } from 'test/tmp';
import {
    buildDBSchemas,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    knex,
    seed,
    SeedIds,
    seedPost,
    seedUser,
} from 'test/helpers';
import faker from 'faker';

describe('Transaction', () => {
    let ids: SeedIds;
    let gybson: GybsonClient;
    let connection;
    beforeAll(async (): Promise<void> => {
        connection = await buildDBSchemas();
        gybson = new GybsonClient(knex());
    });
    afterAll(async () => {
        await closeConnection();
        await gybson.close();
    });
    beforeEach(async () => {
        gybson = new GybsonClient(knex());

        // Seeds
        ids = await seed(gybson);
    });
    describe('Insert multiple rows', () => {
        it('Can insert multiple rows as a transaction', async () => {
            const result = await gybson._transaction(async (connection) => {
                const userId = await gybson.Users.insert({
                    connection,
                    values: {
                        first_name: 'John',
                        last_name: 'Doe',
                        permissions: 'ADMIN',
                        email: faker.internet.email(),
                        password: 'my password',
                    },
                });
                const tm = await gybson.TeamMembers.insert({
                    connection,
                    values: {
                        user_id: userId,
                        team_id: ids.team1Id,
                    },
                });
                return userId;
            });
            const user = await gybson.Users.loadOne({ where: { user_id: result } });
            expect(user).toEqual(
                expect.objectContaining({
                    user_id: result,
                    first_name: 'John',
                    last_name: 'Doe',
                    permissions: 'ADMIN',
                }),
            );
        });
        describe('Rollback on failure', () => {
            it('Does not make any changes if an statement fails', async () => {
                const users = await gybson.Users.findMany({});
                const numUsers = users.length;
                await expect(
                    gybson._transaction(async (trx) => {
                        const userId = await gybson.Users.insert({
                            connection: trx,
                            values: {
                                first_name: 'John',
                                last_name: 'Doe',
                                permissions: 'ADMIN',
                                email: faker.internet.email(),
                                password: 'my password',
                            },
                        });
                        // non existing team_id will fail
                        const tm = await gybson.TeamMembers.insert({
                            connection: trx,
                            values: {
                                user_id: userId,
                                team_id: 30000,
                            },
                        });
                        return userId;
                    }),
                ).rejects.toThrow(Error);
                // no new user added
                const users2 = await gybson.Users.findMany({});
                expect(users2).toHaveLength(numUsers);
            });
        });
        describe('Query support', () => {
            it('Can transact insert, upsert, soft-delete, update', async () => {
                await gybson._transaction(async (trx) => {
                    await gybson.Users.insert({
                        connection: trx,
                        values: {
                            first_name: 'John',
                            last_name: 'Doe',
                            permissions: 'ADMIN',
                            email: faker.internet.email(),
                            password: 'my password',
                        },
                    });
                    await gybson.Users.upsert({
                        connection: trx,
                        values: {
                            first_name: 'John',
                            last_name: 'Doe',
                            permissions: 'ADMIN',
                            email: faker.internet.email(),
                            password: 'my password',
                        },
                        updateColumns: { first_name: true },
                    });
                    await gybson.Users.softDelete({
                        connection: trx,
                        where: {
                            first_name: 'steve',
                        },
                    });
                    await gybson.Users.update({
                        connection: trx,
                        values: {
                            email: faker.internet.email(),
                        },
                        where: {
                            last_name: 'steve',
                        },
                    });
                });
            });
        });
    });
});
