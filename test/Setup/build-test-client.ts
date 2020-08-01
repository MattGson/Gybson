import { generate } from '../../src/Generator';
import { connection } from './buildMySQL';
import path from 'path';

const out = path.join(__dirname, '../Gen');
const lib = path.join(__dirname, '../../src/Client');
generate(connection, out, lib).catch((e) => console.log(e));
