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
    crm?: string;
    custo_diaria: number;
    ativo: boolean;
    // Campos de login médico
    is_medico?: boolean;
    login_cpf?: string;
    senha?: string;
}

export class Funcionario extends Model<FuncionarioAttributes> implements FuncionarioAttributes {
    public id!: string;
    public nome!: string;
    public cargo!: string;
    public cpf?: string;
    public telefone?: string;
    public email?: string;
    public especialidade?: string;
    public crm?: string;
    public custo_diaria!: number;
    public ativo!: boolean;
    public is_medico?: boolean;
    public login_cpf?: string;
    public senha?: string;

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
        crm: {
            type: DataTypes.STRING(30),
            allowNull: true,
            comment: 'CRM/RQE do médico Responsável Técnico',
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
        is_medico: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        login_cpf: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        senha: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Hash bcrypt da senha do medico para login',
        },
    },
    {
        sequelize,
        tableName: 'funcionarios',
        timestamps: true,
        underscored: true,
    }
);
