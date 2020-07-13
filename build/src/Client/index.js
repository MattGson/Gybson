"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knex = void 0;
const knex_duplicate_key_1 = require("./lib/knex.duplicate.key");
const logging_1 = __importStar(require("./lib/logging"));
knex_duplicate_key_1.attachOnDuplicateUpdate();
//
// INTERNAL USE
//
// export  from './QueryBuilders/QueryBuilder;
var QueryBuilder_1 = require("./QueryBuilders/QueryBuilder");
Object.defineProperty(exports, "QueryBuilder", { enumerable: true, get: function () { return QueryBuilder_1.QueryBuilder; } });
const state = {
    knex: undefined,
};
exports.knex = () => {
    if (!state.knex)
        throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};
const initialize = (knex, config) => {
    const useConfig = Object.assign({ logLevel: logging_1.LogLevel.info }, config);
    logging_1.buildLogger(useConfig);
    state.knex = knex;
    logging_1.default.info('Initialising Nodent with Knex instance');
};
exports.default = {
    initialize,
};
//# sourceMappingURL=index.js.map