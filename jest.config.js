module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: false,

    notify: true,
    notifyMode: 'always',

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',
    // Indicates whether each individual test should be reported during the run
    verbose: true,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],

    setupFilesAfterEnv: ['jest-extended'],

    moduleDirectories: ['node_modules', '<rootDir>/src'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
};
