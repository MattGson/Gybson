import { seed, SeedIds } from '../environment/seed';
import gybsonRefresh, { Gybson } from '../tmp';
import { buildDBSchemas, closeConnection, closePoolConnection, getPoolConnection } from '../environment/build-test-db';
import gybInit, { LogLevel } from '../../src/Client';
import 'jest-extended';
import { Connection } from '../../src/Generator/Introspection';

describe('Insert', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    let connection: Connection;
    beforeAll(async (): Promise<void> => {
        connection = await buildDBSchemas();
        await gybInit.init({ ...connection, options: { logLevel: LogLevel.debug } });
    });
    afterAll(async () => {
        await closeConnection();
        await gybInit.close();
    });
    beforeEach(async () => {
        gybson = gybsonRefresh();

        // Seeds
        ids = await seed(gybson);
    });
    describe('usage', () => {
        it('Can insert a single row', async () => {
            const postId = await gybson.Posts.insert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
            });
            const post = await gybson.Posts.oneByPostId({ post_id: postId });
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
            const postId = await gybson.Posts.insert({
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
            const posts = await gybson.Posts.manyByAuthorId({ author_id: ids.user1Id });
            expect(posts).toIncludeAllMembers([
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
            const postId = await gybson.Posts.insert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
            });
            expect(postId).toBeDefined();
            const post = await gybson.Posts.oneByPostId({ post_id: postId });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
        });
        it('Throws error if the insert fails', async () => {
            await expect(
                gybson.Posts.insert({
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
            const postId = await gybson.Posts.insert({
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
