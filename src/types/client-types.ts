import { Connection as PGConnection } from 'pg';
import { Connection as MYSQLConnection } from 'promise-mysql';
import { RecordUnknown } from 'src/query-client';

export type Connection = PGConnection | MYSQLConnection;

export enum LogLevel {
    info = 'info',
    warn = 'warn',
    error = 'error',
    debug = 'debug',
    silly = 'silly',
}

interface LeveledLogMethod {
    (message: string): void;
    (message: string, meta: any): void;
    (message: string, ...meta: any[]): void;
    (message: any): void;
    (infoObject: RecordUnknown): void;
}

export type Logger = {
    error: LeveledLogMethod;
    warn: LeveledLogMethod;
    info: LeveledLogMethod;
    debug: LeveledLogMethod;
    silly: LeveledLogMethod;
};

export type ClientEngine = 'pg' | 'mysql';

export interface GybsonConfig {
    logLevel?: LogLevel;
    logger?: Logger;
}
