#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import { usage } from 'yargs';
import path from 'path';
import { generate } from '../index';

const args = usage('Usage: $0 <command> [options]')
    .options({
        conn: { type: 'string' },
        outdir: { type: 'string' },
    })
    .global('config')
    .default('config', 'nodent-config.json')
    .config('config', 'Configure using a json file')
    .command('generate', 'Generate database client')
    .example('$0 generate', 'generate the client using a nodent-config.json file in the current directory') //     .demand('o')
    // .nargs('o', 1)
    // .alias('o', 'output')
    // .describe('o', 'output file relative path')
    .alias('h', 'help').argv;

// let argv: SchematsConfig = yargs
//     .usage('Usage: $0 <command> [options]')
//     .global('config')
//     .default('config', 'schemats.json')
//     .config()
//     .env('SCHEMATS')
//     .command('generate', 'generate type definition')
//     .demand(1)
//     // tslint:disable-next-line
//     .example('$0 generate -c postgres://username:password@localhost/db -t table1 -t table2 -s schema -o interface_output.ts', 'generate typescript interfaces from schema')
//     .demand('c')
//     .alias('c', 'conn')
//     .nargs('c', 1)
//     .describe('c', 'database connection string')
//     .alias('t', 'table')
//     .nargs('t', 1)
//     .describe('t', 'table name')
//     .alias('s', 'schema')
//     .nargs('s', 1)
//     .describe('s', 'schema name')
//     .alias('C', 'camelCase')
//     .describe('C', 'Camel-case columns')
//     .describe('noHeader', 'Do not write header')
//     .demand('o')
//     .nargs('o', 1)
//     .alias('o', 'output')
//     .describe('o', 'output file name')
//     .help('h')
//     .alias('h', 'help')
//     .argv;

const run = async () => {
    try {
        const conn = args.conn;
        const outdir = args.outdir;

        if (!conn) throw new Error('Must include a database connection in config');
        if (!outdir) throw new Error('Must include an output directory');

        const CURRENT = process.cwd();
        const GENERATED_DIR = path.join(CURRENT, outdir);

        await generate(conn, GENERATED_DIR);

        // if (!Array.isArray(argv.table)) {
        //     if (!argv.table) {
        //         argv.table = [];
        //     } else {
        //         argv.table = [argv.table];
        //     }
        // }
        //
        // let formattedOutput = await typescriptOfSchema(argv.conn, argv.table, argv.schema, {
        //     camelCase: argv.camelCase,
        //     writeHeader: !argv.noHeader,
        // });
        // fs.writeFileSync(argv.output, formattedOutput);
    } catch (e) {
        console.error(e.message);
        console.log('Use: "nodent -h" to see help');
        process.exit(1);
    }
};

run()
    .then(() => {
        process.exit();
    })
    .catch((e: any) => {
        console.warn(e.message);
        console.log('Use: "nodent -h" to see help');
        process.exit(1);
    });

//generateTypes()
//     .then(() => generateLoaders())
//     .then((tables) => {
//         console.log(`Client generated for ${tables.length} tables.`);
//         return knex.destroy();
//     })
//     .catch((e) => {
//         console.error('Could not gen client', e);
//         process.exit(1);
//     })
//     .finally(() => {
//         process.exit();
//     });
