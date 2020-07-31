import { Introspection } from '../../src/Generator/Introspection/IntrospectionTypes';
import { buildMySQLSchema, closeConnection, knex, schemaName } from '../Setup/buildMySQL';
import { MySQLIntrospection } from '../../src/Generator/Introspection/MySQLIntrospection';
import { CardinalityResolver } from '../../src/Generator/TableClientBuilder/CardinalityResolver';
import 'jest-extended';

describe('CardinalityResolver', () => {
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
    describe('primaryKeys', () => {
        it('Returns the primary keys from a set of keys', async () => {
            const keys = await intro.getTableKeys('users');
            const primary = CardinalityResolver.primaryKey(keys);
            expect(primary).toHaveLength(1);
            expect(primary).toEqual([expect.objectContaining({ columnName: 'user_id' })]);
        });
        it('Returns the compound primary keys from a set of keys', async () => {
            const keys = await intro.getTableKeys('team_members');
            const primary = CardinalityResolver.primaryKey(keys);
            expect(primary).toHaveLength(2);
            expect(primary).toEqual([
                expect.objectContaining({ columnName: 'team_id' }),
                expect.objectContaining({ columnName: 'user_id' }),
            ]);
        });
    });
    describe('uniqueColumns', () => {
        it('Returns the columns that have a UNIQUE constraint', async () => {
            const keys = await intro.getTableKeys('users');
            const unique = CardinalityResolver.uniqueColumns(keys);
            expect(unique).toHaveLength(2);
            expect(unique).toIncludeAllMembers([
                expect.objectContaining({ columnName: 'email' }),
                expect.objectContaining({ columnName: 'token' }),
            ]);
        });
        it('Returns all columns from a multipart UNIQUE constraint', async () => {
            const keys = await intro.getTableKeys('team_members_positions');
            const unique = CardinalityResolver.uniqueColumns(keys);
            expect(unique).toHaveLength(2);
            expect(unique).toIncludeAllMembers([
                expect.objectContaining({ columnName: 'manager' }),
                expect.objectContaining({ columnName: 'position' }),
            ]);
        });
    });
    describe('getUniqueKeyCombinations', () => {
        it('Returns the UNIQUE key constraints', async () => {
            const keys = await intro.getTableKeys('team_members_positions');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([
                expect.objectContaining({ columnName: 'position' }),
                expect.objectContaining({ columnName: 'manager' }),
            ]);
        });
        it('Returns a primary key', async () => {
            const keys = await intro.getTableKeys('users');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'user_id' })]);
        });
        it('Returns a compound primary key', async () => {
            const keys = await intro.getTableKeys('team_members_positions');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([
                expect.objectContaining({ columnName: 'team_id' }),
                expect.objectContaining({ columnName: 'user_id' }),
            ]);
        });
    });
    describe('getNonUniqueKeyCombinations', () => {
        it('Returns the single foreign key columns', async () => {
            const keys = await intro.getTableKeys('posts');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'author_id' })]);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'co_author' })]);
        });
        it('Returns the individual parts of a compound primary key', async () => {
            const keys = await intro.getTableKeys('team_members');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'user_id' })]);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'team_id' })]);
        });
        it('Returns the inter-leavings of ', async () => {
            const keys = await intro.getTableKeys('team_members');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'user_id' })]);
            expect(combos).toContainEqual([expect.objectContaining({ columnName: 'team_id' })]);
        });
    });
});
