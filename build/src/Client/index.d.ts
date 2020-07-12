import Knex = require('knex');
import { Logger, LogLevel } from '../../build/src/Client/lib/logging';
export * from './QueryBuilders/Loaders';
export * from './QueryBuilders/Persistors';
export * from './QueryBuilders/Updaters';
export declare const knex: () => Knex<any, unknown[]>;
export declare const logger: () => Logger;
interface NodentConfig {
    logLevel?: LogLevel;
}
declare const _default: {
    initialize: (knex: Knex<any, unknown[]>, config: NodentConfig) => void;
};
export default _default;
