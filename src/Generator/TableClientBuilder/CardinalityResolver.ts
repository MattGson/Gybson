import { KeyDefinition } from '../Introspection/IntrospectionTypes';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * Get the primary key from a tables keys
     * @param allKeys in the table
     */
    public static primaryKey(allKeys: KeyDefinition[]): KeyDefinition[] {
        return allKeys.filter((k) => k.constraintName === 'PRIMARY');
    }

    /**
     * Get the columns part of unique constraints from a tables keys
     * @param allKeys in the table
     */
    public static uniqueColumns(allKeys: KeyDefinition[]): KeyDefinition[] {
        return allKeys.filter((k) => k.constraintType === 'UNIQUE');
    }

    /**
     * Returns a minimal list of key combinations that uniquely define a single row - PK and unique constraints
     * @param allKeys
     */
    public static getUniqueKeyCombinations(allKeys: KeyDefinition[]): KeyDefinition[][] {
        let keys = [this.primaryKey(allKeys)];
        // support compound unique constraints
        const unique = _.groupBy(this.uniqueColumns(allKeys), (k) => k.constraintName);
        return [...keys, ...Object.values(unique)];
    }

    /**
     * Returns the list of key combinations that DO NOT uniquely define a single row
     * // TODO:- interleave compound unique keys
     * // TODO:- combos of compound foreign keys with more than 2 parts
     * @param allKeys
     */
    public static getNonUniqueKeyCombinations(allKeys: KeyDefinition[]): KeyDefinition[][] {
        // get primary and unique keys to check against
        const primaryKeys = this.primaryKey(allKeys);
        const primaryMap = _.keyBy(primaryKeys, (k) => k.columnName);

        // non-compound unique keys
        const uniqueKeys = this.getUniqueKeyCombinations(allKeys);
        const singleUniqueKeys = _.flatten(uniqueKeys.filter((cols) => cols.length === 1));
        const singleUniqueKeyMap = _.keyBy(singleUniqueKeys, (k) => k.columnName);

        // get non unique individual key columns (not PRIMARY, not UNIQUE)
        const nonUniqueSingleKeys = _.uniqBy(
            allKeys.filter((key) => {
                // is part of primary key so not unique
                if (primaryMap[key.columnName]) return false;

                // is a single unique constraint
                if (singleUniqueKeyMap[key.columnName]) return false;

                return true;
            }),
            (k) => k.columnName,
        );

        // combinations with a single key
        let keyCombinations = nonUniqueSingleKeys.map((k) => [k]);

        // table has a single primary key column
        if (primaryKeys.length < 2) return nonUniqueSingleKeys.map((k) => [k]);

        // has a multi-part primary key
        if (primaryKeys.length === 2) {
            // work out combos for 2 part PK
            const [a, b] = primaryKeys;
            keyCombinations.push([a], [b]);
            for (let key of nonUniqueSingleKeys) {
                keyCombinations.push([a, key], [b, key]);
            }
        } else {
            // work out combinations (limited to 3 part PK for reasonable efficiency)
            const [a, b, c] = primaryKeys;
            keyCombinations.push([a], [b], [c], [a, b], [a, c], [b, c]);
            for (let key of nonUniqueSingleKeys) {
                keyCombinations.push([a, key], [b, key], [c, key]);
            }
        }

        return keyCombinations;
    }
}
