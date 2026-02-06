import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type InscricaoStatus = 'pendente' | 'atendido' | 'faltou' | 'cancelado';

export interface InscricaoAttributes {
    id?: string;
    cidadao_id: string;
    acao_id: string;
    curso_exame_id?: string;
    status: 'pendente' | 'atendido' | 'faltou';
    data_inscricao: Date;
    observacoes?: string;
    campos_customizados?: Record<string, any>;
}

export class Inscricao extends Model<InscricaoAttributes> implements InscricaoAttributes {
    public id!: string;
    public cidadao_id!: string;
    public acao_id!: string;
    public curso_exame_id?: string;
    public status!: 'pendente' | 'atendido' | 'faltou';
    public data_inscricao!: Date;
    public observacoes?: string;
    public campos_customizados?: Record<string, any>;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Inscricao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
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
        curso_exame_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'cursos_exames',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pendente',
            validate: {
                isIn: [['pendente', 'atendido', 'faltou']],
            },
        },
        data_inscricao: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        campos_customizados: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'inscricoes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
    }
);
