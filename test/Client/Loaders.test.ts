import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit from '../../src/Client';
import gybsonRefresh, { Gybson } from '../Gen';
import { seed, SeedIds } from '../Setup/seed';

describe('Loaders', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            await gybInit.init(connection);
            gybson = gybsonRefresh();

            // Seeds
            ids = await seed(gybson);
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

    describe('one by column load', () => {
        it('Can load one from a single unique key', async () => {
            const loadOne = await gybson.Users.oneByUserId({ user_id: ids.user1Id });
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
            const member = await gybson.TeamMembers.oneByTeamIdAndUserId({
                user_id: ids.user1Id,
                team_id: ids.team1Id,
            });
            expect(member).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                }),
            );
        });
        it('Does not return deleted rows by default', async () => {
            await gybson.Users.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const loadOne = await gybson.Users.oneByUserId({ user_id: ids.user1Id });
            expect(loadOne).toEqual(null);
        });
        it('Returns deleted rows when requested', async () => {
            await gybson.Users.softDelete({
                where: {
                    user_id: ids.user1Id,
                },
            });
            const loadOne = await gybson.Users.oneByUserId({ user_id: ids.user1Id, includeDeleted: true });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                }),
            );
        });
    });
    describe('many by column load', () => {
        it('Can load many from a single non-unique key', async () => {
            const loadMany = await gybson.Posts.manyByAuthorId({ author_id: ids.user1Id });
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
            const member = await gybson.TeamMembers.manyByTeamIdAndMemberPostId({
                team_id: ids.team1Id,
                member_post_id: ids.post2Id,
            });
            expect(member).toContainEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    team_id: ids.team1Id,
                    member_post_id: ids.post2Id,
                }),
            );
        });
        it('Does not return deleted rows by default', async () => {
            await gybson.Posts.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            const loadMany = await gybson.Posts.manyByAuthorId({ author_id: ids.user1Id });
            expect(loadMany).not.toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
        it('Returns deleted rows when requested', async () => {
            await gybson.Posts.softDelete({
                where: {
                    post_id: ids.post1Id,
                },
            });
            const loadMany = await gybson.Posts.manyByAuthorId({ author_id: ids.user1Id, includeDeleted: true });
            expect(loadMany).toContainEqual(expect.objectContaining({ post_id: ids.post1Id }));
        });
    });
});
