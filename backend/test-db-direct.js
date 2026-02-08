// Teste direto com Sequelize - SEM importar modelo TypeScript
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false  // Desabilitar logs SQL
});

async function testDirect() {
    try {
        console.log('🔍 Teste Direto - Sem TypeScript\n');

        console.log('1. Conectando...');
        await sequelize.authenticate();
        console.log('✅ Conectado\n');

        console.log('2. Fazendo query SQL direta...');
        const [results] = await sequelize.query('SELECT COUNT(*) as total FROM contas_pagar');
        console.log('✅ Total de registros:', results[0].total, '\n');

        console.log('3. Testando INSERT direto...');
        await sequelize.query(`
            INSERT INTO contas_pagar (
                id, tipo_conta, descricao, valor, data_vencimento, 
                status, recorrente, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 'agua', 'Teste SQL direto', 100.00, '2026-02-15',
                'pendente', false, NOW(), NOW()
            )
        `);
        console.log('✅ INSERT funcionou\n');

        console.log('4. Verificando registro criado...');
        const [newResults] = await sequelize.query('SELECT COUNT(*) as total FROM contas_pagar');
        console.log('✅ Total agora:', newResults[0].total, '\n');

        console.log('5. Limpando teste...');
        await sequelize.query(`DELETE FROM contas_pagar WHERE descricao = 'Teste SQL direto'`);
        console.log('✅ Limpeza concluída\n');

        console.log('🎉 BANCO DE DADOS ESTÁ 100% FUNCIONAL!');
        console.log('\n⚠️  Conclusão: O problema NÃO está no banco de dados');
        console.log('⚠️  O problema está no MODELO SEQUELIZE ou na ROTA\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:');
        console.error(error.message);
        console.error('\nStack:');
        console.error(error.stack);
        process.exit(1);
    }
}

testDirect();
