module.exports = {
    env: {
        format: ['production', 'development', 'testing', 'test'],
        default: 'development',
        arg: 'node-env',
        env: 'NODE_ENV',
    },
    logging: {
        logLevel: {
            doc: 'Service logger level. Info is standard.',
            format: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
            default: 'debug',
            arg: 'log-level',
            env: 'LOG_LEVEL',
        },
    },
};
