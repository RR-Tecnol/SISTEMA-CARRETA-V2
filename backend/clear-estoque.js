/**
 * Script: clear-estoque.js
 * 
 * Zera COMPLETAMENTE o estoque para entrega oficial do sistema:
 *   - Apaga todos os registros de estoque_caminhoes
 *   - Apaga todo o histórico de movimentacoes_estoque
 *   - Apaga todos os insumos cadastrados
 * 
 * ATENÇÃO: Esta operação é IRREVERSÍVEL.
 * 
 * Rodar na VPS:
 *   docker cp backend/clear-estoque.js carretas-backend:/app/clear-estoque.js
 *   docker exec carretas-backend node clear-estoque.js
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function clearEstoque() {
    const client = await pool.connect();
    try {
        console.log('🔌 Conectando ao banco...\n');
        console.log('⚠️  Limpando estoque para entrega oficial...\n');

        // 1. Apagar estoque dos caminhões (referencia insumos)
        const r1 = await client.query('DELETE FROM estoque_caminhoes');
        console.log(`✅ estoque_caminhoes: ${r1.rowCount} registro(s) apagado(s)`);

        // 2. Apagar movimentações (referencia insumos)
        const r2 = await client.query('DELETE FROM movimentacoes_estoque');
        console.log(`✅ movimentacoes_estoque: ${r2.rowCount} registro(s) apagado(s)`);

        // 3. Apagar insumos (referencia acao_insumos se existir)
        try {
            await client.query('DELETE FROM acao_insumos');
            console.log(`✅ acao_insumos: limpo`);
        } catch (e) {
            console.log(`ℹ️  acao_insumos: não encontrado ou já vazio`);
        }

        // 4. Apagar os insumos em si
        const r4 = await client.query('DELETE FROM insumos');
        console.log(`✅ insumos: ${r4.rowCount} registro(s) apagado(s)`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Estoque zerado com sucesso!');
        console.log('   Sistema pronto para uso oficial.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

clearEstoque();
