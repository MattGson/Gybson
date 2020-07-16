import { BooleanWhere, BooleanWhereNullable, DateWhere, Enumerable, NumberWhere, NumberWhereNullable, Order, SQLQueryBuilder, StringWhere, StringWhereNullable } from '../Client';
import { users } from './db-schema';
export declare type UsersDTO = users;
export declare type UsersColumn = Extract<keyof UsersDTO, string>;
export declare type UsersValue = Extract<UsersDTO[UsersColumn], string | number>;
export declare type UsersWhere = {
    user_id?: number | NumberWhere;
    email?: string | StringWhereNullable | null;
    fname?: string | StringWhere;
    lname?: string | StringWhere;
    image_uri?: string | StringWhereNullable | null;
    timezone?: string | StringWhereNullable | null;
    hash?: string | StringWhere;
    token?: string | StringWhereNullable | null;
    force_reauth?: boolean | BooleanWhereNullable | null;
    password_reset_token?: string | StringWhereNullable | null;
    created_at?: Date | DateWhere;
    deleted?: boolean | BooleanWhereNullable | null;
    email_verified?: boolean | BooleanWhere;
    email_verification_token_id?: number | NumberWhereNullable | null;
    AND?: Enumerable<UsersWhere>;
    OR?: Enumerable<UsersWhere>;
    NOT?: Enumerable<UsersWhere>;
};
export declare type UsersOrderBy = {
    user_id?: Order;
    email?: Order;
    fname?: Order;
    lname?: Order;
    image_uri?: Order;
    timezone?: Order;
    hash?: Order;
    token?: Order;
    force_reauth?: Order;
    password_reset_token?: Order;
    created_at?: Order;
    deleted?: Order;
    email_verified?: Order;
    email_verification_token_id?: Order;
};
export default class Users extends SQLQueryBuilder<UsersDTO, UsersColumn, UsersValue, UsersWhere, UsersOrderBy> {
    constructor();
    private readonly UsersByUserIdLoader;
    byUserId(user_id: number, includeDeleted?: boolean): Promise<users | null>;
    private readonly UsersByEmailLoader;
    byEmail(email: string): Promise<users[]>;
    private readonly UsersByEmailVerificationTokenIdLoader;
    byEmailVerificationTokenId(email_verification_token_id: number): Promise<users[]>;
}
