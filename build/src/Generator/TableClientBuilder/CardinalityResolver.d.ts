import { KeyColumn } from './types';
export declare class CardinalityResolver {
    /**
     * True if key column can map to many rows in the table
     */
    static isToMany(column: string, tableKeys: KeyColumn[]): boolean;
}
