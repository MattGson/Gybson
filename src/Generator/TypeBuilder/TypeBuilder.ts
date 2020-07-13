import { EnumDefinitions, Introspection, TableDefinition } from '../Introspection/IntrospectionTypes';
import _ from 'lodash';

interface BuilderOptions {
    rowTypeSuffix: string;
}

export class TypeBuilder {
    private readonly tables: string[];
    private readonly enums: EnumDefinitions;
    private readonly options: BuilderOptions;

    public constructor(tables: string[], enums: EnumDefinitions, options: BuilderOptions) {
        this.tables = tables;
        this.options = options;
        this.enums = enums;
    }

    /**
     * Build types for schema
     * @param introspection
     */
    public async build(introspection: Introspection): Promise<string> {
        let content = ``;

        content += TypeBuilder.generateEnumType(this.enums);

        for (let table of this.tables) {
            const columns = await introspection.getTableTypes(table, this.enums);
            const tableTypes = await this.generateTableTypes(table, columns);
            const tableRow = await this.generateTableInterface(table, columns);

            content += tableTypes;
            content += tableRow;
        }

        content += this.generateTableList();
        return content;
    }

    /**
     * Change names of types to remove any reserved words
     * @param name
     */
    private static normalizeName(name: string): string {
        const reservedKeywords = ['string', 'number', 'package', 'symbol'];
        const reserved = reservedKeywords.indexOf(name) !== -1;

        if (reserved) {
            return name + '_';
        } else {
            return name;
        }
    }

    /**
     * Get the field type map for a table
     * @param tableName
     * @param tableDefinition
     */
    private generateTableTypes(tableName: string, tableDefinition: TableDefinition) {
        let fields = '';
        Object.keys(tableDefinition).forEach((columnName) => {
            let type = tableDefinition[columnName].tsType;
            let nullable = tableDefinition[columnName].nullable ? '| null' : '';
            fields += `export type ${TypeBuilder.normalizeName(columnName)} = ${type}${nullable};\n`;
        });

        return `
        export namespace ${tableName}Fields {
        ${fields}
        }
    `;
    }

    /**
     * Get the row typing for a table
     * @param tableName
     * @param tableDefinition
     */
    private generateTableInterface(tableName: string, tableDefinition: TableDefinition) {
        let members = '';
        Object.keys(tableDefinition).forEach((columnName) => {
            members += `${columnName}: ${tableName}Fields.${TypeBuilder.normalizeName(columnName)};\n`;
        });

        return `
        export interface ${TypeBuilder.normalizeName(tableName)} {
        ${members}
        }
    `;
    }

    /**
     * Convert enum object to type definitions
     * @param enumObject
     */
    private static generateEnumType(enumObject: EnumDefinitions) {
        let enumString = '';
        console.log('Building enums: ', enumObject);
        for (let enumName in Object.keys(enumObject)) {
            enumString += `export type ${enumName} = `;
            enumString += enumObject[enumName].map((v: string) => `'${v}'`).join(' | ');
            enumString += ';\n';
        }
        return enumString;
    }

    /**
     * Get list of all tables with types
     */
    private async generateTableList(): Promise<string> {
        const tableRows = this.tables.reduce((result: string[], tbl) => {
            return result.concat(`${tbl}: dbt.${tbl};`);
        }, []);

        return `
      export interface DBTables {
        ${tableRows.join('\n')}
      }

      export type DBTableName = Extract<keyof DBTables, string>;
    `;
    }
}
