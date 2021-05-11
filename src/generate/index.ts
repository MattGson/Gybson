import { writeFormattedFile } from './printer';
import { buildClient, TableClient } from './client-builder';
import { join } from 'path';

// **************************
// generate client libs
// **************************

/**
 * Build an entry point file (index.ts)
 * @param builders
 * @param outdir
 * @param gybsonLibPath- path to the gybson lib. Only configurable to improve testability
 */
async function generateEntryPoint(builders: TableClient[], outdir: string, gybsonLibPath: string = 'gybson') {
    let index = `import { GybsonBase } from '${gybsonLibPath}';`;
    let clients = ``;
    for (let { name } of builders) {
        index += `import ${name} from './${name}';`;
        clients += `public readonly ${name} = new ${name}(this.clientConfig);`;
    }
    for (let { name } of builders) {
        index += `export * from './${name}';`;
    }
    index += `

        export class GybsonClient extends GybsonBase {
            ${clients}
        }
    `;

    await writeFormattedFile({
        content: index,
        directory: outdir,
        filename: 'index',
    });
}

// ****************************
// Entry point
// ****************************

/**
 *
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

    // const schema = await introspectSchema({ conn });
    const clients = await buildClient({ schema, gybsonLibPath: gybsonLibPath ?? 'gybson' });
    await Promise.all(
        clients.map((cl) => {
            writeFormattedFile({
                content: cl.code,
                directory: outdir,
                filename: cl.name,
            });
        }),
    );
    await generateEntryPoint(clients, outdir, gybsonLibPath);

    console.log(`Generated for ${Object.keys(schema.tables).length} tables`);
}
