import { GybsonClient } from 'test/tmp';
import {
    buildDBSchemas,
    closeConnection,
    closePoolConnection,
    getPoolConnection,
    knex,
    seed,
    SeedIds,
    seedPost,
    seedUser,
} from 'test/helpers';

describe('FindMany', () => {
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
        it('loads many rows', async () => {
            const posts = await gybson.Posts.findMany({});
            expect(posts.length).toBeGreaterThan(1);
        });
        it('does not load deleted rows by default', async () => {
            await gybson.Posts.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            const posts = await gybson.Posts.findMany({});
            expect(posts).not.toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
        it('does not load date deleted rows by default', async () => {
            await gybson.Users.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const users = await gybson.Users.findMany({});
            expect(users).not.toContainEqual(expect.objectContaining({ user_id: ids.user1Id }));
        });
    });
    describe('filtering', () => {
        it('Can filter by where clause', async () => {
            await gybson.Users.findMany({
                where: {
                    permissions: 'USER',
                    first_name: {
                        startsWith: 'john',
                        endsWith: 'n',
                    },
                    token: {
                        not: null,
                    },
                    subscription_level: 'GOLD',
                    best_friend_id: {
                        in: [5, 6],
                    },
                },
            });
        });

        it('Can filter by relations in where clause', async () => {
            const u2 = await seedUser(gybson);
            await seedPost(gybson, { author_id: u2, message: 'filter-me' });
            await seedPost(gybson, { author_id: u2, message: 'nope' });
            // both posts meet the condition
            const users = await gybson.Users.findMany({
                where: {
                    author_posts: {
                        whereEvery: {
                            message: {
                                contains: 'e',
                            },
                        },
                    },
                },
            });
            expect(users).toContainEqual(
                expect.objectContaining({
                    user_id: u2,
                }),
            );
            // tighten the condition so only one post meets it
            const users2 = await gybson.Users.findMany({
                where: {
                    author_posts: {
                        whereEvery: {
                            message: {
                                contains: 'me',
                            },
                        },
                    },
                },
            });
            expect(users2).not.toContainEqual(
                expect.objectContaining({
                    user_id: u2,
                }),
            );
        });
    });
    describe('order by', () => {
        it('Can order loaded rows ascending', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });
            const member = await gybson.Posts.findMany({
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
        it('Can order loaded rows descending', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });
            const member = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'desc',
                },
            });
            expect(member).toEqual([
                expect.objectContaining({
                    post_id: p1,
                }),
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
        });
        it('Can order loaded rows by multiple columns', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'a', author: 'c' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a', author: 'b' });
            const member = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                    author: 'desc',
                },
            });
            expect(member).toEqual([
                expect.objectContaining({
                    post_id: p1,
                }),
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
        });
    });
    describe('paginate', () => {
        it('Can paginate rows by offset limit', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'a', author: 'c' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'b', author: 'b' });
            const p3 = await seedPost(gybson, { author_id: u, message: 'c', author: 'b' });
            const posts = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                },
                paginate: {
                    offset: 1,
                    limit: 1,
                },
            });
            expect(posts).toHaveLength(1);
            expect(posts).toEqual([
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
        });
        it('Can paginate rows by forward cursor', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'a', author: 'c' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'b', author: 'b' });
            const p3 = await seedPost(gybson, { author_id: u, message: 'c', author: 'b' });
            const posts = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                },
                paginate: {
                    afterCursor: {
                        message: 'a',
                    },
                    limit: 2,
                },
            });
            expect(posts).toHaveLength(2);
            expect(posts).toEqual([
                expect.objectContaining({
                    post_id: p2,
                }),
                expect.objectContaining({
                    post_id: p3,
                }),
            ]);
        });
        it('Can paginate rows by backward cursor', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'a', author: 'c' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'b', author: 'b' });
            const p3 = await seedPost(gybson, { author_id: u, message: 'c', author: 'b' });
            const posts = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                },
                paginate: {
                    beforeCursor: {
                        message: 'c',
                    },
                    limit: 3,
                },
            });
            expect(posts).toHaveLength(2);
            expect(posts).toEqual([
                expect.objectContaining({
                    post_id: p1,
                }),
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
        });
        it('Can paginate rows by multi-part cursor', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'a', author: 'a' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'b', author: 'b' });
            const p3 = await seedPost(gybson, { author_id: u, message: 'c', author: 'b' });
            const posts = await gybson.Posts.findMany({
                where: {
                    author_id: u,
                },
                orderBy: {
                    message: 'asc',
                },
                paginate: {
                    beforeCursor: {
                        message: 'c',
                        author: 'b',
                    },
                    limit: 3,
                },
            });
            expect(posts).toHaveLength(1);
            expect(posts).toEqual([
                expect.objectContaining({
                    post_id: p1,
                }),
            ]);
        });
    });
});
