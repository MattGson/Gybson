import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit from '../../src/Client';
import gybsonRefresh, { Gybson } from '../Gen';
import { seed, SeedIds, seedUser } from '../Setup/seed';
import 'jest-extended';

describe('FindMany', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            await gybInit.init(connection);
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
    });
    describe('where', () => {
        describe('Column filters', () => {
            it('Can filter by column equals', async () => {
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: ids.user1Id,
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
            it('Can filter by column equals (other syntax)', async () => {
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: {
                            equals: ids.user1Id,
                        },
                    },
                });
                expect(find).toHaveLength(1);
                expect(find).toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
            it('Can filter by column not equals', async () => {
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: {
                            not: ids.user1Id,
                        },
                    },
                });
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
            it('Can filter by column in', async () => {
                const user2Id = await seedUser(gybson);
                if (!user2Id) fail();
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: {
                            in: [ids.user1Id, user2Id],
                        },
                    },
                });
                expect(find).toHaveLength(2);
                expect(find).toIncludeAllMembers([
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                    expect.objectContaining({
                        user_id: user2Id,
                    }),
                ]);
            });
            it('Can filter by column not in', async () => {
                const user2Id = await seedUser(gybson);
                if (!user2Id) fail();
                const find = await gybson.Users.findMany({
                    where: {
                        user_id: {
                            notIn: [ids.user1Id, user2Id],
                        },
                    },
                });
                expect(find).not.toIncludeAnyMembers([
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                    expect.objectContaining({
                        user_id: user2Id,
                    }),
                ]);
            });
            it('Can filter by greater than', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            gt: 4.5,
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
            it('Can filter by greater than or equal', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            gte: 6,
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
            it('Can filter by less than', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            lt: 4.5,
                        },
                    },
                });
                expect(find).toHaveLength(0);
            });
            it('Can filter by less than or equal', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            lte: 4.5,
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
            it('Can filter by string contains', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        message: {
                            contains: 'est',
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
            it('Can filter by string starts with', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        message: {
                            startsWith: 'fi',
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
            it('Can filter by string ends with', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        message: {
                            endsWith: '2',
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
        });
        describe('Column types filters', () => {
            it('Can filter strings', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        message: {
                            equals: 'test 2',
                            startsWith: 'tes',
                            endsWith: '2',
                        },
                        author: {
                            lt: 'owen',
                            gte: 'andy',
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                        author: 'name',
                    }),
                );
            });
            it('Can filter numbers', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        rating_average: {
                            equals: 4,
                            lt: 5,
                            gt: 3,
                            not: 7,
                        },
                    },
                });
                expect(find).toHaveLength(0);
            });
            it('Can filter dates', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        created: {
                            lt: new Date(),
                            gt: new Date(2005, 5, 2),
                        },
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
            });
            it('Can filter booleans', async () => {
                await gybson.TeamMembersPositions.insert({
                    values: {
                        team_id: ids.team1Id,
                        user_id: ids.user1Id,
                        verified: true,
                        position: 'pos',
                        manager: 'a manager',
                    },
                });
                const find = await gybson.TeamMembersPositions.findMany({
                    where: {
                        verified: true,
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        team_id: ids.team1Id,
                        user_id: ids.user1Id,
                        verified: 1,
                    }),
                );
            });
        });
        describe('Multiple column filters', () => {
            it('Can filter by multiple column equals', async () => {
                const find = await gybson.Posts.findMany({
                    where: {
                        author: {
                            equals: 'name',
                        },
                        rating_average: 6,
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: ids.post2Id,
                    }),
                );
                expect(find).toContainEqual(
                    expect.not.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
        });
    });
    describe('order by', () => {});
    describe('paginate', () => {});
});
