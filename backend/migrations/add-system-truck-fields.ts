/**
 * Migração: Adicionar novos campos aos modelos
 * 
 * Execução: npx ts-node migrations/add-system-truck-fields.ts
 */

import { sequelize } from '../src/config/database';

async function migrate() {
    try {
        console.log('🔄 Iniciando migração...');

        // Adicionar campos ao Cidadao
        console.log('📝 Adicionando campos ao Cidadao...');
        await sequelize.query(`
            ALTER TABLE cidadaos 
            ADD COLUMN IF NOT EXISTS cartao_sus VARCHAR(15),
            ADD COLUMN IF NOT EXISTS raca VARCHAR(20),
            ADD COLUMN IF NOT EXISTS genero VARCHAR(20);
        `);

        // Criar ENUMs se não existirem
        await sequelize.query(`
            DO $$ BEGIN
                CREATE TYPE enum_cidadaos_raca AS ENUM ('branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await sequelize.query(`
            DO $$ BEGIN
                CREATE TYPE enum_cidadaos_genero AS ENUM ('masculino', 'feminino', 'outro', 'nao_declarado');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Alterar tipo das colunas para ENUM
        await sequelize.query(`
            ALTER TABLE cidadaos 
            ALTER COLUMN raca TYPE enum_cidadaos_raca USING raca::enum_cidadaos_raca;
        `);

        await sequelize.query(`
            ALTER TABLE cidadaos 
            ALTER COLUMN genero TYPE enum_cidadaos_genero USING genero::enum_cidadaos_genero;
        `);

        // Adicionar campo ao Acao
        console.log('📝 Adicionando campo permitir_inscricao_previa ao Acao...');
        await sequelize.query(`
            ALTER TABLE acoes 
            ADD COLUMN IF NOT EXISTS permitir_inscricao_previa BOOLEAN DEFAULT true;
        `);

        // Adicionar campo ao ContaPagar
        console.log('📝 Adicionando campo tipo_espontaneo ao ContaPagar...');
        await sequelize.query(`
            ALTER TABLE contas_pagar 
            ADD COLUMN IF NOT EXISTS tipo_espontaneo VARCHAR(255);
        `);

        // Atualizar ENUM de tipo_conta
        console.log('📝 Atualizando ENUM de tipo_conta...');
        await sequelize.query(`
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'pneu_furado';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'troca_oleo';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'abastecimento';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'manutencao_mecanica';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'reboque';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'lavagem';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'pedagio';
            ALTER TYPE enum_contas_pagar_tipo_conta ADD VALUE IF NOT EXISTS 'espontaneo';
        `);

        // Atualizar ENUM de tipo_custo
        console.log('📝 Atualizando ENUM de tipo_custo...');
        await sequelize.query(`
            ALTER TYPE enum_custos_acoes_tipo_custo ADD VALUE IF NOT EXISTS 'abastecimento';
            ALTER TYPE enum_custos_acoes_tipo_custo ADD VALUE IF NOT EXISTS 'pedagio';
            ALTER TYPE enum_custos_acoes_tipo_custo ADD VALUE IF NOT EXISTS 'manutencao';
        `);

        // Adicionar campos ao AcaoFuncionario
        console.log('📝 Adicionando campos ao AcaoFuncionario...');
        await sequelize.query(`
            ALTER TABLE acao_funcionarios 
            ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS dias_trabalhados INTEGER DEFAULT 1;
        `);

        console.log('✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
