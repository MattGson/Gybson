import { generate } from '../../src/Generator';
import { buildMySQLSchema, closeConnection, connection } from './buildMySQL';
import path from 'path';

const out = path.join(__dirname, '../Gen');
const lib = path.join(__dirname, '../../src/Client');

// build a db and gybson client for testing
buildMySQLSchema()
    .then(() => closeConnection())
    .then(() => generate(connection, out, lib))
    .catch((e) => console.log(e));
