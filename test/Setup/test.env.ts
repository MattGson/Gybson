import { MySQLIntrospection } from '../../src/Generator/Introspection/MySQLIntrospection';
import { PostgresIntrospection } from '../../src/Generator/Introspection/PostgresIntrospection';

export const DB = (): 'mysql' | 'pg' => {
    const db = process.env.DB;
    if (db !== 'mysql' && db !== 'pg') throw new Error('DB must be pg or mysql');
    return db;
};

export const getIntrospection = (knex: any, schema?: string) => {
    if (DB() === 'mysql') {
        return new MySQLIntrospection(knex, schema);
    }
    return new PostgresIntrospection(knex);
};
