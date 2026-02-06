/**
 * Migração: Adicionar campos de controle de estoque ao AcaoInsumo
 * 
 * Execução: npx ts-node migrations/add-estoque-fields.ts
 */

import { sequelize } from '../src/config/database';

async function migrate() {
    try {
        console.log('🔄 Iniciando migração de estoque...');

        // Adicionar campos ao AcaoInsumo
        console.log('📝 Adicionando campos ao AcaoInsumo...');
        await sequelize.query(`
            ALTER TABLE acoes_insumos 
            ADD COLUMN IF NOT EXISTS quantidade_levada INTEGER,
            ADD COLUMN IF NOT EXISTS quantidade_retornada INTEGER;
        `);

        console.log('✅ Migração de estoque concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
