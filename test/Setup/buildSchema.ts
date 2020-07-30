import * as Knex from 'knex';

export const buildSchema = async (knex: Knex) => {
    await knex.schema.createTable('users', (table) => {
        table.increments('user_id').unsigned().primary();
        table.string('email', 400).notNullable();
        table.string('first_name', 200);
        table.string('last_name', 200);
        table.string('password', 200).notNullable();
        table.string('token', 200).unique();
        table
            .enum('permissions', ['USER', 'ADMIN'])
            .defaultTo('USER')
            .comment('The permissions the user has access to');
        table.boolean('deleted').defaultTo(false);
    });

    await knex.schema.createTable('teams', (table) => {
        table.increments('team_id').unsigned().primary();
        table.string('name', 400).notNullable();
        table.boolean('deleted').defaultTo(false);
    });

    await knex.schema.createTable('team_members', (table) => {
        table.integer('team_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.boolean('deleted').defaultTo(false);

        table.foreign('team_id').references('teams.team_id');
        table.foreign('user_id').references('users.user_id');
    });

    await knex.schema.createTable('posts', (table) => {
        table.increments('post_id').unsigned().primary();
        table.string('author').notNullable().comment('The name of the author');
        table.integer('author_id').unsigned().notNullable().comment('A link to the author');
        table.integer('co_author').unsigned().comment('An optional co-author');
        table.string('message', 4000).notNullable();
        table.float('rating_average').defaultTo(0).comment('The average rating across reviewers');
        table.dateTime('created').defaultTo(knex.fn.now());

        table.foreign('author_id').references('users.user_id');
        table.foreign('co_author').references('users.user_id');

        table.boolean('deleted').defaultTo(false);
    });
};
