import { DatabaseSchema } from '../../TypeTruth/TypeTruth';
import { TableClientBuilder } from './TableClientBuilder';
import { codeGenPreferences } from '../config';

export interface TableClient {
    code: string;
    name: string;
}

/**
 * Build client from database schema
 * @param params
 */
export const buildClient = async (params: {
    schema: DatabaseSchema;
    gybsonLibPath: string;
}): Promise<TableClient[]> => {
    const { schema, gybsonLibPath } = params;

    const clients: TableClient[] = [];

    const jobs = Object.entries(schema).map(async ([table, tableSchema]) => {
        const builder = new TableClientBuilder({
            table,
            schema: tableSchema,
            options: { ...codeGenPreferences, gybsonLibPath },
        });

        clients.push({
            code: await builder.build(),
            name: builder.className,
        });
    });
    await Promise.all(jobs);
    return clients;
};
