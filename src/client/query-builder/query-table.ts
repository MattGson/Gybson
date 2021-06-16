import { ColumnDefinition, Comparable, DatabaseSchema } from 'relational-schema';

export class QueryTable {
    public readonly tableAlias: string;
    public constructor(public tableName: string, protected schema: DatabaseSchema) {
        this.tableAlias = `${tableName}_1`;
    }

    public get primaryKey(): string[] {
        return this.schema.tables[this.tableName].primaryKey?.columnNames || [];
    }

    public get aliasedTable(): string {
        return `${this.tableName} as ${this.tableAlias}`;
    }

    public aliasedColumn(column: string): string {
        return `${this.tableAlias}.${column}`;
    }

    public get softDeleteColumn(): ColumnDefinition | null {
        return this.schema.tables[this.tableName].softDelete;
    }

    public get hasSoftDelete(): boolean {
        return this.softDeleteColumn != null;
    }

    public get aliasedSoftDeleteColumn(): string | null {
        const column = this.softDeleteColumn;
        if (!column) return null;
        return `${this.aliasedColumn(column.columnName)}`;
    }

    public softDeleteFilter(alias: boolean): Record<string, Date | boolean | null> {
        const colAlias = this.aliasedSoftDeleteColumn;
        const column = this.softDeleteColumn;
        if (!colAlias || !column) return {};

        const colName = alias ? colAlias : column.columnName;
        const type = column?.tsType;
        if (type === Comparable.Date) return { [colName]: null };
        if (type === Comparable.boolean) return { [colName]: false };
        return {};
    }
}
