import { seed, SeedIds } from '../Setup/seed';
import gybsonRefresh, { Gybson } from '../Gen';
import { closeConnection } from '../Setup/build-test-db';
import gybInit, { LogLevel } from '../../src/Client';
import faker from 'faker';
import { Transaction } from 'knex';
import { buildDBSchemas } from '../Setup/build-test-db';

describe('Transaction', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    let connection;
    beforeAll(
        async (): Promise<void> => {
            connection = await buildDBSchemas();
            await gybInit.init({ ...connection, options: { logLevel: LogLevel.debug } });
        },
    );
    afterAll(async () => {
        await closeConnection();
        await gybInit.close();
    });
    beforeEach(async () => {
        gybson = gybsonRefresh();

        // Seeds
        ids = await seed(gybson);
    });
    describe('Insert multiple rows', () => {
        it('Can insert multiple rows as a transaction', async () => {
            const result = await gybson.runTransaction(async (trx) => {
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
                const tm = await gybson.TeamMembers.insert({
                    connection: trx,
                    values: {
                        user_id: userId,
                        team_id: ids.team1Id,
                    },
                });
                return userId;
            });
            const user = await gybson.Users.oneByUserId({ user_id: result });
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
                    gybson.runTransaction(async (trx) => {
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
                await gybson.runTransaction(async (trx) => {
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
