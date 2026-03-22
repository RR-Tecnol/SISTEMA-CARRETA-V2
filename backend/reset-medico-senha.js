/**
 * Script: reset-medico-senha.js
 * 
 * Redefine a senha de um médico ou admin_estrada pelo login_cpf.
 * Útil quando a senha foi salva incorretamente antes do rebuild.
 * 
 * USO:
 *   docker exec carretas-backend node reset-medico-senha.js LOGIN_CPF NOVA_SENHA
 * 
 * EXEMPLO:
 *   docker exec carretas-backend node reset-medico-senha.js "024.947.683-57" "Senha@2026"
 *   docker exec carretas-backend node reset-medico-senha.js "02494768357" "Senha@2026"
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const loginCpfArg = process.argv[2];
const novaSenhaArg = process.argv[3];

if (!loginCpfArg || !novaSenhaArg) {
    console.error('Uso: node reset-medico-senha.js LOGIN_CPF NOVA_SENHA');
    console.error('Ex:  node reset-medico-senha.js "024.947.683-57" "Senha@2026"');
    process.exit(1);
}

const cleanLogin = loginCpfArg.replace(/\D/g, '');
const formattedLogin = cleanLogin.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

async function resetSenha() {
    const client = await pool.connect();
    try {
        console.log(`\n🔍 Buscando funcionário com login: ${loginCpfArg}`);

        // Busca médico
        const medico = await client.query(
            `SELECT id, nome, login_cpf, is_medico, is_admin_estrada, ativo
             FROM funcionarios
             WHERE login_cpf IN ($1, $2, $3)
                OR admin_estrada_login_cpf IN ($1, $2, $3)`,
            [loginCpfArg, cleanLogin, formattedLogin]
        );

        if (medico.rows.length === 0) {
            console.error(`❌ Nenhum médico/admin_estrada encontrado com login: ${loginCpfArg}`);
            console.log('\nMédicos cadastrados:');
            const todos = await client.query(
                `SELECT nome, login_cpf, admin_estrada_login_cpf, is_medico, is_admin_estrada FROM funcionarios WHERE is_medico=true OR is_admin_estrada=true`
            );
            todos.rows.forEach(r => console.log(`  ${r.nome} | login: ${r.login_cpf || r.admin_estrada_login_cpf}`));
            process.exit(1);
        }

        const f = medico.rows[0];
        console.log(`✅ Encontrado: ${f.nome} (ativo: ${f.ativo})`);

        const hash = await bcrypt.hash(novaSenhaArg, 10);

        if (f.is_medico) {
            await client.query(
                `UPDATE funcionarios SET senha = $1 WHERE id = $2`,
                [hash, f.id]
            );
            console.log(`✅ Senha do MÉDICO ${f.nome} redefinida!`);
        } else if (f.is_admin_estrada) {
            await client.query(
                `UPDATE funcionarios SET admin_estrada_senha = $1 WHERE id = $2`,
                [hash, f.id]
            );
            console.log(`✅ Senha do ADMIN ESTRADA ${f.nome} redefinida!`);
        }

        console.log(`\n📋 Login: ${f.login_cpf || loginCpfArg}`);
        console.log(`   Senha: ${novaSenhaArg}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

resetSenha();
