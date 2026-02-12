const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres'
});

async function fixPassword() {
    try {
        const cpf = '012.192.083-61';
        const plainPassword = '123456';

        console.log(`🔧 Corrigindo senha para CPF ${cpf}...`);

        // Gerar hash bcrypt da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        console.log(`Hash gerado: ${hashedPassword.substring(0, 30)}...`);

        // Atualizar no banco
        const result = await pool.query(
            'UPDATE cidadaos SET senha = $1 WHERE cpf = $2 RETURNING id, nome_completo, cpf, email',
            [hashedPassword, cpf]
        );

        if (result.rows.length > 0) {
            console.log('\n✅ Senha atualizada com sucesso!');
            console.log('Usuário:', result.rows[0].nome_completo);
            console.log('CPF:', result.rows[0].cpf);
            console.log('Email:', result.rows[0].email);
            console.log('\n🔐 Senha: 123456');
            console.log('✅ Agora você pode fazer login normalmente!');
        } else {
            console.log('\n❌ Usuário não encontrado!');
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Erro ao atualizar senha:', error.message);
        process.exit(1);
    }
}

fixPassword();
