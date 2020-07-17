import { createLogger, format, transports } from 'winston';
import * as winston from "winston";
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = format;

let logger: winston.Logger;

export interface Logger {
    debug(...params: any): void;
    info(...params: any): void;
    error(...params: any): void;
    warn(...params: any): void;
}

export enum LogLevel {
    info = 'info',
    warn = 'warn',
    error = 'error',
    debug = 'debug',
}

export const buildLogger = (config: { logLevel: LogLevel }): winston.Logger => {
    const console = {
        format: combine(
            colorize(),
            splat(),
            simple(),
            printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
    };

    logger = createLogger({
        format: combine(
            errors({ stack: true }),
            splat(),
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            json(),
        ),
        level: config.logLevel,
        defaultMeta: { service: 'Nodent' },
        transports: [],
    });
    logger.add(new transports.Console(console));
    logger.exceptions.handle(new transports.Console(console));
    return logger;
};

// @ts-ignore
export default logger;
