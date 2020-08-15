import { seed, SeedIds, seedPost } from '../Setup/seed';
import gybsonRefresh, { Gybson } from '../Gen';
import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit, { LogLevel } from '../../src/Client';
import 'jest-extended';

describe('Update', () => {
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
        it('Can update fields filtering by where clause', async () => {
            const p1 = await seedPost(gybson, { message: 'message 1', author_id: ids.user1Id });

            await gybson.Posts.update({
                values: {
                    message: 'message 2',
                },
                where: {
                    message: {
                        startsWith: 'mes',
                    },
                },
            });
            const post = await gybson.Posts.oneByPostId({ post_id: p1 });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: p1,
                    message: 'message 2',
                }),
            );
        });
    });
});
