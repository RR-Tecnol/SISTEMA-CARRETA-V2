import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class ConfiguracaoSistema extends Model {
    public chave!: string;
    public valor!: string;
}

ConfiguracaoSistema.init(
    {
        chave: {
            type: DataTypes.STRING(100),
            primaryKey: true,
            allowNull: false,
        },
        valor: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'configuracoes_sistema',
        timestamps: false,
    }
);
