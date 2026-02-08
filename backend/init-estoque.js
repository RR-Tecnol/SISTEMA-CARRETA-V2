const { sequelize } = require('./src/config/database');
const { Insumo } = require('./src/models/Insumo');
const { MovimentacaoEstoque } = require('./src/models/MovimentacaoEstoque');
const { EstoqueCaminhao } = require('./src/models/EstoqueCaminhao');
const { AcaoInsumo } = require('./src/models/AcaoInsumo');

async function initEstoque() {
    try {
        console.log('🔄 Iniciando criação das tabelas de estoque...');

        // Sincronizar modelos com o banco (criar tabelas)
        await Insumo.sync({ alter: true });
        console.log('✅ Tabela "insumos" criada/atualizada');

        await MovimentacaoEstoque.sync({ alter: true });
        console.log('✅ Tabela "movimentacoes_estoque" criada/atualizada');

        await EstoqueCaminhao.sync({ alter: true });
        console.log('✅ Tabela "estoque_caminhoes" criada/atualizada');

        await AcaoInsumo.sync({ alter: true });
        console.log('✅ Tabela "acoes_insumos" criada/atualizada');

        console.log('\n✅ Todas as tabelas de estoque foram criadas com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        process.exit(1);
    }
}

initEstoque();
