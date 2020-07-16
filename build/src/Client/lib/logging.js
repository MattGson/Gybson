"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLogger = exports.LogLevel = void 0;
const winston_1 = require("winston");
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = winston_1.format;
let logger;
var LogLevel;
(function (LogLevel) {
    LogLevel["info"] = "info";
    LogLevel["warn"] = "warn";
    LogLevel["error"] = "error";
    LogLevel["debug"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.buildLogger = (config) => {
    const console = {
        format: combine(colorize(), splat(), simple(), printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
    };
    logger = winston_1.createLogger({
        format: combine(errors({ stack: true }), splat(), timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }), json()),
        level: config.logLevel,
        defaultMeta: { service: 'Nodent' },
        transports: [],
    });
    logger.add(new winston_1.transports.Console(console));
    logger.exceptions.handle(new winston_1.transports.Console(console));
};
// @ts-ignore
exports.default = logger;
//# sourceMappingURL=logging.js.map