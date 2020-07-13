import { KeyDefinition } from '../Introspection/IntrospectionTypes';
export declare class CardinalityResolver {
    /**
     * True if key column can map to many rows in the table
     */
    static isToMany(column: string, tableKeys: KeyDefinition[]): boolean;
}
