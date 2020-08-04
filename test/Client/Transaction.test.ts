import { seed, SeedIds } from '../Setup/seed';
import gybsonRefresh, { Gybson } from '../Gen';
import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit, { LogLevel, transaction } from '../../src/Client';
import faker from 'faker';
import { Transaction } from 'knex';

describe('Transaction', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
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
            const result = await transaction(async (trx: Transaction) => {
                const userId = await gybson.Users.insert({
                    transact: trx,
                    values: {
                        first_name: 'John',
                        last_name: 'Doe',
                        permissions: 'ADMIN',
                        email: faker.internet.email(),
                        password: 'my password',
                    },
                });
                const tm = await gybson.TeamMembers.insert({
                    transact: trx,
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
                    transaction(async (trx: Transaction) => {
                        const userId = await gybson.Users.insert({
                            transact: trx,
                            values: {
                                first_name: 'John',
                                last_name: 'Doe',
                                permissions: 'ADMIN',
                                email: faker.internet.email(),
                                password: 'my password',
                            },
                        });
                        // missing team id will fail
                        const tm = await gybson.TeamMembers.insert({
                            transact: trx,
                            values: {
                                user_id: userId,
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
                await transaction(async (trx: Transaction) => {
                    await gybson.Users.insert({
                        transact: trx,
                        values: {
                            first_name: 'John',
                            last_name: 'Doe',
                            permissions: 'ADMIN',
                            email: faker.internet.email(),
                            password: 'my password',
                        },
                    });
                    await gybson.Users.upsert({
                        transact: trx,
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
                        transact: trx,
                        where: {
                            first_name: 'steve',
                        },
                    });
                    await gybson.Users.update({
                        transact: trx,
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
