#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import path from 'path';
import yargs from 'yargs';
const { hideBin } = require('yargs/helpers');
import { generate } from '../generate/index';
import { LogLevel } from '../types';

type logLevel = LogLevel;
const logLevels: ReadonlyArray<logLevel> = [LogLevel.debug, LogLevel.info];

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command(
        'generate',
        'Generate client from relational-schema',
        (yargs) => {
            yargs
                .options({
                    schemaFile: {
                        type: 'string',
                        description: 'The location of the relations schema file',
                    },
                    outdir: { type: 'string', default: './gen' },
                    prettierConfig: { type: 'string', description: 'Path to a prettierrc file' },
                    logLevel: { choices: logLevels, default: LogLevel.info },
                })
                .global('config')
                .default('config', 'relation-config.json')
                .config('config', 'Configure using a json file')
                .example(
                    '$0 introspect',
                    'generate the schema using a introspect-config.json file in the current directory',
                );
        },
        async (argv) => {
            await generateClient(argv);
        },
    )
    .alias('h', 'help').argv;

async function generateClient(args: any) {
    try {
        // TODO:- options

        const GENERATED_DIR = path.join(process.cwd(), args.outdir);

        await generate({ outdir: GENERATED_DIR, gybsonLibPath: 'gybson', schemaFile: args.schemaFile });
    } catch (e) {
        console.error(e.message);
        console.log('Use: "gybson -h" to see help');
        process.exit(1);
    }
}
