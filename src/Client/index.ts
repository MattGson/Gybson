import Knex = require('knex');
import { attachOnDuplicateUpdate } from './lib/knex.duplicate.key';
attachOnDuplicateUpdate();

global._logger = {
    debug: console.log,
    info: console.log,
    error: console.error,
};
const state: { knex: Knex<any, unknown[]> | undefined } = {
    knex: undefined
};

export const initialize = (knex: Knex) => {
    state.knex = knex;
    _logger.info('Initialising Nodent with Knex instance');
};

export const knex = () => {
    if (!state.knex) throw new Error('Nodent must be configured with a knex instance');
    return state.knex;
};
