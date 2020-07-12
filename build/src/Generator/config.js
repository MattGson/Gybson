"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeGenPreferences = exports.mysql = exports.prettier = void 0;
exports.prettier = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
};
exports.mysql = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'komodo',
};
exports.codeGenPreferences = {
    rowTypeSuffix: 'DTO',
};
//# sourceMappingURL=config.js.map