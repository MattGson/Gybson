import { Introspection } from '../../../src/Generator/Introspection/IntrospectionTypes';
import { buildDBSchemas, closeConnection, knex, schemaName } from '../../Setup/build-test-db';
import { CardinalityResolver } from '../../../src/Generator/Introspection/CardinalityResolver';
import 'jest-extended';
import { getIntrospection } from '../../Setup/test.env';

describe('CardinalityResolver', () => {
    let intro: Introspection;
    beforeAll(
        async (): Promise<void> => {
            await buildDBSchemas();
            intro = getIntrospection(knex(), schemaName);
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    describe('primaryKeys', () => {
        it('Returns the primary key from a set of constraints', async () => {
            const keys = await intro.getTableConstraints('users');
            const primary = CardinalityResolver.primaryKey(keys);
            expect(primary).toEqual(expect.objectContaining({ columnNames: ['user_id'] }));
        });
        it('Returns the compound primary key from a set of keys', async () => {
            const keys = await intro.getTableConstraints('team_members');
            const primary = CardinalityResolver.primaryKey(keys);
            expect(primary).toEqual(expect.objectContaining({ columnNames: ['team_id', 'user_id'] }));
        });
    });
    describe('uniqueColumns', () => {
        it('Returns the columns that have a UNIQUE constraint', async () => {
            const keys = await intro.getTableConstraints('users');
            const unique = CardinalityResolver.uniqueConstraints(keys);
            expect(unique).toHaveLength(2);
            expect(unique).toIncludeAllMembers([
                expect.objectContaining({ columnNames: ['email'] }),
                expect.objectContaining({ columnNames: ['token'] }),
            ]);
        });
        it('Returns all columns from a multipart UNIQUE constraint', async () => {
            const keys = await intro.getTableConstraints('team_members_positions');
            const unique = CardinalityResolver.uniqueConstraints(keys);
            expect(unique).toHaveLength(1);
            expect(unique).toIncludeAllMembers([expect.objectContaining({ columnNames: ['manager', 'position'] })]);
        });
    });
    describe('getUniqueKeyCombinations', () => {
        it('Returns the UNIQUE key constraints', async () => {
            const keys = await intro.getTableConstraints('team_members_positions');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toIncludeAllMembers([['manager', 'position']]);
        });
        it('Returns a primary key', async () => {
            const keys = await intro.getTableConstraints('users');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toIncludeAllMembers([['user_id']]);
        });
        it('Returns a compound primary key', async () => {
            const keys = await intro.getTableConstraints('team_members_positions');
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys);
            expect(combos).toContainEqual(['team_id', 'user_id']);
        });
    });
    describe('getNonUniqueKeyCombinations', () => {
        it('Returns the single foreign key columns', async () => {
            const keys = await intro.getTableConstraints('posts');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toContainEqual(['author_id']);
            expect(combos).toContainEqual(['co_author']);
        });
        it('Returns the individual parts of a compound primary key', async () => {
            const keys = await intro.getTableConstraints('team_members');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toContainEqual(['user_id']);
            expect(combos).toContainEqual(['team_id']);
        });
        it('Returns the inter-leavings of compound key columns with other non-unique key columns', async () => {
            const keys = await intro.getTableConstraints('team_members');
            const combos = CardinalityResolver.getNonUniqueKeyCombinations(keys);
            expect(combos).toIncludeAllMembers([
                ['member_post_id', 'team_id'],
                ['member_post_id', 'user_id'],
            ]);
        });
    });
});
