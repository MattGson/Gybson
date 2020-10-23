import { generate } from '../../src/Generator';
import {buildDBSchemas, closeConnection, mysqlConnection, pgConnection} from './build-test-db';
import path from 'path';

const out = path.join(__dirname, '../Gen');
const lib = path.join('../../src/Client');

// build a db and gybson client for testing
buildDBSchemas()
    .then(() => closeConnection())
    // .then(() => generate(mysqlConnection, out, lib))
    .then(() => generate(pgConnection, out, lib))
    .catch((e) => console.log(e));
