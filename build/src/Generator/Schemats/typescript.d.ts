/**
 * Created by Matt Goodson
 */
import { TableDefinition } from './schemaInterfaces';
import Options from './options';
export declare function generateTableInterface(tableNameRaw: string, tableDefinition: TableDefinition, options: Options): string;
export declare function generateEnumType(enumObject: any, options: Options): string;
export declare function generateTableTypes(tableNameRaw: string, tableDefinition: TableDefinition, options: Options): string;
