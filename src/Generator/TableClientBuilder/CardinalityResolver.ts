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
     * Get the unique columns from a tables keys
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
        let keys = [CardinalityResolver.primaryKey(allKeys)];
        // support compound unique constraints
        const unique = _.groupBy(CardinalityResolver.uniqueColumns(allKeys), (k) => k.constraintName);
        return [...keys, ...Object.values(unique)];
    }

    /**
     * Returns the list of key combinations that DO NOT uniquely define a single row
     * // TODO:- interleave compound unique keys
     * @param allKeys
     */
    public static getNonUniqueKeyCombinations(allKeys: KeyDefinition[]): KeyDefinition[][] {
        // get primary and unique keys to check against
        const primaryKeys = this.primaryKey(allKeys);
        const primaryMap = _.keyBy(primaryKeys, (k) => k.columnName);
        const uniqueColumns = this.uniqueColumns(allKeys);
        const uniqueMap = _.keyBy(uniqueColumns, (k) => k.columnName);

        // get non unique individual key columns (not PRIMARY, not UNIQUE)
        const nonUniqueSingleKeys = _.uniqBy(
            allKeys.filter((key) => !primaryMap[key.columnName] && !uniqueMap[key.columnName]),
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

    /**
     * True if key column can map to many rows in the table
     * @deprecated - no longer required
     */
    public static isToMany(column: string, tableKeys: KeyDefinition[]): boolean {
        const primary = tableKeys.filter((key) => key.constraintName === 'PRIMARY');
        const primaryMap = _.keyBy(primary, 'columnName');

        // column is singular PK so can't map to many rows
        if (primaryMap[column] && primary.length === 1) return false;

        // column is part of compound PK so should map to many rows else PK is over-specified
        if (primaryMap[column] && primary.length > 1) return true;

        // assume non-primary keys are non-unique in table
        return true;
    }
}
