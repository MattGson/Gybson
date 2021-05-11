import { lowerFirst } from 'lodash';
import { DatabaseSchema } from 'relational-schema';
import { TableClientBuilder } from './table-client-builder';

export interface TableClient {
    code: string;
    entityName: string;
    className: string;
}

/**
 * Build client from database schema for each table
 * @param params
 */
export const buildTableClients = async (params: {
    schema: DatabaseSchema;
    gybsonLibPath: string;
}): Promise<TableClient[]> => {
    const { schema, gybsonLibPath } = params;

    const clients: TableClient[] = [];

    const jobs = Object.entries(schema.tables).map(async ([table, tableSchema]) => {
        const builder = new TableClientBuilder({
            table,
            schema: tableSchema,
            options: { gybsonLibPath },
        });

        clients.push({
            code: await builder.build(),
            className: builder.className,
            entityName: builder.entityName,
        });
    });
    await Promise.all(jobs);

    return clients;
};

/**
 * Build the main client entrypoint
 * @param builders
 * @param outdir
 * @param gybsonLibPath
 */
export function buildClient(params: { tableClients: TableClient[]; gybsonLibPath: string }): { code: string } {
    const { tableClients, gybsonLibPath } = params;
    let index = `import { GybsonBase } from '${gybsonLibPath}';`;
    let clients = ``;
    for (const { entityName, className } of tableClients) {
        index += `import { ${className} } from './${entityName}';`;
        clients += `public readonly ${lowerFirst(entityName)} = new ${className}(this.clientConfig);`;
    }
    for (const { entityName } of tableClients) {
        index += `export * from './${entityName}';`;
    }
    index += `

        export class GybsonClient extends GybsonBase {
            ${clients}
        }
    `;

    return { code: index };
}
