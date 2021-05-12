import { closeConnection, DB, itif, getKnex, seed, SeedIds, seedPost, seedUser, openConnection } from 'test/helpers';
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
    describe('one by column load', () => {
        it('Can load one from a single unique key', async () => {
            // multi-load to debug batching
            const [loadOne] = await Promise.all([
                gybson.user.loadOne({ where: { user_id: ids.user1Id } }),
                gybson.user.loadOne({ where: { user_id: 12 } }),
            ]);
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'John',
                    last_name: 'Doe',
                    permissions: 'USER',
                }),
            );
        });
        it('Can load one from a single unique key using common interface', async () => {
            // multi-load to debug batching - should batch across both methods
            const [loadOne] = await Promise.all([
                gybson.user.loadOne({
                    where: {
                        user_id: ids.user1Id,
                    },
                }),
                gybson.user.loadOne({ where: { user_id: 12 } }),
            ]);
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'John',
                    last_name: 'Doe',
                    permissions: 'USER',
                }),
            );
        });
        it('Can load one from a compound unique key', async () => {
            const member = await gybson.teamMember.loadOne({
                where: {
                    team_id__user_id: {
                        user_id: ids.user1Id,
                        team_id: ids.team1Id,
                    },
                },
            });
            expect(member).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                }),
            );
        });
        it('Can load one from a compound unique key using common interface', async () => {
            // run both to debug batching
            const [member] = await Promise.all([
                gybson.teamMember.loadOne({
                    where: {
                        team_id__user_id: {
                            team_id: ids.team1Id,
                            user_id: ids.user1Id,
                        },
                    },
                }),
                gybson.teamMember.loadOne({
                    where: {
                        team_id__user_id: {
                            user_id: 5,
                            team_id: 3,
                        },
                    },
                }),
            ]);
            expect(member).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                }),
            );
        });
        it('Does not return deleted rows by default', async () => {
            await gybson.user.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const loadOne = await gybson.user.loadOne({ where: { user_id: ids.user1Id } });
            expect(loadOne).toEqual(null);
        });
        it('Returns deleted rows when requested', async () => {
            await gybson.user.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const loadOne = await gybson.user.loadOne({ where: { user_id: ids.user1Id }, includeDeleted: true });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                }),
            );
        });
        it('Caches the result of load', async () => {
            await gybson.user.loadOne({ where: { user_id: ids.user1Id } }); // run twice to debug load cache

            await gybson.user.update({
                values: {
                    first_name: 'Changed',
                },
                where: {
                    user_id: ids.user1Id,
                },
            });

            // check name has not changed
            const loadOne = await gybson.user.loadOne({ where: { user_id: ids.user1Id } });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'John',
                }),
            );
            // clear cache
            await gybson.user.purge();
            // should be up to date
            const loadOne2 = await gybson.user.loadOne({ where: { user_id: ids.user1Id } });
            expect(loadOne2).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'Changed',
                }),
            );
        });
    });
    describe('many by column load', () => {
        it('Can load many from a single non-unique key', async () => {
            const loadMany = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
            expect(loadMany).toContainEqual(
                expect.objectContaining({
                    author_id: ids.user1Id,
                    message: 'test 2',
                }),
            );
            expect(loadMany).toContainEqual(
                expect.objectContaining({
                    author_id: ids.user1Id,
                    message: 'first',
                }),
            );
        });
        it('Can load many from a single non-unique key from the common interface', async () => {
            // run both to debug batch
            const [loadMany] = await Promise.all([
                gybson.post.loadMany({
                    where: {
                        author_id: ids.user1Id,
                    },
                }),
                gybson.post.loadMany({ where: { author_id: 8 } }),
            ]);
            expect(loadMany).toContainEqual(
                expect.objectContaining({
                    author_id: ids.user1Id,
                    message: 'test 2',
                }),
            );
            expect(loadMany).toContainEqual(
                expect.objectContaining({
                    author_id: ids.user1Id,
                    message: 'first',
                }),
            );
        });
        it('Can load many from a compound non-unique key', async () => {
            const member = await gybson.teamMember.loadMany({
                where: {
                    team_id: ids.team1Id,
                    member_post_id: ids.post2Id,
                },
            });
            expect(member).toContainEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                    member_post_id: ids.post2Id,
                }),
            );
        });
        it('Can load many from a compound non-unique key from the common interface', async () => {
            const member = await gybson.teamMember.loadMany({
                where: {
                    member_post_id: ids.post2Id,
                    team_id: ids.team1Id,
                },
            });
            expect(member).toContainEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                    member_post_id: ids.post2Id,
                }),
            );
        });
        it('Can order loaded rows', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });
            const member = await gybson.post.loadMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                },
            });
            expect(member).toEqual([
                expect.objectContaining({
                    post_id: p2,
                }),
                expect.objectContaining({
                    post_id: p1,
                }),
            ]);
        });
        it('Can order loaded rows using the common interface', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });
            // run both to debug batch - should Not be batched as orderBy is different.
            const [member] = await Promise.all([
                gybson.post.loadMany({
                    where: {
                        author_id: u,
                    },
                    orderBy: {
                        message: 'asc',
                    },
                }),
                gybson.post.loadMany({
                    where: {
                        author_id: 2,
                    },
                    orderBy: {
                        post_id: 'asc',
                    },
                }),
            ]);
            expect(member).toEqual([
                expect.objectContaining({
                    post_id: p2,
                }),
                expect.objectContaining({
                    post_id: p1,
                }),
            ]);
        });
        it('Does not return deleted rows by default', async () => {
            await gybson.post.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            const loadMany = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
            expect(loadMany).not.toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
        it('Returns deleted rows when requested', async () => {
            await gybson.post.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            const loadMany = await gybson.post.loadMany({
                where: { author_id: ids.user1Id },
                includeDeleted: true,
            });
            expect(loadMany).toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
        it('Does not cache the result of load', async () => {
            await gybson.post.loadMany({ where: { author_id: ids.user1Id } });

            await gybson.post.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });

            // check result has changed
            const loadMany = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
            expect(loadMany).not.toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
    });
    describe('MySQL only', () => {
        itif(DB() === 'mysql')('Loads are case-insensitive on alphabetical keys on single loaders', async () => {
            console.log(DB());
            await gybson.user.update({
                values: {
                    email: 'Cased@gmail.com',
                },
                where: {
                    user_id: ids.user1Id,
                },
            });
            const user = await gybson.user.loadOne({ where: { email: 'cased@gmail.com' } });
            expect(user).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    email: 'Cased@gmail.com',
                }),
            );
        });
        itif(DB() === 'mysql')('Loads are case-insensitive on alphabetical keys on many loaders', async () => {
            await gybson.teamMembersPosition.insert({
                values: {
                    manager: 'CasedManager',
                    team_id: ids.team1Id,
                    user_id: ids.user1Id,
                    position: 'A position',
                },
            });
            const members = await gybson.teamMembersPosition.loadMany({ where: { manager: 'casedManager' } });
            expect(members).toContainEqual(
                expect.objectContaining({
                    manager: 'CasedManager',
                }),
            );
        });
    });
});
