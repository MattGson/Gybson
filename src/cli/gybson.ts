#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import yargs from 'yargs';
import { generate } from '../generate/index';
import { logger } from '../generate/logger';
const { hideBin } = require('yargs/helpers');

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command(
        'generate',
        'Generate client from a relational-schema.js file',
        (yargs) => {
            yargs
                .options({
                    schemaFile: {
                        type: 'string',
                        description: 'The location of the relations schema file',
                        demandOption: true,
                    },
                    outdir: {
                        type: 'string',
                        default: './gen',
                        description: 'The directory to generate the client code in',
                    },
                    prettierConfig: { type: 'string', description: 'Path to a prettierrc file' },
                })
                .global('config')
                .default('config', 'gybson.json')
                .config('config', 'Configure using a json file')
                .example('$0 generate', 'generate the client using a gybson.json file in the current directory');
        },
        async (argv) => {
            await generateClient(argv);
        },
    )
    .alias('h', 'help').argv;

async function generateClient(args: any) {
    try {
        const { schemaFile, outdir, prettierConfig } = args;

        await generate({ outdir, gybsonLibPath: 'gybson', schemaFile, prettierConfig });
    } catch (e) {
        logger.error(e.message);
        logger.info('Use: "gybson -h" to see help');
        process.exit(1);
    }
}
