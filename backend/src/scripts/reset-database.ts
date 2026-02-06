// @ts-nocheck
import { sequelize } from '../config/database';

async function resetDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        console.log('🗑️  Limpando dados antigos...\n');

        // Ordem importa por causa das foreign keys
        await sequelize.query('DELETE FROM acao_curso_exame;');
        console.log('   ✓ Limpou relacionamentos ação-cursos/exames');

        await sequelize.query('DELETE FROM acao_funcionarios;');
        console.log('   ✓ Limpou relacionamentos ação-funcionários');

        await sequelize.query('DELETE FROM acao_caminhoes;');
        console.log('   ✓ Limpou relacionamentos ação-caminhões');

        await sequelize.query('DELETE FROM inscricoes;');
        console.log('   ✓ Limpou inscrições');

        await sequelize.query('DELETE FROM acoes;');
        console.log('   ✓ Limpou ações');

        await sequelize.query('DELETE FROM cursos_exames;');
        console.log('   ✓ Limpou cursos e exames');

        await sequelize.query('DELETE FROM funcionarios;');
        console.log('   ✓ Limpou funcionários');

        await sequelize.query('DELETE FROM caminhoes;');
        console.log('   ✓ Limpou caminhões');

        await sequelize.query('DELETE FROM instituicoes;');
        console.log('   ✓ Limpou instituições');

        console.log('\n✅ Banco de dados limpo com sucesso!');
        console.log('📝 Agora execute: npm run seed:data\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao limpar banco:', error);
        console.error('Detalhes:', error.message);
        process.exit(1);
    }
}

resetDatabase();
