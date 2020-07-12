"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.LogLevel = void 0;
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = format;
var LogLevel;
(function (LogLevel) {
    LogLevel["info"] = "info";
    LogLevel["warn"] = "warn";
    LogLevel["error"] = "error";
    LogLevel["debug"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.getLogger = (config) => {
    const consoleTransport = {
        format: combine(colorize(), splat(), simple(), printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
    };
    const Winston = createLogger({
        format: combine(errors({ stack: true }), splat(), timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }), json()),
        level: config.logLevel,
        defaultMeta: { service: 'Nodent' },
        transports: [consoleTransport],
    });
    return Winston;
};
//# sourceMappingURL=logging.js.map