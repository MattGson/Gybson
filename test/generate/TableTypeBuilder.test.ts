import { buildDBSchemas, closeConnection } from 'test/helpers/build-test-db';
import 'jest-extended';
// @ts-ignore - no types for prettier
import { format } from 'prettier';
import { TableTypeBuilder } from 'src/generate/client-builder/table-type-builder';
import { prettierDefault } from 'src/generate/config';
import schema from 'test/tmp/relational-schema';

describe('TableTypeBuilder', () => {
    beforeAll(async (): Promise<void> => {
        await buildDBSchemas();
    });
    afterAll(async () => {
        await closeConnection();
    });
    describe('typeNamesForTable', () => {
        it('Generates the type names for table', async (): Promise<void> => {
            const typeNames = TableTypeBuilder.typeNamesForTable({ tableName: 'users' });

            expect(typeNames).toEqual({
                rowTypeName: `usersRow`,
                requiredRowTypeName: `usersRequiredRow`,
                columnMapTypeName: `usersColumnMap`,
                whereTypeName: `usersWhere`,
                loadOneWhereTypeName: `usersLoadOneWhere`,
                loadManyWhereTypeName: `usersLoadManyWhere`,
                orderByTypeName: `usersOrderBy`,
                paginationTypeName: `usersPaginate`,
                relationFilterTypeName: `usersRelationFilter`,
            });
        });
        it('Applies a given suffix to row type', async (): Promise<void> => {
            const typeNames = TableTypeBuilder.typeNamesForTable({ tableName: 'users', rowTypeSuffix: 'DTO' });

            expect(typeNames).toEqual({
                rowTypeName: `usersDTO`,
                requiredRowTypeName: `usersRequiredRow`,
                columnMapTypeName: `usersColumnMap`,
                whereTypeName: `usersWhere`,
                loadOneWhereTypeName: `usersLoadOneWhere`,
                loadManyWhereTypeName: `usersLoadManyWhere`,
                orderByTypeName: `usersOrderBy`,
                paginationTypeName: `usersPaginate`,
                relationFilterTypeName: `usersRelationFilter`,
            });
        });
    });
    describe('buildTypeImports', () => {
        it('Generates the imports for types with relations', async (): Promise<void> => {
            const { relations } = schema.tables.users;
            const imports = TableTypeBuilder.buildTypeImports({
                tableName: 'users',
                // @ts-ignore
                relations,
                gybsonLibPath: 'gybson',
            });
            const formatted = format(imports, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `import {
    QueryClient,
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
    Loader,
} from 'gybson';

import { postsRelationFilter } from './Posts';
import { team_membersRelationFilter } from './TeamMembers';
`,
            );
        });
    });
    describe('buildEnumTypes', () => {
        it('Generates the enum types for the table', async (): Promise<void> => {
            const enums = schema.tables.users.enums;
            const result = TableTypeBuilder.buildEnumTypes({ enums });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export type users_permissions = 'ADMIN' | 'USER';
export type users_subscription_level = 'BRONZE' | 'GOLD' | 'SILVER';
`,
            );
        });
    });
    describe('buildRowType', () => {
        it('Generates the row type for the table', async (): Promise<void> => {
            const enums = schema.tables.users.enums;
            const columns = schema.tables.users.columns;
            const result = TableTypeBuilder.buildRowType({ table: columns, rowTypeName: 'usersRow' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
            const enums = schema.tables.users.enums;
            const columns = schema.tables.users.columns;
            const result = TableTypeBuilder.buildColumnMapType({ columns, columnMapTypeName: 'usersColumnMap' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
            const columns = schema.tables.posts.columns;
            const relations = schema.tables.posts.relations;
            // @ts-ignore
            const result = TableTypeBuilder.buildWhereType({ columns, relations, whereTypeName: 'postsWhere' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
    describe('buildLoadOneWhereType', () => {
        it('Generates filters for unique keys', async (): Promise<void> => {
            const columns = schema.tables.team_members.columns;
            const uniqueKeyCombinations = schema.tables.team_members.uniqueKeyCombinations;
            const result = TableTypeBuilder.buildLoadOneWhereType({
                uniqueKeys: uniqueKeyCombinations,
                columns,
                loadOneWhereTypeName: 'team_membersLoadOneWhere',
            });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface team_membersLoadOneWhere {
    team_id__user_id?: {
        team_id: number;
        user_id: number;
    };
}
`,
            );
        });
    });
    describe('buildLoadManyWhereType', () => {
        it('Generates filters for non-unique keys', async (): Promise<void> => {
            const columns = schema.tables.posts.columns;
            const uniqueKeyCombinations = schema.tables.posts.uniqueKeyCombinations;
            const result = TableTypeBuilder.buildLoadManyWhereType({
                columns,
                uniqueKeys: uniqueKeyCombinations,
                loadManyWhereTypeName: 'postsLoadManyWhere',
            });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface postsLoadManyWhere {
    author?: string;
    author_id?: number;
    co_author?: number | null;
    message?: string;
    rating_average?: number | null;
    created?: Date | null;
    deleted?: boolean | null;
}
`,
            );
        });
    });
    describe('buildOrderType', () => {
        it('Generates an Order clause for every column', async (): Promise<void> => {
            const columns = schema.tables.posts.columns;
            const result = TableTypeBuilder.buildOrderType({ orderByTypeName: 'postsOrderBy', columns });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

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
