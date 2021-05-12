import { GybsonClient } from '../tmp';
import faker from 'faker';
import { User } from '../tmp/User';
import { Post } from '../tmp/Post';

export type SeedIds = {
    user1Id: number;
    team1Id: number;
    post1Id: number;
    post2Id: number;
};

export const seedPost = async (gybson: GybsonClient, values?: Partial<Post>): Promise<number> => {
    const postId = await gybson.post.insert({
        values: {
            message: 'test 2',
            author_id: faker.random.number(),
            rating_average: 6,
            author: 'name',
            created: new Date(2003, 20, 4),
            ...values,
        },
    });
    return postId;
};

export const seedUser = async (gybson: GybsonClient, values?: Partial<User>): Promise<number> => {
    const user1Id = await gybson.user.insert({
        values: {
            first_name: 'John',
            last_name: 'Doe',
            permissions: 'USER',
            email: faker.internet.email(),
            password: faker.internet.password(),
            ...values,
        },
    });
    return user1Id;
};

export const seed = async (gybson: GybsonClient): Promise<SeedIds> => {
    const user1Id = await seedUser(gybson);
    const team1Id = await gybson.team.insert({
        values: {
            name: 'team',
        },
    });

    const post1Id = await seedPost(gybson, {
        message: 'first',
        author_id: user1Id,
        rating_average: 4.5,
        author: 'name',
    });
    const post2Id = await seedPost(gybson, {
        message: 'test 2',
        author_id: user1Id,
        rating_average: 6,
        author: 'name',
        created: new Date(2003, 20, 4),
    });
    await gybson.teamMember.insert({
        values: {
            user_id: user1Id,
            team_id: team1Id,
            member_post_id: post2Id,
        },
    });

    return {
        user1Id,
        team1Id,
        post1Id,
        post2Id,
    };
};
