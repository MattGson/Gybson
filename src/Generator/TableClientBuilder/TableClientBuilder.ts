import _ from 'lodash';
import {
    Introspection,
    KeyDefinition,
    ColumnDefinition,
    EnumDefinitions,
    TableDefinition,
} from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';

interface BuilderOptions {
    rowTypeSuffix: string;
    softDeleteColumn?: string;
}

/**
 * Builds db client methods for a table
 */
export class TableClientBuilder {
    public readonly entityName: string;
    public readonly typeNames: {
        rowTypeName: string;
        columnTypeName: string;
        valueTypeName: string;
        whereTypeName: string;
        orderByTypeName: string;
    };
    public readonly className: string;
    public readonly table: string;
    private readonly enums: EnumDefinitions;
    private readonly options: BuilderOptions;
    private softDeleteColumn?: string;
    private loaders: string[] = [];
    private types?: string;

    public constructor(table: string, enums: EnumDefinitions, options: BuilderOptions) {
        this.entityName = TableClientBuilder.PascalCase(table);
        this.table = table;
        this.enums = enums;
        this.className = `${this.entityName}`;
        this.options = options;
        this.typeNames = {
            rowTypeName: `${this.className}${options.rowTypeSuffix || 'Row'}`,
            columnTypeName: `${this.className}Column`,
            valueTypeName: `${this.className}Value`,
            whereTypeName: `${this.className}Where`,
            orderByTypeName: `${this.className}OrderBy`,
        };
    }

    private static PascalCase(name: string) {
        return _.upperFirst(_.camelCase(name));
    }

    public async build(introspection: Introspection): Promise<string> {
        const columns = await introspection.getTableTypes(this.table, this.enums);

        // if a soft delete column is given, check if it exists on the table
        this.softDeleteColumn =
            this.options.softDeleteColumn && columns[this.options.softDeleteColumn]
                ? this.options.softDeleteColumn
                : undefined;

        // TODO:- work out where this goes
        this.types = this.buildQueryTypes(columns);

        const tableKeys = await introspection.getTableKeys(this.table);
        const unique = CardinalityResolver.getUniqueKeys(tableKeys);
        const nonUnique = CardinalityResolver.getNonUniqueKey(tableKeys);

        unique.forEach((key) => {
            // for now only accept loaders on string and number column types
            const keyColumns: ColumnDefinition[] = key.map((k) => columns[k.columnName]);
            for (let col of keyColumns) {
                if (col.tsType !== 'string' && col.tsType !== 'number') return;
            }

            this.addCompoundByColumnLoader(keyColumns);
        });
        // filter duplicate columns
        // const uniqueKeys = _.keyBy(tableKeys, (key) => key.columnName);
        //
        // Object.values(uniqueKeys).forEach((key: KeyDefinition) => {
        //     const { columnName } = key;
        //
        //     const column: ColumnDefinition = columns[columnName];
        //
        //     // for now only accept loaders on string and number column types
        //     if (column.tsType !== 'string' && column.tsType !== 'number') return;
        //
        //     const isMany = CardinalityResolver.isToMany(columnName, tableKeys);
        //     if (!isMany) this.addByColumnLoader(column);
        //     else this.addManyByColumnLoader(column);
        // });

        return this.buildTemplate(
            this.loaders.join(`
        
        `),
        );
    }

