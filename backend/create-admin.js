const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_carretas', {
    dialect: 'postgres',
    logging: false,
});

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const [results] = await sequelize.query(`
            INSERT INTO admins (id, nome, email, senha, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                'Administrador',
                'admin@systemtruck.com',
                '${hashedPassword}',
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO UPDATE SET
                senha = EXCLUDED.senha,
                updated_at = NOW()
            RETURNING email, nome;
        `);

        console.log('✅ Usuário admin criado/atualizado com sucesso!');
        console.log('📧 Email: admin@systemtruck.com');
        console.log('🔑 Senha: admin123');
        console.log('');
        console.log(results);

        await sequelize.close();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

createAdmin();
