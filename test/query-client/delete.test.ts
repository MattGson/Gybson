import { GybsonClient } from 'test/tmp';
import {
    buildDBSchemas,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    getKnex,
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
            const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.post.delete({
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
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.post.delete({
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
