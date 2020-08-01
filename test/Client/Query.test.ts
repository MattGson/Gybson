import { buildMySQLSchema, closeConnection, connection } from '../Setup/buildMySQL';
import { DatabaseSchema } from '../../src/Client';

import Gybson from '../../src/Client';
import Users from '../Gen/Users';
import Teams from '../Gen/Teams';
import TeamMembers from '../Gen/TeamMembers';

describe('Query', () => {
    let schema: DatabaseSchema;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            await Gybson.init(connection);
        },
    );
    afterAll(async () => {
        await closeConnection();
        await Gybson.close();
    });
    describe('one by column load', () => {
        let user1: number;
        let team1: number;
        beforeAll(async () => {
            const user = new Users();
            const teams = new Teams();
            const tm = new TeamMembers();

            user1 =
                (await user.insert({
                    values: {
                        first_name: 'John',
                        last_name: 'Doe',
                        permissions: 'USER',
                        email: 'my@demo.com',
                        password: 'any',
                    },
                })) || -1;
            team1 =
                (await teams.insert({
                    values: {
                        name: 'team',
                    },
                })) || -1;
            await tm.insert({
                values: {
                    user_id: user1,
                    team_id: team1,
                },
            });
        });
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
