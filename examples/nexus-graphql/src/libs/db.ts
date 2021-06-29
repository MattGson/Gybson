import { knex } from 'knex';
import config from '../config/config';

const db = config.get('db');

export const knexClient = knex({
    client: 'mysql',
    connection: {
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        timezone: 'utc',
        charset: 'utf8mb4',
    },
});

export const gybson = () => new GybsonClient(knexClient);
