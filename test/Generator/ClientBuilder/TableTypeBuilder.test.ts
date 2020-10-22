import { Introspection } from '../../../src/Generator/Introspection/IntrospectionTypes';
import { buildMySQLSchema, closeConnection, knex, schemaName } from '../../Setup/buildMySQL';
import { MySQLIntrospection } from '../../../src/Generator/Introspection/MySQLIntrospection';
import { TableSchemaBuilder } from '../../../src/Generator/Introspection/TableSchemaBuilder';
import 'jest-extended';
// @ts-ignore - no types for prettier
import { format } from 'prettier';
import { TableTypeBuilder } from '../../../src/Generator/TableClientBuilder/TableTypeBuilder';
import { prettier } from '../../../src/Generator/config';

describe('TableTypeBuilder', () => {
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
    describe('typeNamesForTable', () => {
        it('Generates the type names for table', async (): Promise<void> => {
            const typeNames = TableTypeBuilder.typeNamesForTable({ tableName: 'users' });

            expect(typeNames).toEqual({
                rowTypeName: `usersRow`,
                columnMapTypeName: `usersColumnMap`,
                whereTypeName: `usersWhere`,
                orderByTypeName: `usersOrderBy`,
                paginationTypeName: `usersPaginate`,
                relationFilterTypeName: `usersRelationFilter`,
            });
        });
        it('Applies a given suffix to row type', async (): Promise<void> => {
            const typeNames = TableTypeBuilder.typeNamesForTable({ tableName: 'users', rowTypeSuffix: 'DTO' });

            expect(typeNames).toEqual({
                rowTypeName: `usersDTO`,
                columnMapTypeName: `usersColumnMap`,
                whereTypeName: `usersWhere`,
                orderByTypeName: `usersOrderBy`,
                paginationTypeName: `usersPaginate`,
                relationFilterTypeName: `usersRelationFilter`,
            });
        });
    });
    describe('buildTypeImports', () => {
        it('Generates the imports for types with relations', async (): Promise<void> => {
            const { relations } = await new TableSchemaBuilder('users', intro).buildTableDefinition();
            const imports = TableTypeBuilder.buildTypeImports({
                tableName: 'users',
                relations,
                gybsonLibPath: 'gybson',
            });
            const formatted = format(imports, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `import {
    SQLQueryBuilder,
    Order,
    Enumerable,
    NumberWhere,
    NumberWhereNullable,
    StringWhere,
    StringWhereNullable,
    BooleanWhere,
    BooleanWhereNullable,
    DateWhere,
    DateWhereNullable,
} from 'gybson';

import { postsRelationFilter } from './Posts';
import { team_membersRelationFilter } from './TeamMembers';
`,
            );
        });
    });
    describe('buildEnumTypes', () => {
        it('Generates the enum types for the table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            const result = TableTypeBuilder.buildEnumTypes({ enums });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export type users_permissions = 'USER' | 'ADMIN';
export type users_subscription_level = 'BRONZE' | 'SILVER' | 'GOLD';
`,
            );
        });
    });
    describe('buildRowType', () => {
        it('Generates the row type for the table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            const columns = await intro.getTableTypes('users', enums);
            const result = TableTypeBuilder.buildRowType({ table: columns, rowTypeName: 'usersRow' });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export interface usersRow {
    user_id: number;
    best_friend_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    password: string;
    token: string | null;
    permissions: users_permissions | null;
    subscription_level: users_subscription_level | null;
    deleted_at: Date | null;
}
`,
            );
        });
    });
    describe('buildColumnMapType', () => {
        it('Generates a boolean map of the columns', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('users');
            const columns = await intro.getTableTypes('users', enums);
            const result = TableTypeBuilder.buildColumnMapType({ columns, columnMapTypeName: 'usersColumnMap' });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export interface usersColumnMap {
    user_id: boolean;
    best_friend_id: boolean;
    email: boolean;
    first_name: boolean;
    last_name: boolean;
    password: boolean;
    token: boolean;
    permissions: boolean;
    subscription_level: boolean;
    deleted_at: boolean;
}
`,
            );
        });
    });
    describe('buildRelationFilterType', () => {
        it('Generates a filter for relation queries for the table', async (): Promise<void> => {
            const result = TableTypeBuilder.buildRelationFilterType({
                whereTypeName: 'usersWhere',
                relationFilterTypeName: 'usersRelationFilter',
            });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export interface usersRelationFilter {
    existsWhere?: usersWhere;
    notExistsWhere?: usersWhere;
    whereEvery?: usersWhere;
}
`,
            );
        });
    });
    describe('buildWhereType', () => {
        it('Generates filters for every column, relation and combiner ', async (): Promise<void> => {
            const { relations } = await new TableSchemaBuilder('posts', intro).buildTableDefinition();
            const enums = await intro.getEnumTypesForTable('posts');
            const columns = await intro.getTableTypes('posts', enums);
            const result = TableTypeBuilder.buildWhereType({ columns, relations, whereTypeName: 'postsWhere' });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export interface postsWhere {
    post_id?: number | NumberWhere;
    author?: string | StringWhere;
    author_id?: number | NumberWhere;
    co_author?: number | NumberWhereNullable | null;
    message?: string | StringWhere;
    rating_average?: number | NumberWhereNullable | null;
    created?: Date | DateWhereNullable | null;
    deleted?: boolean | BooleanWhereNullable | null;

    AND?: Enumerable<postsWhere>;
    OR?: Enumerable<postsWhere>;
    NOT?: Enumerable<postsWhere>;

    author_?: usersRelationFilter | null;
    co_author_?: usersRelationFilter | null;
    team_members?: team_membersRelationFilter | null;
}
`,
            );
        });
    });
    describe('buildOrderType', () => {
        it('Generates an Order clause for every column', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTable('posts');
            const columns = await intro.getTableTypes('posts', enums);
            const result = TableTypeBuilder.buildOrderType({ orderByTypeName: 'postsOrderBy', columns });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export type postsOrderBy = {
    post_id?: Order;
    author?: Order;
    author_id?: Order;
    co_author?: Order;
    message?: Order;
    rating_average?: Order;
    created?: Order;
    deleted?: Order;
};
`,
            );
        });
    });
    describe('buildPaginateType', () => {
        it('Generates a filter for relation queries for the table', async (): Promise<void> => {
            const result = TableTypeBuilder.buildPaginateType({
                paginationTypeName: 'postsPaginate',
                rowTypeName: 'postsDTO',
            });
            const formatted = format(result, { parser: 'typescript', ...prettier });

            expect(formatted).toEqual(
                `export interface postsPaginate {
    limit?: number;
    afterCursor?: Partial<postsDTO>;
    beforeCursor?: Partial<postsDTO>;
    offset?: number;
}
`,
            );
        });
    });
});
