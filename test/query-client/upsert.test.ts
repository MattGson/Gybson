import 'jest-extended';
import {
    closeConnection,
    getPoolConnection,
    getKnex,
    seed,
    SeedIds,
    closePoolConnection,
    openConnection,
} from 'test/helpers';
import { GybsonClient } from 'test/tmp';

describe('Upsert', () => {
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
    describe('inserting rows with conflicts', () => {
        describe('mergeColumns', () => {
            it('Updates only the specified columns on conflicting rows', async () => {
                const postId = await gybson.post.upsert({
                    values: {
                        post_id: ids.post1Id,
                        message: 'new message',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'new name',
                    },
                    mergeColumns: {
                        message: true,
                        author: true,
                    },
                });

                if (!postId) throw new Error('Post id not found');
                const post = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post).toEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                        message: 'new message',
                        author_id: ids.user1Id,
                        rating_average: 4.5,
                        author: 'new name',
                    }),
                );
            });
            it('Updates specified columns on a subset of multi-rows that conflict', async () => {
                // first post has conflict second doesn't
                const postId = await gybson.post.upsert({
                    values: [
                        {
                            post_id: ids.post1Id,
                            message: 'another new message',
                            author_id: ids.user1Id,
                            rating_average: 6,
                            author: 'name',
                        },
                        {
                            message: 'test 100',
                            author_id: ids.user1Id,
                            rating_average: 8,
                            author: 'name',
                        },
                    ],
                    mergeColumns: {
                        message: true,
                    },
                });
                const posts = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
                expect(posts).toIncludeAllMembers([
                    expect.objectContaining({
                        post_id: ids.post1Id,
                        message: 'another new message',
                        author_id: ids.user1Id,
                    }),
                    expect.objectContaining({
                        message: 'test 100',
                        author_id: ids.user1Id,
                        rating_average: 8,
                        author: 'name',
                    }),
                ]);
            });
            it('Can reinstate soft-deleted rows', async () => {
                await gybson.post.softDelete({
                    where: {
                        post_id: ids.post1Id,
                    },
                });
                const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
                expect(post).toEqual(null);

                const postId = await gybson.post.upsert({
                    values: {
                        post_id: ids.post1Id,
                        message: 'new message',
                        rating_average: 6,
                        author: 'name',
                        author_id: ids.user1Id,
                    },
                    mergeColumns: {
                        message: true,
                    },
                    reinstateSoftDeletedRows: true,
                });
                await gybson.post.purge();
                const post2 = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post2).toEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
        });
        describe('update', () => {
            it('Makes the specified updates on conflicts', async () => {
                const postId = await gybson.post.upsert({
                    values: {
                        post_id: ids.post1Id,
                        message: 'new message',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'new name',
                    },
                    update: {
                        message: 'another message',
                        author: 'another author',
                    },
                });

                if (!postId) throw new Error('Post id not found');
                const post = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post).toEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                        message: 'another message',
                        author_id: ids.user1Id,
                        rating_average: 4.5,
                        author: 'another author',
                    }),
                );
            });
            it('Makes specified updates on a subset of multi-rows that conflict', async () => {
                // first post has conflict second doesn't
                await gybson.post.upsert({
                    values: [
                        {
                            post_id: ids.post1Id,
                            message: 'another new message',
                            author_id: ids.user1Id,
                            rating_average: 6,
                            author: 'name',
                        },
                        {
                            message: 'test 100',
                            author_id: ids.user1Id,
                            rating_average: 8,
                            author: 'name',
                        },
                    ],
                    update: {
                        message: 'latest message',
                    },
                });
                const posts = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
                expect(posts).toIncludeAllMembers([
                    expect.objectContaining({
                        post_id: ids.post1Id,
                        message: 'latest message',
                        author_id: ids.user1Id,
                    }),
                    expect.objectContaining({
                        message: 'test 100',
                        author_id: ids.user1Id,
                        rating_average: 8,
                        author: 'name',
                    }),
                ]);
            });
            it('Can reinstate soft-deleted rows', async () => {
                await gybson.post.softDelete({
                    where: {
                        post_id: ids.post1Id,
                    },
                });
                const post = await gybson.post.loadOne({ where: { post_id: ids.post1Id } });
                expect(post).toEqual(null);

                const postId = await gybson.post.upsert({
                    values: {
                        post_id: ids.post1Id,
                        message: 'new message',
                        rating_average: 6,
                        author: 'name',
                        author_id: ids.user1Id,
                    },
                    update: {
                        message: 'latest',
                    },
                    reinstateSoftDeletedRows: true,
                });
                await gybson.post.purge();
                const post2 = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post2).toEqual(
                    expect.objectContaining({
                        post_id: ids.post1Id,
                    }),
                );
            });
        });
        it('Returns the id of the first upserted row', async () => {
            const postId = await gybson.post.upsert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
                mergeColumns: {
                    message: true,
                },
            });
            expect(postId).toBeDefined();
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
        });
        it('Returns compund id of the first upserted row', async () => {
            const result = await gybson.teamMember.upsert({
                values: {
                    team_id: ids.team1Id,
                    user_id: ids.user1Id,
                },
                mergeColumns: {
                    team_id: true,
                },
            });
            expect(result).toBeDefined();
            // const post = await gybson.post.loadOne({ where: { post_id: postId } });
            // expect(post).toEqual(
            //     expect.objectContaining({
            //         post_id: postId,
            //     }),
            // );
        });
    });
    describe('inserting rows without conflicts', () => {
        describe('mergeColumns', () => {
            it('Can insert a single row', async () => {
                const postId = await gybson.post.upsert({
                    values: {
                        message: 'test 2',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'name',
                    },
                    mergeColumns: {
                        message: true,
                    },
                });
                const post = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post).toEqual(
                    expect.objectContaining({
                        post_id: postId,
                        message: 'test 2',
                        rating_average: 6,
                        author: 'name',
                    }),
                );
            });
            it('Can insert multiple rows', async () => {
                const postId = await gybson.post.upsert({
                    values: [
                        {
                            message: 'test 2',
                            author_id: ids.user1Id,
                            rating_average: 6,
                            author: 'name',
                        },
                        {
                            message: 'test 3',
                            author_id: ids.user1Id,
                            rating_average: 8,
                            author: 'name',
                        },
                    ],
                    mergeColumns: {
                        message: true,
                    },
                });
                const posts = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
                expect(posts).toIncludeAllMembers([
                    expect.objectContaining({
                        post_id: postId,
                        message: 'test 2',
                        rating_average: 6,
                    }),
                    expect.objectContaining({
                        post_id: postId + 1,
                        message: 'test 3',
                        author_id: ids.user1Id,
                        rating_average: 8,
                    }),
                ]);
            });
        });
        describe('update', () => {
            it('Can insert a single row', async () => {
                const postId = await gybson.post.upsert({
                    values: {
                        message: 'test 2',
                        author_id: ids.user1Id,
                        rating_average: 6,
                        author: 'name',
                    },
                    update: {
                        message: 'hello',
                    },
                });
                const post = await gybson.post.loadOne({ where: { post_id: postId } });
                expect(post).toEqual(
                    expect.objectContaining({
                        post_id: postId,
                        message: 'test 2',
                        rating_average: 6,
                        author: 'name',
                    }),
                );
            });
            it('Can insert multiple rows', async () => {
                const postId = await gybson.post.upsert({
                    values: [
                        {
                            message: 'test 2',
                            author_id: ids.user1Id,
                            rating_average: 6,
                            author: 'name',
                        },
                        {
                            message: 'test 3',
                            author_id: ids.user1Id,
                            rating_average: 8,
                            author: 'name',
                        },
                    ],
                    update: {
                        message: 'hello',
                    },
                });
                const posts = await gybson.post.loadMany({ where: { author_id: ids.user1Id } });
                expect(posts).toIncludeAllMembers([
                    expect.objectContaining({
                        post_id: postId,
                        message: 'test 2',
                        rating_average: 6,
                    }),
                    expect.objectContaining({
                        post_id: postId + 1,
                        message: 'test 3',
                        author_id: ids.user1Id,
                        rating_average: 8,
                    }),
                ]);
            });
        });
        it('Returns the id of the first inserted row', async () => {
            const postId = await gybson.post.upsert({
                values: {
                    message: 'test 2',
                    author_id: ids.user1Id,
                    rating_average: 6,
                    author: 'name',
                    created: new Date(2003, 20, 4),
                },
                mergeColumns: {
                    message: true,
                },
            });
            expect(postId).toBeDefined();
            const post = await gybson.post.loadOne({ where: { post_id: postId } });
            expect(post).toEqual(
                expect.objectContaining({
                    post_id: postId,
                }),
            );
        });
        it('Throws error if the upsert fails', async () => {
            // author_id is non existing
            await expect(
                gybson.post.upsert({
                    values: {
                        post_id: ids.post1Id,
                        message: 'test 2',
                        author_id: 50000,
                        author: 'sgdsags',
                        rating_average: 6,
                        created: new Date(2003, 20, 4),
                    },
                    mergeColumns: {
                        author_id: true,
                    },
                }),
            ).rejects.toThrow(Error);
        });
    });
    it('Can use an external connection', async () => {
        const connection = await getPoolConnection();
        const postId = await gybson.post.upsert({
            connection,
            values: {
                message: 'test 2',
                author_id: ids.user1Id,
                rating_average: 6,
                author: 'name',
                created: new Date(2003, 20, 4),
            },
            mergeColumns: {
                message: true,
            },
        });
        expect(postId).toBeDefined();
        await closePoolConnection(connection);
    });
});
