import { EnumDefinitions, Introspection, TableColumnsDefinition } from './IntrospectionTypes';
import {
    ColumnType,
    Comparable,
    ConstraintDefinition,
    NonComparable,
    RelationDefinition,
} from '../../TypeTruth';
import _ from 'lodash';
import Knex = require('knex');

export class PostgresIntrospection implements Introspection {
    private readonly schemaName: string;
    private knex: Knex;

    public constructor(knex: Knex, schemaName?: string) {
        this.knex = knex;
        if (schemaName) this.schemaName = schemaName;
        else this.schemaName = 'public';
    }

    public getTsTypeForColumn(
        tableName: string,
        columnName: string,
        dbType: string,
        customTypes: EnumDefinitions,
    ): ColumnType {
        switch (dbType) {
            case 'bpchar':
            case 'char':
            case 'varchar':
            case 'text':
            case 'citext':
            case 'uuid':
            case 'bytea':
            case 'inet':
            case 'time':
            case 'timetz':
            case 'interval':
            case 'name':
                return Comparable.string;
            case 'int2':
            case 'int4':
            case 'int8':
            case 'float4':
            case 'float8':
            case 'numeric':
            case 'money':
            case 'oid':
                return Comparable.number;
            case 'bool':
                return Comparable.boolean;
            case 'json':
            case 'jsonb':
                return NonComparable.Object;
            case 'date':
            case 'timestamp':
            case 'timestamptz':
                return Comparable.Date;
            case '_int2':
            case '_int4':
            case '_int8':
            case '_float4':
            case '_float8':
            case '_numeric':
            case '_money':
                return NonComparable.ArrayNum;
            case '_bool':
                return NonComparable.ArrayBool;
            case '_varchar':
            case '_text':
            case '_citext':
            case '_uuid':
            case '_bytea':
                return NonComparable.ArrayStr;
            case '_json':
            case '_jsonb':
                return NonComparable.ArrayObj;
            case '_timestamptz':
                return NonComparable.ArrayDate;
            default:
                const possibleEnum = PostgresIntrospection.getEnumName(tableName, dbType);
                if (customTypes[possibleEnum]) {
                    return possibleEnum;
                } else {
                    console.log(
                        `Type [${columnName}] has been mapped to [any] because no specific type has been found.`,
                    );
                    return NonComparable.any;
                }
        }
    }

    /**
     * Get name of enum
     * @param tableName
     * @param enumName
     */
    private static getEnumName(tableName: string, enumName: string): string {
        return `${tableName}_${enumName}`;
    }

    // TODO:- need to support native enums and allowed values ideally
    /**
     * Get the enum types used by a table
     * @param tableName
     */
    public async getEnumTypesForTable(tableName: string): Promise<EnumDefinitions> {
        type rowType = {
            enum_name: string;
            value: string;
            oid: number;
        };
        const result = await this.knex.raw(`
            select t.typname as enum_name, e.enumlabel as value, t.oid 
            from pg_type t
            inner join pg_enum e ON (t.oid = e.enumtypid) 
            inner join pg_catalog.pg_namespace n ON (n.oid = t.typnamespace) 
            where n.nspname = '${this.schemaName}';
        `);

        const rows: rowType[] = result.rows;
        const enumRows = _.groupBy(rows, (r) => r.oid);

        let enums: EnumDefinitions = {};
        for (let [oid, values] of Object.entries(enumRows)) {
            const [{ enum_name }] = values;
            const enumName = PostgresIntrospection.getEnumName(tableName, enum_name);
            enums[enumName] = {
                enumName,
                values: values.map((v) => v.value).sort(),
                columnName: '', // TODO:- how to link to table? info schema udt_name ?
            };
        }
        return enums;
    }

    /**
     * Get the type definition for a table
     * @param tableName
     * @param enumTypes
     */
    public async getTableTypes(tableName: string, enumTypes: EnumDefinitions): Promise<TableColumnsDefinition> {
        let tableDefinition: TableColumnsDefinition = {};

        const tableColumns = await this.knex('information_schema.columns')
            .select('column_name', 'udt_name', 'is_nullable', 'column_default')
            .where({ table_name: tableName, table_schema: this.schemaName });

        tableColumns.map(
            (schemaItem: {
                column_name: string;
                udt_name: string;
                is_nullable: string;
                column_default: string | null;
            }) => {
                const columnName = schemaItem.column_name;
                const dbType = schemaItem.udt_name;
                tableDefinition[columnName] = {
                    dbType,
                    columnDefault: schemaItem.column_default,
                    nullable: schemaItem.is_nullable === 'YES',
                    columnName,
                    tsType: this.getTsTypeForColumn(tableName, columnName, dbType, enumTypes),
                };
            },
        );
        return tableDefinition;
    }

