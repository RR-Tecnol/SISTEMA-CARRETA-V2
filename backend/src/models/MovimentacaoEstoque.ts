import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Insumo } from './Insumo';

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'PERDA';

export interface MovimentacaoEstoqueAttributes {
    id: string;
    insumo_id: string;
    tipo: TipoMovimentacao;
    quantidade: number;
    quantidade_anterior: number;
    quantidade_atual: number;
    origem?: string; // 'CAPITAL' | caminhao_id | acao_id
    destino?: string; // 'CAPITAL' | caminhao_id | acao_id
    caminhao_id?: string;
    acao_id?: string;
    motorista_id?: string;
    nota_fiscal?: string;
    data_movimento: Date;
    observacoes?: string;
    usuario_id?: string;
}

export class MovimentacaoEstoque extends Model<MovimentacaoEstoqueAttributes> implements MovimentacaoEstoqueAttributes {
    public id!: string;
    public insumo_id!: string;
    public tipo!: TipoMovimentacao;
    public quantidade!: number;
    public quantidade_anterior!: number;
    public quantidade_atual!: number;
    public origem?: string;
    public destino?: string;
    public caminhao_id?: string;
    public acao_id?: string;
    public motorista_id?: string;
    public nota_fiscal?: string;
    public data_movimento!: Date;
    public observacoes?: string;
    public usuario_id?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

MovimentacaoEstoque.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        insumo_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'insumos',
                key: 'id',
            },
        },
        tipo: {
            type: DataTypes.ENUM('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE', 'PERDA'),
            allowNull: false,
            comment: 'Tipo de movimentação do estoque',
        },
        quantidade: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantidade movimentada',
        },
        quantidade_anterior: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantidade antes da movimentação',
        },
        quantidade_atual: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantidade após a movimentação',
        },
        origem: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Origem (CAPITAL, caminhao_id, acao_id)',
        },
        destino: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Destino (CAPITAL, caminhao_id, acao_id)',
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'caminhoes',
                key: 'id',
            },
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'acoes',
                key: 'id',
            },
        },
        motorista_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'funcionarios',
                key: 'id',
            },
        },
        nota_fiscal: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Número da nota fiscal relacionada',
        },
        data_movimento: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        usuario_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID do usuário que realizou a movimentação',
        },
    },
    {
        sequelize,
        tableName: 'movimentacoes_estoque',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Relacionamentos
MovimentacaoEstoque.belongsTo(Insumo, {
    foreignKey: 'insumo_id',
    as: 'insumo',
});
