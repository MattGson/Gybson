const { createLogger, format, transports } = require('winston');
const { combine, colorize, printf, splat, errors, simple } = format;
const morgan = require('morgan');
const config = require('../../config/config');

const Console = {
    format: combine(
        format.timestamp(),
        colorize(),
        splat(),
        simple(),
        printf(
            (info: any) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''}`,
        ),
    ),
};

export const logger = createLogger({
    level: config.logLevel,
    format: combine(errors({ stack: true })),
    defaultMeta: {
        service: config.service,
        version: config.version,
    },
    transports: [],
});
logger.add(new transports.Console(Console));
logger.exceptions.handle(new transports.Console(Console));

const stream = {
    write: (text: string) => {
        logger.info(text.trim());
    },
};
export const requestLogger = morgan('combined', { stream });
