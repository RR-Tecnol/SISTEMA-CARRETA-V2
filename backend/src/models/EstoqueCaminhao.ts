import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Caminhao } from './Caminhao';
import { Insumo } from './Insumo';

export interface EstoqueCaminhaoAttributes {
    id: string;
    caminhao_id: string;
    insumo_id: string;
    quantidade: number;
    ultima_atualizacao: Date;
}

export class EstoqueCaminhao extends Model<EstoqueCaminhaoAttributes> implements EstoqueCaminhaoAttributes {
    public id!: string;
    public caminhao_id!: string;
    public insumo_id!: string;
    public quantidade!: number;
    public ultima_atualizacao!: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EstoqueCaminhao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'caminhoes',
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
    },
    {
        sequelize,
        tableName: 'estoque_caminhoes',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['caminhao_id', 'insumo_id'],
                name: 'unique_caminhao_insumo',
            },
        ],
    }
);

// Relacionamentos
EstoqueCaminhao.belongsTo(Caminhao, {
    foreignKey: 'caminhao_id',
    as: 'caminhao',
});

EstoqueCaminhao.belongsTo(Insumo, {
    foreignKey: 'insumo_id',
    as: 'insumo',
});
