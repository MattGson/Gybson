import Gybson, { LogLevel } from '../build/src/Client';
import by from '../Gen';

Gybson.init({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        port: 3306,
        database: 'komodo',
    },
    config: {
        logLevel: LogLevel.debug,
    },
});

const main = async () => {


    const gyb = by();

    await gyb.Users.findMany({
        where: {
            user_id: 4,
        },
        orderBy: {
            fname: 'asc',
        },
        paginate: {
            limit: 3,
            afterCount: 4,
            afterCursor: {
                user_id: 5,
            },
        },
    });
};

main().then(() => console.log('done'));
