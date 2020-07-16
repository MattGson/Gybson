import { KeyDefinition } from '../Introspection/IntrospectionTypes';
export declare class CardinalityResolver {
    /**
     * Get the primary keys
     * @param allKeys in the table
     */
    static primaryKeys(allKeys: KeyDefinition[]): KeyDefinition[];
    /**
     * Returns the keys that uniquely define a single row - only PK for now
     * @param allKeys
     */
    static getUniqueKeys(allKeys: KeyDefinition[]): KeyDefinition[][];
    /**
     * Returns the list of key combinations that DO NOT uniquely define a single row
     * @param allKeys
     */
    static getNonUniqueKey(allKeys: KeyDefinition[]): KeyDefinition[][];
    /**
     * True if key column can map to many rows in the table
     */
    static isToMany(column: string, tableKeys: KeyDefinition[]): boolean;
}
