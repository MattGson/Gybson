/// <reference types="node" />
import Knex = require('knex');
import { LogLevel } from './lib/logging';
import { ConnectionOptions } from 'tls';
export { SQLQueryBuilder } from './QueryBuilders/SQLQueryBuilder';
export * from './QueryBuilders/QueryTypes';
export declare const knex: () => Knex<any, unknown[]>;
export { LogLevel } from './lib/logging';
export interface NodentConfig {
    logLevel?: LogLevel;
}
export interface MYSQLConnection {
    host?: string;
    port?: number;
    localAddress?: string;
    socketPath?: string;
    user?: string;
    password?: string;
    database?: string;
    charset?: string;
    timezone?: string;
    connectTimeout?: number;
    stringifyObjects?: boolean;
    insecureAuth?: boolean;
    typeCast?: any;
    queryFormat?: (query: string, values: any) => string;
    supportBigNumbers?: boolean;
    bigNumberStrings?: boolean;
    dateStrings?: boolean;
    debug?: boolean;
    trace?: boolean;
    multipleStatements?: boolean;
    flags?: string;
    ssl?: string;
    decimalNumbers?: boolean;
}
export interface PostgresConnection {
    user?: string;
    database?: string;
    password?: string;
    port?: number;
    host?: string;
    connectionString?: string;
    keepAlive?: boolean;
    statement_timeout?: false | number;
    connectionTimeoutMillis?: number;
    keepAliveInitialDelayMillis?: number;
    ssl?: boolean | ConnectionOptions;
}
declare const _default: {
    init: (config: {
        client: "mysql" | "postgres";
        connection?: MYSQLConnection | PostgresConnection | undefined;
        config?: NodentConfig | undefined;
    }) => void;
};
export default _default;
