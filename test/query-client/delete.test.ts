import { GybsonClient } from 'test/tmp';
import {
    buildDBSchemas,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    knex,
    seed,
    SeedIds,
} from 'test/helpers';
import 'jest-extended';

describe('Delete', () => {
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
    describe('usage', () => {
        it('Can delete using where filters', async () => {
            const post = await gybson.Posts.loadOne({ where: { post_id: ids.post1Id } });
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
            await gybson.Posts.purge();
            const post2 = await gybson.Posts.loadOne({ where: { post_id: ids.post1Id } });
            expect(post2).toEqual(null);
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const post = await gybson.Posts.loadOne({ where: { post_id: ids.post1Id } });
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
            await gybson.Posts.purge();
            const post2 = await gybson.Posts.loadOne({ where: { post_id: ids.post1Id } });
            expect(post2).toEqual(null);
            await closePoolConnection(connection);
        });
    });
});
