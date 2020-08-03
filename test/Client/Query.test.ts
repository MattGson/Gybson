import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import gybInit from '../../src/Client';
import Users from '../Gen/Users';
import TeamMembers from '../Gen/TeamMembers';
import gybsonRefresh, { Gybson } from '../Gen';

describe('Query', () => {
    let user1: number;
    let team1: number;
    let post1: number;
    let gybson: Gybson;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            await gybInit.init(connection);

            // Seeds
            gybson = gybsonRefresh();
            user1 =
                (await gybson.Users.insert({
                    values: {
                        first_name: 'John',
                        last_name: 'Doe',
                        permissions: 'USER',
                        email: 'my@demo.com',
                        password: 'any',
                    },
                })) || -1;
            team1 =
                (await gybson.Teams.insert({
                    values: {
                        name: 'team',
                    },
                })) || -1;
            await gybson.TeamMembers.insert({
                values: {
                    user_id: user1,
                    team_id: team1,
                },
            });
            post1 =
                (await gybson.Posts.insert({
                    values: {
                        message: 'test',
                        author_id: user1,
                        rating_average: 4.5,
                        author: 'name',
                    },
                })) || -1;
        },
    );
    afterAll(async () => {
        await closeConnection();
        await gybInit.close();
    });

    describe('one by column load', () => {
        it('Can load one from a single unique key', async () => {
            const loadOne = await gybson.Users.oneByUserId({ user_id: user1 });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: user1,
                    first_name: 'John',
                    last_name: 'Doe',
                    permissions: 'USER',
                    email: 'my@demo.com',
                }),
            );
        });
        it('Can load one from a compound unique key', async () => {
            const member = await gybson.TeamMembers.oneByTeamIdAndUserId({ user_id: user1, team_id: team1 });
            expect(member).toEqual(
                expect.objectContaining({
                    user_id: user1,
                    team_id: team1,
                }),
            );
        });
        it('Does not return deleted rows by default', async () => {
            await gybson.Users.softDelete({
                where: {
                    user_id: user1,
                },
            });
            const loadOne = await gybson.Users.oneByUserId({ user_id: user1 });
            expect(loadOne).toEqual(null);
        });
    });
    describe('one by column load', () => {
        it('Can load one from a single unique key', async () => {
            const user = new Users();
            const loadOne = await user.oneByUserId({ user_id: user1 });
            expect(loadOne).toEqual(
                expect.objectContaining({
                    user_id: user1,
                    first_name: 'John',
                    last_name: 'Doe',
                    permissions: 'USER',
                    email: 'my@demo.com',
                }),
            );
        });
        it('Can load one from a compound unique key', async () => {
            const tm = new TeamMembers();
            const member = await tm.oneByTeamIdAndUserId({ user_id: user1, team_id: team1 });
            expect(member).toEqual(
                expect.objectContaining({
                    user_id: user1,
                    team_id: team1,
                }),
            );
        });
    });
});
