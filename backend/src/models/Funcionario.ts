import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface FuncionarioAttributes {
    id: string;
    nome: string;
    cargo: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    especialidade?: string;
    custo_diaria: number;
    ativo: boolean;
}

export class Funcionario extends Model<FuncionarioAttributes> implements FuncionarioAttributes {
    public id!: string;
    public nome!: string;
    public cargo!: string;
    public cpf?: string;
    public telefone?: string;
    public email?: string;
    public especialidade?: string;
    public custo_diaria!: number;
    public ativo!: boolean;

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
        cpf: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        telefone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        especialidade: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        custo_diaria: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'funcionarios',
        timestamps: true,
        underscored: true,
    }
);
