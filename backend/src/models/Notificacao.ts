import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificacaoTipo = 'whatsapp' | 'email' | 'sms';
export type NotificacaoStatus = 'agendada' | 'enviada' | 'erro';

export interface NotificacaoAttributes {
    id: string;
    acao_id?: string;
    tipo: NotificacaoTipo;
    template: string;
    destinatarios_filtro?: Record<string, any>;
    agendamento?: Date;
    status: NotificacaoStatus;
    estatisticas?: Record<string, any>;
    sent_at?: Date;
}

export class Notificacao extends Model<NotificacaoAttributes> implements NotificacaoAttributes {
    public id!: string;
    public acao_id?: string;
    public tipo!: NotificacaoTipo;
    public template!: string;
    public destinatarios_filtro?: Record<string, any>;
    public agendamento?: Date;
    public status!: NotificacaoStatus;
    public estatisticas?: Record<string, any>;
    public sent_at?: Date;

    public readonly created_at!: Date;
}

Notificacao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'acoes',
                key: 'id',
            },
        },
        tipo: {
            type: DataTypes.ENUM('whatsapp', 'email', 'sms'),
            allowNull: false,
        },
        template: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        destinatarios_filtro: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        agendamento: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('agendada', 'enviada', 'erro'),
            allowNull: false,
            defaultValue: 'agendada',
        },
        estatisticas: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: { enviados: 0, entregues: 0, falhas: 0 },
        },
        sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'notificacoes',
        timestamps: true,
        underscored: true,
        updatedAt: false,
    }
);
