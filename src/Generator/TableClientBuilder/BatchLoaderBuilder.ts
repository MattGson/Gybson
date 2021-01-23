import { ColumnDefinition } from '../../TypeTruth';
import { PascalCase } from '../lib';

export class BatchLoaderBuilder {
    /**
     * Get the loader configuration for a column combination
     * @param params
     */
    public static getLoadParams(params: { loadColumns: ColumnDefinition[]; softDeleteColumn?: ColumnDefinition }) {
        const { loadColumns: columns, softDeleteColumn } = params;

        const colNames = columns.map((col) => col.columnName);

        let methodParamType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        if (softDeleteColumn) methodParamType += 'includeDeleted?: boolean;';

        let loadFiltersSpread = `${colNames.join(',')}`;
        const loaderName = colNames.map((name) => PascalCase(name)).join('And');

        const uniqueLoadFilter = ((cols: ColumnDefinition[]) => {
                if (cols.length == 1) return cols[0].columnName;
                const name = cols.map((c) => c.columnName).join('__');
                return `
                        ${name}?: {
                            ${loadFiltersSpread}
                        }
                    `;
            })(columns);

        return {
            methodParamType,
            loadFiltersSpread,
            uniqueLoadFilter,
            loaderName,
        };
    }

    /**
     * Build a loader to load a single row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param params
     */
    public static getOneByColumnLoader(params: {
        loadColumns: ColumnDefinition[];
        softDeleteColumn?: ColumnDefinition;
    }): string {
        const { methodParamType, loadFiltersSpread, uniqueLoadFilter, loaderName } = BatchLoaderBuilder.getLoadParams(params);
        return `
                public async oneBy${loaderName}(params: { ${methodParamType} }) {
                    const { ${loadFiltersSpread}, ...options } = params;
                    return this.loadOne({ where: { ${uniqueLoadFilter} }, ...options });
                }
            `;
    }

    /**
     * Build a loader to load multiple row for a compound key
     * Gives the caller choice on whether to include soft deleted rows
     * @param params
     */
    public static getManyByColumnLoader(params: {
        loadColumns: ColumnDefinition[];
        softDeleteColumn?: ColumnDefinition;
        orderByTypeName: string;
    }): string {
        const { orderByTypeName } = params;
        const { methodParamType, loadFiltersSpread, loaderName } = BatchLoaderBuilder.getLoadParams(params);

        return `
                 public async manyBy${loaderName}(params: { ${methodParamType} orderBy?: ${orderByTypeName} }) {
                    const { ${loadFiltersSpread}, ...options } = params;
                    return this.loadMany({ where: { ${loadFiltersSpread} }, ...options });
                }
            `;
    }
}
