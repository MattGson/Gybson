#! /usr/bin/env node
"use strict";
/**
 * Commandline interface
 * Created by Matt Goodson
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = require("yargs");
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const clients = ['mysql', 'postgres'];
const args = yargs_1.usage('Usage: $0 <command> [options]')
    .options({
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'number', default: 3306 },
    client: { choices: clients, default: clients[0] },
    user: { type: 'string', default: 'root' },
    password: { type: 'string', default: '' },
    database: { type: 'string', default: 'public' },
    outdir: { type: 'string', default: './gen' },
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
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = {
            client: args.client,
            connection: {
                host: args.host,
                port: args.port,
                user: args.user,
                password: args.password,
                database: args.database,
            },
        };
        const outdir = args.outdir;
        const CURRENT = process.cwd();
        const GENERATED_DIR = path_1.default.join(CURRENT, outdir);
        yield index_1.generate(conn, GENERATED_DIR);
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
    }
    catch (e) {
        console.error(e.message);
        console.log('Use: "nodent -h" to see help');
        process.exit(1);
    }
});
run()
    .then(() => {
    process.exit();
})
    .catch((e) => {
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
//# sourceMappingURL=nodent.js.map