import { ConstraintDefinition } from '../../TypeTruth/TypeTruth';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * Get the primary key from a tables keys
     * @param constraints in the table
     */
    public static primaryKey(constraints: ConstraintDefinition[]): ConstraintDefinition | undefined {
        const pks = constraints.filter((k) => k.constraintType === 'PRIMARY KEY');
        return pks[0] !== undefined ? pks[0] : undefined;
    }

    /**
     * Get the constraints that are unique in a table
     * @param constraints in the table
     */
    public static uniqueConstraints(constraints: ConstraintDefinition[]): ConstraintDefinition[] {
        return constraints.filter((k) => k.constraintType === 'UNIQUE');
    }

    /**
     * Returns a minimal list of key column combinations that are guaranteed to uniquely define a single row - PK and unique constraints
     * @param constraints
     */
    public static getUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][] {
        const unique = this.uniqueConstraints(constraints).map((con) => con.columnNames);
        const primary = this.primaryKey(constraints)?.columnNames;
        if (primary) unique.push(primary);

        return unique;
    }

    private static buildPermutations(
        constraintA: ConstraintDefinition,
        constraintB: ConstraintDefinition,
    ): Set<string>[] {
        let combos: Set<string>[] = [];
        if (constraintA.columnNames.length === 1) {
            const [a] = constraintA.columnNames;
            combos.push(new Set([a]));
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]));
            }
        } else if (constraintA.columnNames.length === 2) {
            const [a, b] = constraintA.columnNames;
            combos.push(
                new Set([a]),
                new Set<string>([b]),
            );
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]), new Set([b, column]));
            }
        } else if (constraintA.columnNames.length > 2) {
            // limited to 3 part PK for reasonable efficiency)
            const [a, b, c] = constraintA.columnNames;
            combos.push(new Set([a]), new Set([b]), new Set([c]), new Set([a, b]), new Set([a, c]), new Set([b, c]));
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]), new Set([b, column]), new Set([c, column]));
            }
        }
        return combos;
    }

    public static getNonUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][] {
        // permute key column combinations up to length 3.
        // use Set comparison to check if in unique constraints.

        const uniqueCombos = this.getUniqueKeyCombinations(constraints).map((combo) => new Set(combo));
        const permutations: Set<string>[] = [];
        for (const constraintA of constraints) {
            for (const constraintB of constraints) {
                if (constraintB.constraintName === constraintA.constraintName) continue;
                permutations.push(...this.buildPermutations(constraintA, constraintB));
            }
        }

        const isSubset = (set: Set<string>, subset: Set<string>) => {
            return new Set([...set, ...subset]).size === set.size;
        };

        let nonUnique: Set<string>[] = [];
        for (const perm of permutations) {
            let unique = false;
            for (const uniqueCombo of uniqueCombos) {
                if (isSubset(perm, uniqueCombo)) unique = true;
            }
            if (!unique) {
                nonUnique = _.unionWith(nonUnique, [perm], _.isEqual);
            }
        }
        return nonUnique.map((perm) => Array.from(perm));
    }

    // /**
    //  * Get all non unique subsets of a compound key
    //  * @param constraint
    //  */
    // private static subsetCompoundKey(constraint: ConstraintDefinition): string[][] {
    //     let combos: string[][] = [];
    //     if (constraint.columnNames.length === 2) {
    //         // work out combos for 2 part key
    //         const [a, b] = constraint.columnNames;
    //         combos.push([a], [b]);
    //         // for (let key of nonUniqueSingleKeys) {
    //         //     combos.push([a, key], [b, key]);
    //         // }
    //     } else if (constraint.columnNames.length > 2) {
    //         // limited to 3 part PK for reasonable efficiency)
    //         const [a, b, c] = constraint.columnNames;
    //         combos.push([a], [b], [c], [a, b], [a, c], [b, c]);
    //         // for (let key of nonUniqueSingleKeys) {
    //         //     keyCombinations.push([a, key], [b, key], [c, key]);
    //         // }
    //     }
    //     // the whole constraint is non-unique so can add it
    //     if (constraint.constraintType === 'FOREIGN KEY') combos.push(constraint.columnNames);
    //     return combos;
    // }
    //
    // /**
    //  * interleave all non-unique subsets with another non-unique key
    //  * @param constraint
    //  * // TODO:- what if the non-unique single key becomes unique when combined?
    //  * //   TODO How about generating lots of combinations and just filtering by the unique constraints?
    //  */
    // private static interleaveCompoundKey(constraint: ConstraintDefinition): string[][] {
    //     let combos: string[][] = [];
    //     if (constraint.columnNames.length === 2) {
    //         // work out combos for 2 part key
    //         const [a, b] = constraint.columnNames;
    //         combos.push([a], [b]);
    //         // for (let key of nonUniqueSingleKeys) {
    //         //     combos.push([a, key], [b, key]);
    //         // }
    //     } else if (constraint.columnNames.length > 2) {
    //         // limited to 3 part PK for reasonable efficiency)
    //         const [a, b, c] = constraint.columnNames;
    //         combos.push([a], [b], [c], [a, b], [a, c], [b, c]);
    //         // for (let key of nonUniqueSingleKeys) {
    //         //     keyCombinations.push([a, key], [b, key], [c, key]);
    //         // }
    //     }
    //     // the whole constraint is non-unique so can add it
    //     if (constraint.constraintType === 'FOREIGN KEY') combos.push(constraint.columnNames);
    //     return combos;
    // }
    //
    // /**
    //  * Returns the list of key combinations that DO NOT uniquely define a single row
    //  * // TODO:- interleave compound unique keys
    //  * // TODO:- combos of compound foreign keys with more than 2 parts
    //  * @param constraints
    //  */
    // public static getNonUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][] {
    //     // all non-unique key column combinations
    //     let nonUnique: string[][] = [];
    //
    //     // get primary and unique keys to check against
    //     const primaryKey = this.primaryKey(constraints);
    //     const uniqueKeys = this.uniqueConstraints(constraints);
    //     const foreignKeys = this.foreignConstraints(constraints);
    //
    //     // add all subsets of compound keys
    //     // assumed to be non-unique
    //     const compoundKeys = this.getCompoundKeys(constraints);
    //     compoundKeys.forEach((key) => {
    //         nonUnique = [...nonUnique, ...this.subsetCompoundKey(key)];
    //     });
    //
    //     // add all singular keys that are not UNIQUE or PRIMARY (FOREIGN)
    //     const nonUniqueSingleKeys = this.getSingularKeys(foreignKeys);
    //     nonUniqueSingleKeys.forEach((key) => {
    //         nonUnique.push(key.columnNames);
    //     });
    //
    //     // combine
    //     // - Non-unique single keys ->
    //
    //     // // non-compound unique keys
    //     // const uniqueKeys = this.getUniqueKeyCombinations(allKeys);
    //     // const singleUniqueKeys = _.flatten(uniqueKeys.filter((cols) => cols.length === 1));
    //     // const singleUniqueKeyMap = _.keyBy(singleUniqueKeys, (k) => k.columnName);
    //     //
    //     // // get non unique individual key columns (not PRIMARY, not UNIQUE)
    //     // const nonUniqueSingleKeys = _.uniqBy(
    //     //     allKeys.filter((key) => {
    //     //         // is part of primary key so not unique
    //     //         if (primaryMap[key.columnName]) return false;
    //     //
    //     //         // is a single unique constraint
    //     //         if (singleUniqueKeyMap[key.columnName]) return false;
    //     //
    //     //         return true;
    //     //     }),
    //     //     (k) => k.columnName,
    //     // );
    //
    //     // combinations with a single key
    //     // let keyCombinations = nonUniqueSingleKeys.map((k) => [k]);
    //     //
    //     // // table has a single primary key column
    //     // if (primaryKeys.length < 2) return nonUniqueSingleKeys.map((k) => [k]);
    //     //
    //     // // has a multi-part primary key
    //     // if (primaryKeys.length === 2) {
    //     //     // work out combos for 2 part PK
    //     //     const [a, b] = primaryKeys;
    //     //     keyCombinations.push([a], [b]);
    //     //     for (let key of nonUniqueSingleKeys) {
    //     //         keyCombinations.push([a, key], [b, key]);
    //     //     }
    //     // } else {
    //     //     // work out combinations (limited to 3 part PK for reasonable efficiency)
    //     //     const [a, b, c] = primaryKeys;
    //     //     keyCombinations.push([a], [b], [c], [a, b], [a, c], [b, c]);
    //     //     for (let key of nonUniqueSingleKeys) {
    //     //         keyCombinations.push([a, key], [b, key], [c, key]);
    //     //     }
    //     // }
    //
    //     return nonUnique;
    // }

    //
    // /**
    //  * Returns the list of key combinations that DO NOT uniquely define a single row
    //  * // TODO:- interleave compound unique keys
    //  * // TODO:- combos of compound foreign keys with more than 2 parts
    //  * @param allKeys
    //  */
    // public static getNonUniqueKeyCombinations(allKeys: KeyDefinition[]): KeyDefinition[][] {
    //     // get primary and unique keys to check against
    //     const primaryKeys = this.primaryKey(allKeys);
    //     const primaryMap = _.keyBy(primaryKeys, (k) => k.columnName);
    //
    //     // non-compound unique keys
    //     const uniqueKeys = this.getUniqueKeyCombinations(allKeys);
    //     const singleUniqueKeys = _.flatten(uniqueKeys.filter((cols) => cols.length === 1));
    //     const singleUniqueKeyMap = _.keyBy(singleUniqueKeys, (k) => k.columnName);
    //
    //     // get non unique individual key columns (not PRIMARY, not UNIQUE)
    //     const nonUniqueSingleKeys = _.uniqBy(
    //         allKeys.filter((key) => {
    //             // is part of primary key so not unique
    //             if (primaryMap[key.columnName]) return false;
    //
    //             // is a single unique constraint
    //             if (singleUniqueKeyMap[key.columnName]) return false;
    //
    //             return true;
    //         }),
    //         (k) => k.columnName,
    //     );
    //
    //     // combinations with a single key
    //     let keyCombinations = nonUniqueSingleKeys.map((k) => [k]);
    //
    //     // table has a single primary key column
    //     if (primaryKeys.length < 2) return nonUniqueSingleKeys.map((k) => [k]);
    //
    //     // has a multi-part primary key
    //     if (primaryKeys.length === 2) {
    //         // work out combos for 2 part PK
    //         const [a, b] = primaryKeys;
    //         keyCombinations.push([a], [b]);
    //         for (let key of nonUniqueSingleKeys) {
    //             keyCombinations.push([a, key], [b, key]);
    //         }
    //     } else {
    //         // work out combinations (limited to 3 part PK for reasonable efficiency)
    //         const [a, b, c] = primaryKeys;
    //         keyCombinations.push([a], [b], [c], [a, b], [a, c], [b, c]);
    //         for (let key of nonUniqueSingleKeys) {
    //             keyCombinations.push([a, key], [b, key], [c, key]);
    //         }
    //     }
    //
    //     return keyCombinations;
    // }
}
