import { closeConnection, getKnex, openConnection, seed, SeedIds } from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('Loaders', () => {
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
    describe('fluent loads', () => {
        it('can load fluent chains', async () => {
            // multi-load to debug batching
            const [user] = await Promise.all([
                gybson.user.loadOne({ where: { user_id: ids.user1Id } }),
                gybson.user.loadOne({ where: { user_id: 12 } }),
            ]);

            const nonUnique = await gybson.user
                .from(user)
                .bestFriend()
                .where({
                    first_name: 'joe',
                    author_posts: {
                        exists: true,
                    },
                })
                .authorPosts()
                .orderBy({ rating_average: 'desc' })
                .paginate({ first: 10, after: { post_id: 4 } })
                .all();

            const uniqueTest = await gybson.user
                .from(user)
                .teamMembers({ skipCache: true })
                .whereUnique({
                    team_id__user_id: {
                        team_id: 3,
                        user_id: 4,
                    },
                })
                .first();

            const uniqueAndNonUnique = await gybson.user
                .from(user)
                .teamMembers({ skipCache: true })
                .whereUnique({
                    team_id__user_id: {
                        team_id: 3,
                        user_id: 4,
                    },
                })
                // TODO:- should ideally retain filtered options, since unique filter is applied, there will only be at most one row still
                // at the moment this adds back the list operators - this applies to all narrowing but maybe easier said than done.
                .where({
                    member_post_id: 4,
                })
                .memberPost()
                .where({
                    rating_average: {
                        gt: 2,
                    },
                })
                .first();
        });
    });
});
