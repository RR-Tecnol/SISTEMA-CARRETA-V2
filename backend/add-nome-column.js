// Script para adicionar a coluna 'nome' à tabela acoes
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function addNomeColumn() {
    const client = await pool.connect();
    try {
        console.log('🔄 Adicionando coluna "nome" à tabela acoes...');

        // Adicionar coluna nome
        await client.query(`
            ALTER TABLE acoes 
            ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT 'Ação sem nome';
        `);

        console.log('✅ Coluna "nome" adicionada com sucesso!');

        // Atualizar ações existentes com nomes baseados no tipo
        console.log('🔄 Atualizando ações existentes com nomes descritivos...');

        const result = await client.query(`
            UPDATE acoes 
            SET nome = CONCAT(
                'Ação de ', 
                CASE 
                    WHEN tipo = 'saude' THEN 'Saúde' 
                    WHEN tipo = 'curso' THEN 'Curso'
                    ELSE tipo 
                END, 
                ' #', numero_acao
            ) 
            WHERE nome = 'Ação sem nome';
        `);

        console.log(`✅ ${result.rowCount} ações atualizadas com nomes descritivos!`);

        // Verificar resultado
        const check = await client.query('SELECT id, nome, tipo FROM acoes LIMIT 5;');
        console.log('\n📋 Primeiras 5 ações:');
        check.rows.forEach(row => {
            console.log(`  - ${row.nome} (${row.tipo})`);
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar coluna:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addNomeColumn()
    .then(() => {
        console.log('\n✅ Migração concluída com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro na migração:', error);
        process.exit(1);
    });
