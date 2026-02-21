import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('manutencoes_caminhao', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'caminhoes', key: 'id' },
            onDelete: 'CASCADE',
        },
        tipo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'preventiva',
        },
        titulo: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'agendada',
        },
        prioridade: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'media',
        },
        km_atual: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        km_proximo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        data_agendada: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        data_conclusao: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        custo_estimado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        custo_real: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        fornecedor: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        responsavel: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
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
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('manutencoes_caminhao');
}
