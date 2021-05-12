import 'jest-extended';
import { format } from 'prettier';
import { TableTypeBuilder } from 'src/generate/client-builder/table-type-builder';
import { prettierDefault } from 'src/generate/config';
import schema from 'test/tmp/relational-schema';
import { DB, itif } from 'test/helpers';

describe('TableTypeBuilder', () => {
    describe('typeNamesForTable', () => {
        it('Generates the type names for table', async (): Promise<void> => {
            const typeNames = TableTypeBuilder.typeNamesForTable({ tableName: 'users' });

            expect(typeNames).toEqual({
                rowTypeName: `User`,
                requiredRowTypeName: `UserRequiredRow`,
                columnMapTypeName: `UserColumnMap`,
                whereTypeName: `UserWhere`,
                loadOneWhereTypeName: `UserLoadOneWhere`,
                loadManyWhereTypeName: `UserLoadManyWhere`,
                orderByTypeName: `UserOrderBy`,
                paginationTypeName: `UserPaginate`,
                relationFilterTypeName: `UserRelationFilter`,
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

import { PostRelationFilter } from './Post';
import { TeamMemberRelationFilter } from './TeamMember';
import { TeamRelationFilter } from './Team';
`,
            );
        });
    });
    describe('buildEnumTypes', () => {
        itif(DB() === 'mysql')('Generates the enum types for the table', async (): Promise<void> => {
            const enums = schema.tables.users.enums;
            const result = TableTypeBuilder.buildEnumTypes({ enums });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export type users_permissions = 'ADMIN' | 'USER';
export type users_subscription_level = 'BRONZE' | 'GOLD' | 'SILVER';
`,
            );
        });
        itif(DB() === 'pg')('Generates the enum types for the table', async (): Promise<void> => {
            const enums = schema.tables.users.enums;
            const result = TableTypeBuilder.buildEnumTypes({ enums });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export type permissions = 'ADMIN' | 'USER';
export type subscription_level = 'BRONZE' | 'GOLD' | 'SILVER';
`,
            );
        });
    });
    describe('buildRowType', () => {
        itif(DB() === 'mysql')('Generates the row type for the table', async (): Promise<void> => {
            const columns = schema.tables.users.columns;
            const result = TableTypeBuilder.buildRowType({ table: columns, rowTypeName: 'User' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface User {
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
        itif(DB() === 'pg')('Generates the row type for the table', async (): Promise<void> => {
            const columns = schema.tables.users.columns;
            const result = TableTypeBuilder.buildRowType({ table: columns, rowTypeName: 'User' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface User {
    user_id: number;
    best_friend_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    password: string;
    token: string | null;
    permissions: permissions | null;
    subscription_level: subscription_level | null;
    deleted_at: Date | null;
}
`,
            );
        });
    });
    describe('buildColumnMapType', () => {
        it('Generates a boolean map of the columns', async (): Promise<void> => {
            const columns = schema.tables.users.columns;
            const result = TableTypeBuilder.buildColumnMapType({ columns, columnMapTypeName: 'UserColumnMap' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface UserColumnMap {
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
                whereTypeName: 'UserWhere',
                relationFilterTypeName: 'UserRelationFilter',
            });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface UserRelationFilter {
    existsWhere?: UserWhere;
    notExistsWhere?: UserWhere;
    whereEvery?: UserWhere;
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
            const result = TableTypeBuilder.buildWhereType({ columns, relations, whereTypeName: 'PostWhere' });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface PostWhere {
    post_id?: number | NumberWhere;
    author?: string | StringWhere;
    author_id?: number | NumberWhere;
    co_author?: number | NumberWhereNullable | null;
    message?: string | StringWhere;
    rating_average?: number | NumberWhereNullable | null;
    created?: Date | DateWhereNullable | null;
    deleted?: boolean | BooleanWhereNullable | null;

    AND?: Enumerable<PostWhere>;
    OR?: Enumerable<PostWhere>;
    NOT?: Enumerable<PostWhere>;

    author_relation?: UserRelationFilter | null;
    co_author_relation?: UserRelationFilter | null;
    team_members?: TeamMemberRelationFilter | null;
    teams?: TeamRelationFilter | null;
    users?: UserRelationFilter | null;
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
                loadOneWhereTypeName: 'TeamMemberLoadOneWhere',
            });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface TeamMemberLoadOneWhere {
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
            const result = TableTypeBuilder.buildOrderType({ orderByTypeName: 'PostOrderBy', columns });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export type PostOrderBy = {
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
                paginationTypeName: 'PostPaginate',
                rowTypeName: 'Post',
            });
            const formatted = format(result, { parser: 'typescript', ...prettierDefault });

            expect(formatted).toEqual(
                `export interface PostPaginate {
    limit?: number;
    afterCursor?: Partial<Post>;
    beforeCursor?: Partial<Post>;
    offset?: number;
}
`,
            );
        });
    });
});
