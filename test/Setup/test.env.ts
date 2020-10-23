export const DB = () => {
    const db = process.env.DB;
    if (db !== 'mysql' && db !== 'pg') throw new Error('DB must be pg or mysql');
    return db;
};
