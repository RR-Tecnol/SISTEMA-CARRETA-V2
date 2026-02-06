const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_carretas', {
    dialect: 'postgres',
    logging: false,
});

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // Ler o arquivo SQL
        const sqlFile = path.join(__dirname, 'init-database.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Remover comandos \echo que não funcionam no Sequelize
        const cleanSql = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('\\echo'))
            .join('\n');

        console.log('🔄 Executando init-database.sql...\n');

        // Executar o SQL
        await sequelize.query(cleanSql);

        console.log('\n✅ Banco de dados inicializado com sucesso!\n');
        console.log('📧 Credenciais Admin:');
        console.log('   CPF: 123.456.789-09');
        console.log('   Senha: admin123');
        console.log('   Email: admin@sistemacarretas.com.br\n');

        // Verificar dados
        const [instituicoes] = await sequelize.query('SELECT COUNT(*) FROM instituicoes');
        const [cursos] = await sequelize.query('SELECT COUNT(*) FROM cursos_exames');
        const [acoes] = await sequelize.query('SELECT COUNT(*) FROM acoes');
        const [cidadaos] = await sequelize.query('SELECT COUNT(*) FROM cidadaos');

        console.log(`📊 Dados inseridos:`);
        console.log(`   Instituições: ${instituicoes[0].count}`);
        console.log(`   Cursos/Exames: ${cursos[0].count}`);
        console.log(`   Ações: ${acoes[0].count}`);
        console.log(`   Cidadãos: ${cidadaos[0].count}\n`);

        await sequelize.close();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('\nDetalhes:', error);
        process.exit(1);
    }
}

initDatabase();
