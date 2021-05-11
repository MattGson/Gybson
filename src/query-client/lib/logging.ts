import { createLogger, format, transports } from 'winston';
import * as winston from 'winston';
import { LogLevel } from '../../types';
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = format;

let state: {
    logger?: winston.Logger;
} = {};

export const buildLogger = (config: { logLevel: LogLevel }): winston.Logger => {
    const console = {
        format: combine(
            colorize(),
            splat(),
            simple(),
            printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
    };

    state.logger = createLogger({
        format: combine(
            errors({ stack: true }),
            splat(),
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            json(),
        ),
        level: config.logLevel,
        defaultMeta: { service: 'Gybson' },
        transports: [],
    });
    state.logger.add(new transports.Console(console));
    state.logger.exceptions.handle(new transports.Console(console));
    return state.logger;
};

export const logger = (): winston.Logger => {
    if (!state.logger) throw new Error('Must initialise the logger');
    return state.logger;
};
