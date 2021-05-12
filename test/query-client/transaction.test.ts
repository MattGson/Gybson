import faker from 'faker';
import { openConnection, closeConnection, getKnex, seed, SeedIds } from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('Transaction', () => {
    let ids: SeedIds;
    let gybson: GybsonClient;
    beforeAll(async (): Promise<void> => {
        await openConnection();
    });
    afterAll(async () => {
        await closeConnection();
    });
    beforeEach(async () => {
        gybson = new GybsonClient(getKnex());

        // Seeds
        ids = await seed(gybson);
    });
    describe('Insert multiple rows', () => {
        it('Can insert multiple rows as a transaction', async () => {
            const result = await gybson._transaction(async (connection) => {
                const userId = await gybson.user.insert({
                    connection,
                    values: {
                        first_name: 'John',
                        last_name: 'Doe',
                        permissions: 'ADMIN',
                        email: faker.internet.email(),
                        password: 'my password',
                    },
                });
                const tm = await gybson.teamMember.insert({
                    connection,
                    values: {
                        user_id: userId,
                        team_id: ids.team1Id,
                    },
                });
                return userId;
            });
            const user = await gybson.user.loadOne({ where: { user_id: result } });
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
                const users = await gybson.user.findMany({});
                const numuser = users.length;
                await expect(
                    gybson._transaction(async (trx) => {
                        const userId = await gybson.user.insert({
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
                        const tm = await gybson.teamMember.insert({
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
                const users2 = await gybson.user.findMany({});
                expect(users2).toHaveLength(numuser);
            });
        });
        describe('Query support', () => {
            it('Can transact insert, upsert, soft-delete, update', async () => {
                await gybson._transaction(async (trx) => {
                    await gybson.user.insert({
                        connection: trx,
                        values: {
                            first_name: 'John',
                            last_name: 'Doe',
                            permissions: 'ADMIN',
                            email: faker.internet.email(),
                            password: 'my password',
                        },
                    });
                    await gybson.user.upsert({
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
                    await gybson.user.softDelete({
                        connection: trx,
                        where: {
                            first_name: 'steve',
                        },
                    });
                    await gybson.user.update({
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
