const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

async function addMissingColumns() {
    try {
        console.log('🔧 Adicionando colunas faltantes à tabela contas_pagar...\n');

        await sequelize.authenticate();
        console.log('✅ Conectado ao banco\n');

        // Adicionar coluna acao_id
        console.log('1. Adicionando coluna acao_id...');
        await sequelize.query(`
            ALTER TABLE contas_pagar 
            ADD COLUMN IF NOT EXISTS acao_id UUID;
        `);
        console.log('✅ Coluna acao_id adicionada\n');

        // Adicionar coluna cidade
        console.log('2. Adicionando coluna cidade...');
        await sequelize.query(`
            ALTER TABLE contas_pagar 
            ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
        `);
        console.log('✅ Coluna cidade adicionada\n');

        // Adicionar coluna caminhao_id
        console.log('3. Adicionando coluna caminhao_id...');
        await sequelize.query(`
            ALTER TABLE contas_pagar 
            ADD COLUMN IF NOT EXISTS caminhao_id UUID;
        `);
        console.log('✅ Coluna caminhao_id adicionada\n');

        // Verificar estrutura final
        console.log('4. Verificando estrutura final...');
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contas_pagar'
            ORDER BY ordinal_position
        `);

        console.log('📋 Colunas da tabela contas_pagar:');
        columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n🎉 COLUNAS ADICIONADAS COM SUCESSO!');
        console.log('✅ A tabela agora está compatível com o modelo\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

addMissingColumns();
