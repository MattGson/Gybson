import { seed, SeedIds } from '../Setup/seed';
import gybsonRefresh, { Gybson } from '../Gen';
import { buildDBSchemas, closeConnection, closePoolConnection, getPoolConnection } from '../Setup/build-test-db';
import gybInit, { LogLevel } from '../../src/Client';
import 'jest-extended';

describe('Delete', () => {
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
    describe('usage', () => {
        it('Can delete using where filters', async () => {
            const post = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.Posts.delete({
                where: {
                    rating_average: {
                        gt: 4,
                    },
                },
            });
            const post2 = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post2).toEqual(null);
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const post = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.Posts.delete({
                connection,
                where: {
                    rating_average: {
                        gt: 4,
                    },
                },
            });
            const post2 = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post2).toEqual(null);
            await closePoolConnection(connection);
        });
    });
});
