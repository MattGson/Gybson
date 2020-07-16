import Knex = require('knex');
import { LogLevel } from './lib/logging';
export { QueryBuilder } from './QueryBuilders/QueryBuilder';
export * from './QueryBuilders/QueryTypes';
export declare const knex: () => Knex<any, unknown[]>;
export interface NodentConfig {
    logLevel?: LogLevel;
}
declare const _default: {
    initialize: (knex: Knex<any, unknown[]>, config: NodentConfig) => void;
};
export default _default;
