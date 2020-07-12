import { QueryBuilder as KnexQB } from 'knex';

declare module 'knex' {
    interface QueryBuilder {
        onDuplicateUpdate(...columnNames: ({ [key: string]: string } | string)[]): KnexQB;
    }
}

export function attachOnDuplicateUpdate(): void;
