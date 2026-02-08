import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    // Adicionar novos campos ao modelo Insumo
    await queryInterface.addColumn('insumos', 'descricao', {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada do insumo',
    });

    await queryInterface.addColumn('insumos', 'categoria', {
        type: DataTypes.ENUM('EPI', 'MEDICAMENTO', 'MATERIAL_DESCARTAVEL', 'EQUIPAMENTO', 'OUTROS'),
        allowNull: false,
        defaultValue: 'OUTROS',
        comment: 'Categoria do insumo',
    });

    await queryInterface.addColumn('insumos', 'codigo_barras', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Código de barras do produto',
    });

    await queryInterface.addColumn('insumos', 'lote', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Número do lote',
    });

    await queryInterface.addColumn('insumos', 'data_validade', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data de validade do lote',
    });

    await queryInterface.addColumn('insumos', 'fornecedor', {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Nome do fornecedor',
    });

    await queryInterface.addColumn('insumos', 'nota_fiscal', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Número da nota fiscal de entrada',
    });

    await queryInterface.addColumn('insumos', 'data_entrada', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data de entrada no estoque',
    });

    await queryInterface.addColumn('insumos', 'localizacao', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Localização física no estoque (prateleira, setor)',
    });

    // Adicionar novos campos ao modelo MovimentacaoEstoque
    await queryInterface.addColumn('movimentacoes_estoque', 'quantidade_anterior', {
        type: DataTypes.INTEGER,
        allowNull: true, // Permitir null temporariamente para dados existentes
        comment: 'Quantidade antes da movimentação',
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'quantidade_atual', {
        type: DataTypes.INTEGER,
        allowNull: true, // Permitir null temporariamente para dados existentes
        comment: 'Quantidade após a movimentação',
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'origem', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Origem (CAPITAL, caminhao_id, acao_id)',
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'destino', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Destino (CAPITAL, caminhao_id, acao_id)',
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'caminhao_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'caminhoes',
            key: 'id',
        },
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'acao_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'acoes',
            key: 'id',
        },
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'motorista_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'funcionarios',
            key: 'id',
        },
    });

    await queryInterface.addColumn('movimentacoes_estoque', 'nota_fiscal', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Número da nota fiscal relacionada',
    });

    // Atualizar enum do tipo de movimentação
    await queryInterface.sequelize.query(`
        ALTER TYPE "enum_movimentacoes_estoque_tipo" 
        ADD VALUE IF NOT EXISTS 'TRANSFERENCIA';
    `);

    await queryInterface.sequelize.query(`
        ALTER TYPE "enum_movimentacoes_estoque_tipo" 
        ADD VALUE IF NOT EXISTS 'PERDA';
    `);

    // Criar tabela EstoqueCaminhao
    await queryInterface.createTable('estoque_caminhoes', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'caminhoes',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        insumo_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'insumos',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        quantidade: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Quantidade atual do insumo no caminhão',
        },
        ultima_atualizacao: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    // Criar índice único para caminhao_id + insumo_id
    await queryInterface.addIndex('estoque_caminhoes', ['caminhao_id', 'insumo_id'], {
        unique: true,
        name: 'unique_caminhao_insumo',
    });

    // Criar índices para otimização de queries
    await queryInterface.addIndex('movimentacoes_estoque', ['caminhao_id']);
    await queryInterface.addIndex('movimentacoes_estoque', ['acao_id']);
    await queryInterface.addIndex('movimentacoes_estoque', ['data_movimento']);
    await queryInterface.addIndex('insumos', ['categoria']);
    await queryInterface.addIndex('insumos', ['data_validade']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    // Remover índices
    await queryInterface.removeIndex('estoque_caminhoes', 'unique_caminhao_insumo');
    await queryInterface.removeIndex('movimentacoes_estoque', ['caminhao_id']);
    await queryInterface.removeIndex('movimentacoes_estoque', ['acao_id']);
    await queryInterface.removeIndex('movimentacoes_estoque', ['data_movimento']);
    await queryInterface.removeIndex('insumos', ['categoria']);
    await queryInterface.removeIndex('insumos', ['data_validade']);

    // Remover tabela EstoqueCaminhao
    await queryInterface.dropTable('estoque_caminhoes');

    // Remover campos de MovimentacaoEstoque
    await queryInterface.removeColumn('movimentacoes_estoque', 'nota_fiscal');
    await queryInterface.removeColumn('movimentacoes_estoque', 'motorista_id');
    await queryInterface.removeColumn('movimentacoes_estoque', 'acao_id');
    await queryInterface.removeColumn('movimentacoes_estoque', 'caminhao_id');
    await queryInterface.removeColumn('movimentacoes_estoque', 'destino');
    await queryInterface.removeColumn('movimentacoes_estoque', 'origem');
    await queryInterface.removeColumn('movimentacoes_estoque', 'quantidade_atual');
    await queryInterface.removeColumn('movimentacoes_estoque', 'quantidade_anterior');

    // Remover campos de Insumo
    await queryInterface.removeColumn('insumos', 'localizacao');
    await queryInterface.removeColumn('insumos', 'data_entrada');
    await queryInterface.removeColumn('insumos', 'nota_fiscal');
    await queryInterface.removeColumn('insumos', 'fornecedor');
    await queryInterface.removeColumn('insumos', 'data_validade');
    await queryInterface.removeColumn('insumos', 'lote');
    await queryInterface.removeColumn('insumos', 'codigo_barras');
    await queryInterface.removeColumn('insumos', 'categoria');
    await queryInterface.removeColumn('insumos', 'descricao');
}
