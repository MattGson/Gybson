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

        // const loadKeyType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        let methodParamType = `${columns.map((col) => `${col.columnName}: ${col.tsType}`)};`;
        if (softDeleteColumn) methodParamType += 'includeDeleted?: boolean;';

        let loadFiltersSpread = `${colNames.join(',')}`;
        const loaderName = colNames.map((name) => PascalCase(name)).join('And');

        return {
            // loadKeyType,
            methodParamType,
            loadFiltersSpread,
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
        // rowTypeName: string;
        softDeleteColumn?: ColumnDefinition;
    }): string {
        const { methodParamType, loadFiltersSpread, loaderName } = BatchLoaderBuilder.getLoadParams(params);
        return `
                 public async oneBy${loaderName}(params: { ${methodParamType} }) {
                    const { ${loadFiltersSpread}, ...options } = params;
                    return this.loader.loadOne({ ${loadFiltersSpread} }, options);
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
        softDeleteColumn?: ColumnDefinition;
        orderByTypeName: string;
    }): string {
        return `const a = "${params}"`;
        // const { rowTypeName, softDeleteColumn, orderByTypeName } = params;
        // const { loadKeyType, methodParamType, methodParamSpread, loaderName } = BatchLoaderBuilder.getLoadParams(
        //     params,
        // );
        //
        // return `
        //         private readonly by${loaderName}Loader = new DataLoader<{ ${loadKeyType} orderBy?: ${orderByTypeName} }, ${rowTypeName}[], string>(keys => {
        //             const [{ orderBy }] = keys;
        //             const order = { ...orderBy }; // copy to retain
        //             keys.map(k => delete k.orderBy); // remove key so its not included as a load param
        //             // apply the first ordering to all - may need to change data loader to execute multiple times for each ordering specified
        //             return this.manyByCompoundColumnLoader({ keys, orderBy: order });
        //         }, {
        //             cacheKeyFn: (k) => Object.values(k).join(':')
        //         });
        //
        //          public async manyBy${loaderName}(params: { ${methodParamType} orderBy?: ${orderByTypeName} }) {
        //             const { ${methodParamSpread}, orderBy } = params;
        //             const rows = await this.by${loaderName}Loader.load({ ${methodParamSpread}, orderBy });
        //             ${
        //                 softDeleteColumn
        //                     ? `
        //             if (params.includeDeleted) return rows;
        //             return rows.filter(row => !row.${softDeleteColumn.columnName});`
        //                     : 'return rows;'
        //             }
        //         }
        //     `;
    }
}
