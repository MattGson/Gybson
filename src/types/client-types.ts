import { Connection as PGConnection } from 'pg';
import { Connection as MYSQLConnection } from 'promise-mysql';

export type Connection = PGConnection | MYSQLConnection;

export enum LogLevel {
    info = 'info',
    warn = 'warn',
    error = 'error',
    debug = 'debug',
}

export type ClientEngine = 'pg' | 'mysql';

export interface GybsonConfig {
    logLevel?: LogLevel;
}
