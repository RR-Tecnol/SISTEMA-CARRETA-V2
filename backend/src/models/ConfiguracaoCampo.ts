import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type ConfiguracaoCampoEntidade = 'instituicao' | 'acao' | 'cidadao' | 'curso_exame';
export type ConfiguracaoCampoTipo = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export interface ConfiguracaoCampoAttributes {
    id: string;
    entidade: ConfiguracaoCampoEntidade;
    nome_campo: string;
    tipo: ConfiguracaoCampoTipo;
    obrigatorio: boolean;
    mascara?: string;
    validacao_regex?: string;
    opcoes?: string[];
    ordem_exibicao: number;
    ativo: boolean;
}

export class ConfiguracaoCampo extends Model<ConfiguracaoCampoAttributes> implements ConfiguracaoCampoAttributes {
    public id!: string;
    public entidade!: ConfiguracaoCampoEntidade;
    public nome_campo!: string;
    public tipo!: ConfiguracaoCampoTipo;
    public obrigatorio!: boolean;
    public mascara?: string;
    public validacao_regex?: string;
    public opcoes?: string[];
    public ordem_exibicao!: number;
    public ativo!: boolean;
}

ConfiguracaoCampo.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        entidade: {
            type: DataTypes.ENUM('instituicao', 'acao', 'cidadao', 'curso_exame'),
            allowNull: false,
        },
        nome_campo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.ENUM('text', 'number', 'date', 'select', 'checkbox'),
            allowNull: false,
        },
        obrigatorio: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        mascara: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        validacao_regex: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        opcoes: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        ordem_exibicao: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'configuracoes_campo',
        timestamps: false,
        underscored: true,
    }
);
