import * as winston from 'winston';
export declare const logger: () => winston.Logger;
export declare enum LogLevel {
    info = "info",
    warn = "warn",
    error = "error",
    debug = "debug"
}
export declare const buildLogger: (config: {
    logLevel: LogLevel;
}) => winston.Logger;
export declare const _logger: winston.Logger;
