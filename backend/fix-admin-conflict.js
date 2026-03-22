/**
 * Script: fix-admin-conflict.js
 * 
 * Remove o Funcionario com o CPF 027.147.183-29 que está causando conflito de login,
 * e garante que o admin (cidadão) com esse CPF existe corretamente.
 * 
 * Rodar na VPS:
 *   docker cp backend/fix-admin-conflict.js carretas-backend:/app/fix-admin-conflict.js
 *   docker exec carretas-backend node fix-admin-conflict.js
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

const CPF_LIMPO   = '02714718329';
const CPF_FORMATO = '027.147.183-29';
const NOVA_SENHA  = 'Gestao@@2026';
const CPF_ANTIGO  = '123.456.789-09';

async function fixAdminConflict() {
    const client = await pool.connect();
    try {
        console.log('🔌 Conectando ao banco de dados...\n');

        // ─────────────────────────────────────────────────────
        // 1. Verificar e remover Funcionario conflitante
        // ─────────────────────────────────────────────────────
        console.log('🔍 Buscando Funcionário com CPF conflitante...');
        const funcionarios = await client.query(
            `SELECT id, nome, cpf, is_medico, is_admin_estrada, login_cpf, ativo
             FROM funcionarios
             WHERE cpf IN ($1, $2) OR login_cpf IN ($1, $2) OR admin_estrada_login_cpf IN ($1, $2)`,
            [CPF_LIMPO, CPF_FORMATO]
        );

        if (funcionarios.rows.length > 0) {
            console.log(`⚠️  Encontrado(s) ${funcionarios.rows.length} funcionário(s) conflitante(s):`);
            for (const f of funcionarios.rows) {
                console.log(`   - ID: ${f.id} | Nome: ${f.nome} | CPF: ${f.cpf} | is_medico: ${f.is_medico} | ativo: ${f.ativo}`);

                // Remove o CPF do campo de documento e login_cpf para eliminar conflito
                await client.query(
                    `UPDATE funcionarios
                     SET cpf = NULL,
                         login_cpf = NULL,
                         admin_estrada_login_cpf = NULL,
                         is_medico = FALSE,
                         is_admin_estrada = FALSE
                     WHERE id = $1`,
                    [f.id]
                );
                console.log(`   ✅ Conflito removido do funcionário ID ${f.id}`);
            }
        } else {
            console.log('✅ Nenhum funcionário conflitante encontrado.\n');
        }

        // ─────────────────────────────────────────────────────
        // 2. Garantir que o admin está com o CPF correto
        // ─────────────────────────────────────────────────────
        console.log('\n🔍 Buscando admin na tabela cidadaos...');

        // Verifica se já tem o novo CPF
        let admin = await client.query(
            `SELECT id, nome_completo, cpf, tipo FROM cidadaos WHERE cpf IN ($1, $2)`,
            [CPF_LIMPO, CPF_FORMATO]
        );

        if (admin.rows.length > 0) {
            // Admin com novo CPF já existe — só atualiza a senha
            console.log(`✅ Admin já existe com o novo CPF!`);
            const senhaHash = await bcrypt.hash(NOVA_SENHA, 10);
            await client.query(
                `UPDATE cidadaos SET senha = $1, tipo = 'admin' WHERE id = $2`,
                [senhaHash, admin.rows[0].id]
            );
            console.log(`✅ Senha atualizada para o admin ID ${admin.rows[0].id}`);
        } else {
            // Tenta achar o admin pelo CPF antigo
            const adminAntigo = await client.query(
                `SELECT id, nome_completo, cpf, tipo FROM cidadaos WHERE cpf IN ($1, $2)`,
                [CPF_ANTIGO, '12345678909']
            );

            if (adminAntigo.rows.length > 0) {
                // Atualiza CPF e senha do admin antigo
                const senhaHash = await bcrypt.hash(NOVA_SENHA, 10);
                await client.query(
                    `UPDATE cidadaos SET cpf = $1, senha = $2, tipo = 'admin' WHERE id = $3`,
                    [CPF_FORMATO, senhaHash, adminAntigo.rows[0].id]
                );
                console.log(`✅ Admin atualizado: CPF antigo → novo CPF`);
            } else {
                // Cria admin do zero
                console.log('⚠️  Admin não encontrado. Criando novo admin...');
                const senhaHash = await bcrypt.hash(NOVA_SENHA, 10);
                await client.query(
                    `INSERT INTO cidadaos
                        (cpf, nome_completo, data_nascimento, telefone, email, senha, tipo,
                         municipio, estado, consentimento_lgpd, data_consentimento, ip_consentimento)
                     VALUES ($1, $2, $3, $4, $5, $6, 'admin', $7, $8, true, NOW(), '127.0.0.1')`,
                    [
                        CPF_FORMATO,
                        'Administrador do Sistema',
                        '1990-01-01',
                        '(83) 99999-9999',
                        'admin@gestaosobrerodas.com.br',
                        senhaHash,
                        'João Pessoa',
                        'PB',
                    ]
                );
                console.log('✅ Novo admin criado com sucesso!');
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ PRONTO! Sistema corrigido.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Credenciais de acesso:');
        console.log(`   CPF  : ${CPF_FORMATO}`);
        console.log(`   Senha: ${NOVA_SENHA}`);
        console.log('   URL  : https://gestaosobrerodas.com.br');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

fixAdminConflict();
