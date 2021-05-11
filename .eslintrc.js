module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    env: {
        jest: true,
        node: true,
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-empty-function': 'warn',

        'prefer-const': 'warn',
    },
    ignorePatterns: ['src/cube-server/schema/**/*.js'],
    globals: {
        _logger: 'readonly',
    },
    overrides: [
        {
            files: ['*.js', '*.jsx', '*.ts'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                '@typescript-eslint/camelcase': 'off',
            },
        },
    ],
};
