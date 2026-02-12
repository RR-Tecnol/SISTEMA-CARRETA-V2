const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres'
});

async function updatePassword() {
    try {
        const userId = 6;
        const newPassword = '123456';

        // Gerar hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        console.log(`Atualizando senha do usuário ID ${userId}...`);
        console.log(`Hash gerado: ${hashedPassword}`);

        // Atualizar no banco
        const result = await pool.query(
            'UPDATE cidadaos SET senha = $1 WHERE id = $2 RETURNING id, nome, cpf',
            [hashedPassword, userId]
        );

        if (result.rows.length > 0) {
            console.log('\n✅ Senha atualizada com sucesso!');
            console.log('Usuário:', result.rows[0]);
            console.log('\nNova senha: 123456');
        } else {
            console.log('\n❌ Usuário não encontrado!');
        }

        await pool.end();
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        process.exit(1);
    }
}

updatePassword();
