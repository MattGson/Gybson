import * as winston from "winston";
declare let logger: winston.Logger;
export interface Logger {
    debug(...params: any): void;
    info(...params: any): void;
    error(...params: any): void;
    warn(...params: any): void;
}
export declare enum LogLevel {
    info = "info",
    warn = "warn",
    error = "error",
    debug = "debug"
}
export declare const buildLogger: (config: {
    logLevel: LogLevel;
}) => void;
export default logger;
