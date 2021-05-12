import { knex, Knex } from 'knex';
import { mysqlConnection, pgConnection } from 'test/config';
import { DB } from 'test/helpers';
import { migrateDb } from './migrate-up';

const openConnection = async (): Promise<Knex<any, unknown>> => {
    if (DB() === 'pg') {
        return knex(pgConnection);
    }
    if (DB() === 'mysql') {
        return knex(mysqlConnection);
    }
    throw new Error('No db specified while opening connection');
};

const buildDBSchemas = async (): Promise<Knex<any, unknown>> => {
    const conn = await openConnection();
    await migrateDb(conn, DB() === 'pg');
    return conn;
};

buildDBSchemas()
    .then((knex) => knex.destroy())
    .catch((e) => console.log(e));
