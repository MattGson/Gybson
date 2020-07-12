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
exports.knex = exports.initialize = void 0;
const knex_duplicate_key_1 = require("./lib/knex.duplicate.key");
knex_duplicate_key_1.attachOnDuplicateUpdate();
global._logger = {
    debug: console.log,
    info: console.log,
    error: console.error,
};
const state = {
    knex: undefined,
};
exports.initialize = (knex) => {
    state.knex = knex;
    _logger.info('Initialising Nodent with Knex instance');
};
exports.knex = () => {
    if (!state.knex)
        throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};
__exportStar(require("./QueryBuilders/Loaders"), exports);
__exportStar(require("./QueryBuilders/Persistors"), exports);
__exportStar(require("./QueryBuilders/Updaters"), exports);
//# sourceMappingURL=index.js.map