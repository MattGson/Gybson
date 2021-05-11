import {
    buildDBSchemas,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    getKnex,
    seed,
    SeedIds,
} from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('SoftDelete', () => {
    let ids: SeedIds;
    let gybson: GybsonClient;
    let connection;
    beforeAll(async (): Promise<void> => {
        connection = await buildDBSchemas();
    });
    afterAll(async () => {
        await closeConnection();
    });
    beforeEach(async () => {
        gybson = new GybsonClient(getKnex());

        // Seeds
        ids = await seed(gybson);
    });
    describe('usage', () => {
        it('Can soft delete using where filters', async () => {
            const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.post.softDelete({
                where: {
                    rating_average: {
                        gt: 4,
                    },
                },
            });
            await gybson.post.purge();
            const post2 = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post2).toEqual(null);
        });
        it('Can soft delete using a boolean column', async () => {
            const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.post.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            await gybson.post.purge();
            const post2 = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post2).toEqual(null);

            const post3 = await gybson.post.findMany({ where: { post_id: ids.post1Id } });
            expect(post3).toEqual([]);
        });
        it('Can soft delete using a Date column', async () => {
            const user = await gybson.user.loadOne({ where: { user_id: ids.user1Id } });
            expect(user).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                }),
            );

            await gybson.user.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            // test both loader and find-many
            await gybson.user.purge();
            const user2 = await gybson.user.loadOne({ where: { user_id: ids.user1Id } });
            expect(user2).toEqual(null);

            const post3 = await gybson.user.findMany({ where: { user_id: ids.user1Id } });
            expect(post3).toEqual([]);
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.post.softDelete({
                connection,
                where: {
                    rating_average: {
                        gt: 4,
                    },
                },
            });
            await gybson.post.purge();
            const post2 = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post2).toEqual(null);
            await closePoolConnection(connection);
        });
    });
});
