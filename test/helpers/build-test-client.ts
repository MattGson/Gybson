import { generate } from 'src/generate';
import { buildDBSchemas, closeConnection } from './build-test-db';
import path from 'path';

const outdir = path.join(process.cwd(), 'test/tmp');
// fake lib path for tests
const gybsonLibPath = path.join('../../src/query-client');

const schemaFile = 'test/tmp/relational-schema.ts';

// build a db and gybson client for testing
// Note:- if you import this file you may get test issues as it executes immediately
buildDBSchemas()
    .then(() => generate({ outdir, gybsonLibPath, schemaFile }))
    .then(() => closeConnection())
    .catch((e) => console.log(e));
