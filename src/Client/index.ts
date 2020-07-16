import Knex = require('knex');
import { attachOnDuplicateUpdate } from './lib/knex.duplicate.key';
import _logger, { buildLogger, LogLevel } from './lib/logging';

attachOnDuplicateUpdate();

//
// INTERNAL USE
//
export { SQLQueryBuilder } from './QueryBuilders/SQLQueryBuilder';
export * from './QueryBuilders/QueryTypes';

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

const initialize = (_knex?: Knex<any, unknown[]>, config?: NodentConfig, connection?: any) => {
    const useConfig = {
        logLevel: LogLevel.info,
        ...config,
    };
    buildLogger(useConfig);

    state.knex = Knex(connection);
    _logger.info('Initialising Nodent with Knex instance');
};

export default {
    initialize,
};
