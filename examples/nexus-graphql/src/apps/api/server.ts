import { logger, requestLogger } from '@demoapp/libs';
import express from 'express';
import { helmet } from 'helmet';
const config = require('./config');
import { apollo } from './graphql/app';

const main = async (): Promise<void> => {
    try {
        const app = express();

        app.use(helmet());
        app.use(requestLogger); // log all server requests

        const graphApp = apollo();
        graphApp.applyMiddleware({ app, path: '/api/graphql' });

        // endpoint for automated uptime checks
        app.get('/api/health_check', (_req, res) => {
            res.sendStatus(200);
        });


        //SERVER
        const port = config.get('port');
        app.listen(port, () => {
            logger.info('API listening on ' + port);
        });
    } catch (err) {
        logger.error('Failed to initialize app: ', err);
        process.exit(1);
    }
};

process.on('uncaughtException', function (err) {
    logger.error(err);
    process.exit(1);
});

main();
