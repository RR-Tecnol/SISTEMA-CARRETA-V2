import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AcaoCaminhaoAttributes {
    id: string;
    acao_id: string;
    caminhao_id: string;
}

export interface AcaoCaminhaoCreationAttributes extends Optional<AcaoCaminhaoAttributes, 'id'> {}

export class AcaoCaminhao extends Model<AcaoCaminhaoAttributes, AcaoCaminhaoCreationAttributes> implements AcaoCaminhaoAttributes {
    public id!: string;
    public acao_id!: string;
    public caminhao_id!: string;
}

AcaoCaminhao.init(
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
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'caminhoes',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'acao_caminhoes',
        timestamps: true,
        underscored: true,
    }
);
