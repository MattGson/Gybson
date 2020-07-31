import { Introspection } from '../../src/Generator/Introspection/IntrospectionTypes';
import { buildMySQLSchema, closeConnection, knex, schemaName } from '../Setup/buildMYSQL';
import { MySQLIntrospection } from '../../src/Generator/Introspection/MySQLIntrospection';
import 'jest-extended';
// @ts-ignore - no types for prettier
import { format } from 'prettier';
import { TableClientBuilder } from '../../src/Generator/TableClientBuilder/TableClientBuilder';
import { codeGenPreferences, prettier } from '../../src/Generator/config';
import { TableSchemaBuilder } from '../../src/Generator/TableClientBuilder/TableSchemaBuilder';

describe('TableClientBuilder', () => {
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
    describe('build smoke tests', () => {
        it('builds the client for a table', async () => {
            const tblSchema = await new TableSchemaBuilder('users', intro).buildTableDefinition();
            const builder = new TableClientBuilder({
                table: 'users',
                schema: tblSchema,
                dbIntrospection: intro,
                options: codeGenPreferences,
            });

            const result = await builder.build();
            const formatted = format(result, { parser: 'typescript', ...prettier });
            expect(formatted).toEqual(
                `import DataLoader = require('dataloader');
import {
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

import { schema } from './schemaRelations';

import { PostsRelationFilter } from './Posts';
import { PostsRelationFilter } from './Posts';
import { TeamMembersRelationFilter } from './TeamMembers';

// Enums
export type users_permissions = 'USER' | 'ADMIN';
export type users_subscription_level = 'BRONZE' | 'SILVER' | 'GOLD';

// Row types
export interface UsersDTO {
    user_id: number;
    best_friend_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    password: string;
    token: string | null;
    permissions: users_permissions | null;
    subscription_level: users_subscription_level | null;
    deleted: boolean | null;
}

export type UsersColumnMap = {
    user_id: boolean;
    best_friend_id: boolean;
    email: boolean;
    first_name: boolean;
    last_name: boolean;
    password: boolean;
    token: boolean;
    permissions: boolean;
    subscription_level: boolean;
    deleted: boolean;
};

export type UsersRelationFilter = {
    existsWhere?: UsersWhere;
    notExistsWhere?: UsersWhere;
    innerJoinWhere?: UsersWhere;
};

// Where types
export type UsersWhere = {
    user_id?: number | NumberWhere;
    best_friend_id?: number | NumberWhereNullable | null;
    email?: string | StringWhere;
    first_name?: string | StringWhereNullable | null;
    last_name?: string | StringWhereNullable | null;
    password?: string | StringWhere;
    token?: string | StringWhereNullable | null;
    permissions?: users_permissions;
    subscription_level?: users_subscription_level;
    deleted?: boolean | BooleanWhereNullable | null;

    AND?: Enumerable<UsersWhere>;
    OR?: Enumerable<UsersWhere>;
    NOT?: Enumerable<UsersWhere>;

    best_friend?: UsersRelationFilter | null;
    posts?: PostsRelationFilter | null;
    posts?: PostsRelationFilter | null;
    team_members?: TeamMembersRelationFilter | null;
    users?: UsersRelationFilter | null;
};

// Order by types
export type UsersOrderBy = {
    user_id?: Order;
    best_friend_id?: Order;
    email?: Order;
    first_name?: Order;
    last_name?: Order;
    password?: Order;
    token?: Order;
    permissions?: Order;
    subscription_level?: Order;
    deleted?: Order;
};

//Pagination types
export type UsersPaginate = {
    limit?: number;
    afterCursor?: Partial<UsersDTO>;
    afterCount?: number;
};

export default class Users extends SQLQueryBuilder<UsersDTO, UsersColumnMap, UsersWhere, UsersOrderBy, UsersPaginate> {
    constructor() {
        super({
            tableName: 'users',
            schema,
            softDeleteColumn: 'deleted',
        });
    }

    private readonly UsersByUserIdLoader = new DataLoader<{ user_id: number }, UsersDTO | null>((keys) => {
        return this.byCompoundColumnLoader({ keys });
    });

    public async byUserId({ user_id, includeDeleted }: { user_id: number; includeDeleted?: boolean }) {
        const row = await this.UsersByUserIdLoader.load({ user_id });
        if (row?.deleted && !includeDeleted) return null;
        return row;
    }

    private readonly UsersByEmailLoader = new DataLoader<{ email: string }, UsersDTO | null>((keys) => {
        return this.byCompoundColumnLoader({ keys });
    });

    public async byEmail({ email, includeDeleted }: { email: string; includeDeleted?: boolean }) {
        const row = await this.UsersByEmailLoader.load({ email });
        if (row?.deleted && !includeDeleted) return null;
        return row;
    }

    private readonly UsersByTokenLoader = new DataLoader<{ token: string }, UsersDTO | null>((keys) => {
        return this.byCompoundColumnLoader({ keys });
    });

    public async byToken({ token, includeDeleted }: { token: string; includeDeleted?: boolean }) {
        const row = await this.UsersByTokenLoader.load({ token });
        if (row?.deleted && !includeDeleted) return null;
        return row;
    }

    private readonly UsersByBestFriendIdLoader = new DataLoader<
        { best_friend_id: number; orderBy: UsersOrderBy | undefined },
        UsersDTO[]
    >(
        (keys) => {
            const [first] = keys;
            keys.map((k) => delete k.orderBy); // remove key so its not included as a load param
            // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
            return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
        },
        {
            // ignore order for cache equivalency TODO - re-assess - will this compare objects properly?
            cacheKeyFn: (k) => ({ ...k, orderBy: {} }),
        },
    );

    public async byBestFriendId({
        best_friend_id,
        orderBy,
    }: {
        best_friend_id: number;
        includeDeleted?: boolean;
        orderBy?: UsersOrderBy;
    }) {
        return this.UsersByBestFriendIdLoader.load({ best_friend_id, orderBy });
    }
}
`,
            );
        });
        it('builds the client for a table', async () => {
            const tblSchema = await new TableSchemaBuilder('team_members_positions', intro).buildTableDefinition();
            const builder = new TableClientBuilder({
                table: 'team_members_positions',
                schema: tblSchema,
                dbIntrospection: intro,
                options: codeGenPreferences,
            });

            const result = await builder.build();
            const formatted = format(result, { parser: 'typescript', ...prettier });
            expect(formatted).toEqual(
                `import DataLoader = require('dataloader');
import {
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

import { schema } from './schemaRelations';

import { TeamMembersRelationFilter } from './TeamMembers';

// Enums

// Row types
export interface TeamMembersPositionsDTO {
    team_id: number;
    user_id: number;
    position: string;
    manager: string;
    deleted: boolean | null;
}

export type TeamMembersPositionsColumnMap = {
    team_id: boolean;
    user_id: boolean;
    position: boolean;
    manager: boolean;
    deleted: boolean;
};

export type TeamMembersPositionsRelationFilter = {
    existsWhere?: TeamMembersPositionsWhere;
    notExistsWhere?: TeamMembersPositionsWhere;
    innerJoinWhere?: TeamMembersPositionsWhere;
};

// Where types
export type TeamMembersPositionsWhere = {
    team_id?: number | NumberWhere;
    user_id?: number | NumberWhere;
    position?: string | StringWhere;
    manager?: string | StringWhere;
    deleted?: boolean | BooleanWhereNullable | null;

    AND?: Enumerable<TeamMembersPositionsWhere>;
    OR?: Enumerable<TeamMembersPositionsWhere>;
    NOT?: Enumerable<TeamMembersPositionsWhere>;

    team_member?: TeamMembersRelationFilter | null;
};

// Order by types
export type TeamMembersPositionsOrderBy = {
    team_id?: Order;
    user_id?: Order;
    position?: Order;
    manager?: Order;
    deleted?: Order;
};

//Pagination types
export type TeamMembersPositionsPaginate = {
    limit?: number;
    afterCursor?: Partial<TeamMembersPositionsDTO>;
    afterCount?: number;
};

export default class TeamMembersPositions extends SQLQueryBuilder<
    TeamMembersPositionsDTO,
    TeamMembersPositionsColumnMap,
    TeamMembersPositionsWhere,
    TeamMembersPositionsOrderBy,
    TeamMembersPositionsPaginate
> {
    constructor() {
        super({
            tableName: 'team_members_positions',
            schema,
            softDeleteColumn: 'deleted',
        });
    }

    private readonly TeamMembersPositionsByTeamIdAndUserIdLoader = new DataLoader<
        { team_id: number; user_id: number },
        TeamMembersPositionsDTO | null
    >((keys) => {
        return this.byCompoundColumnLoader({ keys });
    });

    public async byTeamIdAndUserId({
        team_id,
        user_id,
        includeDeleted,
    }: {
        team_id: number;
        user_id: number;
        includeDeleted?: boolean;
    }) {
        const row = await this.TeamMembersPositionsByTeamIdAndUserIdLoader.load({ team_id, user_id });
        if (row?.deleted && !includeDeleted) return null;
        return row;
    }

    private readonly TeamMembersPositionsByPositionAndManagerLoader = new DataLoader<
        { position: string; manager: string },
        TeamMembersPositionsDTO | null
    >((keys) => {
        return this.byCompoundColumnLoader({ keys });
    });

    public async byPositionAndManager({
        position,
        manager,
        includeDeleted,
    }: {
        position: string;
        manager: string;
        includeDeleted?: boolean;
    }) {
        const row = await this.TeamMembersPositionsByPositionAndManagerLoader.load({ position, manager });
        if (row?.deleted && !includeDeleted) return null;
        return row;
    }

    private readonly TeamMembersPositionsByTeamIdLoader = new DataLoader<
        { team_id: number; orderBy: TeamMembersPositionsOrderBy | undefined },
        TeamMembersPositionsDTO[]
    >(
        (keys) => {
            const [first] = keys;
            keys.map((k) => delete k.orderBy); // remove key so its not included as a load param
            // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
            return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
        },
        {
            // ignore order for cache equivalency TODO - re-assess - will this compare objects properly?
            cacheKeyFn: (k) => ({ ...k, orderBy: {} }),
        },
    );

    public async byTeamId({
        team_id,
        orderBy,
    }: {
        team_id: number;
        includeDeleted?: boolean;
        orderBy?: TeamMembersPositionsOrderBy;
    }) {
        return this.TeamMembersPositionsByTeamIdLoader.load({ team_id, orderBy });
    }

    private readonly TeamMembersPositionsByUserIdLoader = new DataLoader<
        { user_id: number; orderBy: TeamMembersPositionsOrderBy | undefined },
        TeamMembersPositionsDTO[]
    >(
        (keys) => {
            const [first] = keys;
            keys.map((k) => delete k.orderBy); // remove key so its not included as a load param
            // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
            return this.manyByCompoundColumnLoader({ keys, orderBy: first.orderBy });
        },
        {
            // ignore order for cache equivalency TODO - re-assess - will this compare objects properly?
            cacheKeyFn: (k) => ({ ...k, orderBy: {} }),
        },
    );

    public async byUserId({
        user_id,
        orderBy,
    }: {
        user_id: number;
        includeDeleted?: boolean;
        orderBy?: TeamMembersPositionsOrderBy;
    }) {
        return this.TeamMembersPositionsByUserIdLoader.load({ user_id, orderBy });
    }
}
`,
            );
        });
    });
});
