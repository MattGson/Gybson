"use strict";
const KnexQueryBuilder = require('knex/lib/query/builder');
const escapeKnexBinding = input => input.replace(/\?/g, '\\?');
exports.attachOnDuplicateUpdate = function attachOnDuplicateUpdate() {
    KnexQueryBuilder.prototype.onDuplicateUpdate = function (...columns) {
        if (this._method !== 'insert') {
            throw new Error('onDuplicateUpdate error: should be used only with insert query.');
        }
        if (columns.length === 0) {
            throw new Error('onDuplicateUpdate error: please specify at least one column name.');
        }
        const { placeholders, bindings } = columns.reduce((result, column) => {
            if (typeof column === 'string') {
                result.placeholders.push(`??=Values(??)`);
                result.bindings.push(column, column);
            }
            else if (column && typeof column === 'object') {
                Object.keys(column).forEach(key => {
                    result.placeholders.push(`??=?`);
                    result.bindings.push(key, column[key]);
                });
            }
            else {
                throw new Error('onDuplicateUpdate error: expected column name to be string or object.');
            }
            return result;
        }, { placeholders: [], bindings: [] });
        return this.client.raw(`${escapeKnexBinding(this.toString())} on duplicate key update ${placeholders.join(', ')}`, bindings);
    };
};
//# sourceMappingURL=knex.duplicate.key.js.map