const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_carretas', {
    dialect: 'postgres',
    logging: false,
});

async function createAdminUser() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // Verificar se a tabela cidadaos existe
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'cidadaos'
        `);

        if (tables.length === 0) {
            console.log('⚠️  Tabela cidadaos não existe. Executando init-database.sql primeiro...\n');

            // Executar comandos SQL um por um
            const commands = [
                `DROP TABLE IF EXISTS notificacoes CASCADE`,
                `DROP TABLE IF EXISTS inscricoes CASCADE`,
                `DROP TABLE IF EXISTS noticias CASCADE`,
                `DROP TABLE IF EXISTS abastecimentos CASCADE`,
                `DROP TABLE IF EXISTS acao_funcionarios CASCADE`,
                `DROP TABLE IF EXISTS acao_caminhoes CASCADE`,
                `DROP TABLE IF EXISTS acao_curso_exame CASCADE`,
                `DROP TABLE IF EXISTS acoes CASCADE`,
                `DROP TABLE IF EXISTS cidadaos CASCADE`,
                `DROP TABLE IF EXISTS curso_exames CASCADE`,
                `DROP TABLE IF EXISTS funcionarios CASCADE`,
                `DROP TABLE IF EXISTS caminhoes CASCADE`,
                `DROP TABLE IF EXISTS instituicoes CASCADE`,
                `DROP TABLE IF EXISTS configuracoes_campo CASCADE`,
                `DROP SEQUENCE IF EXISTS acoes_numero_acao_seq CASCADE`,
            ];

            for (const cmd of commands) {
                await sequelize.query(cmd);
            }

            console.log('✅ Tabelas antigas removidas\n');
        }

        // Criar usuário admin
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await sequelize.query(`
            INSERT INTO cidadaos (id, cpf, nome_completo, data_nascimento, telefone, email, senha, tipo, municipio, estado, consentimento_lgpd, data_consentimento)
            VALUES (
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                '123.456.789-09',
                'Administrador do Sistema',
                '1990-01-01',
                '(83) 99999-9999',
                'admin@systemtruck.com',
                '${hashedPassword}',
                'admin',
                'João Pessoa',
                'PB',
                true,
                NOW()
            )
            ON CONFLICT (cpf) DO UPDATE SET
                senha = EXCLUDED.senha,
                email = EXCLUDED.email,
                updated_at = NOW()
        `);

        console.log('✅ Usuário admin criado/atualizado com sucesso!\n');
        console.log('📧 Credenciais de Login:');
        console.log('   CPF: 123.456.789-09');
        console.log('   Senha: admin123');
        console.log('   Email: admin@systemtruck.com\n');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

createAdminUser();
