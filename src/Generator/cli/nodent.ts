#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import { usage } from 'yargs';
import path from 'path';
import { generate } from '../index';

type client = 'mysql' | 'postgres';
const clients: ReadonlyArray<client> = ['mysql', 'postgres'];

const args = usage('Usage: $0 <command> [options]')
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
    .alias('h', 'help').argv;


const run = async () => {
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
        const GENERATED_DIR = path.join(CURRENT, outdir);

        await generate(conn, GENERATED_DIR);
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

