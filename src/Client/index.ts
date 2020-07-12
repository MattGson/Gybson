import Knex = require('knex');
import { attachOnDuplicateUpdate } from './lib/knex.duplicate.key';
import { getLogger, Logger, LogLevel } from '../../build/src/Client/lib/logging';

attachOnDuplicateUpdate();

//
// INTERNAL USE
//
export * from './QueryBuilders/Loaders';
export * from './QueryBuilders/Persistors';
export * from './QueryBuilders/Updaters';

const state: { knex: Knex<any, unknown[]> | undefined; logger: Logger | undefined } = {
    knex: undefined,
    logger: undefined,
};

export const knex = () => {
    if (!state.knex) throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};

export const logger = () => {
    if (!state.logger) throw new Error('Nodent must be configured with a log level');
    return state.logger;
};

//
// EXTERNAL USE
//
interface NodentConfig {
    logLevel?: LogLevel;
}

const initialize = (knex: Knex<any, unknown[]>, config: NodentConfig) => {
    const useConfig = {
        logLevel: LogLevel.info,
        ...config,
    };

    state.knex = knex;
    state.logger = getLogger(useConfig);
    state.logger.info('Initialising Nodent with Knex instance');
};

export default {
    initialize,
};
