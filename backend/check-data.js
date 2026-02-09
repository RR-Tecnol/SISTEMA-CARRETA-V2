const { sequelize } = require('./src/config/database');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        const queries = [
            { name: 'Exames', query: 'SELECT COUNT(*) as total FROM exames' },
            { name: 'Ações', query: 'SELECT COUNT(*) as total FROM acoes' },
            { name: 'Cidadãos', query: 'SELECT COUNT(*) as total FROM cidadaos' },
            { name: 'Resultados de Exames', query: 'SELECT COUNT(*) as total FROM resultados_exames' },
            { name: 'Inscrições', query: 'SELECT COUNT(*) as total FROM inscricoes' },
        ];

        console.log('📊 CONTAGEM DE REGISTROS:\n');
        for (const { name, query } of queries) {
            const [results] = await sequelize.query(query);
            console.log(`${name}: ${results[0].total}`);
        }

        console.log('\n📋 AMOSTRA DE RESULTADOS_EXAMES:');
        const [sample] = await sequelize.query('SELECT * FROM resultados_exames LIMIT 3');
        console.log(JSON.stringify(sample, null, 2));

        await sequelize.close();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

checkData();
