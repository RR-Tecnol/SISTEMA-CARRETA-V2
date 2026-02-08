// Script simplificado para criar backup SQL
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres'
});

async function createBackup() {
    try {
        await client.connect();
        console.log('✅ Conectado ao banco');

        const timestamp = new Date().toISOString().split('T')[0];
        const backupFile = `backup_sistema_carretas_${timestamp}.sql`;

        let sql = `-- Backup sistema_carretas - ${new Date().toLocaleString('pt-BR')}\n\n`;

        // Listar tabelas
        const tables = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);

        console.log(`📋 ${tables.rows.length} tabelas encontradas`);

        for (const { tablename } of tables.rows) {
            try {
                console.log(`📦 ${tablename}`);

                const data = await client.query(`SELECT * FROM "${tablename}"`);

                if (data.rows.length > 0) {
                    sql += `\n-- ${tablename} (${data.rows.length} registros)\n`;

                    const cols = Object.keys(data.rows[0]);

                    for (const row of data.rows) {
                        const vals = cols.map(c => {
                            const v = row[c];
                            if (v === null) return 'NULL';
                            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                            if (v instanceof Date) return `'${v.toISOString()}'`;
                            if (typeof v === 'boolean') return v;
                            return v;
                        });

                        sql += `INSERT INTO "${tablename}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
                    }
                }
            } catch (err) {
                console.log(`⚠️  Ignorando ${tablename}: ${err.message}`);
            }
        }

        fs.writeFileSync(backupFile, sql);
        const size = (fs.statSync(backupFile).size / 1024).toFixed(2);
        console.log(`\n✅ Backup criado: ${backupFile} (${size} KB)`);

        await client.end();
        return backupFile;
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await client.end();
        process.exit(1);
    }
}

createBackup().then(() => process.exit(0));
