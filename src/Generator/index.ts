import path from 'path';
import _ from 'lodash';
// @ts-ignore
import { format } from 'prettier';
import fs from 'fs-extra';
import { mysql, prettier, codeGenPreferences } from './config';
import Knex from 'knex';
import { MySQLIntrospection } from './Introspection/MySQLIntrospection';
import { TableClientBuilder } from './TableClientBuilder';
// **************************
// setup
// **************************
// const OUT_DIR = process.argv[2];
// const CURRENT = process.cwd();

// const ENT_DIR = path.join(__dirname, '..', '..', 'lib', 'Ent');
// const ENT_DIR = path.join(CURRENT, OUT_DIR);
// const GENERATED_DIR = path.join(CURRENT, '..', '..', 'Client', 'Gen');
const GENERATED_DIR_CLIENTS = path.join(__dirname, '..', 'Client', 'Gen', 'Clients');

const knex = Knex({
    client: 'mysql',
    connection: mysql,
});

/**
 * Write to a typescript file
 * @param content
 * @param directory
 * @param filename
 */
async function writeTypescriptFile(content: string, directory: string, filename: string) {
    // append creates files if they don't exist - write overwrites contents
    await fs.appendFile(path.join(directory, filename), '');
    await fs.writeFile(path.join(directory, filename), format(content, { parser: 'typescript', ...prettier }));
}

// **************************
// generate types
// **************************

// function dbConnectionString(): string {
//     const { database, user, password, port, host } = my;
//     return `mysql://${user}:${password}@${host}:${port}/${database}`;
// }

async function generateTypes(): Promise<void> {
    const DB = new MySQLIntrospection(knex, mysql.database);

    const tables = await DB.getSchemaTables();
    console.log(tables);
    //
    // const typeBuilder = new TypeBuilder(dbConnectionString(), tables);
    //
    // // write index
    // await fs.writeFile(
    //     path.join(GENERATED_DIR, 'index.ts'),
    //     format(
    //         `
    //            import * as DBRowTypes from './db-schema';
    //            import { DBTables, DBTableName } from './db-tables';
    //            export { DBRowTypes, DBTableName, DBTables };
    //     `,
    //         { parser: 'typescript', ...prettier_conf },
    //     ),
    // );
    //
    // const rowTypes = await typeBuilder.generateRowTypes();
    // const tableTypes = await typeBuilder.generateTableTypes();
    //
    // await writeTypescriptFile(rowTypes, GENERATED_DIR, 'db-schema.ts');
    // await writeTypescriptFile(tableTypes, GENERATED_DIR, 'db-tables.ts');
}

// **************************
// generate loaders
// **************************

async function generateLoaders(): Promise<string[]> {
    const DB = new MySQLIntrospection(knex, mysql.database);

    console.log(`Reading from: mysql://${mysql.user}:${mysql.password}@${mysql.host}:${mysql.port}/${mysql.database}`);

    const builders: TableClientBuilder[] = [];

    const tables = await DB.getSchemaTables();

    for (let table of tables) {
        const builder = new TableClientBuilder(table, codeGenPreferences);
        builders.push(builder);
        // const OUT_LOADER_PATH = path.join(GENERATED_DIR, `${builder.className}.ts`);

        // const columns = await DB.getTableTypes(table);
        // const hasSoftDelete = columns['deleted'] != null;
        //
        // const tableKeys = keys[table];
        //
        // // filter duplicate columns
        // const uniqueKeys = _.keyBy(tableKeys, 'columnName');
        //
        // Object.values(uniqueKeys).forEach((key: KeyColumn) => {
        //     const { columnName } = key;
        //
        //     const column: ColumnDefinition = columns[columnName];
        //
        //     // for now only accept loaders on string and number column types
        //     if (column.tsType !== 'string' && column.tsType !== 'number') return;
        //
        //     const isMany = CardinalityResolver.isToMany(columnName, tableKeys);
        //     if (!isMany) builder.addByColumnLoader(column, hasSoftDelete);
        //     else builder.addManyByColumnLoader(column, hasSoftDelete);
        // });
        //
        // builder.addFindMany(hasSoftDelete);

        // append creates files if they don't exist - write overwrites contents
        await writeTypescriptFile(await builder.build(DB), GENERATED_DIR_CLIENTS, `${builder.className}.ts`);
    }

    // // build index.ts
    // let imports = ``;
    // let loaders = ``;
    //
    // builders.map((builder) => {
    //     imports += `import ${builder.LoaderName}, { ${builder.RowTypeName} } from './Gen/${builder.EntName}';`;
    //     loaders += `${builder.LoaderName}: new ${builder.LoaderName}(),`;
    // });
    // const entLoaders = `
    //     export const EntLoader = () => {
    //     return {
    //         ${loaders}
    //         }
    //     }
    //     export type EntLoader = ReturnType<typeof EntLoader>;
    // `;
    // await fs.appendFile(path.join(ENT_DIR, 'index.ts'), '');
    // await fs.writeFile(
    //     path.join(ENT_DIR, 'index.ts'),
    //     format(imports + entLoaders, {
    //         parser: 'typescript',
    //         ...prettier_conf,
    //     }),
    // );

    return tables;
}

// TODO:-  change this for a cli
generateTypes()
    .then(() => generateLoaders())
    .then((tables) => {
        console.log(`Client generated for ${tables.length} tables.`);
        return knex.destroy();
    })
    .catch((e) => {
        console.error('Could not gen client', e);
        process.exit(1);
    })
    .finally(() => {
        process.exit();
    });
