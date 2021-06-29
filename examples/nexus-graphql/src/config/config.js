const convict = require('convict');
const db = require('./db.config');
const service = require('./service.config');

const config = convict({
    ...db,
    ...service,
});

config.validate({ allowed: 'strict' });

module.exports = config;
