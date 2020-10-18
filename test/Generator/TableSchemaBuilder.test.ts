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
        describe('key constraints', () => {
            describe('Primary key', () => {
                it('Gets the primary key for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('users', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.primaryKey).toEqual(
                        expect.objectContaining({
                            columnNames: ['user_id'],
                        }),
                    );
                });
                it('Gets a compound primary key for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('team_members', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.primaryKey).toEqual(
                        expect.objectContaining({
                            columnNames: ['team_id', 'user_id'],
                        }),
                    );
                });
            });
            describe('Unique keys', () => {
                it('Gets unique key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('users', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['email'],
                            constraintType: 'UNIQUE',
                        }),
                        expect.objectContaining({
                            columnNames: ['token'],
                            constraintType: 'UNIQUE',
                        }),
                    ]);
                });

                it('Gets compound unique key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('team_members_positions', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['position', 'manager'],
                            constraintType: 'UNIQUE',
                        }),
                    ]);
                });
            });
            describe('Foreign keys', () => {
                it('Gets foreign key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('team_members', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['team_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                        expect.objectContaining({
                            columnNames: ['user_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                        expect.objectContaining({
                            columnNames: ['member_post_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                    ]);
                });
                it('Gets compound foreign key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('team_members_positions', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['team_id', 'user_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                    ]);
                });
            });
        });

        describe('key combinations', () => {
            describe('uniqueKeyCombinations', () => {
                it('Gets minimal key column combinations that uniquely define a row for a table', async (): Promise<
                    void
                > => {
                    const schemaBuilder = new TableSchemaBuilder('users', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.uniqueKeyCombinations).toIncludeAllMembers([['email'], ['token'], ['user_id']]);

                    // with compound keys
                    const schemaBuilder2 = new TableSchemaBuilder('team_members_positions', intro);
                    const schema2 = await schemaBuilder2.buildTableDefinition();

                    expect(schema2.uniqueKeyCombinations).toIncludeAllMembers([
                        ['position', 'manager'],
                        ['team_id', 'user_id'],
                    ]);
                });
            });
            describe('nonUniqueKeyCombinations', () => {
                it('Gets key column combinations that DO NOT uniquely define a row for a table', async (): Promise<
                    void
                > => {
                    const schemaBuilder = new TableSchemaBuilder('users', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.nonUniqueKeyCombinations).toIncludeAllMembers([['best_friend_id']]);
                });
                it('Permutes compound unique keys to form non-unique keys', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder('team_members_positions', intro);
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.nonUniqueKeyCombinations).toIncludeAllMembers([
                        ['team_id'],
                        ['user_id'],
                        ['team_id', 'position'],
                        ['user_id', 'position'],
                        ['team_id', 'manager'],
                        ['user_id', 'manager'],
                        ['position'],
                        ['manager'],
                    ]);
                });
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
