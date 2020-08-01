import { EnumDefinitions, TableDefinition } from '../Generator/Introspection/IntrospectionTypes';
import { ColumnDefinition, Comparable, RelationDefinition } from './TypeTruth';
import _ from 'lodash';
import { PascalCase } from '../Generator/lib';

export type TableTypeNames = {
    rowTypeName: string;
    columnMapTypeName: string;
    columnTypeName: string;
    valueTypeName: string;
    whereTypeName: string;
    orderByTypeName: string;
    paginationTypeName: string;
    relationFilterTypeName: string;
};

export class TableTypeBuilder {
    /**
     * Get the type names for a table
     * @param params
     */
    public static typeNamesForTable(params: { tableName: string; rowTypeSuffix?: string }): TableTypeNames {
        const { tableName, rowTypeSuffix } = params;
        return {
            rowTypeName: `${tableName}${rowTypeSuffix || 'Row'}`,
            columnTypeName: `${tableName}Column`,
            columnMapTypeName: `${tableName}ColumnMap`,
            valueTypeName: `${tableName}Value`,
            whereTypeName: `${tableName}Where`,
            orderByTypeName: `${tableName}OrderBy`,
            paginationTypeName: `${tableName}Paginate`,
            relationFilterTypeName: `${tableName}RelationFilter`,
        };
    }

    /**
     * Add all imports required for types
     * @param params
     */
    public static buildTypeImports(params: { relations: RelationDefinition[]; tableName: string }) {
        const { relations, tableName } = params;
        return `
             import { 
                SQLQueryBuilder,
                Order, 
                Enumerable, 
                NumberWhere, 
                NumberWhereNullable, 
                StringWhere, 
                StringWhereNullable, 
                BooleanWhere, 
                BooleanWhereNullable, 
                DateWhere, 
                DateWhereNullable 
            } from 'gybson';
            
            ${_.uniqBy(relations, r => r.toTable)
                .map((tbl) => {
                    if (tbl.toTable === tableName) return ''; // don't import own types
                    return `import { ${tbl.toTable}RelationFilter } from "./${PascalCase(tbl.toTable)}"`;
                })
                .join(';')}
        `;
    }

    /**
     * Build enum type for table
     * @param params
     */
    public static buildEnumTypes(params: { enums: EnumDefinitions }) {
        const { enums } = params;
        return `
            // Enums
            ${Object.entries(enums)
                .map(([name, def]) => {
                    return `export type ${name} = ${def.values.map((v) => `'${v}'`).join(' | ')}`;
                })
                .join(';')}
        `;
    }

    /**
     * Build row type for table
     * @param params
     */
    public static buildRowType(params: { table: TableDefinition; rowTypeName: string }) {
        const { table, rowTypeName } = params;
        return `
             // Row types
            export interface ${rowTypeName} {
                ${Object.entries(table)
                    .map(([columnName, columnDefinition]) => {
                        let type = columnDefinition.tsType;
                        let nullable = columnDefinition.nullable ? '| null' : '';
                        return `${columnName}: ${type}${nullable};`;
                    })
                    .join(' ')}
            }
        `;
    }

    /**
     * Build a boolean map of table columns
     * @param params
     */
    public static buildColumnMapType(params: { columnMapTypeName: string; columns: TableDefinition }) {
        const { columnMapTypeName, columns } = params;
        return `
            // Column map
            export type ${columnMapTypeName} = {
             ${Object.values(columns)
                 .map((col) => `${col.columnName}: boolean;`)
                 .join(' ')}
            }
        `;
    }

    /**
     * Build the relation filter type for a table
     * @param params
     */
    public static buildRelationFilterType(params: { whereTypeName: string; relationFilterTypeName: string }) {
        const { whereTypeName, relationFilterTypeName } = params;
        return `
            // Relation
            export type ${relationFilterTypeName} = {
                existsWhere?: ${whereTypeName};
                notExistsWhere?: ${whereTypeName};
                innerJoinWhere?: ${whereTypeName};
            }`;
    }

    /**
     * Get the where type for a column
     * @param params
     */
    private static whereFilterForColumn(params: { column: ColumnDefinition }) {
        const { column: col } = params;

        const type = `${col.columnName}?: ${col.tsType}`;

        if (col.nullable) {
            switch (col.tsType) {
                case Comparable.Date:
                    return `${type} | DateWhereNullable | null`;
                case Comparable.string:
                    return `${type} | StringWhereNullable | null`;
                case Comparable.number:
                    return `${type} | NumberWhereNullable | null`;
                case Comparable.bigint:
                    return `${type} | NumberWhereNullable | null`;
                case Comparable.boolean:
                    return `${type} | BooleanWhereNullable | null`;
                default:
                    return `${type} | null`;
            }
        }
        switch (col.tsType) {
            case Comparable.Date:
                return `${type} | DateWhere`;
            case Comparable.string:
                return `${type} | StringWhere`;
            case Comparable.number:
                return `${type} | NumberWhere`;
            case Comparable.bigint:
                return `${type} | NumberWhere`;
            case Comparable.boolean:
                return `${type} | BooleanWhere`;
            default:
                return type;
        }
    }

    // /**
    //  * Build the where type for a column
    //  * @param col
    //  */
    // private static buildWhereTypeForColumn(col: ColumnDefinition) {
    //     const type = `${col.columnName}?: ${col.tsType}`;
    //     // @ts-ignore - don't have where clause for enum and set types
    //     if (!col.tsType || !Comparable[col.tsType]) return type;
    //     // add where filter options to type
    //     return `${type} | ${_.upperFirst(col.tsType)}Where${col.nullable ? 'Nullable | null' : ''}`;
    // }

    private static buildWhereCombinersForTable = (params: { whereTypeName: string }) => {
        const { whereTypeName } = params;
        return `
            AND?: Enumerable<${whereTypeName}>;
            OR?: Enumerable<${whereTypeName}>;
            NOT?: Enumerable<${whereTypeName}>;
        `;
    };

    /**
     * Build the where clause type for a table
     * @param params
     */
    public static buildWhereType(params: {
        whereTypeName: string;
        columns: TableDefinition;
        relations: RelationDefinition[];
    }) {
        const { whereTypeName, columns, relations } = params;
        return `
            // Where types
            export type ${whereTypeName} = {
                ${Object.values(columns)
                    .map((col) => TableTypeBuilder.whereFilterForColumn({ column: col }))
                    .join('; ')}
                ${TableTypeBuilder.buildWhereCombinersForTable({ whereTypeName })}
                ${relations.map((relation) => {
                    return `${relation.alias}?: ${relation.toTable}RelationFilter | null`;
                })}
            };
        `;
    }

    /**
     * Build order by type for table
     * @param params
     */
    public static buildOrderType(params: { orderByTypeName: string; columns: ColumnDefinition[] }) {
        const { orderByTypeName, columns } = params;
        return `
            // Order by
            export type ${orderByTypeName} = {
                ${columns.map((col) => `${col.columnName}?: Order;`).join(' ')}
            };
        `;
    }

    /**
     * Build pagination type for table
     * @param params
     */
    public static buildPaginateType(params: { paginationTypeName: string; rowTypeName: string }) {
        const { paginationTypeName, rowTypeName } = params;
        return `
            // Paginate
            export type ${paginationTypeName} = {
                limit?: number;
                afterCursor?: Partial<${rowTypeName}>;
                afterCount?: number;
            };
            `;
    }
}
