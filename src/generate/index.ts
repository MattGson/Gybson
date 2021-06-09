import { join } from 'path';
import { LogLevel } from '../types';
import {buildClient, buildEntryPoint, buildTableClients, buildTypesEntrypoint} from './client-builder';
import { logger } from './logger';
import { writeFormattedFile } from './printer';

/**
 * Generate the client
 * @param args
 */
export async function generate(args: {
    outdir: string;
    schemaFile: string;
    gybsonLibPath?: string;
    prettierConfig?: string;
    logLevel?: LogLevel;
}): Promise<void> {
    const { outdir, gybsonLibPath, schemaFile } = args;

    const GENERATED_DIR = join(process.cwd(), outdir);
    const schemaFullPath = join(process.cwd(), schemaFile);

    if (!schemaFullPath.endsWith('.js')) {
        throw new Error(
            'Invalid schema file: Gybson currently only supports the CommonJS output format for relational-schema files.',
        );
    }
    logger.info('Loading schema from ', schemaFullPath);

    let schema = require(schemaFullPath);
    if (!schema) throw new Error('Schema not found');

    // // get around different export behaviour of module formats
    if (schema.default) {
        schema = schema.default;
    }

    logger.info('Generating client in ', GENERATED_DIR);

    const tableClients = await buildTableClients({ schema, gybsonLibPath: gybsonLibPath ?? 'gybson' });
    const types = await buildTypesEntrypoint({ tableClients });
    const client = await buildClient({ tableClients, gybsonLibPath: gybsonLibPath ?? 'gybson' });
    const index = await buildEntryPoint();

    await Promise.all(
        tableClients.map((cl) => {
            writeFormattedFile({
                content: cl.code,
                directory: GENERATED_DIR,
                filename: cl.entityName,
            });
        }),
    );

    await writeFormattedFile({
        content: types.code,
        directory: GENERATED_DIR,
        filename: 'gybson.types',
    });
    await writeFormattedFile({
        content: client.code,
        directory: GENERATED_DIR,
        filename: 'gybson.client',
    });
    await writeFormattedFile({
        content: index.code,
        directory: GENERATED_DIR,
        filename: 'index',
    });

    logger.info(`Generated for ${Object.keys(schema.tables).length} tables`);
}
