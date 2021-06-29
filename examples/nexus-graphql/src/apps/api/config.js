const convict = require('convict');
require('../config/km.core.config');
const db = require('../config/db.config');
const firebase = require('../config/firebase.config');
const pubsub = require('../config/pubsub.config');
const featureFlags = require('../config/featureflags.config');
const emails = require('../config/email.config');
const storage = require('../config/storage.config');
const service = require('../config/service.config');
const auth = require('../config/auth.config');

const config = convict({
    ...db,
    ...firebase,
    ...pubsub,
    ...featureFlags,
    ...emails,
    ...storage,
    ...service,
    ...auth,
    port: {
        doc: 'HTTP service port number, for external interface.',
        format: 'port',
        default: 3001,
        arg: 'port',
        env: 'API_PORT',
    },
});

config.validate({ allowed: 'strict' });

module.exports = config;
