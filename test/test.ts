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



    await gyb.Posts.findMany({
        where: {
            post_id: 4,
            users: {
                existsWhere: {
                    user_id: 5,
                    token: {
                        notExistsWhere: {
                            deleted: false
                        }
                    }
                }
            }
        },
        orderBy: {
            datetime: 'asc',
        },
        paginate: {
            limit: 3,
            afterCount: 4,
            afterCursor: {
                post_id: 5,
            },
        },
    });
};

main().then(() => {
    console.log('');
});