import { sequelize } from './src/config/database';
import { Insumo } from './src/models/Insumo';
import { MovimentacaoEstoque } from './src/models/MovimentacaoEstoque';
import { EstoqueCaminhao } from './src/models/EstoqueCaminhao';
import { AcaoInsumo } from './src/models/AcaoInsumo';

async function recreateEstoqueTables() {
    try {
        console.log('🔄 Recriando tabelas de estoque...\n');

        // ATENÇÃO: force: true DELETA e recria as tabelas!
        console.log('⚠️  ATENÇÃO: Isso vai DELETAR todas as tabelas de estoque e recriar!');

        await AcaoInsumo.sync({ force: true });
        console.log('✅ Tabela "acoes_insumos" recriada');

        await EstoqueCaminhao.sync({ force: true });
        console.log('✅ Tabela "estoque_caminhoes" recriada');

        await MovimentacaoEstoque.sync({ force: true });
        console.log('✅ Tabela "movimentacoes_estoque" recriada');

        await Insumo.sync({ force: true });
        console.log('✅ Tabela "insumos" recriada');

        console.log('\n✅ Todas as tabelas de estoque foram recriadas com sucesso!');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao recriar tabelas:', error);
        await sequelize.close();
        process.exit(1);
    }
}

recreateEstoqueTables();
