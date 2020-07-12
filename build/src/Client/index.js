"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.knex = void 0;
const knex_duplicate_key_1 = require("./lib/knex.duplicate.key");
const logging_1 = require("./lib/logging");
knex_duplicate_key_1.attachOnDuplicateUpdate();
//
// INTERNAL USE
//
__exportStar(require("./QueryBuilders/Loaders"), exports);
__exportStar(require("./QueryBuilders/Persistors"), exports);
__exportStar(require("./QueryBuilders/Updaters"), exports);
const state = {
    knex: undefined,
    logger: undefined,
};
exports.knex = () => {
    if (!state.knex)
        throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};
exports.logger = () => {
    if (!state.logger)
        throw new Error('Nodent must be configured with a log level');
    return state.logger;
};
const initialize = (knex, config) => {
    const useConfig = Object.assign({ logLevel: logging_1.LogLevel.info }, config);
    state.knex = knex;
    state.logger = logging_1.getLogger(useConfig);
    state.logger.info('Initialising Nodent with Knex instance');
};
exports.default = {
    initialize,
};
//# sourceMappingURL=index.js.map