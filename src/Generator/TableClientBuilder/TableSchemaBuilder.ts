import { Introspection } from '../Introspection/IntrospectionTypes';
import {TableSchemaDefinition} from "../../TypeTruth/TypeTruth";
import {CardinalityResolver} from "./CardinalityResolver";

export class TableSchemaBuilder {
    private tableName: string;
    private introspection: Introspection;

    public constructor(tableName: string, introspection: Introspection) {
        this.introspection = introspection;
        this.tableName = tableName;
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
            primaryKey: CardinalityResolver.primaryKeys(keys).map(k => k.columnName);
            relations: []
        }

    }
}
