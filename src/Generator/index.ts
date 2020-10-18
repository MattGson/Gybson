import { Connection, introspectSchema } from './Introspection';
import { writeTypescriptFile } from './lib';
import { buildClient, TableClient } from './TableClientBuilder';

// **************************
// generate client libs
// **************************

/**
 * Build an entry point file (index.ts)
 * @param builders
 * @param outdir
 */
async function generateEntryPoint(builders: TableClient[], outdir: string) {
    let index = ``;
    let clients = ``;
    for (let { name } of builders) {
        index += `import ${name} from './${name}';`;
        clients += `${name}: new ${name}(),`;
    }
    index += `
        const Gybson = () => {
        return {${clients}};
        };
        export default Gybson;
        export type Gybson = ReturnType<typeof Gybson>;
    `;

    await writeTypescriptFile(index, outdir, 'index.ts');
}

// /**
//  * Generate the db clients for each table
//  * @param db
//  * @param outdir
//  * @param libDir - relative location of the Gybson client lib
//  */
// async function generateClients(db: Introspection, outdir: string, libDir?: string): Promise<string[]> {
//     const builders: TableClientBuilder[] = [];
//     const tables = await db.getSchemaTables();
//
//     const schema: DatabaseSchema = {};
//
//     // for (let table of tables) {
//     //     //     Only keys seem to be missing right now.
//     //     const tblSchema = await new TableSchemaBuilder(table, db).buildTableDefinition();
//     //     const builder = new TableClientBuilder({
//     //         table,
//     //         schema: tblSchema,
//     //         dbIntrospection: db,
//     //         options: { ...codeGenPreferences, gybsonLibPath: libDir || 'gybson' },
//     //     });
//     //     schema[table] = tblSchema;
//     //     builders.push(builder);
//     //     await writeTypescriptFile(await builder.build(), outdir, `${builder.className}.ts`);
//     // }
//     // ADD relation map
//     await writeTypescriptFile(
//     //     `
//     //     import { DatabaseSchema } from '${libDir}';
//     //
//     //     export const schema: DatabaseSchema = ${JSON.stringify(schema)}`,
//     //     outdir,
//     //     `gybson.schema.ts`,
//     // );
//
//     // BUILD ENTRY POINT
//     await generateEntryPoint(builders, outdir);
//
//     return tables;
// }

// ****************************
// Entry point
// ****************************

/**
 *
 * @param conn
 * @param outdir - write files to this dir
 * @param gybsonLibPath - path to the gybson lib. Only configurable to improve testability
 */
export async function generate(conn: Connection, outdir: string, gybsonLibPath: string = 'gybson') {
    console.log(`Generating client for schema: ${conn.connection.database}`);

    const schema = await introspectSchema({ conn });
    const clients = await buildClient({ schema, gybsonLibPath });

    // write code to files
    await writeTypescriptFile(
        `
        import { DatabaseSchema } from '${gybsonLibPath}';

        export const schema: DatabaseSchema = ${JSON.stringify(schema)}`,
        outdir,
        `gybson.schema.ts`,
    );

    await Promise.all(
        clients.map((cl) => {
            writeTypescriptFile(cl.code, outdir, `${cl.name}.ts`);
        }),
    );
    await generateEntryPoint(clients, outdir);

    console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
}
