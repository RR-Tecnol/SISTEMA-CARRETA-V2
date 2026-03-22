/**
 * Script: repair-funcionarios.js
 * 
 * Limpa dados corrompidos na tabela funcionarios:
 * - Strings vazias ('') em senha, login_cpf, admin_estrada_senha, admin_estrada_login_cpf
 *   são convertidas para NULL para que o login funcione corretamente.
 * 
 * Rodar na VPS:
 *   docker cp backend/repair-funcionarios.js carretas-backend:/app/repair-funcionarios.js
 *   docker exec carretas-backend node repair-funcionarios.js
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function repairFuncionarios() {
    const client = await pool.connect();
    try {
        console.log('🔌 Conectando ao banco...\n');

        // 1. Limpar senhas vazias de médicos
        const r1 = await client.query(`
            UPDATE funcionarios
            SET senha = NULL
            WHERE senha = ''
        `);
        console.log(`✅ Senhas vazias de médico limpas: ${r1.rowCount} registro(s)`);

        // 2. Limpar login_cpf vazios
        const r2 = await client.query(`
            UPDATE funcionarios
            SET login_cpf = NULL
            WHERE login_cpf = ''
        `);
        console.log(`✅ login_cpf vazios limpos: ${r2.rowCount} registro(s)`);

        // 3. Limpar senhas admin_estrada vazias
        const r3 = await client.query(`
            UPDATE funcionarios
            SET admin_estrada_senha = NULL
            WHERE admin_estrada_senha = ''
        `);
        console.log(`✅ Senhas vazias admin_estrada limpas: ${r3.rowCount} registro(s)`);

        // 4. Limpar admin_estrada_login_cpf vazios
        const r4 = await client.query(`
            UPDATE funcionarios
            SET admin_estrada_login_cpf = NULL
            WHERE admin_estrada_login_cpf = ''
        `);
        console.log(`✅ admin_estrada_login_cpf vazios limpos: ${r4.rowCount} registro(s)`);

        // 5. Mostrar estado atual dos médicos e admin_estrada
        const medicos = await client.query(`
            SELECT id, nome, is_medico, login_cpf,
                   CASE WHEN senha IS NULL THEN 'SEM SENHA ❌' ELSE 'COM SENHA ✅' END as status_senha,
                   ativo
            FROM funcionarios
            WHERE is_medico = true OR is_admin_estrada = true
            ORDER BY nome
        `);

        if (medicos.rows.length > 0) {
            console.log('\n📋 Médicos/Admin Estrada no banco:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            for (const m of medicos.rows) {
                const loginOk = m.login_cpf ? `login: ${m.login_cpf}` : 'SEM LOGIN_CPF ❌';
                console.log(`  ${m.nome} | ${loginOk} | ${m.status_senha} | ativo: ${m.ativo}`);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n⚠️  Todos que estão "SEM SENHA" ou "SEM LOGIN_CPF" precisam ser re-cadastrados');
            console.log('   na tela de Funcionários do sistema.\n');
        } else {
            console.log('\n⚠️  Nenhum médico/admin_estrada cadastrado ainda.\n');
        }

        console.log('✅ Reparo concluído!');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

repairFuncionarios();
