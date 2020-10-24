import { Introspection } from '../../../src/Generator/Introspection/IntrospectionTypes';
import { buildDBSchemas, closeConnection, knex, schemaName } from '../../Setup/build-test-db';
import 'jest-extended';
import { BatchLoaderBuilder } from '../../../src/Generator/TableClientBuilder/BatchLoaderBuilder';
import {getIntrospection} from "../../Setup/test.env";

describe('BatchLoaderBuilder', () => {
    let intro: Introspection;
    beforeAll(
        async (): Promise<void> => {
            await buildDBSchemas();
            intro = getIntrospection(knex(), schemaName);
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    describe('getLoadParams', () => {
        it('Returns the correct params for a table with soft delete', async () => {
            const columns = [
                {
                    dbType: 'int',
                    nullable: false,
                    tsType: 'number',
                    columnName: 'user_id',
                    columnDefault: null,
                },
            ];
            const softDelete = {
                dbType: 'tinyint',
                nullable: false,
                tsType: 'boolean',
                columnName: 'deleted',
                columnDefault: '0',
            };

            const params = BatchLoaderBuilder.getLoadParams({ loadColumns: columns, softDeleteColumn: softDelete });
            expect(params).toEqual({
                loadKeyType: 'user_id: number;',
                methodParamType: 'user_id: number;includeDeleted?: boolean;',
                methodParamSpread: 'user_id',
                loaderName: 'UserId',
            });
        });
        it('Returns the correct params for a table without soft delete', async () => {
            const columns = [
                {
                    dbType: 'int',
                    nullable: false,
                    tsType: 'number',
                    columnName: 'user_id',
                    columnDefault: null
                },
            ];
            const params = BatchLoaderBuilder.getLoadParams({ loadColumns: columns });
            expect(params).toEqual({
                loadKeyType: 'user_id: number;',
                methodParamType: 'user_id: number;',
                methodParamSpread: 'user_id',
                loaderName: 'UserId',
            });
        });
        it('Returns the correct params for a a multi-column loader', async () => {
            const columns = [
                {
                    dbType: 'int',
                    nullable: false,
                    tsType: 'number',
                    columnName: 'user_id',
                    columnDefault: null
                },
                {
                    dbType: 'varchar',
                    nullable: true,
                    tsType: 'string',
                    columnName: 'first_name',
                    columnDefault: null
                },
            ];
            const params = BatchLoaderBuilder.getLoadParams({ loadColumns: columns });
            expect(params).toEqual({
                loadKeyType: 'user_id: number,first_name: string;',
                methodParamType: 'user_id: number,first_name: string;',
                methodParamSpread: 'user_id,first_name',
                loaderName: 'UserIdAndFirstName',
            });
        });
    });
});
