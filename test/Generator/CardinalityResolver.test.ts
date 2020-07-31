import { Introspection } from '../../src/Generator/Introspection/IntrospectionTypes';
import { buildMySQLSchema, closeConnection, knex, schemaName } from '../Setup/buildMySQL';
import { MySQLIntrospection } from '../../src/Generator/Introspection/MySQLIntrospection';
import { CardinalityResolver } from '../../src/Generator/TableClientBuilder/CardinalityResolver';

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
            const primary = CardinalityResolver.primaryKeys(keys);
            expect(primary).toHaveLength(1);
            expect(primary).toEqual([expect.objectContaining({ columnName: 'user_id' })]);
        });
        it('Returns the compound primary keys from a set of keys', async () => {
            const keys = await intro.getTableKeys('team_members');
            const primary = CardinalityResolver.primaryKeys(keys);
            expect(primary).toHaveLength(2);
            expect(primary).toEqual([
                expect.objectContaining({ columnName: 'team_id' }),
                expect.objectContaining({ columnName: 'user_id' }),
            ]);
        });
    });
    describe('getUniqueKeys', () => {
        it('Returns the primary keys from a set of keys', async () => {
            const keys = await intro.getTableKeys('users');
            const primary = CardinalityResolver.primaryKeys(keys);
            expect(primary).toHaveLength(1);
            expect(primary).toEqual([expect.objectContaining({ columnName: 'user_id' })]);
        });
        it('Returns the compound primary keys from a set of keys', async () => {
            const keys = await intro.getTableKeys('team_members');
            const primary = CardinalityResolver.primaryKeys(keys);
            expect(primary).toHaveLength(2);
            expect(primary).toEqual([
                expect.objectContaining({ columnName: 'team_id' }),
                expect.objectContaining({ columnName: 'user_id' }),
            ]);
        });
    });
});
