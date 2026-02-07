// Script para atualizar nomes das ações existentes
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function updateActionNames() {
    const client = await pool.connect();
    try {
        console.log('🔄 Atualizando nomes das ações existentes...');

        const result = await client.query(`
            UPDATE acoes 
            SET nome = CONCAT(
                CASE 
                    WHEN tipo = 'saude' THEN 'Ação de Saúde'
                    WHEN tipo = 'curso' THEN 'Ação de Curso'
                    ELSE 'Ação'
                END, 
                ' #', numero_acao
            ) 
            WHERE nome = 'Ação sem nome';
        `);

        console.log(`✅ ${result.rowCount} ações atualizadas!`);

        // Verificar resultado
        const check = await client.query('SELECT id, nome, tipo FROM acoes LIMIT 10;');
        console.log('\n📋 Ações atualizadas:');
        check.rows.forEach(row => {
            console.log(`  - ${row.nome} (tipo: ${row.tipo})`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

updateActionNames()
    .then(() => {
        console.log('\n✅ Atualização concluída!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    });
