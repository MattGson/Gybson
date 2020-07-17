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
exports.knex = void 0;
const Knex = require("knex");
const knex_duplicate_key_1 = require("./lib/knex.duplicate.key");
const logging_1 = require("./lib/logging");
knex_duplicate_key_1.attachOnDuplicateUpdate();
//
// INTERNAL USE
//
var SQLQueryBuilder_1 = require("./QueryBuilders/SQLQueryBuilder");
Object.defineProperty(exports, "SQLQueryBuilder", { enumerable: true, get: function () { return SQLQueryBuilder_1.SQLQueryBuilder; } });
__exportStar(require("./QueryBuilders/QueryTypes"), exports);
const state = {
    knex: undefined,
};
exports.knex = () => {
    if (!state.knex)
        throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};
const init = (config) => {
    const useConfig = Object.assign({ logLevel: logging_1.LogLevel.info }, config);
    const logger = logging_1.buildLogger(useConfig);
    state.knex = Knex({
        client: config.client,
        connection: config.connection,
    });
    logger.info('Initialising Nodent...');
};
exports.default = {
    init,
};
//# sourceMappingURL=index.js.map