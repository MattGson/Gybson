import 'jest-extended';
import {
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    getKnex,
    seed,
    SeedIds,
    seedPost,
    openConnection,
} from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('Update', () => {
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
        it('Can update fields filtering by where clause', async () => {
            const p1 = await seedPost(gybson, { message: 'message 1', author_id: ids.user1Id });

            await gybson.post.update({
                values: {
                    message: 'message 2',
                },
                where: {
                    message: {
                        startsWith: 'mes',
                    },
                },
            });
            const post = await gybson.post.loadOne({ where: { post_id: p1 } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: p1,
                    message: 'message 2',
                }),
            );
        });
        it('Can use an external connection', async () => {
            const connection = await getPoolConnection();
            await seedPost(gybson, { message: 'message 1', author_id: ids.user1Id });

            await gybson.post.update({
                connection,
                values: {
                    message: 'message 2',
                },
                where: {
                    message: {
                        startsWith: 'mes',
                    },
                },
            });
            await closePoolConnection(connection);
        });
    });
});
