import { gybson } from '@demoapp/libs/db';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';

export const apollo = (): ApolloServer =>
    new ApolloServer({
        schema,
        context: async () => {
            return {
                gybson: gybson(),
            };
        },
    });