    private buildTemplate(content: string) {
        // TODO:- this should be in type gen
        const { rowTypeName, columnTypeName, valueTypeName, whereTypeName, orderByTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { SQLQueryBuilder } from 'nodent';
            import { ${this.table} } from './db-schema';
            
            ${this.types}

             export default class ${
                 this.className
             } extends SQLQueryBuilder<${rowTypeName}, ${columnTypeName}, ${valueTypeName}, ${whereTypeName}, ${orderByTypeName}> {
                    constructor() {
                        super('${this.table}', ${this.softDeleteColumn ? `'${this.softDeleteColumn}'` : undefined});
                    }
                ${content}
            }
            `;
    }

    // TODO:- where should this go?
    private buildQueryTypes(table: TableDefinition) {
        const { rowTypeName, columnTypeName, valueTypeName, whereTypeName, orderByTypeName } = this.typeNames;

        const whereTypeForColumn = (col: ColumnDefinition) => {
            if (!col.tsType) return '';
            return `${TableClientBuilder.PascalCase(col.tsType)}Where${col.nullable ? 'Nullable | null' : ''}`;
        };

        return `
                
                import { 
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
                } from 'nodent';
               
                export type ${rowTypeName} = ${this.table};
                export type ${columnTypeName} = Extract<keyof ${rowTypeName}, string>;
                export type  ${valueTypeName} = Extract<${rowTypeName}[${columnTypeName}], string | number>;
                
                export type ${whereTypeName} = {
                    ${Object.values(table)
                        .map((col) => {
                            return `${col.columnName}?: ${col.tsType} | ${whereTypeForColumn(col)};`;
                        })
                        .join(' ')}
                    AND?: Enumerable<${whereTypeName}>;
                    OR?: Enumerable<${whereTypeName}>;
                    NOT?: Enumerable<${whereTypeName}>;
                };
                
                
                export type ${orderByTypeName} = {
                    ${Object.values(table)
                        .map((col) => {
                            return `${col.columnName}?: Order;`;
                        })
                        .join(' ')}
                };
        `;
    }

    /**
     * Build a public interface for a loader
     * Can optionally include soft delete filtering
     * @param column
     * @param loaderName
     * @param softDeleteFilter
     */
    private loaderPublicMethod(column: ColumnDefinition, loaderName: string, softDeleteFilter: boolean) {
        const { columnName, tsType } = column;

        if (softDeleteFilter && this.softDeleteColumn)
            return `
            public async by${TableClientBuilder.PascalCase(
                columnName,
            )}(${columnName}: ${tsType}, includeDeleted = false) {
                    const row = await this.${loaderName}.load(${columnName});
                    if (row?.${this.softDeleteColumn} && !includeDeleted) return null;
                    return row;
                }
        `;

        return `
            public by${TableClientBuilder.PascalCase(columnName)}(${columnName}: ${tsType}) {
                    return this.${loaderName}.load(${columnName});
                }
        `;
    }

    /**
     *   // TODO:- compound loader is a more general case so maybe don't need this?
     * //  TODO  - Localise public methods
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     */
    private addByColumnLoader(column: ColumnDefinition) {
        const { rowTypeName } = this.typeNames;

        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;

        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<${column.tsType}, ${rowTypeName} | null>(ids => {
                    return this.byColumnLoader({ column: '${columnName}', keys: ids });
                });
                
                ${this.loaderPublicMethod(column, loaderName, true)}
            `);
    }
    // take list of unique keys
    // take all permutations of keys
    // remove those which contain a unique key

    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param columns
     */
    private addCompoundByColumnLoader(columns: ColumnDefinition[]) {
        const { rowTypeName } = this.typeNames;

        const colNames = columns.map((col) => TableClientBuilder.PascalCase(col.columnName));
        const keyType = `{ ${columns.map((col) => `${col.columnName}: ${col.tsType}`)} }`;

        const loaderName = `${this.entityName}By${colNames.join('And')}Loader`;

        this.loaders.push(`
                 private readonly ${loaderName} = new DataLoader<${keyType}, ${rowTypeName} | null>(keys => {
                    return this.byCompoundColumnLoader({ keys });
                });
                
            `);

        // private readonly FeedbackByPostIdAndUserIdLoader = new DataLoader<
        //     { user_id: number; post_id: number },
        //     FeedbackDTO | null
        // >((ids) => {
        //     return this.loadFeedback(ids);
        // });

        // if (softDeleteFilter && this.softDeleteColumn)
        //     return `
        //     public async by${TableClientBuilder.PascalCase(
        //         columnName,
        //     )}(${columnName}: ${tsType}, includeDeleted = false) {
        //             const row = await this.${loaderName}.load(${columnName});
        //             if (row?.${this.softDeleteColumn} && !includeDeleted) return null;
        //             return row;
        //         }
        // `;
    }

    /** TODO:- this should allow ordering on response - may need to change data loader to execute multiple times for each ordering specified
     * Build a loader to load many rows for each key
     * At the moment, this always filters out soft deleted rows
     * @param column
     */
    private addManyByColumnLoader(column: ColumnDefinition) {
        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;

        this.loaders.push(`
                private readonly ${loaderName} = new DataLoader<${column.tsType}, ${
            this.typeNames.rowTypeName
        }[]>(ids => {
                return this.manyByColumnLoader({ column: '${columnName}', keys: ids, orderBy: ['${columnName}'], filterSoftDelete: ${
            this.softDeleteColumn ? 'true' : 'false'
        } });
             });
             
            ${this.loaderPublicMethod(column, loaderName, false)}

        `);
    }
}
