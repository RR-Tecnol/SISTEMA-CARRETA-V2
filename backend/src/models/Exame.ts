import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface ExameAttributes {
    id: string;
    nome: string;
    tipo_exame: string; // Ex: sangue, urina, imagem, etc.
    laboratorio_referencia?: string;
    instrucoes_preparo?: string;
    valores_referencia?: string;
    custo_base?: number;
    ativo: boolean;
}

export class Exame extends Model<ExameAttributes> implements ExameAttributes {
    public id!: string;
    public nome!: string;
    public tipo_exame!: string;
    public laboratorio_referencia?: string;
    public instrucoes_preparo?: string;
    public valores_referencia?: string;
    public custo_base?: number;
    public ativo!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Exame.init(
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
        tipo_exame: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tipo do exame: sangue, urina, imagem, etc.',
        },
        laboratorio_referencia: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        instrucoes_preparo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Instruções de preparo para o exame (ex: jejum de 12h)',
        },
        valores_referencia: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Valores de referência normais para o exame',
        },
        custo_base: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Custo base estimado do exame',
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'exames',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
