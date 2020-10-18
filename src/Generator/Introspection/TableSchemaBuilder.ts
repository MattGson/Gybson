import { Introspection, KeyDefinition, TableDefinition } from './IntrospectionTypes';
import { ConstraintDefinition, RelationDefinition, TableSchemaDefinition } from '../../TypeTruth/TypeTruth';
import { CardinalityResolver } from './CardinalityResolver';
import _ from 'lodash';

/**
 * Build a js schema that describes the table and relationships
 */
export class TableSchemaBuilder {
    private readonly tableName: string;
    private introspection: Introspection;

    public constructor(tableName: string, introspection: Introspection) {
        this.introspection = introspection;
        this.tableName = tableName;
    }

    /**
     * Alias the name on relations to ensure unique keys even when the same table is joined multiple times
     * Also remove plural on multi-key joins as assumed unique
     * Also helps readability i.e. posts -> users would be 'posts.author'
     * @param relation
     * @param columns
     */
    private static aliasForwardRelationship(
        relation: RelationDefinition,
        columns: TableDefinition,
    ): RelationDefinition {
        if (relation.joins.length > 1) relation.alias = relation.toTable.replace(/s+$/, '');
        else relation.alias = relation.joins[0].fromColumn.replace('_id', '');
        if (columns[relation.alias]) relation.alias += '_'; // handle any conflicts
        return relation;
    }

    /**
     * Alias the name on relations in the case that the table is joined from another table multiple times
     * Normal case:  posts -> users would be 'users.posts'
     * Special case:  posts.author -> users, posts.co_author -> users would be 'users.author_posts' 'users.co_author_posts'
     * @param relation
     * @param columns
     * @param relations, other relations
     */
    private static aliasBackwardRelationship(
        relation: RelationDefinition,
        columns: TableDefinition,
        relations: RelationDefinition[],
    ): RelationDefinition {
        // check if table name will conflict with other relations on the same table
        let relationCount = 0;
        for (let other_relation of relations) {
            if (other_relation.toTable === relation.toTable) relationCount += 1;
        }
        if (relationCount > 1) relation.alias = `${relation.joins[0].toColumn.replace('_id', '')}_${relation.toTable}`;
        // handle any column conflicts
        if (columns[relation.alias]) relation.alias += '_';
        return relation;
    }

    /**
     * Build a list of key constraints on the table
     * Group into objects by the constraint name
     */
    public buildTableKeyConstraints(allKeys: KeyDefinition[]): ConstraintDefinition[] {
        const columnMap = _.groupBy(allKeys, (k) => k.constraintName);
        const constraintMap = _.keyBy(allKeys, (k) => k.constraintName);

        const constraintDefinitions: ConstraintDefinition[] = [];

        Object.values(constraintMap).forEach((constraint) => {
            const { constraintType, constraintName } = constraint;
            const columns = columnMap[constraintName];

            constraintDefinitions.push({
                constraintName,
                constraintType,
                columnNames: columns.map((c) => c.columnName),
            });
        });
        return constraintDefinitions;
    }
    /**
     * Get the schema definition for a table
     */
    public async buildTableDefinition(): Promise<TableSchemaDefinition> {
        const enums = await this.introspection.getEnumTypesForTable(this.tableName);
        const columns = await this.introspection.getTableTypes(this.tableName, enums);
        const forwardRelations = await this.introspection.getForwardRelations(this.tableName);
        const backwardRelations = await this.introspection.getBackwardRelations(this.tableName);
        const allKeys = await this.introspection.getTableKeys(this.tableName);
        const constraints = await this.buildTableKeyConstraints(allKeys);

        const uniqueKeyCombinations = CardinalityResolver.getUniqueKeyCombinations(constraints);
        const nonUniqueKeyCombinations = CardinalityResolver.getNonUniqueKeyCombinations(constraints);

        return {
            primaryKey: CardinalityResolver.primaryKey(constraints),
            keys: constraints,
            uniqueKeyCombinations,
            nonUniqueKeyCombinations,
            relations: [
                ...forwardRelations.map((r) => TableSchemaBuilder.aliasForwardRelationship(r, columns)),
                ...backwardRelations.map((r) =>
                    TableSchemaBuilder.aliasBackwardRelationship(r, columns, backwardRelations),
                ),
            ],
            columns,
            enums,
        };
    }
}
