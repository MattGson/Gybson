import { Introspection, TableColumnsDefinition } from './IntrospectionTypes';
import { ColumnDefinition, Comparable, RelationDefinition, TableSchemaDefinition } from '../../TypeTruth';
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
     * Format a forward relation (N - 1)
     * Alias the name on relations to ensure unique keys even when the same table is joined multiple times
     * Also remove plural on related tables to match cardinality i.e. posts -> users would be 'post.author'
     * Also handle any conflicts for columns:related-tables with the same name.
     * @param relation
     * @param columns
     * @param uniqueKeys
     */
    private async formatForwardRelation(
        relation: RelationDefinition,
        columns: TableColumnsDefinition,
        uniqueKeys: string[][],
    ): Promise<RelationDefinition> {
        // multiple columns so use the table-name instead
        if (relation.joins.length > 1) {
            relation.alias = relation.toTable.replace(/s+$/, '');
        }
        // single column so just remove plural etc
        else {
            relation.alias = relation.joins[0].fromColumn.replace('_id', '');
        }
        if (columns[relation.alias]) relation.alias += '_'; // handle any conflicts

        // check if there is a unique constraint on the join. If so, it is 1 - 1;
        const joins = relation.joins.map((j) => j.fromColumn).sort();
        if (CardinalityResolver.isOneToOneRelation(joins, uniqueKeys)) relation.type = 'hasOne';

        return relation;
    }

    /**
     * Format a backwards relation (1 - N or 1 - 1) (other table holds to key)
     * Alias the name on relations in the case that the table is joined from another table multiple times
     * Normal case:  posts -> users would be 'user.posts'
     * Special case:  posts.author -> users, posts.co_author -> users would be 'user.author_posts' 'user.co_author_posts'
     * Also add plural on joins to match cardinality i.e. users => posts would be 'user.posts'
     * @param relation
     * @param columns
     * @param relations, other relations
     */
    private async formatBackwardRelationship(
        relation: RelationDefinition,
        columns: TableColumnsDefinition,
        relations: RelationDefinition[],
    ): Promise<RelationDefinition> {
        // check if table name will conflict with other relations on the same table
        let relationCount = 0;
        for (let other_relation of relations) {
            if (other_relation.toTable === relation.toTable) relationCount += 1;
        }
        if (relationCount > 1) {
            relation.alias = `${relation.joins[0].toColumn.replace('_id', '')}_${relation.toTable}`;
        }

        // check if there is a unique constraint on the join. If so, it is (1 - 1);
        const relatedTableConstraints = await this.introspection.getTableConstraints(relation.toTable);
        const uniqueKeys = CardinalityResolver.getUniqueKeyCombinations(relatedTableConstraints);

        const joins = relation.joins.map((j) => j.toColumn).sort();
        if (CardinalityResolver.isOneToOneRelation(joins, uniqueKeys)) {
            relation.type = 'hasOne';
            relation.alias = relation.alias.replace(/s+$/, ''); // remove trailing s
        }

        // add trailing s for (1 - N)
        if (relation.type === 'hasMany' && relation.alias[relation.alias.length - 1] !== 's') {
            relation.alias += `s`;
        }
        // handle any column conflicts
        if (columns[relation.alias]) relation.alias += '_';

        return relation;
    }

    /**
     * Get a column to use for soft deletes if it exists
     * @param columns
     */
    private static getSoftDeleteColumn(columns: TableColumnsDefinition): ColumnDefinition | null {
        let candidate: ColumnDefinition | undefined;
        for (let column of Object.values(columns)) {
            if (
                column.columnName === 'deleted' ||
                column.columnName === 'deleted_at' ||
                column.columnName === 'deletedAt'
            ) {
                candidate = column;
            }
        }
        if (candidate?.tsType === Comparable.boolean || candidate?.tsType === Comparable.Date) return candidate;
        return null;
    }

    /**
     * Get the schema definition for a table
     */
    public async buildTableDefinition(): Promise<TableSchemaDefinition> {
        // columns
        const enums = await this.introspection.getEnumTypesForTable(this.tableName);
        const columns = await this.introspection.getTableTypes(this.tableName, enums);
        const softDelete = TableSchemaBuilder.getSoftDeleteColumn(columns);

        // constraints
        const constraints = await this.introspection.getTableConstraints(this.tableName);
        const uniqueKeyCombinations = CardinalityResolver.getUniqueKeyCombinations(constraints);
        const nonUniqueKeyCombinations = CardinalityResolver.getNonUniqueKeyCombinations(constraints);

        // relations
        const forwardRelations = await this.introspection.getForwardRelations(this.tableName);
        const backwardRelations = await this.introspection.getBackwardRelations(this.tableName);
        const forwardRels = await Promise.all(
            forwardRelations.map((r) => this.formatForwardRelation(r, columns, uniqueKeyCombinations)),
        );
        const backwardRels = await Promise.all(
            backwardRelations.map((r) => this.formatBackwardRelationship(r, columns, backwardRelations)),
        );

        return {
            primaryKey: CardinalityResolver.primaryKey(constraints),
            keys: constraints,
            uniqueKeyCombinations,
            nonUniqueKeyCombinations,
            relations: [...forwardRels, ...backwardRels],
            columns,
            softDelete,
            enums,
        };
    }
}
