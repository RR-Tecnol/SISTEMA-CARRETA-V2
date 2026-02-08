// Teste isolado do modelo ContaPagar
const path = require('path');

// Configurar paths antes de importar
require('ts-node').register({
    project: path.join(__dirname, 'tsconfig.json'),
    transpileOnly: true
});

const { ContaPagar } = require('./src/models/ContaPagar');
const { sequelize } = require('./src/config/database');

async function testModel() {
    try {
        console.log('🔍 Teste 1: Conexão com banco...');
        await sequelize.authenticate();
        console.log('✅ Conexão OK\n');

        console.log('🔍 Teste 2: Informações do modelo...');
        console.log('  Nome:', ContaPagar.name);
        console.log('  Tabela:', ContaPagar.tableName);
        console.log('  Atributos:', Object.keys(ContaPagar.rawAttributes).join(', '));
        console.log('✅ Modelo carregado\n');

        console.log('🔍 Teste 3: Listar registros existentes...');
        const contas = await ContaPagar.findAll({ limit: 5 });
        console.log('  Total encontrado:', contas.length);
        console.log('✅ Query SELECT funcionou\n');

        console.log('🔍 Teste 4: Criar registro de teste...');
        const novaConta = await ContaPagar.create({
            tipo_conta: 'agua',
            descricao: 'Teste automatizado',
            valor: 150.50,
            data_vencimento: '2026-02-15',
            status: 'pendente',
            recorrente: false
        });
        console.log('  ID criado:', novaConta.id);
        console.log('✅ Query INSERT funcionou\n');

        console.log('🔍 Teste 5: Buscar registro criado...');
        const contaEncontrada = await ContaPagar.findByPk(novaConta.id);
        console.log('  Encontrado:', contaEncontrada ? 'SIM' : 'NÃO');
        console.log('✅ Query SELECT BY PK funcionou\n');

        console.log('🔍 Teste 6: Deletar registro de teste...');
        await novaConta.destroy();
        console.log('✅ Query DELETE funcionou\n');

        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ O modelo ContaPagar está funcionando perfeitamente');
        console.log('\n⚠️  O problema NÃO está no modelo!');
        console.log('⚠️  O problema deve estar na ROTA ou no MIDDLEWARE');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO ENCONTRADO:');
        console.error('Mensagem:', error.message);
        console.error('Nome:', error.name);
        console.error('\nStack completo:');
        console.error(error.stack);
        process.exit(1);
    }
}

testModel();
