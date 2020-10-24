import { buildDBSchemas, closeConnection, knex } from '../../Setup/build-test-db';
import { Introspection } from '../../../src/Generator/Introspection/IntrospectionTypes';
import 'jest-extended';
import { PostgresIntrospection } from '../../../src/Generator/Introspection/PostgresIntrospection';
import { describeif } from '../../Setup/helpers';
import { DB } from '../../Setup/test.env';

describeif(DB() === 'pg')('PostgresIntrospection', () => {
    let intro: Introspection;

    beforeAll(
        async (): Promise<void> => {
            await buildDBSchemas();
            intro = new PostgresIntrospection(knex());
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    describe('getSchemaTables', () => {
        it('Loads all tables in a schema', async (): Promise<void> => {
            const tables = await intro.getSchemaTables();
            expect(tables).toHaveLength(5);
            expect(tables).toIncludeAllMembers(['users', 'teams', 'team_members', 'posts', 'team_members_positions']);
        });
    });
    describe('getEnumTypesForTable', () => {
        it('Loads all enums for a table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            expect(Object.keys(enums)).toHaveLength(2);
        });
        it('Names enums with table prefix', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            expect(Object.keys(enums)).toIncludeAllMembers(['users_subscription_level', 'users_permissions']);
        });
        it('Returns the correct column and values for each enum', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            expect(Object.values(enums)).toIncludeAllMembers([
                {
                    columnName: '',
                    enumName: 'users_permissions',
                    values: ['ADMIN', 'USER'],
                },
                {
                    columnName: '',
                    enumName: 'users_subscription_level',
                    values: ['BRONZE', 'GOLD', 'SILVER'],
                },
            ]);
        });
    });
    describe('getTableTypes', () => {
        it('Loads all columns for a table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            const types = await intro.getTableTypes('users', enums);
            expect(Object.keys(types)).toHaveLength(10);
        });
        it('Maps types correctly from db to typescript including enums', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            const types = await intro.getTableTypes('users', enums);

            expect(types['user_id']).toEqual({
                dbType: 'int4',
                nullable: false,
                tsType: 'number',
                columnName: 'user_id',
                columnDefault: `nextval('users_user_id_seq'::regclass)`,
            });
            expect(types['email']).toEqual({
                dbType: 'varchar',
                nullable: false,
                tsType: 'string',
                columnName: 'email',
                columnDefault: null,
            });
            expect(types['first_name']).toEqual({
                dbType: 'varchar',
                nullable: true,
                tsType: 'string',
                columnName: 'first_name',
                columnDefault: null,
            });
            expect(types['permissions']).toEqual({
                dbType: 'permissions',
                nullable: true,
                tsType: 'users_permissions',
                columnName: 'permissions',
                columnDefault: `'USER'::permissions`,
            });
            expect(types['deleted_at']).toEqual({
                dbType: 'timestamptz',
                nullable: true,
                tsType: 'Date',
                columnName: 'deleted_at',
                columnDefault: null,
            });
        });
    });
    describe('getTableConstraints', () => {
        it('Loads all primary key columns for table', async (): Promise<void> => {
            const userKeys = await intro.getTableConstraints('users');
            expect(userKeys).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['user_id'],
                    constraintName: 'users_pkey',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
            // check compound key
            const teamMemberKeys = await intro.getTableConstraints('team_members');
            expect(teamMemberKeys).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['team_id', 'user_id'],
                    constraintName: 'team_members_pkey',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
        });
        it('Loads all foreign key columns for table', async (): Promise<void> => {
            const postKeys = await intro.getTableConstraints('posts');
            expect(postKeys).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['author_id'],
                    constraintType: 'FOREIGN KEY',
                }),
                expect.objectContaining({
                    columnNames: ['co_author'],
                    constraintType: 'FOREIGN KEY',
                }),
            ]);
        });
        it('loads self relation keys', async () => {
            const userKeys = await intro.getTableConstraints('users');
            expect(userKeys).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['best_friend_id'],
                    constraintType: 'FOREIGN KEY',
                }),
            ]);
        });
        it('loads unique keys', async () => {
            const userKeys = await intro.getTableConstraints('users');
            expect(userKeys).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['email'],
                    constraintType: 'UNIQUE',
                }),
            ]);
        });
    });
    describe('getForwardRelations', () => {
        it('Loads all relations on foreign keys for a table', async (): Promise<void> => {
            const rels = await intro.getForwardRelations('team_members');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'teams',
                    alias: 'teams',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads multiple relations to the same table', async (): Promise<void> => {
            const rels = await intro.getForwardRelations('posts');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'author_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'co_author',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all joins on compound foreign keys for a table', async (): Promise<void> => {
            const rels = await intro.getForwardRelations('team_members_positions');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members',
                    alias: 'team_members',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all relations on self-referencing keys for table', async (): Promise<void> => {
            const rels = await intro.getForwardRelations('users');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'best_friend_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
    });
    describe('getBackwardRelations', () => {
        it('Loads all relations on foreign keys referencing the table', async (): Promise<void> => {
            const rels = await intro.getBackwardRelations('teams');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members',
                    alias: 'team_members',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads multiple relations from the same table', async (): Promise<void> => {
            const rels = await intro.getBackwardRelations('users');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'posts',
                    alias: 'posts',
                    joins: [
                        {
                            toColumn: 'author_id',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'posts',
                    alias: 'posts',
                    joins: [
                        {
                            toColumn: 'co_author',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all joins on compound foreign relations to the table', async (): Promise<void> => {
            const rels = await intro.getBackwardRelations('team_members');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members_positions',
                    alias: 'team_members_positions',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all relations on self-referencing keys for table', async (): Promise<void> => {
            const rels = await intro.getBackwardRelations('users');
            expect(rels).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            toColumn: 'best_friend_id',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
    });
});
