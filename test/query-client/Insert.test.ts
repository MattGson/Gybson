import {
    openConnection,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    getKnex,
    seed,
    SeedIds,
} from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('Insert', () => {
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
        it('Can insert a single row', async () => {
            const postId = await gybson.post.insert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
            });
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                    message: 'test 2',
                    rating_average: 6,
                    author: 'name',
                }),
            );
        });
        it('Can insert multiple rows', async () => {
            const postId = await gybson.post.insert({
                values: [
                    {
                        message: 'test 2',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'name',
                        created: new Date(2003, 20, 4),
                    },
                    {
                        message: 'test 3',
                        author_id: ids.user1Id,
                        rating_average: 8,
                        author: 'name 2',
                        created: new Date(2005, 20, 4),
                    },
                ],
            });
            const post = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
            expect(post).toIncludeAllMembers([
                expect.objectContaining({
                    post_id: postId,
                    message: 'test 2',
                    rating_average: 6,
                    author: 'name',
                }),
                expect.objectContaining({
                    post_id: postId + 1,
                    message: 'test 3',
                    author_id: ids.user1Id,
                    rating_average: 8,
                    author: 'name 2',
                }),
            ]);
        });
        it('Returns the id of the first inserted row', async () => {
            const postId = await gybson.post.insert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
            });
            expect(postId).toBeDefined();
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
        });
        it('Throws error if the insert fails', async () => {
            await expect(
                gybson.post.insert({
                    values: {
                        post_id: ids.post1Id, // conflicting id
                        message: 'test 2',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'name',
                        created: new Date(2003, 20, 4),
                    },
                }),
            ).rejects.toThrow(Error);
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const postId = await gybson.post.insert({
                connection,
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
            });
            await closePoolConnection(connection);
            expect(postId).toBeDefined();
        });
    });
});
