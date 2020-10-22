import { generate } from '../../src/Generator';
import { buildDBSchemas, closeConnection, mysqlConnection } from './buildMySQL';
import path from 'path';

const out = path.join(__dirname, '../Gen');
const lib = path.join('../../src/Client');

// build a db and gybson client for testing
buildDBSchemas()
    .then(() => closeConnection())
    .then(() => generate(mysqlConnection, out, lib))
    .catch((e) => console.log(e));
