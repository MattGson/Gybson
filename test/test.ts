import Gybson, { LogLevel } from '../build/src/Client';
import by from '../Gen';

Gybson.init({
    client: 'mysql',
    connection: {
        database: 'komodo',
        user: 'root',
        password: '',
    },
    options: {
        logLevel: LogLevel.debug,
    },
});
const gyb = by();

const main = async () => {
    await gyb.Posts.insert({
        values: [
            {
                author_id: 4,
            },
        ],
    });

    await gyb.Posts.upsert({
        values: [
            {
                post_id: 4,
                author_id: 3,
            },
        ],
        updateColumns: {
            author_id: true
        }
    });

    await gyb.Posts.update({
        values: {
            author_id: 1,
            datetime: new Date(),
        },
        where: {
            post_id: 4
        }
    })

    const post = await gyb.Posts.findMany({
        where: {
            post_id: 4,
            users: {
                innerJoinWhere: {
                    user_id: {
                        not: 5,
                    },
                },
            },
        },
        orderBy: {
            datetime: 'asc',
        },
        paginate: {
            limit: 3,
            afterCursor: {
                post_id: 1,
            },
        },
    });
    console.log(post);
};

main().then(() => {
    console.log('');
});
