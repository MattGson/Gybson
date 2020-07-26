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
        logLevel: LogLevel.debug
    }
});
const gyb = by();

const main = async () => {



    const post = await gyb.Posts.findMany({
        where: {
            post_id: 4,
            users: {
                innerJoinWhere: {
                    user_id:  {
                        not: 5
                    }
                }
            }
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