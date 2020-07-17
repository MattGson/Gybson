import Nodent, { LogLevel } from '../build/src/Client';

const main = async () => {

    Nodent.init({
        client: 'mysql',
        connection: {
            host: '127.0.0.1',
            port: 3306,
            database: 'komodo',
            timezone: 'utc',
            charset: 'utf8mb4',
        },
        config: {
            logLevel: LogLevel.debug,
        },
    });



};


main();