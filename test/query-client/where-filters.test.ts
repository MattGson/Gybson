import { openConnection, closeConnection, getKnex, seed, SeedIds, seedPost, seedUser } from 'test/helpers';
import { GybsonClient } from 'test/tmp';
import * as faker from 'faker';
import { LogLevel } from 'src/types';

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
        gybson = new GybsonClient(getKnex(), { logLevel: LogLevel.debug });

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
                                equals: created,
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
            describe('HasMany relations', () => {
                it('Can filter by relation "exists"', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                exists: true,
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
                            user_id: u3,
                        }),
                    );
                });

                it('Can filter by relation "not exists"', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                exists: false,
                            },
                        },
                    });
                    expect(users).toContainEqual(
                        expect.objectContaining({
                            user_id: u3,
                        }),
                    );
                    expect(users).not.toContainEqual(
                        expect.objectContaining({
                            user_id: u2,
                        }),
                    );
                });

                it('Can filter by "where" any related row meets the condition', async () => {
                    const u2 = await seedUser(gybson);
                    await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    await seedPost(gybson, { author_id: u2, message: 'not' });
                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                where: {
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

                it('Can filter "where every" related row meets a condition', async () => {
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
            });
            describe('hasOne, BelongsTo optional relations', () => {
                it('Can filter by relation "exists"', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    const p1 = await seedPost(gybson, { author_id: u2, co_author: u3, message: 'filter-me' });
                    const p2 = await seedPost(gybson, { author_id: u3, message: 'filter-me' });
                    const posts = await gybson.post.findMany({
                        where: {
                            co_author_relation: {
                                exists: true,
                            },
                        },
                    });
                    expect(posts).toContainEqual(
                        expect.objectContaining({
                            post_id: p1,
                        }),
                    );
                    expect(posts).not.toContainEqual(
                        expect.objectContaining({
                            post_id: p2,
                        }),
                    );
                });

                it('Can filter by relation "not exists"', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    const p1 = await seedPost(gybson, { author_id: u2, co_author: u3, message: 'filter-me' });
                    const p2 = await seedPost(gybson, { author_id: u3, message: 'filter-me' });
                    const posts = await gybson.post.findMany({
                        where: {
                            co_author_relation: {
                                exists: false,
                            },
                        },
                    });
                    expect(posts).toContainEqual(
                        expect.objectContaining({
                            post_id: p2,
                        }),
                    );
                    expect(posts).not.toContainEqual(
                        expect.objectContaining({
                            post_id: p1,
                        }),
                    );
                });
                it('Can filter by relation "where" any related row meets the condition', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    const p1 = await seedPost(gybson, { author_id: u2, co_author: u3, message: 'filter-me' });
                    const p2 = await seedPost(gybson, { author_id: u3, message: 'filter-me' });
                    const posts = await gybson.post.findMany({
                        where: {
                            co_author_relation: {
                                where: {
                                    user_id: u3,
                                },
                            },
                        },
                    });
                    expect(posts).toContainEqual(
                        expect.objectContaining({
                            post_id: p1,
                        }),
                    );
                    expect(posts).not.toContainEqual(
                        expect.objectContaining({
                            post_id: p2,
                        }),
                    );
                });
            });

            describe('hasOne, BelongsTo required relations', () => {
                it('Can filter by relation "where" the related row meets a condition', async () => {
                    const u2 = await seedUser(gybson);
                    const u3 = await seedUser(gybson);
                    const p1 = await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    const p2 = await seedPost(gybson, { author_id: u3, message: 'filter-me' });
                    const posts = await gybson.post.findMany({
                        where: {
                            author_relation: {
                                where: {
                                    user_id: u2,
                                },
                            },
                        },
                    });
                    expect(posts).toContainEqual(
                        expect.objectContaining({
                            post_id: p1,
                        }),
                    );
                    expect(posts).not.toContainEqual(
                        expect.objectContaining({
                            post_id: p2,
                        }),
                    );
                });
            });
            describe('soft deleted relations', () => {
                it('"exists" filters out soft deleted rows', async () => {
                    const u2 = await seedUser(gybson);
                    const postid = await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    await gybson.post.softDelete({ where: { post_id: postid } });

                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                exists: true,
                            },
                        },
                    });
                    // u2 no longer has posts so not returned
                    expect(users).not.toContainEqual(
                        expect.objectContaining({
                            user_id: u2,
                        }),
                    );
                });
                it('"not exists" filters out soft deleted rows', async () => {
                    const u2 = await seedUser(gybson);
                    const postid = await seedPost(gybson, { author_id: u2, message: 'filter-me' });
                    await gybson.post.softDelete({ where: { post_id: postid } });

                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                exists: false,
                            },
                        },
                    });
                    // u2 no longer has any posts so is returned
                    expect(users).toContainEqual(
                        expect.objectContaining({
                            user_id: u2,
                        }),
                    );
                });
                it('"where" filters out soft deleted rows', async () => {
                    const u2 = await seedUser(gybson);
                    const p1 = await seedPost(gybson, { author_id: u2, message: 'filter-me' });

                    await gybson.user.softDelete({
                        where: { user_id: u2 },
                    });

                    const posts = await gybson.post.findMany({
                        where: {
                            author_relation: {
                                where: {
                                    user_id: u2,
                                },
                            },
                        },
                    });
                    // author soft deleted
                    expect(posts).not.toContainEqual(
                        expect.objectContaining({
                            post_id: p1,
                        }),
                    );
                });
                it('"where every" filters out soft deleted rows', async () => {
                    const u2 = await seedUser(gybson);
                    const post1 = await seedPost(gybson, { author_id: u2, message: 'B' });
                    await seedPost(gybson, { author_id: u2, message: 'A' });

                    // soft delete post 1 so not checked
                    await gybson.post.softDelete({ where: { post_id: post1 } });

                    const users = await gybson.user.findMany({
                        where: {
                            author_posts: {
                                whereEvery: {
                                    message: {
                                        startsWith: 'A',
                                    },
                                },
                            },
                        },
                    });
                    // u2 no longer has any posts so is returned
                    expect(users).toContainEqual(
                        expect.objectContaining({
                            user_id: u2,
                        }),
                    );
                });
            });
            describe('relations method support', () => {
                // DELETE JOIN, UPDATE JOIN
                // TODO:- this syntax is stupidly different between PG and MySQL and between update and delete in both
                // Very hard to support consistently. Sub-queries might be the best bet but not good efficiency.
                // Maybe just delete then delete where in ?
                it('"Can filter relations on delete', async () => {
                    const u2 = await seedUser(gybson);
                    const p = await seedPost(gybson, { author_id: u2, message: 'A' });

                    await gybson.post.delete({
                        where: {
                            author_relation: {
                                where: {
                                    user_id: u2,
                                },
                            },
                        },
                    });
                    const u = await gybson.post.loadOne({ where: { post_id: p } });
                    expect(u).toBeNull();
                });
                it('"Can filter relations on soft-delete', async () => {
                    const u2 = await seedUser(gybson);
                    const p = await seedPost(gybson, { author_id: u2, message: 'A' });

                    await gybson.post.softDelete({
                        where: {
                            author_relation: {
                                where: {
                                    user_id: u2,
                                },
                            },
                        },
                    });
                    const u = await gybson.post.loadOne({ where: { post_id: p } });
                    expect(u).toBeNull();
                });
                it('"Can filter relations on update', async () => {
                    const u2 = await seedUser(gybson);
                    await seedPost(gybson, { author_id: u2, message: 'A' });

                    await gybson.user.update({
                        values: {
                            first_name: 'new_name_984393',
                        },
                        where: {
                            author_posts: {
                                where: {
                                    message: {
                                        startsWith: 'A',
                                    },
                                },
                            },
                        },
                    });
                    const u = await gybson.user.loadOne({ where: { user_id: u2 } });
                    expect(u).toEqual(
                        expect.objectContaining({
                            first_name: 'new_name_984393',
                        }),
                    );
                });
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
        describe('Can nest and combine clauses', () => {
            it('Can support complex nesting', async () => {
                await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                AND: [
                                    {
                                        message: {
                                            contains: 'hip',
                                        },
                                        author_relation: {
                                            where: {
                                                first_name: 'steve',
                                            },
                                        },
                                    },
                                    {
                                        author_id: {
                                            not: 1,
                                        },
                                    },
                                ],
                            },
                            {
                                rating_average: {
                                    gt: 10,
                                },
                                team_members: {
                                    exists: true,
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
            it('Can join multiple tables at same depth', async () => {
                /**
                SELECT "posts_1".*
                FROM   "posts" AS "posts_1"
                    LEFT JOIN "users" AS "users_2_0_1"
                            ON "users_2_0_1"."user_id" = "posts_1"."author_id"
                    LEFT JOIN "posts" AS "posts_3_0_2"
                            ON "posts_3_0_2"."author_id" = "users_2_0_1"."user_id"
                    LEFT JOIN "team_members" AS "team_members_2_0_2"
                            ON "team_members_2_0_2"."member_post_id" = "posts_1"."post_id"
                    LEFT JOIN "team_members" AS "team_members_2_1_1"
                            ON "team_members_2_1_1"."member_post_id" = "posts_1"."post_id"
                WHERE  ( ( "users_2_0_1"."deleted_at" IS NULL
                        AND "users_2_0_1"."user_id" = ?
                        AND "posts_3_0_2"."deleted" = ?
                        AND "posts_3_0_2"."post_id" IS NOT NULL
                        AND "team_members_2_0_2"."deleted" = ?
                        AND "team_members_2_0_2"."team_id" = ? )
                        OR ( "team_members_2_1_1"."deleted" = ?
                            AND "team_members_2_1_1"."team_id" = ? ) )
                    AND "posts_1"."deleted" = ?
                GROUP  BY "posts_1"."post_id" 
                 */

                await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                author_relation: {
                                    where: {
                                        user_id: 1,
                                        author_posts: {
                                            exists: true,
                                        },
                                    },
                                },
                                // join another table in same branch
                                team_members: {
                                    where: {
                                        team_id: 4,
                                    },
                                },
                            },
                            {
                                // join another table in another branch
                                team_members: {
                                    where: {
                                        team_id: 9,
                                    },
                                },
                            },
                        ],
                    },
                });
            });
            it('Can join same table at same depth in different logical branch', async () => {
                /**
                SELECT "posts_1".*
                FROM   "posts" AS "posts_1"
                    LEFT JOIN "users" AS "users_2_0"
                            ON "users_2_0"."user_id" = "posts_1"."author_id"
                    LEFT JOIN "posts" AS "posts_3_0"
                            ON "posts_3_0"."author_id" = "users_2_0"."user_id"
                    LEFT JOIN "users" AS "users_2_1"
                            ON "users_2_1"."user_id" = "posts_1"."author_id"
                WHERE  (
                        (
                            "users_2_0"."deleted_at" IS NULL
                            AND "users_2_0"."user_id" = ?
                            AND "posts_3_0"."deleted" = ?
                            AND "posts_3_0"."post_id" IS NOT NULL
                        )
                        OR
                        (
                            "users_2_1"."deleted_at" IS NULL
                            AND "users_2_1"."user_id" = ?
                        )
                    )
                    AND "posts_1"."deleted" = ?
                GROUP  BY "posts_1"."post_id"
                 */

                await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                author_relation: {
                                    where: {
                                        user_id: 1,
                                        author_posts: {
                                            exists: true,
                                        },
                                    },
                                },
                            },
                            {
                                // join same table with different filter at same depth
                                author_relation: {
                                    where: {
                                        user_id: 2,
                                    },
                                },
                            },
                        ],
                    },
                });
            });
            it('Can join same table at the same depth in same logical branch', async () => {
                /*

                SELECT "posts_1".*
                FROM   "posts" AS "posts_1"
                    LEFT JOIN "users" AS "users_2_1"
                            ON "users_2_1"."user_id" = "posts_1"."author_id"
                    LEFT JOIN "posts" AS "posts_3_1"
                            ON "posts_3_1"."author_id" = "users_2_1"."user_id"
                    LEFT JOIN "users" AS "users_2_2"
                            ON "users_2_2"."user_id" = "posts_1"."co_author"
                WHERE  ( ( "users_2_1"."deleted_at" IS NULL
                        AND "users_2_1"."user_id" = ?
                        AND "posts_3_1"."deleted" = ?
                        AND "posts_3_1"."post_id" IS NOT NULL
                        AND "users_2_2"."deleted_at" IS NULL
                        AND "users_2_2"."first_name" = ? )
                        OR ( "posts_1"."rating_average" = ? ) )
                    AND "posts_1"."deleted" = ?
                GROUP  BY "posts_1"."post_id"
                */

                await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                author_relation: {
                                    where: {
                                        user_id: 1,
                                        author_posts: {
                                            exists: true,
                                        },
                                    },
                                },
                                // multiple relations to same in same clause
                                co_author_relation: {
                                    where: {
                                        first_name: 'John',
                                    },
                                },
                            },
                            {
                                rating_average: 2,
                            },
                        ],
                    },
                });
            });
            it('Can add multiple clauses for the same relation filter', async () => {
                /*
                SELECT "posts_1".*
                FROM   "posts" AS "posts_1"
                    LEFT JOIN "users" AS "users_2_0_1"
                            ON "users_2_0_1"."user_id" = "posts_1"."co_author"
                WHERE  ( ( "users_2_0_1"."deleted_at" IS NULL
                        AND "users_2_0_1"."first_name" = ?
                        AND "users_2_0_1"."deleted_at" IS NULL
                        AND "users_2_0_1"."user_id" IS NOT NULL )
                        OR ( "posts_1"."rating_average" = ? ) )
                    AND "posts_1"."deleted" = ?
                GROUP  BY "posts_1"."post_id" 
                */
                await gybson.post.findMany({
                    where: {
                        OR: [
                            {
                                // multiple clauses for same relation
                                co_author_relation: {
                                    where: {
                                        first_name: 'John',
                                    },
                                    exists: true,
                                },
                            },
                            {
                                rating_average: 2,
                            },
                        ],
                    },
                });
            });
        });
    });
});
