import * as db from '../../lib/db';
import config from '../../config/config';
import path from 'path';
import _ from 'lodash';
// @ts-ignore
import { format } from 'prettier';
import fs from 'fs-extra';
import { LoaderBuilder } from './LoaderBuilder';
import { ColumnDefinition, KeyColumn } from './types';
import { SchemaIntrospect } from './SchemaIntrospect';
import { TypeBuilder } from './TypeBuilder';
import { CardinalityResolver } from './CardinalityResolver';

// **************************
// setup
// **************************
const OUT_DIR = process.argv[2];
// const OUT_DIR = 'src/lib/Ent';
const CURRENT = process.cwd();

// console.log(OUT_DIR);

let dbConfig = config.get('db');
db.connect(dbConfig);
const prettier_conf = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
};

// const ENT_DIR = path.join(__dirname, '..', '..', 'lib', 'Ent');
const ENT_DIR = path.join(CURRENT, OUT_DIR);
const GENERATED_LOADERS_DIR = path.join(ENT_DIR, 'Gen');
const GENERATED_TYPES_DIR = path.join(ENT_DIR, 'Types');

function dbConnectionString(): string {
    const { database, user, password, port, host } = dbConfig;
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

async function generateTypes(): Promise<void> {
    const DB = new SchemaIntrospect(await db.pool().getConnection(), dbConfig.database);

    const tables = await DB.getSchemaTables();

    const typeBuilder = new TypeBuilder(dbConnectionString(), tables);

    // write index
    await fs.writeFile(
        path.join(GENERATED_TYPES_DIR, 'index.ts'),
        format(
            `
               import * as DBRowTypes from './db-schema';
               import { DBTables, DBTableName } from './db-tables';
               export { DBRowTypes, DBTableName, DBTables };
        `,
            { parser: 'typescript', ...prettier_conf },
        ),
    );

    const types = await typeBuilder.generateRowTypes();

    // write types
    await fs.writeFile(
        path.join(GENERATED_TYPES_DIR, 'db-schema.ts'),
        format(types, { parser: 'typescript', ...prettier_conf }),
    );

    // write tables
    await fs.writeFile(
        path.join(GENERATED_TYPES_DIR, 'db-tables.ts'),
        format(await typeBuilder.generateTableTypes(), {
            parser: 'typescript',
            ...prettier_conf,
        }),
    );
}

async function generateLoaders(): Promise<string[]> {
    await generateTypes();

    const DB = new SchemaIntrospect(await db.pool().getConnection(), dbConfig.database);

    console.log(`Reading from: ${dbConnectionString()}`);

    let builders: LoaderBuilder[] = [];

    const tables = await DB.getSchemaTables();
    // const primaryKeys = await DB.getPrimaryKeys();
    const keys = await DB.getKeys();

    for (let table of tables) {
        const builder = new LoaderBuilder(table);
        builders.push(builder);
        const OUT_LOADER_PATH = path.join(GENERATED_LOADERS_DIR, `${builder.EntName}.ts`);

        const columns = await DB.getTableTypes(table);
        const hasSoftDelete = columns['deleted'] != null;

        const tableKeys = keys[table];

        // filter duplicate columns
        const uniqueKeys = _.keyBy(tableKeys, 'columnName');

        Object.values(uniqueKeys).forEach((key: KeyColumn) => {
            const { columnName } = key;

            const column: ColumnDefinition = columns[columnName];

            // for now only accept loaders on string and number column types
            if (column.tsType !== 'string' && column.tsType !== 'number') return;

            const isMany = CardinalityResolver.isToMany(columnName, tableKeys);
            if (!isMany) builder.addByColumnLoader(column, hasSoftDelete);
            else builder.addManyByColumnLoader(column, hasSoftDelete);
        });

        builder.addFindMany(hasSoftDelete);

        // append creates files if they don't exist - write overwrites contents
        await fs.appendFile(OUT_LOADER_PATH, '');
        await fs.writeFile(OUT_LOADER_PATH, format(builder.compile(), { parser: 'typescript', ...prettier_conf }));
    }

    // build index.ts
    let imports = ``;
    let loaders = ``;

    builders.map(builder => {
        imports += `import ${builder.LoaderName}, { ${builder.RowTypeName} } from './Gen/${builder.EntName}';`;
        loaders += `${builder.LoaderName}: new ${builder.LoaderName}(),`;
    });
    const entLoaders = `
        export const EntLoader = () => {
        return {
            ${loaders}
            }
        }
        export type EntLoader = ReturnType<typeof EntLoader>;
    `;
    await fs.appendFile(path.join(ENT_DIR, 'index.ts'), '');
    await fs.writeFile(
        path.join(ENT_DIR, 'index.ts'),
        format(imports + entLoaders, {
            parser: 'typescript',
            ...prettier_conf,
        }),
    );

    await db.pool().end();

    return tables;
}

generateTypes()
    .then(() => generateLoaders())
    .then(tables => {
        console.log(`Loaders generated for ${tables.length} tables.`);
        return db.pool().end();
    })
    .catch(e => {
        console.error('Could not gen loaders', e);
        process.exit(1);
    })
    .finally(() => {
        process.exit();
    });
