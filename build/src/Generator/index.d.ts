interface Connection {
    client: 'mysql' | 'postgres';
    connection: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
}
export declare function generate(conn: Connection, outdir: string): Promise<void>;
export {};
