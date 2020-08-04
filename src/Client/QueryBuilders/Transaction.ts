import { knex } from '../index';
import { Transaction } from 'knex';

/**
 * Run a function as a transaction
 * This is a thin wrapper around knex transaction
 * @param fn
 */
export const transaction = async <T>(fn: (transactor: Transaction) => T): Promise<T> => {
    return await knex().transaction(async (trx) => {
        return fn(trx);
    });
};
