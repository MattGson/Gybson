const KnexQueryBuilder = require('knex/lib/query/builder');

const escapeKnexBinding = (input) => input.replace(/\?/g, '\\?');

exports.attachOnConflictUpdate = function attachOnConflictUpdate() {
    KnexQueryBuilder.prototype.onConflictUpdate = function (conflictKeys, ...columns) {
        if (this._method !== 'insert') {
            throw new Error('on conflict error: should be used only with insert query.');
        }

        if (conflictKeys.length === 0) {
            throw new Error('on conflict  error: please specify at least one conflict key name.');
        }
        if (columns.length === 0) {
            throw new Error('on conflict  error: please specify at least one column name to update.');
        }

        const { placeholders, bindings } = columns.reduce(
            (result, column) => {
                if (typeof column === 'string') {
                    result.placeholders.push(`??=excluded.??`);
                    result.bindings.push(column, column);
                } else {
                    throw new Error('on conflict error: expected column name to be string.');
                }

                return result;
            },
            { placeholders: [], bindings: [...conflictKeys] },
        );

        bindings.push(conflictKeys);

        return this.client.raw(
            `${escapeKnexBinding(this.toString())} on conflict (??) do update set ${placeholders.join(
                ', ',
            )} returning ??`,
            bindings,
        );
    };
};
