import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';
import { Inscricao } from './Inscricao';
import { Exame } from './Exame';
import { Cidadao } from './Cidadao';
import { Acao } from './Acao';

export interface ResultadoExameAttributes {
    id: string;
    inscricao_id: string;
    exame_id: string;
    cidadao_id: string;
    acao_id: string;
    data_realizacao: Date;
    resultado?: string;
    arquivo_resultado_url?: string;
    observacoes?: string;
}

export class ResultadoExame extends Model<ResultadoExameAttributes> implements ResultadoExameAttributes {
    public id!: string;
    public inscricao_id!: string;
    public exame_id!: string;
    public cidadao_id!: string;
    public acao_id!: string;
    public data_realizacao!: Date;
    public resultado?: string;
    public arquivo_resultado_url?: string;
    public observacoes?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ResultadoExame.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        inscricao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'inscricoes',
                key: 'id',
            },
        },
        exame_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'exames',
                key: 'id',
            },
        },
        cidadao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'cidadaos',
                key: 'id',
            },
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'acoes',
                key: 'id',
            },
        },
        data_realizacao: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        resultado: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Resultado textual do exame',
        },
        arquivo_resultado_url: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL do arquivo PDF com o resultado completo',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'resultados_exames',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Relacionamentos
ResultadoExame.belongsTo(Inscricao, {
    foreignKey: 'inscricao_id',
    as: 'inscricao',
});

ResultadoExame.belongsTo(Exame, {
    foreignKey: 'exame_id',
    as: 'exame',
});

ResultadoExame.belongsTo(Cidadao, {
    foreignKey: 'cidadao_id',
    as: 'cidadao',
});

ResultadoExame.belongsTo(Acao, {
    foreignKey: 'acao_id',
    as: 'acao',
});
