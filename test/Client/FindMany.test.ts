import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit from '../../src/Client';
import gybsonRefresh, { Gybson } from '../Gen';
import { seed, SeedIds } from '../Setup/seed';

describe('FindMany', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            await gybInit.init(connection);
            gybson = gybsonRefresh();

            // Seeds
            ids = await seed(gybson);
        },
    );
    afterAll(async () => {
        await closeConnection();
        await gybInit.close();
    });

    describe('where', () => {
        describe('Column filters', () => {
            it('Can filter by column equals', async () => {
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: ids.user1Id,
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
            it('Can filter by greater than', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            gt: 4.5,
                        },
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
            it('Can filter by less than', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            lt: 4.5,
                        },
                    },
                });
                expect(find).toHaveLength(0);
            });
            it('Can filter by less than or equal', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            lte: 4.5,
                        },
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
            it('Can filter by greater than or equal', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            gte: 6,
                        },
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
        });
        describe('Multiple column filters', () => {
            it('Can filter by multiple column equals', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        author: {
                            equals: 'name',
                        },
                        rating_average: 6,
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
        });
    });
    describe('order by', () => {});
    describe('paginate', () => {});
});
