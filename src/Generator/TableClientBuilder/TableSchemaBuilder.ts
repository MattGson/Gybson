import { Introspection } from '../Introspection/IntrospectionTypes';
import { RelationDefinition, TableSchemaDefinition } from '../../TypeTruth/TypeTruth';
import { CardinalityResolver } from './CardinalityResolver';

export class TableSchemaBuilder {
    private readonly tableName: string;
    private introspection: Introspection;

    public constructor(tableName: string, introspection: Introspection) {
        this.introspection = introspection;
        this.tableName = tableName;
    }

    /**
     * Alias the name on relations to ensure unique keys even when the same table is joined multiple times
     * Also helps readability i.e. posts -> users would be 'posts.author'
     * @param relation
     */
    private static aliasForwardRelationship(relation: RelationDefinition): RelationDefinition {
        if (relation.joins.length > 1) relation.alias = relation.toTable.replace(/s+$/, '');
        else relation.alias = relation.joins[0].fromColumn.replace('_id', '');
        return relation;
    }

    /**
     * Get the schema definition for a table
     */
    public async buildTableDefinition(): Promise<TableSchemaDefinition> {
        const enums = await this.introspection.getEnumTypesForTable(this.tableName);
        const columns = await this.introspection.getTableTypes(this.tableName, enums);
        const forwardRelations = await this.introspection.getForwardRelations(this.tableName);
        const backwardRelations = await this.introspection.getBackwardRelations(this.tableName);
        const keys = await this.introspection.getTableKeys(this.tableName);

        return {
            primaryKey: CardinalityResolver.primaryKeys(keys).map((k) => k.columnName),
            relations: [
                ...forwardRelations.map((r) => TableSchemaBuilder.aliasForwardRelationship(r)),
                ...backwardRelations,
            ],
            columns,
            enums,
        };
    }
}
