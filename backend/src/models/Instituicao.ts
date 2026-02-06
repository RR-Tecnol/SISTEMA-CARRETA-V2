import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface InstituicaoAttributes {
    id: string;
    razao_social: string;
    cnpj: string;
    responsavel_nome: string;
    responsavel_email: string;
    responsavel_tel: string;
    endereco_completo: string;
    campos_customizados?: Record<string, any>;
    ativo: boolean;
}

export class Instituicao extends Model<InstituicaoAttributes> implements InstituicaoAttributes {
    public id!: string;
    public razao_social!: string;
    public cnpj!: string;
    public responsavel_nome!: string;
    public responsavel_email!: string;
    public responsavel_tel!: string;
    public endereco_completo!: string;
    public campos_customizados?: Record<string, any>;
    public ativo!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Instituicao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        razao_social: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cnpj: {
            type: DataTypes.STRING(18),
            allowNull: false,
            unique: true,
        },
        responsavel_nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        responsavel_email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        responsavel_tel: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        endereco_completo: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        campos_customizados: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'instituicoes',
        timestamps: true,
        underscored: true,
    }
);
