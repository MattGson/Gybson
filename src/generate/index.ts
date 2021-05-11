import { join } from 'path';
import { buildClient, buildTableClients } from './client-builder';
import { writeFormattedFile } from './printer';

/**
 * Generate the client
 * @param conn
 * @param outdir - write files to this dir
 * @param gybsonLibPath - path to the gybson lib. Only configurable to improve testability
 */
export async function generate(args: { outdir: string; schemaFile: string; gybsonLibPath?: string }) {
    const { outdir, gybsonLibPath, schemaFile } = args;

    const schemaFullPath = join(process.cwd(), schemaFile);
    console.log('Loading schema from ', schemaFullPath);

    let schema = require(schemaFullPath);
    if (!schema) throw new Error('Schema not found');

    // // get around different export behaviour of JS, TS schemas
    if (schema.default) {
        schema = schema.default;
    }

    console.log('Generating client in ', outdir);

    const tableClients = await buildTableClients({ schema, gybsonLibPath: gybsonLibPath ?? 'gybson' });
    const client = await buildClient({ tableClients, gybsonLibPath: gybsonLibPath ?? 'gybson' });

    await Promise.all(
        tableClients.map((cl) => {
            writeFormattedFile({
                content: cl.code,
                directory: outdir,
                filename: cl.entityName,
            });
        }),
    );

    await writeFormattedFile({
        content: client.code,
        directory: outdir,
        filename: 'index',
    });

    // await generateEntryPoint(clients, outdir, gybsonLibPath);

    console.log(`Generated for ${Object.keys(schema.tables).length} tables`);
}
