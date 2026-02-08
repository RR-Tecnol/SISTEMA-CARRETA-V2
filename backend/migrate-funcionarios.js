const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function migrateFuncionarios() {
    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');

        // Verificar se as colunas já existem
        const checkColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'funcionarios'
        `);

        const existingColumns = checkColumns.rows.map(row => row.column_name);
        console.log('📋 Colunas existentes:', existingColumns);

        // Adicionar coluna cpf se não existir
        if (!existingColumns.includes('cpf')) {
            console.log('➕ Adicionando coluna cpf...');
            await client.query(`
                ALTER TABLE funcionarios 
                ADD COLUMN cpf VARCHAR(14)
            `);
            console.log('✅ Coluna cpf adicionada');
        }

        // Adicionar coluna telefone se não existir
        if (!existingColumns.includes('telefone')) {
            console.log('➕ Adicionando coluna telefone...');
            await client.query(`
                ALTER TABLE funcionarios 
                ADD COLUMN telefone VARCHAR(20)
            `);
            console.log('✅ Coluna telefone adicionada');
        }

        // Adicionar coluna email se não existir
        if (!existingColumns.includes('email')) {
            console.log('➕ Adicionando coluna email...');
            await client.query(`
                ALTER TABLE funcionarios 
                ADD COLUMN email VARCHAR(255)
            `);
            console.log('✅ Coluna email adicionada');
        }

        // Renomear custo_diario para custo_diaria se necessário
        if (existingColumns.includes('custo_diario') && !existingColumns.includes('custo_diaria')) {
            console.log('🔄 Renomeando coluna custo_diario para custo_diaria...');
            await client.query(`
                ALTER TABLE funcionarios 
                RENAME COLUMN custo_diario TO custo_diaria
            `);
            console.log('✅ Coluna renomeada');
        }

        // Renomear status para ativo e converter tipo se necessário
        if (existingColumns.includes('status') && !existingColumns.includes('ativo')) {
            console.log('🔄 Convertendo coluna status para ativo (boolean)...');

            // Adicionar nova coluna ativo
            await client.query(`
                ALTER TABLE funcionarios 
                ADD COLUMN ativo BOOLEAN DEFAULT true
            `);

            // Copiar dados convertidos
            await client.query(`
                UPDATE funcionarios 
                SET ativo = (status = 'ativo')
            `);

            // Remover coluna antiga
            await client.query(`
                ALTER TABLE funcionarios 
                DROP COLUMN status
            `);

            console.log('✅ Coluna convertida');
        }

        console.log('\n✅ Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        await client.end();
    }
}

migrateFuncionarios();
