import _ from 'lodash';
import { Introspection, KeyDefinition, ColumnDefinition, EnumDefinitions } from '../Introspection/IntrospectionTypes';
import { CardinalityResolver } from './CardinalityResolver';

interface BuilderOptions {
    rowTypeSuffix: string;
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
        partialRowTypeName: string;
    };
    public readonly className: string;
    public readonly table: string;
    private readonly enums: EnumDefinitions;
    private loaders: string[] = [];

    public constructor(table: string, enums: EnumDefinitions, options: BuilderOptions) {
        this.entityName = TableClientBuilder.PascalCase(table);
        this.table = table;
        this.enums = enums;
        this.className = `${this.entityName}`;
        this.typeNames = {
            rowTypeName: `${this.className}${options.rowTypeSuffix || 'Row'}`,
            columnTypeName: `${this.className}Column`,
            valueTypeName: `${this.className}Value`,
            partialRowTypeName: `${this.className}RowPartial`,
        };
    }

    private static PascalCase(name: string) {
        return _.upperFirst(_.camelCase(name));
    }

    public async build(introspection: Introspection): Promise<string> {
        const columns = await introspection.getTableTypes(this.table, this.enums);
        const hasSoftDelete = columns['deleted'] != null;

        const tableKeys = await introspection.getTableKeys(this.table);
        // filter duplicate columns
        const uniqueKeys = _.keyBy(tableKeys, 'columnName');

        Object.values(uniqueKeys).forEach((key: KeyDefinition) => {
            const { columnName } = key;

            const column: ColumnDefinition = columns[columnName];

            // for now only accept loaders on string and number column types
            if (column.tsType !== 'string' && column.tsType !== 'number') return;

            const isMany = CardinalityResolver.isToMany(columnName, tableKeys);
            if (!isMany) this.addByColumnLoader(column, hasSoftDelete);
            else this.addManyByColumnLoader(column, hasSoftDelete);
        });

        this.addFindMany(hasSoftDelete);

        return this.buildTemplate(
            this.loaders.join(`
        
        `),
        );
    }

    private buildTemplate(content: string) {
        // TODO:- this should be in type gen
        const { rowTypeName, columnTypeName, valueTypeName, partialRowTypeName } = this.typeNames;
        return `
            import DataLoader = require('dataloader');
            import { byColumnLoader, manyByColumnLoader, findManyLoader } from 'nodent';
            import { ${this.table} } from './db-schema';

            export type ${rowTypeName} = ${this.table};
            export type ${columnTypeName} = Extract<keyof ${rowTypeName}, string>;
            export type  ${valueTypeName} = Extract<${rowTypeName}[${columnTypeName}], string | number>;
            export type  ${partialRowTypeName} = Partial<${rowTypeName}>;

             export default class ${this.className} {
                ${content}
            }
            `;
    }

    /**
     * Build a public interface for a loader
     * Can optionally include soft delete filtering
     * @param column
     * @param loaderName
     * @param hasSoftDelete
     */
    private static loaderPublicMethod(column: ColumnDefinition, loaderName: string, hasSoftDelete: boolean) {
        const { columnName, tsType } = column;

        if (hasSoftDelete)
            return `
            public async by${TableClientBuilder.PascalCase(
                columnName,
            )}(${columnName}: ${tsType}, includeDeleted = false) {
                    const row = await this.${loaderName}.load(${columnName});
                    if (row?.deleted && !includeDeleted) return null;
                    return row;
                }
        `;

        return `
            public by${TableClientBuilder.PascalCase(columnName)}(${columnName}: ${tsType}) {
                    return this.${loaderName}.load(${columnName});
                }
        `;
    }

    /** // TODO:- add compound key loaders i.e. orgMembers.byOrgIdAndUserId()
     * Build a loader to load a single row for each key
     * Gives the caller choice on whether to include soft deleted rows
     * @param column
     * @param hasSoftDelete
     */
    private addByColumnLoader(column: ColumnDefinition, hasSoftDelete: boolean) {
        const { rowTypeName, columnTypeName, valueTypeName } = this.typeNames;

        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;

        this.loaders.push(`
              /* Notice that byColumn loader might return null for some keys */
                 private readonly ${loaderName} = new DataLoader<${column.tsType}, ${rowTypeName} | null>(ids => {
                    return byColumnLoader<${rowTypeName}, ${columnTypeName}, ${valueTypeName}>('${
            this.table
        }', '${columnName}', ids, false);
                });
                
                ${TableClientBuilder.loaderPublicMethod(column, loaderName, hasSoftDelete)}
            `);
    }

    /**
     * Build a loader to load many rows for each key
     * At the moment, this always filters out soft deleted rows
     * @param column
     * @param hasSoftDelete
     */
    private addManyByColumnLoader(column: ColumnDefinition, hasSoftDelete: boolean) {
        const { rowTypeName, columnTypeName, valueTypeName } = this.typeNames;
        const { columnName } = column;
        const loaderName = `${this.entityName}By${TableClientBuilder.PascalCase(columnName)}Loader`;

        this.loaders.push(`
                private readonly ${loaderName} = new DataLoader<${column.tsType}, ${
            this.typeNames.rowTypeName
        }[]>(ids => {
                return manyByColumnLoader<${rowTypeName}, ${columnTypeName}, ${valueTypeName}>('${
            this.table
        }', '${columnName}', ids, ['${columnName}'], ${hasSoftDelete ? 'true' : 'false'});
             });
             
            ${TableClientBuilder.loaderPublicMethod(column, loaderName, false)}

        `);
    }

    /**
     * Build a loader to query rows from a table.
     * Doesn't use batching or caching as this is very hard to support.
     * Gives the option of including soft deleted rows
     * // TODO:-
     *     - cursor pagination,
     *     - ordering - multiple directions and columns?, remove string constants?
     *     - Joins (join filtering), eager load?
     *     type defs
     *      - gen more comprehensive types for each table i.e. SelectionSet
     *      - Split the type outputs by table maybe? Alias to more usable names
     * @param hasSoftDelete
     */
    private addFindMany(hasSoftDelete: boolean) {
        const { columnTypeName, rowTypeName, partialRowTypeName } = this.typeNames;
        this.loaders.push(`
            public findMany
            <${columnTypeName}, ${partialRowTypeName}>
             (options: {
            orderBy?: { columns: ${columnTypeName}[]; asc?: boolean; desc?: boolean; };
            where?: ${partialRowTypeName};
            ${hasSoftDelete ? 'includeDeleted?: boolean' : 'includeDeleted?: false'}
            }): Promise<${rowTypeName}[]> {
                    return findManyLoader({ tableName: '${this.table}', options, hasSoftDelete: ${
            hasSoftDelete ? 'true' : 'false'
        }});
                }
        `);
    }
}
