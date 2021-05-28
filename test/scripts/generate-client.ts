import { generate } from 'src/generate';

const outdir = 'test/tmp';
// fake lib path for tests
const gybsonLibPath = '../../src/query-client';

const schemaFile = 'test/tmp/relational-schema.js';

// build a gybson client for testing
generate({ outdir, gybsonLibPath, schemaFile }).catch((e) => console.log(e));
