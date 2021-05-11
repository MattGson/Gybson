import { writeFormattedFile } from './printer';
import { buildClient, TableClient } from './client-builder';

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
    let index = `import { runTransaction } from '${gybsonLibPath}';`;
    let clients = ``;
    for (let { name } of builders) {
        index += `import ${name} from './${name}';`;
        clients += `${name}: new ${name}(),`;
    }
    index += `
        const Gybson = () => {
        return {${clients} runTransaction };
        };
        export default Gybson;
        export type Gybson = ReturnType<typeof Gybson>;
    `;

    await writeFormattedFile({
        content: index,
        directory: outdir,
        filename: 'index.ts',
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
export async function generate(outdir: string, gybsonLibPath: string = 'gybson') {
    const schema: any = {};

    console.log(`Generating client for schema: ${'TODO'}`);

    // const schema = await introspectSchema({ conn });
    const clients = await buildClient({ schema, gybsonLibPath });

    // write code to files
    // await writeTypescriptFile(
    //     `
    //     import { DatabaseSchema } from '${gybsonLibPath}';

    //     export const schema: DatabaseSchema = ${JSON.stringify(schema)}`,
    //     outdir,
    //     `gybson.schema.ts`,
    // );

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

    console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
}
