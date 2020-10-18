import { Introspection } from '../../src/Generator/Introspection/IntrospectionTypes';
import { buildMySQLSchema, closeConnection, knex, schemaName } from '../Setup/buildMySQL';
import { MySQLIntrospection } from '../../src/Generator/Introspection/MySQLIntrospection';
import { TableSchemaBuilder } from '../../src/Generator/Introspection/TableSchemaBuilder';
import 'jest-extended';

describe('TableSchemaBuilder', () => {
    let intro: Introspection;
    beforeAll(
        async (): Promise<void> => {
            await buildMySQLSchema();
            intro = new MySQLIntrospection(knex(), schemaName);
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    describe('buildTableDefinition', () => {
        describe('Primary key', () => {
            it('Gets the primary key for a table', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('users', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.primaryKey).toEqual(['user_id']);
            });
            it('Gets a compound primary key for a table', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('team_members', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.primaryKey).toEqual(['team_id', 'user_id']);
            });
        });
        describe('Columns', () => {
            it('Gets the columns for a table', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('users', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                // just smoke test as the introspection takes care of this
                expect(schema.columns).toEqual(
                    expect.objectContaining({
                        user_id: {
                            dbType: 'int',
                            nullable: false,
                            tsType: 'number',
                            columnName: 'user_id',
                        },
                        permissions: {
                            dbType: 'enum',
                            nullable: true,
                            tsType: 'users_permissions',
                            columnName: 'permissions',
                        },
                    }),
                );
            });
        });
        describe('Enums', () => {
            it('Gets the enums for a table', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('users', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                // just smoke test as the introspection takes care of this
                expect(schema.enums).toEqual(
                    expect.objectContaining({
                        users_permissions: {
                            columnName: 'permissions',
                            enumName: 'users_permissions',
                            values: ['USER', 'ADMIN'],
                        },
                        users_subscription_level: {
                            columnName: 'subscription_level',
                            enumName: 'users_subscription_level',
                            values: ['BRONZE', 'SILVER', 'GOLD'],
                        },
                    }),
                );
            });
        });
        describe('Relations', () => {
            it('Forwards relations are aliased by column name with `id` stripped', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('users', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'users',
                        alias: 'best_friend',
                        joins: [
                            {
                                fromColumn: 'best_friend_id',
                                toColumn: 'user_id',
                            },
                        ],
                    }),
                ]);
            });
            it('Backwards relations are aliased as the table name by default', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('posts', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'team_members',
                        alias: 'team_members',
                        joins: [{ fromColumn: 'post_id', toColumn: 'member_post_id' }],
                    }),
                ]);
            });
            it('Backwards relations are aliased with columnName_tableName if there are multiple instances of the table', async (): Promise<
                void
            > => {
                const schemaBuilder = new TableSchemaBuilder('users', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'posts',
                        alias: 'author_posts',
                        joins: [
                            {
                                toColumn: 'author_id',
                                fromColumn: 'user_id',
                            },
                        ],
                    }),
                    expect.objectContaining({
                        toTable: 'posts',
                        alias: 'co_author_posts',
                        joins: [
                            {
                                toColumn: 'co_author',
                                fromColumn: 'user_id',
                            },
                        ],
                    }),
                    expect.objectContaining({
                        toTable: 'team_members',
                        alias: 'team_members',
                        joins: [{ fromColumn: 'user_id', toColumn: 'user_id' }],
                    }),
                ]);
            });
            it('Relation alias that conflicts with column name is aliased with _', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder('posts', intro);
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'users',
                        alias: 'author_',
                        joins: [
                            {
                                fromColumn: 'author_id',
                                toColumn: 'user_id',
                            },
                        ],
                    }),
                ]);

                const schemaBuilder2 = new TableSchemaBuilder('posts', intro);
                const schema2 = await schemaBuilder2.buildTableDefinition();

                expect(schema2.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'users',
                        alias: 'co_author_',
                        joins: [
                            {
                                fromColumn: 'co_author',
                                toColumn: 'user_id',
                            },
                        ],
                    }),
                ]);
            });
        });
    });
});
