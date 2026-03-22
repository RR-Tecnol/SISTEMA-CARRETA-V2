/**
 * Script: update-admin.js
 * Atualiza CPF e senha do administrador do sistema.
 * 
 * Rodar na VPS:
 *   docker exec carretas-backend node update-admin.js
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

const CPF_ANTIGO = '123.456.789-09';
const CPF_NOVO   = '027.147.183-29';
const NOVA_SENHA = 'Gestao@@2026';

async function updateAdmin() {
    const client = await pool.connect();
    try {
        console.log('🔌 Conectando ao banco de dados...');
        console.log(`📋 CPF antigo: ${CPF_ANTIGO}`);
        console.log(`📋 CPF novo  : ${CPF_NOVO}`);

        // Verifica se o admin antigo existe
        const check = await client.query(
            "SELECT id, nome_completo, cpf, tipo FROM cidadaos WHERE cpf = $1",
            [CPF_ANTIGO]
        );

        if (check.rows.length === 0) {
            console.log('\n⚠️  Admin com CPF antigo não encontrado. Verificando se o novo CPF já existe...');

            const checkNew = await client.query(
                "SELECT id, nome_completo, cpf, tipo FROM cidadaos WHERE cpf = $1",
                [CPF_NOVO]
            );

            if (checkNew.rows.length > 0) {
                console.log('✅ Admin com novo CPF já existe! Atualizando apenas a senha...');
                const hash = await bcrypt.hash(NOVA_SENHA, 10);
                const res = await client.query(
                    "UPDATE cidadaos SET senha = $1 WHERE cpf = $2 RETURNING id, nome_completo, cpf, tipo",
                    [hash, CPF_NOVO]
                );
                console.log('\n✅ Senha atualizada com sucesso!');
                console.log('Usuário:', res.rows[0]);
            } else {
                console.log('❌ Nenhum admin encontrado. Execute o seed-admin primeiro.');
            }
            return;
        }

        const admin = check.rows[0];
        console.log(`\n👤 Admin encontrado: ${admin.nome_completo} (ID: ${admin.id})`);

        // Gera o hash da nova senha
        console.log('\n🔐 Gerando hash da nova senha...');
        const senhaHash = await bcrypt.hash(NOVA_SENHA, 10);

        // Atualiza CPF e senha
        const result = await client.query(
            "UPDATE cidadaos SET cpf = $1, senha = $2 WHERE id = $3 RETURNING id, nome_completo, cpf, tipo",
            [CPF_NOVO, senhaHash, admin.id]
        );

        const atualizado = result.rows[0];
        console.log('\n✅ Admin atualizado com sucesso!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   ID    : ${atualizado.id}`);
        console.log(`   Nome  : ${atualizado.nome_completo}`);
        console.log(`   CPF   : ${atualizado.cpf}`);
        console.log(`   Tipo  : ${atualizado.tipo}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 Credenciais de acesso atualizadas:');
        console.log(`   CPF  : ${CPF_NOVO}`);
        console.log(`   Senha: ${NOVA_SENHA}`);
        console.log('\n🌐 Acesse: https://gestaosobrerodas.com.br');

    } catch (error) {
        console.error('\n❌ Erro ao atualizar admin:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

updateAdmin();
