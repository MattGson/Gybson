import Knex from 'knex';

import { GybsonClient } from '../test/tmp';

async function main() {
    const knex = Knex({
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '',
            database: 'tests',
        },
    });

    const gybson = new GybsonClient(knex);

    // await gybson.Users.insert({
    //     values: {
    //         email: '',
    //         password: '',
    //     },
    // });

    await gybson.Posts.insert({
        values: {
            message: 'hello',
            author: 'name',
            author_id: 1,
        },
    });

    console.log(await gybson.Posts.findMany({}));

    console.log(
        await gybson.Posts.loadMany({
            where: {
                author_id: 1,
            },
        }),
    );
}

main().then(() => console.log('done'));
