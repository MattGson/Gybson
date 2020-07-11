import { KeyColumn } from './types';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * True if key column can map to many rows in the table
     */
    public static isToMany(column: string, tableKeys: KeyColumn[]): boolean {
        const primary = tableKeys.filter(key => key.constraintName === 'PRIMARY');
        const primaryMap = _.keyBy(primary, 'columnName');

        // column is singular PK so can't map to many rows
        if (primaryMap[column] && primary.length === 1) return false;

        // column is part of compound PK so should map to many rows else PK is over-specified
        if (primaryMap[column] && primary.length > 1) return true;

        // assume non-primary keys are non-unique in table
        return true;
    }
}