    public async getTableConstraints(tableName: string): Promise<ConstraintDefinition[]> {
        const rows = await this.knex('information_schema.key_column_usage as key_usage')
            .select(
                'key_usage.table_name',
                'key_usage.column_name',
                'key_usage.constraint_name',
                'constraints.constraint_type',
            )
            .distinct()
            .leftJoin('information_schema.table_constraints as constraints', function () {
                this.on('key_usage.constraint_name', '=', 'constraints.constraint_name');
                this.andOn('key_usage.constraint_schema', '=', 'constraints.constraint_schema');
                this.andOn('key_usage.table_name', '=', 'constraints.table_name');
            })

            .where({ 'key_usage.table_name': tableName, 'key_usage.table_schema': this.schemaName });

        // group by constraint name
        const columnMap = _.groupBy(rows, (k) => k.constraint_name);
        const constraintMap = _.keyBy(rows, (k) => k.constraint_name);

        const constraintDefinitions: ConstraintDefinition[] = [];

        Object.values(constraintMap).forEach((constraint) => {
            const { constraint_type, constraint_name } = constraint;
            const columns = columnMap[constraint_name];

            constraintDefinitions.push({
                constraintName: constraint_name,
                constraintType: constraint_type,
                columnNames: columns.map((c) => c.column_name).sort(),
            });
        });
        return constraintDefinitions;
    }

    /**
     * Get all relations where the given table holds the constraint (N - 1 or 1 - 1) i.e. Posts.user_id -> Users.user_id
     * @param tableName
     */
    public async getForwardRelations(tableName: string): Promise<RelationDefinition[]> {
        type rowType = {
            constraint_name: string;
            table_name: string;
            column_name: string;
            referenced_table_name: string;
            referenced_column_name: string;
        };

        const result: { rows: rowType[] } = await this.knex.raw(`
            select c.constraint_name
                , x.table_name
                , x.column_name
                , y.table_name as referenced_table_name
                , y.column_name as referenced_column_name
            from information_schema.referential_constraints c
            join information_schema.key_column_usage x
                on x.constraint_name = c.constraint_name
            join information_schema.key_column_usage y
                on y.ordinal_position = x.position_in_unique_constraint
                and y.constraint_name = c.unique_constraint_name
            WHERE x.table_name = '${tableName}'
            order by c.constraint_name, x.ordinal_position
        `);

        // group by constraint name to capture multiple relations to same table
        let relations: { [constraintName: string]: RelationDefinition } = {};
        result.rows.forEach((row) => {
            const { column_name, referenced_table_name, referenced_column_name, constraint_name } = row;
            if (referenced_table_name == null || referenced_column_name == null) return;

            if (!relations[constraint_name])
                relations[constraint_name] = {
                    toTable: referenced_table_name,
                    alias: referenced_table_name,
                    joins: [],
                    type: 'belongsTo', // default always N - 1
                };
            relations[constraint_name].joins.push({
                fromColumn: column_name,
                toColumn: referenced_column_name,
            });
        });
        return Object.values(relations);
    }

    /**
     * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1) i.e. Users.user_id <- Posts.author_id
     * @param tableName
     */
    public async getBackwardRelations(tableName: string): Promise<RelationDefinition[]> {
        type rowType = {
            constraint_name: string;
            table_name: string;
            column_name: string;
            referenced_table_name: string;
            referenced_column_name: string;
        };

        const result: { rows: rowType[] } = await this.knex.raw(`
            select c.constraint_name
                , x.table_name
                , x.column_name
                , y.table_name as referenced_table_name
                , y.column_name as referenced_column_name
            from information_schema.referential_constraints c
            join information_schema.key_column_usage x
                on x.constraint_name = c.constraint_name
            join information_schema.key_column_usage y
                on y.ordinal_position = x.position_in_unique_constraint
                and y.constraint_name = c.unique_constraint_name
            WHERE y.table_name = '${tableName}'
            order by c.constraint_name, x.ordinal_position
        `);

        // group by constraint name to capture multiple relations to same table
        let relations: { [constraintName: string]: RelationDefinition } = {};
        result.rows.forEach((row) => {
            const { column_name, table_name, referenced_column_name, constraint_name } = row;
            if (table_name == null || column_name == null) return;

            if (!relations[constraint_name])
                relations[constraint_name] = {
                    toTable: table_name,
                    alias: table_name,
                    joins: [],
                    type: 'hasMany', // default always 1 - N
                };
            relations[constraint_name].joins.push({
                fromColumn: referenced_column_name,
                toColumn: column_name,
            });
        });
        return Object.values(relations);
    }

    /**
     * Get a list of all table names in schema
     */
    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = await this.knex('information_schema.columns')
            .select('table_name')
            .where({ table_schema: this.schemaName })
            .groupBy('table_name');

        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }
}
