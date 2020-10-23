import { generate } from '../../src/Generator';
import { buildDBSchemas, closeConnection, mysqlConnection, pgConnection } from './build-test-db';
import path from 'path';

const out = path.join(__dirname, '../Gen');
const lib = path.join('../../src/Client');

// build a db and gybson client for testing
buildDBSchemas()
    .then((connection) => generate(connection, out, lib))
    .then(() => closeConnection())
    .catch((e) => console.log(e));
