const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

async function check() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão OK');

        // Verificar se a tabela existe
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'contas_pagar'
        `);
        console.log('📋 Tabela contas_pagar existe:', tables.length > 0);

        // Verificar colunas
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'contas_pagar'
            ORDER BY ordinal_position
        `);
        console.log('📊 Colunas:', columns.length);
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
        });

        // Verificar ENUMs
        const [enums] = await sequelize.query(`
            SELECT t.typname, e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname LIKE '%contas_pagar%'
            ORDER BY t.typname, e.enumsortorder
        `);
        console.log('🏷️  ENUMs:', enums.length);
        enums.forEach(e => {
            console.log(`  - ${e.typname}: ${e.enumlabel}`);
        });

        // Contar registros
        const [count] = await sequelize.query('SELECT COUNT(*) as total FROM contas_pagar');
        console.log('📈 Total de registros:', count[0].total);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

check();
