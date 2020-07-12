export declare class TypeBuilder {
    private tables;
    private connectionString;
    constructor(connectionString: string, tables: string[]);
    generateRowTypes(): Promise<string>;
    generateTableTypes(): Promise<string>;
}
