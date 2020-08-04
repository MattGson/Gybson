import { seed, SeedIds } from '../Setup/seed';
import gybsonRefresh, { Gybson } from '../Gen';
import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit, { LogLevel } from '../../src/Client';
import 'jest-extended';

describe('Insert', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
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
        it('Can soft delete using where filters', async () => {
            const post = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: ids.post1Id,
                }),
            );

            await gybson.Posts.softDelete({
                where: {
                    rating_average: {
                        gt: 4,
                    },
                },
            });
            const post2 = await gybson.Posts.oneByPostId({ post_id: ids.post1Id });
            expect(post2).toEqual(null);
        });
    });
});
