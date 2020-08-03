import gybsonRefresh from '../Gen';
import { Gybson } from '../Gen';

export type SeedIds = {
    user1Id: number;
    team1Id: number;
    post1Id: number;
    post2Id: number;
};

export const seed = async (gybson: Gybson) => {
    const user1Id = await gybson.Users.insert({
        values: {
            first_name: 'John',
            last_name: 'Doe',
            permissions: 'USER',
            email: 'my@demo.com',
            password: 'any',
        },
    });
    const team1Id = await gybson.Teams.insert({
        values: {
            name: 'team',
        },
    });
    if (!user1Id || !team1Id) throw new Error('Seeding failed');

    const post1Id = await gybson.Posts.insert({
        values: {
            message: 'test',
            author_id: user1Id,
            rating_average: 4.5,
            author: 'name',
        },
    });
    const post2Id = await gybson.Posts.insert({
        values: {
            message: 'test 2',
            author_id: user1Id,
            rating_average: 6,
            author: 'name',
        },
    });
    await gybson.TeamMembers.insert({
        values: {
            user_id: user1Id,
            team_id: team1Id,
            member_post_id: post2Id,
        },
    });
    if (!post1Id || !post2Id) throw new Error('Seeding failed');

    return {
        user1Id,
        team1Id,
        post1Id,
        post2Id,
    };
};
