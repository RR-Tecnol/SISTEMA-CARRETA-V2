/**
 * Script: clear-cidadaos.js
 * 
 * Remove todos os cidadãos de teste, mantendo apenas o admin (CPF 027.147.183-29).
 * Remove também os dados associados (inscrições, atendimentos, resultados de exames, etc.)
 * 
 * Rodar na VPS:
 *   docker cp backend/clear-cidadaos.js carretas-backend:/app/clear-cidadaos.js
 *   docker exec carretas-backend node clear-cidadaos.js
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const ADMIN_CPF_MANTER = ['027.147.183-29', '02714718329'];

async function clearCidadaos() {
    const client = await pool.connect();
    try {
        console.log('🔌 Conectando ao banco...\n');

        // 1. Listar cidadãos antes
        const todos = await client.query(
            `SELECT id, nome_completo, cpf, tipo FROM cidadaos ORDER BY id`
        );
        console.log(`📋 Cidadãos encontrados: ${todos.rows.length}`);
        todos.rows.forEach(c => {
            const manter = ADMIN_CPF_MANTER.some(adminCpf =>
                (c.cpf || '').replace(/\D/g, '') === '02714718329'
            );
            console.log(`  ${manter ? '✅ MANTER' : '❌ APAGAR'} | ID: ${c.id} | ${c.nome_completo} | CPF: ${c.cpf} | tipo: ${c.tipo}`);
        });

        // 2. IDs para apagar
        const idsApagar = todos.rows
            .filter(c => (c.cpf || '').replace(/\D/g, '') !== '02714718329')
            .map(c => c.id);

        if (idsApagar.length === 0) {
            console.log('\n✅ Nenhum cidadão para apagar. Sistema já limpo.');
            return;
        }

        console.log(`\n⚠️  Apagando ${idsApagar.length} cidadão(s)...\n`);

        // 3. Remover dados relacionados
        const tabelas = [
            'inscricoes',
            'atendimentos_medicos',
            'resultado_exames',
            'resultado_exame',
            'resultados_exame',
        ];

        for (const tabela of tabelas) {
            try {
                const r = await client.query(
                    `DELETE FROM ${tabela} WHERE cidadao_id = ANY($1)`,
                    [idsApagar]
                );
                if (r.rowCount > 0) {
                    console.log(`✅ ${tabela}: ${r.rowCount} registro(s) removido(s)`);
                }
            } catch (e) {
                // Tabela pode não existir
            }
        }

        // 4. Deletar os cidadãos
        const r = await client.query(
            `DELETE FROM cidadaos WHERE id = ANY($1)`,
            [idsApagar]
        );
        console.log(`\n✅ cidadaos: ${r.rowCount} registro(s) removido(s)`);

        // 5. Mostrar quem ficou
        const restantes = await client.query(
            `SELECT id, nome_completo, cpf, tipo FROM cidadaos ORDER BY id`
        );
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Cidadãos restantes:');
        restantes.rows.forEach(c => {
            console.log(`   #${c.id} | ${c.nome_completo} | CPF: ${c.cpf} | tipo: ${c.tipo}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ Sistema pronto para uso oficial!');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

clearCidadaos();
