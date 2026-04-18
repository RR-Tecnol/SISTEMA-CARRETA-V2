import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type EmergenciaStatus = 'novo' | 'visto' | 'em_atendimento' | 'resolvido';

export interface EmergenciaAttributes {
    id: string;
    acao_id: string;
    cidadao_id: string;
    nome_cidadao: string;
    status: EmergenciaStatus;
    atendido_por?: string;
    resolvido_em?: Date;
    observacoes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class Emergencia extends Model<EmergenciaAttributes> implements EmergenciaAttributes {
    public id!: string;
    public acao_id!: string;
    public cidadao_id!: string;
    public nome_cidadao!: string;
    public status!: EmergenciaStatus;
    public atendido_por?: string;
    public resolvido_em?: Date;
    public observacoes?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Emergencia.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'acoes', key: 'id' },
        },
        cidadao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'cidadaos', key: 'id' },
        },
        nome_cidadao: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('novo', 'visto', 'em_atendimento', 'resolvido'),
            allowNull: false,
            defaultValue: 'novo',
        },
        atendido_por: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'funcionarios', key: 'id' },
        },
        resolvido_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'emergencias',
        timestamps: true,
        underscored: true,
    }
);
