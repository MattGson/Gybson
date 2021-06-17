import { GybsonClient } from 'test/tmp';
import {
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    getKnex,
    seed,
    SeedIds,
    openConnection,
} from 'test/helpers';
import 'jest-extended';

describe('Delete', () => {
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
    describe('usage', () => {
        it('Can delete using where filters', async () => {
            const postId = await gybson.post.insert({
                values: {
                    author: 'author',
                    author_id: ids.user1Id,
                    message: 'Hello',
                    rating_average: 2000,
                },
            });
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
            await gybson.post.delete({
                where: {
                    rating_average: {
                        gt: 1999,
                    },
                },
            });
            await gybson.post.purge();
            const post2 = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post2).toEqual(null);
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const postId = await gybson.post.insert({
                values: {
                    author: 'author',
                    author_id: ids.user1Id,
                    message: 'Hello',
                    rating_average: 2000,
                },
            });
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
            await gybson.post.delete({
                connection,
                where: {
                    rating_average: {
                        gt: 1999,
                    },
                },
            });
            await gybson.post.purge();
            const post2 = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post2).toEqual(null);
            await closePoolConnection(connection);
        });
    });
});
