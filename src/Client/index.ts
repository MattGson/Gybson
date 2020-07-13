import Knex = require('knex');
import { attachOnDuplicateUpdate } from './lib/knex.duplicate.key';
import _logger, { buildLogger, LogLevel } from './lib/logging';

attachOnDuplicateUpdate();

//
// INTERNAL USE
//
export * from './QueryBuilders/Loaders';
export * from './QueryBuilders/Persistors';
export * from './QueryBuilders/Updaters';

const state: { knex: Knex<any, unknown[]> | undefined } = {
    knex: undefined,
};

export const knex = () => {
    if (!state.knex) throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};

//
// EXTERNAL USE
//
export interface NodentConfig {
    logLevel?: LogLevel;
}

const initialize = (knex: Knex<any, unknown[]>, config: NodentConfig) => {
    const useConfig = {
        logLevel: LogLevel.info,
        ...config,
    };
    buildLogger(useConfig);

    state.knex = knex;
    _logger.info('Initialising Nodent with Knex instance');
};

export default {
    initialize,
};
