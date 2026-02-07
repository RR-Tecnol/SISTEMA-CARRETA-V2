const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'sistema_carretas',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupDir = path.join(__dirname, '..', 'backups');
        const backupFile = path.join(backupDir, `database_backup_${timestamp}.sql`);

        // Criar diretório se não existir
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        let sqlContent = `-- Sistema Carretas - Database Backup\n`;
        sqlContent += `-- Data: ${new Date().toLocaleString('pt-BR')}\n`;
        sqlContent += `-- Database: sistema_carretas\n`;
        sqlContent += `-- Backup automático completo\n\n`;

        // Obter todas as tabelas
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name != 'SequelizeMeta'
            ORDER BY table_name;
        `;

        const tablesResult = await client.query(tablesQuery);
        const tables = tablesResult.rows.map(r => r.table_name);

        console.log(`📦 Exportando ${tables.length} tabelas...\n`);

        for (const table of tables) {
            console.log(`  📋 ${table}...`);

            // Obter contagem
            const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
            const count = parseInt(countResult.rows[0].count);

            sqlContent += `\n-- ========================================\n`;
            sqlContent += `-- Tabela: ${table} (${count} registros)\n`;
            sqlContent += `-- ========================================\n\n`;

            if (count > 0) {
                // Obter dados
                const dataQuery = `SELECT * FROM "${table}"`;
                const result = await client.query(dataQuery);

                for (const row of result.rows) {
                    const columns = Object.keys(row);
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });

                    sqlContent += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
                }
            } else {
                sqlContent += `-- Nenhum registro\n`;
            }

            sqlContent += `\n`;
        }

        // Salvar arquivo
        fs.writeFileSync(backupFile, sqlContent, 'utf8');
        const sizeKB = (fs.statSync(backupFile).size / 1024).toFixed(2);

        console.log(`\n✅ Backup criado com sucesso!`);
        console.log(`📁 Arquivo: ${path.basename(backupFile)}`);
        console.log(`📊 Tamanho: ${sizeKB} KB`);
        console.log(`📂 Localização: ${backupFile}`);

        return backupFile;

    } catch (error) {
        console.error('❌ Erro ao criar backup:', error);
        throw error;
    } finally {
        await client.end();
    }
}

// Executar backup
backupDatabase()
    .then(() => {
        console.log('\n🎉 Backup concluído com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Falha no backup:', error.message);
        process.exit(1);
    });
