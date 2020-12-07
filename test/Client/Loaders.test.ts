import { closeConnection } from '../Setup/build-test-db';
import gybInit from '../../src/Client';
import gybsonRefresh, { Gybson } from '../Gen';
import { seed, SeedIds, seedPost, seedUser } from '../Setup/seed';
import { buildDBSchemas } from '../Setup/build-test-db';
import { DB } from '../Setup/test.env';
import { itif } from '../Setup/helpers';

describe('Loaders', () => {
    let ids: SeedIds;
    let gybson: Gybson;
    let connection;
    beforeAll(
        async (): Promise<void> => {
            connection = await buildDBSchemas();
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
            const loadOne2 = await gybson.Users.oneByUserId({ user_id: ids.user1Id });
            console.log(loadOne2)
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
            const member = await gybson.TeamMembers.manyByMemberPostIdAndTeamId({
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
        it('Can order loaded rows', async () => {
            const u = await seedUser(gybson);
            const p1 = await seedPost(gybson, { author_id: u, message: 'z' });
            const p2 = await seedPost(gybson, { author_id: u, message: 'a' });
            const member = await gybson.Posts.manyByAuthorId({
                author_id: u,
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
    describe('MySQL only', () => {
        itif(DB() === 'mysql')('Loads are case-insensitive on alphabetical keys on single loaders', async () => {
            console.log(DB());
            await gybson.Users.update({
                values: {
                    email: 'Cased@gmail.com',
                },
                where: {
                    user_id: ids.user1Id,
                },
            });
            const user = await gybson.Users.oneByEmail({ email: 'cased@gmail.com' });
            expect(user).toEqual(
                expect.objectContaining({
                    user_id: ids.user1Id,
                    email: 'Cased@gmail.com',
                }),
            );
        });
        itif(DB() === 'mysql')('Loads are case-insensitive on alphabetical keys on many loaders', async () => {
            await gybson.TeamMembersPositions.insert({
                values: {
                    manager: 'CasedManager',
                    team_id: ids.team1Id,
                    user_id: ids.user1Id,
                    position: 'A position',
                },
            });
            const members = await gybson.TeamMembersPositions.manyByManager({ manager: 'casedManager' });
            expect(members).toContainEqual(
                expect.objectContaining({
                    manager: 'CasedManager',
                }),
            );
        });
    });
});
