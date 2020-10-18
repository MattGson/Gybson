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

    /**
     * Build permutations/combinations of two constraints
     * @param constraintA
     * @param constraintB
     */
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

    /**
     * Get all non-unique key combinations
     * @param constraints
     */
    public static getNonUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][] {
        // permute key column combinations up to length 3.
        // use Set comparison to check if in unique constraints.

        const uniqueCombos = this.getUniqueKeyCombinations(constraints).map((combo) => new Set(combo));

        // build key permutations
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

        // filter out duplicates and unique keys
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
}
