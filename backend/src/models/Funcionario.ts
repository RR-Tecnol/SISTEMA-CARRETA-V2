import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface FuncionarioAttributes {
    id: string;
    nome: string;
    cargo: string;
    especialidade?: string;
    custo_diario: number;
    status: 'ativo' | 'inativo';
}

export class Funcionario extends Model<FuncionarioAttributes> implements FuncionarioAttributes {
    public id!: string;
    public nome!: string;
    public cargo!: string;
    public especialidade?: string;
    public custo_diario!: number;
    public status!: 'ativo' | 'inativo';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Funcionario.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cargo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        especialidade: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        custo_diario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'ativo',
            validate: {
                isIn: [['ativo', 'inativo']],
            },
        },
    },
    {
        sequelize,
        tableName: 'funcionarios',
        timestamps: true,
        underscored: true,
    }
);
