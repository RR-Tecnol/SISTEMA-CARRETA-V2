import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface CaminhaoAttributes {
    id: string;
    placa: string;
    modelo: string;
    ano: number;
    autonomia_km_litro: number;
    capacidade_litros: number;
    status: 'disponivel' | 'em_manutencao' | 'em_acao';
}

export class Caminhao extends Model<CaminhaoAttributes> implements CaminhaoAttributes {
    public id!: string;
    public placa!: string;
    public modelo!: string;
    public ano!: number;
    public autonomia_km_litro!: number;
    public capacidade_litros!: number;
    public status!: 'disponivel' | 'em_manutencao' | 'em_acao';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Caminhao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        placa: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
        },
        modelo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ano: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        autonomia_km_litro: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: 'km_por_litro',
            comment: 'Autonomia do caminhão em km por litro',
        },
        capacidade_litros: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'capacidade_litros',
        },
        status: {
            type: DataTypes.STRING, // Banco usa VARCHAR com CHECK, não ENUM nativo
            allowNull: false,
            defaultValue: 'disponivel',
            validate: {
                isIn: [['disponivel', 'em_manutencao', 'em_acao']],
            },
        },
    },
    {
        sequelize,
        tableName: 'caminhoes',
        timestamps: true,
        underscored: true,
    }
);
