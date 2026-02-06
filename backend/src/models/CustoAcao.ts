import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Acao } from './Acao';

export type TipoCusto =
    | 'abastecimento' | 'alimentacao' | 'hospedagem' | 'transporte'
    | 'material' | 'pedagio' | 'manutencao' | 'outros';

export interface CustoAcaoAttributes {
    id: string;
    acao_id: string;
    tipo_custo: TipoCusto;
    descricao: string;
    valor: number;
    data_custo: Date;
    comprovante_url?: string;
}

export class CustoAcao extends Model<CustoAcaoAttributes> implements CustoAcaoAttributes {
    public id!: string;
    public acao_id!: string;
    public tipo_custo!: TipoCusto;
    public descricao!: string;
    public valor!: number;
    public data_custo!: Date;
    public comprovante_url?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CustoAcao.init(
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
        },
        tipo_custo: {
            type: DataTypes.ENUM('abastecimento', 'alimentacao', 'hospedagem', 'transporte', 'material', 'pedagio', 'manutencao', 'outros'),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        data_custo: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        comprovante_url: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL do comprovante de despesa',
        },
    },
    {
        sequelize,
        tableName: 'custos_acoes',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Relacionamentos
CustoAcao.belongsTo(Acao, {
    foreignKey: 'acao_id',
    as: 'acao',
});
