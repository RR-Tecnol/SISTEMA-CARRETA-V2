const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sistema_carretas'
});

async function createBackup() {
    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');

        // Get all tables
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup_database_${timestamp}.sql`;
        let sqlDump = `-- PostgreSQL Database Backup\n`;
        sqlDump += `-- Database: sistema_carretas\n`;
        sqlDump += `-- Date: ${new Date().toISOString()}\n\n`;

        // For each table, get CREATE TABLE and INSERT statements
        for (const row of tablesResult.rows) {
            const tableName = row.tablename;
            console.log(`📦 Exportando tabela: ${tableName}`);

            // Get table data
            const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

            if (dataResult.rows.length > 0) {
                sqlDump += `\n-- Table: ${tableName}\n`;

                for (const dataRow of dataResult.rows) {
                    const columns = Object.keys(dataRow);
                    const values = columns.map(col => {
                        const val = dataRow[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        return val;
                    });

                    sqlDump += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
                }
            }
        }

        fs.writeFileSync(filename, sqlDump);
        console.log(`\n✅ Backup criado com sucesso: ${filename}`);
        console.log(`📊 Tamanho: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('❌ Erro ao criar backup:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createBackup();
