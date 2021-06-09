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
 * @param params
 */
export function buildClient(params: { tableClients: TableClient[]; gybsonLibPath: string }): { code: string } {
    const { tableClients, gybsonLibPath } = params;
    let index = `import { GybsonBase } from '${gybsonLibPath}';`;
    let clients = ``;
    for (const { entityName, className } of tableClients) {
        index += `import { ${className} } from './${entityName}';`;
        clients += `public get ${lowerFirst(entityName)}(): ${className} { 
                        // lazy instantiation
                        let client = this.clients.get('${entityName}');
                        if (client) return client;
                        client = new ${className}(this.clientConfig);
                        this.clients.set('${entityName}', client);
                        return client;
                     }
                    `;
    }
    index += `

        export class GybsonClient extends GybsonBase {
            private clients: Map<string, any> = new Map();
            ${clients}
        }
    `;

    return { code: index };
}

/**
 * Build the main client entrypoint
 * @param params
 */
export function buildTypesEntrypoint(params: { tableClients: TableClient[] }): { code: string } {
    const { tableClients } = params;
    let index = ``;
    for (const { entityName } of tableClients) {
        index += `export * from './${entityName}';`;
    }
    return { code: index };
}

/**
 * Build the main client entrypoint
 */
export function buildEntryPoint() {
    return {
        code: `
        // namespaced exports can be useful to avoid naming collisions
        export * as Gybson from './gybson.types';
        export {
            GybsonClient,
        } from './gybson.client';
    `,
    };
}
