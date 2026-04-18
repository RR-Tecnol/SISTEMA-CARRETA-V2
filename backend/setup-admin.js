const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_carretas',
    {
        dialect: 'postgres',
        logging: console.log,
    }
);

async function setupDatabase() {
    try {
        console.log('🔄 Conectando ao banco de dados...\n');
        await sequelize.authenticate();
        console.log('✅ Conectado com sucesso!\n');

        // Criar usuário admin
        console.log('🔄 Criando usuário administrador...\n');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        try {
            await sequelize.query(`
                INSERT INTO cidadaos (
                    id, cpf, nome_completo, data_nascimento, 
                    telefone, email, senha, tipo, 
                    municipio, estado, consentimento_lgpd, data_consentimento,
                    created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    '123.456.789-09',
                    'Administrador Gestão sobre Rodas',
                    '1990-01-01',
                    '(83) 99999-9999',
                    'admin@systemtruck.com',
                    :senha,
                    'admin',
                    'João Pessoa',
                    'PB',
                    true,
                    NOW(),
                    NOW(),
                    NOW()
                )
                ON CONFLICT (cpf) DO UPDATE SET
                    senha = EXCLUDED.senha,
                    email = EXCLUDED.email,
                    nome_completo = EXCLUDED.nome_completo,
                    updated_at = NOW()
                RETURNING cpf, nome_completo, email, tipo
            `, {
                replacements: { senha: hashedPassword }
            });

            console.log('✅ Usuário admin criado/atualizado!\n');
        } catch (error) {
            if (error.message.includes('relation "cidadaos" does not exist')) {
                console.log('⚠️  A tabela "cidadaos" não existe.');
                console.log('📝 Execute o arquivo init-database.sql primeiro:\n');
                console.log('   Opção 1: Via pgAdmin (copie e cole o conteúdo)');
                console.log('   Opção 2: Via linha de comando (se tiver psql instalado)\n');
                process.exit(1);
            }
            throw error;
        }

        // Verificar dados
        const [admins] = await sequelize.query(`
            SELECT cpf, nome_completo, email, tipo 
            FROM cidadaos 
            WHERE tipo = 'admin'
        `);

        console.log('📊 Administradores cadastrados:');
        console.table(admins);

        console.log('\n🎉 PRONTO PARA USO!\n');
        console.log('📧 Credenciais de Login:');
        console.log('   CPF: 123.456.789-09');
        console.log('   Senha: admin123');
        console.log('   Email: admin@systemtruck.com\n');
        console.log('🌐 Acesse: http://localhost:3000\n');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        console.error('\nDetalhes completos:');
        console.error(error);
        process.exit(1);
    }
}

setupDatabase();
