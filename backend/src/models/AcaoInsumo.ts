import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Acao } from './Acao';
import { Insumo } from './Insumo';

export interface AcaoInsumoAttributes {
    id: string;
    acao_id: string;
    insumo_id: string;
    quantidade_planejada: number;
    quantidade_levada?: number;
    quantidade_utilizada?: number;
    quantidade_retornada?: number;
}

export class AcaoInsumo extends Model<AcaoInsumoAttributes> implements AcaoInsumoAttributes {
    public id!: string;
    public acao_id!: string;
    public insumo_id!: string;
    public quantidade_planejada!: number;
    public quantidade_levada?: number;
    public quantidade_utilizada?: number;
    public quantidade_retornada?: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

AcaoInsumo.init(
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
        insumo_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'insumos',
                key: 'id',
            },
        },
        quantidade_planejada: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantidade planejada para a ação',
        },
        quantidade_levada: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Quantidade que o motorista levou',
        },
        quantidade_utilizada: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Quantidade efetivamente utilizada na ação',
        },
        quantidade_retornada: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Quantidade que retornou após a ação',
        },
    },
    {
        sequelize,
        tableName: 'acoes_insumos',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Relacionamentos
AcaoInsumo.belongsTo(Acao, {
    foreignKey: 'acao_id',
    as: 'acao',
});

AcaoInsumo.belongsTo(Insumo, {
    foreignKey: 'insumo_id',
    as: 'insumo',
});
