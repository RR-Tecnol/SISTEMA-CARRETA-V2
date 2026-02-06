import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Insumo } from './Insumo';

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste';

export interface MovimentacaoEstoqueAttributes {
    id: string;
    insumo_id: string;
    tipo: TipoMovimentacao;
    quantidade: number;
    data_movimento: Date;
    observacoes?: string;
    usuario_id?: string;
}

export class MovimentacaoEstoque extends Model<MovimentacaoEstoqueAttributes> implements MovimentacaoEstoqueAttributes {
    public id!: string;
    public insumo_id!: string;
    public tipo!: TipoMovimentacao;
    public quantidade!: number;
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
            type: DataTypes.ENUM('entrada', 'saida', 'ajuste'),
            allowNull: false,
            comment: 'Tipo de movimentação: entrada (compra), saída (uso), ajuste (correção)',
        },
        quantidade: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantidade movimentada (positivo para entrada, negativo para saída)',
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
