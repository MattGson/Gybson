import { KeyDefinition } from '../Introspection/IntrospectionTypes';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * Get the primary keys
     * @param allKeys in the table
     */
    public static primaryKeys(allKeys: KeyDefinition[]): KeyDefinition[] {
        return allKeys.filter((k) => k.constraintName === 'PRIMARY');
    }

    /**
     * Returns the keys that uniquely define a single row - only PK for now
     * @param allKeys
     */
    public static getUniqueKeys(allKeys: KeyDefinition[]): KeyDefinition[][] {
        return [this.primaryKeys(allKeys)];
    }

    /**
     * Returns the list of key combinations that DO NOT uniquely define a single row
     * @param allKeys
     */
    public static getNonUniqueKey(allKeys: KeyDefinition[]): KeyDefinition[][] {
        const primaryKeys = this.primaryKeys(allKeys);
        const primaryMap = _.keyBy(primaryKeys, (k) => k.columnName);

        // get non primary individual keys
        const singleKeys = _.uniqBy(
            allKeys.filter((key) => key.constraintName !== 'PRIMARY' && !primaryMap[key.columnName]),
            (k) => k.columnName,
        );
        // table has a single primary key
        if (primaryKeys.length < 2) return singleKeys.map((k) => [k]);
        // has a multi-part primary key
        let combos: KeyDefinition[][] = singleKeys.map((k) => [k]);
        if (primaryKeys.length > 2) {
            // work out combinations (limited to 3 part PK for reasonable efficiency)
            const [a, b, c] = primaryKeys;
            combos.push([a], [b], [c], [a, b], [a, c], [b, c]);
            for (let key of singleKeys) {
                combos.push([a, key], [b, key], [c, key]);
            }
        } else {
            // work out combos for 2 part PK
            const [a, b] = primaryKeys;
            combos.push([a], [b]);
            for (let key of singleKeys) {
                combos.push([a, key], [b, key]);
            }
        }

        return combos;
    }

    /**
     * True if key column can map to many rows in the table
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
