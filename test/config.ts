export const databaseName = 'tests';
export const mysqlConnection = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: databaseName,
        multipleStatements: true,
    },
};

export const pgConnection = {
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: databaseName,
        schema: 'public',
    },
    pool: {
        min: 2,
        max: 50,
    },
};
