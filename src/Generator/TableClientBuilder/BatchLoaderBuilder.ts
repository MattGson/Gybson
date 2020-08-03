import { ColumnDefinition } from '../../TypeTruth/TypeTruth';
import { PascalCase } from '../lib';

export class BatchLoaderBuilder {
    /**
     * Get the loader configuration for a column combination
     * @param params
     */
    public static getLoadParams(params: { loadColumns: ColumnDefinition[]; softDeleteColumn?: string }) {
        const { loadColumns: columns, softDeleteColumn } = params;

        const colNames = columns.map((col) => col.columnName);

        const loadKeyType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        let methodParamType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        if (softDeleteColumn) methodParamType += 'includeDeleted?: boolean;';

        let methodParamSpread = `${colNames.join(',')}`;
        const loaderName = colNames.map((name) => PascalCase(name)).join('And');

        return {
            loadKeyType,
            methodParamType,
            methodParamSpread,
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
        rowTypeName: string;
        softDeleteColumn?: string;
    }): string {
        const { rowTypeName, softDeleteColumn } = params;
        const { loadKeyType, methodParamType, methodParamSpread, loaderName } = BatchLoaderBuilder.getLoadParams(
            params,
        );

        return `
                 private readonly by${loaderName}Loader = new DataLoader<{ ${loadKeyType} }, ${rowTypeName} | null>(keys => {
                    return this.byCompoundColumnLoader({ keys });
                });
                
                 public async oneBy${loaderName}(params: { ${methodParamType} }) {
                    const { ${methodParamSpread} } = params;
                    const row = await this.by${loaderName}Loader.load({ ${methodParamSpread} });
                    ${softDeleteColumn ? `if (row?.${softDeleteColumn} && !params.includeDeleted) return null;` : ''}
                    return row;
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
        rowTypeName: string;
        softDeleteColumn?: string;
        orderByTypeName: string;
    }): string {
        const { rowTypeName, softDeleteColumn, orderByTypeName } = params;
        const { loadKeyType, methodParamType, methodParamSpread, loaderName } = BatchLoaderBuilder.getLoadParams(
            params,
        );

        return `
                private readonly by${loaderName}Loader = new DataLoader<{ ${loadKeyType} orderBy?: ${orderByTypeName} }, ${rowTypeName}[]>(keys => {
                    const [{ orderBy }] = keys;
                    const order = { ...orderBy }; // copy to retain
                    keys.map(k => delete k.orderBy); // remove key so its not included as a load param
                    // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
                    return this.manyByCompoundColumnLoader({ keys, orderBy: order });
                }, {
                    // ignore order for cache equivalency - re-assess - will this compare objects properly?
                    cacheKeyFn: (k => ({...k, orderBy: {}}))
                });
                
                 public async manyBy${loaderName}(params: { ${methodParamType} orderBy?: ${orderByTypeName} }) {
                    const { ${methodParamSpread}, orderBy } = params;
                    const rows = await this.by${loaderName}Loader.load({ ${methodParamSpread}, orderBy });
                    ${
                        softDeleteColumn
                            ? `
                    if (params.includeDeleted) return rows;
                    return rows.filter(row => !row.${softDeleteColumn});`
                            : 'return rows;'
                    }
                }
            `;
    }
}
