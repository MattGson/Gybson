"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.buildLogger = exports.LogLevel = void 0;
const winston_1 = require("winston");
const { combine, timestamp, colorize, json, printf, splat, errors, simple } = winston_1.format;
let state = {};
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
    state.logger = winston_1.createLogger({
        format: combine(errors({ stack: true }), splat(), timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }), json()),
        level: config.logLevel,
        defaultMeta: { service: 'Nodent' },
        transports: [],
    });
    state.logger.add(new winston_1.transports.Console(console));
    state.logger.exceptions.handle(new winston_1.transports.Console(console));
    return state.logger;
};
exports.logger = () => {
    if (!state.logger)
        throw new Error('Must initialise the logger');
    return state.logger;
};
//# sourceMappingURL=logging.js.map