export const itif = (condition: boolean) => (condition ? it : it.skip);
export const describeif = (condition: boolean) => (condition ? describe : describe.skip);

export const DB = (): 'mysql' | 'pg' => {
    const db = process.env.DB;
    if (db !== 'mysql' && db !== 'pg') throw new Error('DB must be pg or mysql');
    return db;
};
