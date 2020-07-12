"use strict";
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
    knex: undefined
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
//# sourceMappingURL=index.js.map