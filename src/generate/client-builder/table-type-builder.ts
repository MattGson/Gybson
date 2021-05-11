import _ from 'lodash';
import {
    ColumnDefinition,
    Comparable,
    EnumDefinitions,
    RelationDefinition,
    TableColumnsDefinition,
} from 'relational-schema';
import { PascalCase } from '../printer';

export type TableTypeNames = {
    rowTypeName: string;
    requiredRowTypeName: string;
    columnMapTypeName: string;
    whereTypeName: string;
    loadOneWhereTypeName: string;
    loadManyWhereTypeName: string;
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
            requiredRowTypeName: `${tableName}RequiredRow`,
            columnMapTypeName: `${tableName}ColumnMap`,
            whereTypeName: `${tableName}Where`,
            loadOneWhereTypeName: `${tableName}LoadOneWhere`,
            loadManyWhereTypeName: `${tableName}LoadManyWhere`,
            orderByTypeName: `${tableName}OrderBy`,
            paginationTypeName: `${tableName}Paginate`,
            relationFilterTypeName: `${tableName}RelationFilter`,
        };
    }

    /**
     * Add all imports required for types
     * @param params
     */
    public static buildTypeImports(params: {
        relations: RelationDefinition[];
        tableName: string;
        gybsonLibPath: string;
    }) {
        const { relations, tableName, gybsonLibPath } = params;
        return `
             import { 
                QueryClient,
                Order, 
                Enumerable, 
                NumberWhere, 
                NumberWhereNullable, 
                StringWhere, 
                StringWhereNullable, 
                BooleanWhere, 
                BooleanWhereNullable, 
                DateWhere, 
                DateWhereNullable,
                Loader
            } from '${gybsonLibPath}';
            
            ${_.uniqBy(relations, (r) => r.toTable)
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
            ${Object.entries(enums)
                .map(([name, def]) => {
                    return `export type ${name} = ${def.values.map((v: string) => `'${v}'`).join(' | ')}`;
                })
                .sort()
                .join(';')}
        `;
    }

    /**
     * Build row type for table
     * @param params
     */
    public static buildRowType(params: { table: TableColumnsDefinition; rowTypeName: string }) {
        const { table, rowTypeName } = params;
        return `
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
     * Build row type for table with all non-required insert values optional
     * @param params
     */
    public static buildRequiredRowType(params: { table: TableColumnsDefinition; requiredRowTypeName: string }) {
        const { table, requiredRowTypeName } = params;
        return `
            export interface ${requiredRowTypeName} {
                ${Object.entries(table)
                    .map(([columnName, columnDefinition]) => {
                        let type = columnDefinition.tsType;
                        if (columnDefinition.nullable) type = `${type} | null`;
                        if (columnDefinition.nullable || columnDefinition.columnDefault) {
                            return `${columnName}?: ${type};`;
                        }
                        return `${columnName}: ${type};`;
                    })
                    .join(' ')}
            }
        `;
    }

    /**
     * Build a boolean map of table columns
     * @param params
     */
    public static buildColumnMapType(params: { columnMapTypeName: string; columns: TableColumnsDefinition }) {
        const { columnMapTypeName, columns } = params;
        return `
            export interface ${columnMapTypeName} {
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
            export interface ${relationFilterTypeName} {
                existsWhere?: ${whereTypeName};
                notExistsWhere?: ${whereTypeName};
                whereEvery?: ${whereTypeName};
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
        columns: TableColumnsDefinition;
        relations: RelationDefinition[];
    }) {
        const { whereTypeName, columns, relations } = params;
        return `
            export interface ${whereTypeName} {
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
     * Build the where clause type for unique load angles
     * @param params
     */
    public static buildLoadOneWhereType(params: {
        loadOneWhereTypeName: string;
        columns: TableColumnsDefinition;
        uniqueKeys: string[][];
    }) {
        const { loadOneWhereTypeName, columns, uniqueKeys } = params;

        const uniqueColumns = uniqueKeys.map((key) => {
            return key.map((k) => columns[k]);
        });

        const columnEntry = (col: ColumnDefinition) => `${col.columnName}: ${col.tsType}`;
        const optionalColumnEntry = (col: ColumnDefinition) => `${col.columnName}?: ${col.tsType}`;
        return `
            export interface ${loadOneWhereTypeName} {
                ${uniqueColumns
                    .map((cols) => {
                        if (cols.length == 1) return optionalColumnEntry(cols[0]);
                        const name = cols.map((c) => c.columnName).join('__');
                        return `
                        ${name}?: {
                            ${cols.map(columnEntry).join(';')}
                        }
                    `;
                    })
                    .join('; ')}
            };
        `;
    }

    /**
     * Build the where clause type for non-unique load angles
     * @param params
     */
    public static buildLoadManyWhereType(params: {
        columns: TableColumnsDefinition;
        uniqueKeys: string[][];
        loadManyWhereTypeName: string;
    }) {
        const { columns, uniqueKeys, loadManyWhereTypeName } = params;

        // get columns that are not unique constraints
        const nonUniqueColumns = Object.values(columns).filter((col) => {
            return !uniqueKeys.find((k) => k.length === 1 && k[0] === col.columnName);
        });

        return `
            export interface ${loadManyWhereTypeName} {
                ${nonUniqueColumns
                    .map((columnDefinition) => {
                        let type = columnDefinition.tsType;
                        let nullable = columnDefinition.nullable ? '| null' : '';
                        return `${columnDefinition.columnName}?: ${type}${nullable};`;
                    })
                    .join(' ')}
            }
        `;
    }

    /**
     * Build order by type for table
     * @param params
     */
    public static buildOrderType(params: { orderByTypeName: string; columns: TableColumnsDefinition }) {
        const { orderByTypeName, columns } = params;
        return `
            export type ${orderByTypeName} = {
                ${Object.values(columns)
                    .map((col) => `${col.columnName}?: Order;`)
                    .join(' ')}
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
            export interface ${paginationTypeName} {
                limit?: number;
                afterCursor?: Partial<${rowTypeName}>;
                beforeCursor?: Partial<${rowTypeName}>;
                offset?: number;
            };
            `;
    }
}
