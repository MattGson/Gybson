"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLogger = exports.LogLevel = void 0;
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = format;
let logger;
var LogLevel;
(function (LogLevel) {
    LogLevel["info"] = "info";
    LogLevel["warn"] = "warn";
    LogLevel["error"] = "error";
    LogLevel["debug"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.buildLogger = (config) => {
    const consoleTransport = {
        format: combine(colorize(), splat(), simple(), printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
    };
    logger = createLogger({
        format: combine(errors({ stack: true }), splat(), timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }), json()),
        level: config.logLevel,
        defaultMeta: { service: 'Nodent' },
        transports: [new transports.Console(consoleTransport)],
    });
};
// @ts-ignore
exports.default = {
    info: console.log,
    debug: console.log,
    warn: console.log,
    error: console.log,
};
//# sourceMappingURL=logging.js.map