module.exports = {
    db: {
        doc: 'MYSQL database connection parameters.',
        host: {
            format: String,
            default: '127.0.0.1',
            arg: 'mysql-host',
            env: 'MYSQL_HOST',
        },
        port: {
            format: 'port',
            default: 3306,
            arg: 'mysql-port',
            env: 'MYSQL_PORT',
        },
        user: {
            format: String,
            default: 'root',
            arg: 'mysql-user',
            env: 'MYSQL_USER',
        },
        password: {
            format: String,
            default: '',
            arg: 'mysql-password',
            env: 'MYSQL_PASSWORD',
        },
        database: {
            format: String,
            default: 'demoapp',
            arg: 'mysql-database',
            env: 'MYSQL_DATABASE',
        },
    },
};
