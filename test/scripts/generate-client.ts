import path from 'path';
import { generate } from 'src/generate';

const outdir = path.join(process.cwd(), 'test/tmp');
// fake lib path for tests
const gybsonLibPath = path.join('../../src/query-client');

const schemaFile = 'test/tmp/relational-schema.ts';

// build a gybson client for testing
generate({ outdir, gybsonLibPath, schemaFile }).catch((e) => console.log(e));
