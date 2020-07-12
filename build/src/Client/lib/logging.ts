const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = format;

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

export const getLogger = (config: { logLevel: LogLevel }): Logger => {
    const consoleTransport = {
        format: combine(
            colorize(),
            splat(),
            simple(),
            printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
    };

    const Winston = createLogger({
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
        transports: [consoleTransport],
    });

    return Winston;
};
