import { SoftDeleteQueryFilter, SoftDeletable } from '../../TypeTruth/QueryTypes';

type RowMiddleware = <T>(rows: T[], params: SoftDeleteQueryFilter) => T[];

const SoftDeleteMiddleware: RowMiddleware = (rows, params) => {
    return rows.filter((row: SoftDeletable) => {
        if (row?.deleted && !params.includeDeleted) return false;
        if (row?.deleted_at && !params.includeDeleted) return false;
        return !(row?.deletedAt && !params.includeDeleted);
    });
};

// could configure with custom middleware in the future
const middlewares = [SoftDeleteMiddleware];

export const runMiddleWares = <T>(rows: T[], params: any): T[] => {
    let result = [...rows];
    middlewares.forEach((m) => (result = m(result, params)));
    return result;
};
