const { Client } = require('pg');

async function listTables() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'sistema_carretas',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados\n');

        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const result = await client.query(query);

        console.log('📋 Tabelas encontradas:');
        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.table_name}`);
        });

        return result.rows.map(r => r.table_name);

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await client.end();
    }
}

listTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
