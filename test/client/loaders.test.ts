import { closeConnection, DB, itif, getKnex, seed, SeedIds, seedPost, seedUser, openConnection } from 'test/helpers';
import { GybsonClient, Gybson } from 'test/tmp';
import * as faker from 'faker';

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
    describe('one load', () => {
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
        it('Can load one from a compound unique key', async () => {
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
            const loadOne = await gybson.user.loadOne({
                where: { user_id: ids.user1Id },
            });
            expect(loadOne).toEqual(null);
        });
        it('Returns deleted rows when requested', async () => {
            await gybson.user.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const loadOne = await gybson.user.loadOne({
                where: { user_id: ids.user1Id },
                includeDeleted: true,
            });
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
            const loadOne = await gybson.user.loadOne({
                where: { user_id: ids.user1Id },
            });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'John',
                }),
            );
            // clear cache
            await gybson.user.purge();
            // should be up to date
            const loadOne2 = await gybson.user.loadOne({
                where: { user_id: ids.user1Id },
            });
            expect(loadOne2).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    first_name: 'Changed',
                }),
            );
        });
        it('Can load same row from multiple places', async () => {
            const p1 = await seedPost(gybson, { author_id: ids.user1Id, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: ids.user1Id, message: 'a' });

            // Should batch and return value to each caller
            const [post1, post2, post3] = await Promise.all([
                gybson.post.loadOne({
                    where: {
                        post_id: p1,
                    },
                }),
                gybson.post.loadOne({
                    where: {
                        post_id: p2,
                    },
                }),
                gybson.post.loadOne({
                    where: {
                        post_id: p1,
                    },
                }),
            ]);
            expect(post1!.post_id).toEqual(p1);
            expect(post2!.post_id).toEqual(p2);
            expect(post3!.post_id).toEqual(p1);
        });
        it('Can bulk load', async () => {
            await gybson.user.delete({
                where: {
                    user_id: {
                        gte: 1000,
                        lte: 5000,
                    },
                },
            });

            // create many rows
            const users: Gybson.UserRequiredRow[] = [];
            for (let i = 1000; i < 5000; i++) {
                users.push({
                    user_id: i,
                    email: faker.random.alphaNumeric(10) + faker.internet.email(),
                    password: 'fi23jf',
                });
            }
            await gybson.user.insert({
                values: users,
                ignoreDuplicates: true,
            });

            // load all at once
            const results = await Promise.all(users.map((u) => gybson.user.loadOne({ where: { user_id: u.user_id } })));
            expect(results).toHaveLength(4000);
            const [first, second] = results;
            expect(first!.email).toEqual(users[0].email);
            expect(second!.email).toEqual(users[1].email);
        });
    });
    describe('many load', () => {
        it('Can load many from a single non-unique key', async () => {
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
        it('Can order loaded rows', async () => {
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
            const loadMany = await gybson.post.loadMany({
                where: { author_id: ids.user1Id },
            });
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
            const loadMany = await gybson.post.loadMany({
                where: { author_id: ids.user1Id },
            });
            expect(loadMany).not.toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
        it('Can load same rows from multiple places', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });

            // Should batch and return value to each caller
            // const [posts1, posts2, posts3] = await Promise.all([
            // gybson.post.loadMany({
            //     where: {
            //         author_id: u,
            //     },
            // }).include({
            //     post: {
            //         where: {
            //             id: 1
            //         }
            //     }
            // }),

            const q = gybson.post.one({ where: { post_id: 1 } }).paginate({
                limit: 1,
                offset: 12,
            });

            const c = q
                .comments({ where: { title: 'test' } })
                .with({
                    author: true,
                    tags: {
                        with: {
                            category: true,
                        },
                        paginate: { limit: 10, after: { id: 1 } },
                    },
                    likes: {
                        where: {
                            author_id: 3,
                        },
                        orderBy: { id: 'desc' },
                        with: {
                            author: true,
                        },
                    },
                })
                .first();

            const c = q
                .comments({ where: { title: 'test' } })
                .withAuthor()
                .withTags({
                    with: {
                        category: true,
                    },
                    first: 10,
                    after: { id: 1 },
                })
                .withLikes({
                    where: {
                        author_id: 3,
                    },
                    orderBy: { id: 'desc' },
                    withAuthor: {
                        where: {
                            name: 'steve',
                        },
                    },
                })
                .first();

            const c = q
                .comments({ where: { title: 'test' } })
                .withAuthor()
                .withLikes((t) =>
                    t
                        .paginate({
                            first: 10,
                            after: { id: 1 },
                        })
                        .withAuthor(),
                )
                .first();

            const d = q.comments().only({ first: 12, after: { id: '232-434-1232' } });

            gybson.comment.from(c).author().first();

            // gybson.post.loadMany({
            //     where: {
            //         author_id: ids.user1Id,
            //     },
            // }).users({
            //     where: {

            //     }
            // }).with({
            //     posts: {
            //         where: {

            //         },
            //         orderBy: {
            //             id
            //         }
            //     }
            // }).first()

            // gybson.post.loadMany({
            //     where: {
            //         author_id: u,
            //     },
            // }),
            // ]);
            // both posts1 and posts3 should have same values
            expect(posts1).toHaveLength(2);
            expect(posts1).toIncludeAllMembers([
                expect.objectContaining({
                    post_id: p1,
                }),
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
            expect(posts3).toHaveLength(2);
            expect(posts3).toIncludeAllMembers([
                expect.objectContaining({
                    post_id: p1,
                }),
                expect.objectContaining({
                    post_id: p2,
                }),
            ]);
        });
        it('Can bulk load', async () => {
            await gybson.user.delete({
                where: {
                    user_id: {
                        gte: 6000,
                        lte: 10_000,
                    },
                },
            });

            // create many rows
            const users: Gybson.UserRequiredRow[] = [];
            for (let i = 6000; i < 10_000; i++) {
                users.push({
                    user_id: i,
                    email: faker.random.alphaNumeric(10) + faker.internet.email(),
                    password: 'fi23jf',
                    first_name: faker.name.firstName(),
                });
            }
            await gybson.user.insert({
                values: users,
                ignoreDuplicates: true,
            });

            // load all at once
            const results = await Promise.all(users.map((u) => gybson.user.loadMany({ where: { first_name: u.first_name } })));
            expect(results).toHaveLength(4000);
            const [first, second] = results;
            expect(first[0].first_name).toEqual(users[0].first_name);
            expect(second[0].first_name).toEqual(users[1].first_name);
        });
    });
    describe('MySQL only', () => {
        itif(DB() === 'mysql')('Loads are case-insensitive on alphabetical keys on single loaders', async () => {
            await gybson.user.update({
                values: {
                    email: 'Cased@gmail.com',
                },
                where: {
                    user_id: ids.user1Id,
                },
            });
            const user = await gybson.user.loadOne({
                where: { email: 'cased@gmail.com' },
            });
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
            const members = await gybson.teamMembersPosition.loadMany({
                where: { manager: 'casedManager' },
            });
            expect(members).toContainEqual(
                expect.objectContaining({
                    manager: 'CasedManager',
                }),
            );
        });
    });
});
