const config = require('../config');
const dbConfig = config.get('db');

module.exports = {
    development: {
        client: 'mysql',
        connection: {
            database: dbConfig.database,
            user: dbConfig.user,
            password: dbConfig.password,
            host: dbConfig.host,
            port: dbConfig.port,
            charset: 'utf8',
            timezone: 'utc',
            multipleStatements: true,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },
};
