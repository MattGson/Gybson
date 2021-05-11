import { Knex } from 'knex';

export const migrateDb = async (knex: Knex, pg = false) => {
    await knex.schema.dropTableIfExists('team_members_positions');
    await knex.schema.dropTableIfExists('team_members');
    await knex.schema.dropTableIfExists('teams');
    await knex.schema.dropTableIfExists('posts');
    await knex.schema.dropTableIfExists('users');

    if (pg) {
        await knex.raw(`DROP TYPE IF EXISTS permissions`);
        await knex.raw(`DROP TYPE IF EXISTS subscription_level`);
    }
    // table with multiple enums
    // with self-relation
    // with unique keys
    await knex.schema.createTable('users', (table) => {
        table.increments('user_id').unsigned().primary();
        table.integer('best_friend_id').unsigned().comment('Best friend - self relations');
        table.string('email', 400).notNullable().unique();
        table.string('first_name', 200);
        table.string('last_name', 200);
        table.string('password', 200).notNullable();
        table.string('token', 200).unique();
        table
            .enum('permissions', ['USER', 'ADMIN'], { useNative: true, enumName: 'permissions' })
            .defaultTo('USER')
            .comment('The permissions the user has access to');
        table
            .enum('subscription_level', ['BRONZE', 'SILVER', 'GOLD'], {
                useNative: true,
                enumName: 'subscription_level',
            })
            .comment('The package subscription the user has purchased');
        table.dateTime('deleted_at');

        table.foreign('best_friend_id').references('users.user_id');
    });

    // table with multiple references to the same table (users)
    // also has conflicting naming between author and author_id
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

    await knex.schema.createTable('teams', (table) => {
        table.increments('team_id').unsigned().primary();
        table.string('name', 400).notNullable();
        table.boolean('deleted').defaultTo(false);
    });

    // join table with compound primary key
    await knex.schema.createTable('team_members', (table) => {
        table.integer('team_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.integer('member_post_id').unsigned().comment('Post for joining the team');
        table.boolean('deleted').defaultTo(false);

        table.primary(['team_id', 'user_id']);
        table.foreign('team_id').references('teams.team_id');
        table.foreign('user_id').references('users.user_id');
        table.foreign('member_post_id').references('posts.post_id').onDelete('CASCADE');
    });

    // table with compound foreign key
    await knex.schema.createTable('team_members_positions', (table) => {
        table.integer('team_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.string('position').notNullable();
        table.string('manager').notNullable();
        table.boolean('verified').defaultTo(false);

        table.unique(['position', 'manager']); // compound unique constraint
        table.primary(['team_id', 'user_id']);
        table.foreign(['team_id', 'user_id']).references(['team_id', 'user_id']).inTable('team_members');
    });
};
