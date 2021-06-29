import { connectionPlugin, declarativeWrappingPlugin } from 'nexus';
const path = require('path');

export const schemaConfig = {
    outputs: {
        schema: path.join(__dirname, 'gen/schema.graphql'),
        typegen: path.join(__dirname, 'gen/typegen.ts'),
    },
    features: {
        abstractTypeStrategies: {
            // auto-resolve interface and union with __typename from models
            __typename: true,
        },
    },

    nonNullDefaults: {
        input: true,
        output: false,
    },
    prettierConfig: {
        semi: true,
        trailingComma: 'all',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 4,
    },
    plugins: [
        // ... other plugins
        connectionPlugin({
            includeNodesField: true,
            nonNullDefaults: {
                input: false,
                output: true,
            },
        }),
        declarativeWrappingPlugin(),
    ],
    sourceTypes: {
        headers: [
            '/* eslint @typescript-eslint/no-unused-vars: 0 */',
            '/* eslint @typescript-eslint/no-empty-interface: 0 */',
            '/* eslint @typescript-eslint/consistent-type-definitions: 0 */',
            '/* eslint @typescript-eslint/array-type: 0 */',
            '/* eslint @typescript-eslint/ban-types: 0 */',
        ],
        modules: [],
    },
    contextType: {
        module: path.join(__dirname, 'context.ts'),
        export: 'RequestContext',
    },
};
