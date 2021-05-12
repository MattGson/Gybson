import { openConnection, closeConnection, getKnex, seed, SeedIds, seedPost, seedUser } from 'test/helpers';
import { GybsonClient } from 'test/tmp';
import * as faker from "faker";

describe('WhereFilters', () => {
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
    describe('where', () => {
        describe('Column filters', () => {
            it('Can filter by column equals', async () => {
                const find = await gybson.user.findMany({
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
                // other syntax
                const find2 = await gybson.user.findMany({
                    where: {
                        user_id: {
                            equals: ids.user1Id,
                        },
                    },
                });
                expect(find2).toHaveLength(1);
                expect(find2).toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });

            it('Can filter by column not equals', async () => {
                const find = await gybson.user.findMany({
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
                const find = await gybson.user.findMany({
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
                const find = await gybson.user.findMany({
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
                const find = await gybson.post.findMany({
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
                const find = await gybson.post.findMany({
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
                const find = await gybson.post.findMany({
                    where: {
                        rating_average: {
                            lt: 4.5,
                        },
                    },
                });
                find.forEach((post) => {
                    expect(post.rating_average).toBeLessThan(4.5);
                });
            });
            it('Can filter by less than or equal', async () => {
                const find = await gybson.post.findMany({
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
                const find = await gybson.post.findMany({
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
                const find = await gybson.post.findMany({
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
                const find = await gybson.post.findMany({
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
            describe('strings', () => {
                it('Can filter strings', async () => {
                    const find = await gybson.post.findMany({
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
            });
            describe('numbers', () => {
                it('Can filter numbers', async () => {
                    const find = await gybson.post.findMany({
                        where: {
                            rating_average: {
                                equals: 4.5,
                            },
                        },
                    });
                    find.forEach((post) => {
                        expect(post.rating_average).toEqual(4.5);
                    });
                });
                it('Can filter numbers ranges', async () => {
                    const find = await gybson.post.findMany({
                        where: {
                            rating_average: {
                                lt: 5,
                                gt: 3,
                            },
                        },
                    });
                    find.forEach((post) => {
                        expect(post.rating_average).toBeLessThan(5);
                        expect(post.rating_average).toBeGreaterThan(3);
                    });
                });
            });
            describe('dates', () => {
                it('Can filter dates', async () => {
                    const created = new Date(2009, 4);
                    const p3 = await seedPost(gybson, { author_id: ids.user1Id, created });
                    const find = await gybson.post.findMany({
                        where: {
                            created,
                        },
                    });
                    expect(find).toContainEqual(
                        expect.objectContaining({
                            post_id: p3,
                        }),
                    );
                    expect(find).not.toContainEqual(
                        expect.objectContaining({
                            post_id: ids.post2Id,
                        }),
                    );
                    // other syntax
                    const find2 = await gybson.post.findMany({
                        where: {
                            created: {
                                equals: created
                            },
                        },
                    });
                    expect(find2).toContainEqual(
                        expect.objectContaining({
                            post_id: p3,
                        }),
                    );
                    expect(find2).not.toContainEqual(
                        expect.objectContaining({
                            post_id: ids.post2Id,
                        }),
                    );
                });
                it('Can filter dates range', async () => {
                    const created = new Date(2009, 4);
                    const p3 = await seedPost(gybson, { author_id: ids.user1Id, created });
                    const find = await gybson.post.findMany({
                        where: {
                            created: {
                                lt: new Date(),
                                gt: new Date(2005, 5, 2),
                            },
                        },
                    });
                    expect(find).toContainEqual(
                        expect.objectContaining({
                            post_id: p3,
                        }),
                    );
                    expect(find).not.toContainEqual(
                        expect.objectContaining({
                            post_id: ids.post2Id,
                        }),
                    );
                });
            });
            describe('booleans', () => {
                it('Can filter booleans', async () => {
                    await gybson.teamMembersPosition.upsert({
                        values: {
                            team_id: ids.team1Id,
                            user_id: ids.user1Id,
                            verified: true,
                            position: faker.random.alphaNumeric(12),
                            manager: 'a manager',
                        },
                        mergeColumns: {
                            verified: true,
                        },
                    });
                    const find = await gybson.teamMembersPosition.findMany({
                        where: {
                            verified: true,
                        },
                    });
                    expect(find).toContainEqual(
                        expect.objectContaining({
                            team_id: ids.team1Id,
                            user_id: ids.user1Id,
                        }),
                    );
                });
            });
        });
        describe('Multiple column filters', () => {
            it('Can filter by multiple columns', async () => {
                const find = await gybson.post.findMany({
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
            it('Can filter by multiple columns', async () => {
                await gybson.user.findMany({
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
        });
        describe('Relation filters', () => {
            it('Can filter by where every related row meets a condition', async () => {
                const u2 = await seedUser(gybson);
                await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                await seedPost(gybson, { author_id: u2, message: 'nope' });
                // both posts meet the condition
                const users = await gybson.user.findMany({
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
                const users2 = await gybson.user.findMany({
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
            it('Can filter by exists', async () => {
                const u2 = await seedUser(gybson);
                await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                await seedPost(gybson, { author_id: u2, message: 'not' });
                const users = await gybson.user.findMany({
                    where: {
                        author_posts: {
                            existsWhere: {
                                message: {
                                    contains: 'filter-m',
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
                expect(users).not.toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
            it('Can filter by not exists', async () => {
                const u2 = await seedUser(gybson);
                await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                await seedPost(gybson, { author_id: u2, message: 'not' });
                const users = await gybson.user.findMany({
                    where: {
                        author_posts: {
                            notExistsWhere: {
                                message: {
                                    contains: 'filter-m',
                                },
                            },
                        },
                    },
                });
                expect(users).not.toContainEqual(
                    expect.objectContaining({
                        user_id: u2,
                    }),
                );
                expect(users).toContainEqual(
                    expect.objectContaining({
                        user_id: ids.user1Id,
                    }),
                );
            });
        });
        describe('Combiners (gates)', () => {
            it('Can combine clauses with AND', async () => {
                const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
                const p2 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 3 });
                const find = await gybson.post.findMany({
                    where: {
                        AND: [
                            {
                                message: {
                                    contains: 'happy',
                                },
                            },
                            {
                                rating_average: {
                                    gt: 5,
                                },
                            },
                        ],
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: p1,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p2,
                    }),
                );
            });
            it('Can combine clauses with OR', async () => {
                const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
                const p2 = await seedPost(gybson, { message: 'hip', author_id: ids.user1Id, rating_average: 3 });
                const find = await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                message: {
                                    contains: 'hip',
                                },
                            },
                            {
                                rating_average: {
                                    gt: 5,
                                },
                            },
                        ],
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: p1,
                    }),
                );
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: p2,
                    }),
                );
            });
            it('Can combine clauses with NOT', async () => {
                const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
                const p2 = await seedPost(gybson, { message: 'hip', author_id: ids.user1Id, rating_average: 3 });
                const find = await gybson.post.findMany({
                    where: {
                        NOT: [
                            {
                                message: {
                                    contains: 'hip',
                                },
                            },
                            {
                                rating_average: {
                                    gt: 5,
                                },
                            },
                        ],
                    },
                });
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p1,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p2,
                    }),
                );
            });
            it('Can combine more than 2 clauses', async () => {
                const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
                const p2 = await seedPost(gybson, { message: 'hip', author_id: ids.user1Id, rating_average: 3 });
                const find = await gybson.post.findMany({
                    where: {
                        AND: [
                            {
                                message: {
                                    contains: 'hap',
                                },
                            },
                            {
                                rating_average: {
                                    gt: 5,
                                },
                            },
                            {
                                post_id: {
                                    not: p2,
                                },
                            },
                        ],
                    },
                });
                expect(find).toContainEqual(
                    expect.objectContaining({
                        post_id: p1,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p2,
                    }),
                );
            });
            it('Can nest combiners', async () => {
                const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
                const p2 = await seedPost(gybson, { message: 'hip', author_id: ids.user1Id, rating_average: 3 });
                const find = await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                AND: [
                                    {
                                        message: {
                                            contains: 'hip',
                                        },
                                    },
                                    {
                                        author_id: {
                                            not: ids.user1Id,
                                        },
                                    },
                                ],
                            },
                            {
                                rating_average: {
                                    gt: 10,
                                },
                            },
                        ],
                    },
                });
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p1,
                    }),
                );
                expect(find).not.toContainEqual(
                    expect.objectContaining({
                        post_id: p2,
                    }),
                );
            });
        });
        it('Can nest clauses', async () => {
            const p1 = await seedPost(gybson, { message: 'happy', author_id: ids.user1Id, rating_average: 8 });
            const p2 = await seedPost(gybson, { message: 'hip', author_id: ids.user1Id, rating_average: 3 });
            const p3 = await seedPost(gybson, { message: 'hipper', author_id: ids.user1Id, rating_average: 5 });
            const find = await gybson.post.findMany({
                where: {
                    OR: [
                        {
                            AND: [
                                {
                                    message: {
                                        contains: 'hip',
                                    },
                                    author_relation: {
                                        notExistsWhere: {
                                            first_name: 'steve',
                                        },
                                    },
                                },
                                {
                                    author_id: {
                                        not: ids.user1Id,
                                    },
                                },
                            ],
                        },
                        {
                            rating_average: {
                                gt: 10,
                            },
                            NOT: [
                                {
                                    created: {
                                        gt: new Date(),
                                    },
                                },
                            ],
                        },
                    ],
                },
            });
        });
    });
});
