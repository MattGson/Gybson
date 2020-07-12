/**
 * Nodent takes sql database schema and creates a corresponding typescript interface
 * Created by Matt Goodson
 */
import Options, { OptionValues } from './options';
export declare function typescriptOfTable(db: any | string, table: string, schema: string, options?: Options): Promise<string>;
export declare function typescriptOfSchema(db: any | string, tables?: string[], schema?: string | null, options?: OptionValues): Promise<string>;
export { Options, OptionValues };
