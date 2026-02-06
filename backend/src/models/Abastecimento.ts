import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface AbastecimentoAttributes {
    id?: string;
    acao_id: string;
    caminhao_id: string;
    data_abastecimento: Date;
    litros: number;
    valor_total: number;
    preco_por_litro: number;
    observacoes?: string;
}

export class Abastecimento extends Model<AbastecimentoAttributes> implements AbastecimentoAttributes {
    public id!: string;
    public acao_id!: string;
    public caminhao_id!: string;
    public data_abastecimento!: Date;
    public litros!: number;
    public valor_total!: number;
    public preco_por_litro!: number;
    public observacoes?: string;

    // Associações
    public caminhao?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Abastecimento.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'acoes',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'caminhoes',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        data_abastecimento: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        litros: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            comment: 'Quantidade de litros abastecidos',
        },
        valor_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Valor total pago pelo abastecimento',
        },
        preco_por_litro: {
            type: DataTypes.DECIMAL(6, 3),
            allowNull: false,
            comment: 'Preço por litro (calculado: valor_total / litros)',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'abastecimentos',
        timestamps: true,
        underscored: true,
    }
);
