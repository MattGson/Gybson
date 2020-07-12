import Knex = require('knex');
export declare const initialize: (knex: Knex) => void;
export declare const knex: () => Knex<any, unknown[]>;
export * from './QueryBuilders/Loaders';
export * from './QueryBuilders/Persistors';
export * from './QueryBuilders/Updaters';
