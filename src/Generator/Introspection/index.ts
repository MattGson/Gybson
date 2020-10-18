import Knex from 'knex';
import { Introspection } from './IntrospectionTypes';
import { MySQLIntrospection } from './MySQLIntrospection';
import { TableSchemaBuilder } from './TableSchemaBuilder';
import { DatabaseSchema } from '../../TypeTruth/TypeTruth';

export interface Connection {
    client: 'mysql' | 'postgres';
    connection: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        multipleStatements?: boolean;
    };
}

/**
 * Build schema from database connection
 * @param params
 */
export const introspectSchema = async (params: { conn: Connection }): Promise<DatabaseSchema> => {
    const { conn } = params;
    console.log(`Introspecting schema: ${conn.connection.database}`);

    const knex = Knex(conn);
    let DB: Introspection;

    if (conn.client === 'mysql') {
        DB = new MySQLIntrospection(knex, conn.connection.database);
    } else {
        throw new Error('PostgreSQL not currently supported');
    }

    const schema: DatabaseSchema = {};
    const tables = await DB.getSchemaTables();

    for (const table of tables) {
        schema[table] = await new TableSchemaBuilder(table, DB).buildTableDefinition();
    }
    await knex.destroy();

    return schema;
};