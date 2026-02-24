import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AtendimentoStatus = 'aguardando' | 'em_andamento' | 'concluido' | 'cancelado';

export interface AtendimentoMedicoAttributes {
    id: string;
    funcionario_id: string;
    acao_id?: string;
    cidadao_id?: string;
    ponto_id?: string;
    hora_inicio: Date;
    hora_fim?: Date;
    duracao_minutos?: number;
    status: AtendimentoStatus;
    observacoes?: string;
    nome_paciente?: string;
}

export interface AtendimentoMedicoCreationAttributes extends Optional<AtendimentoMedicoAttributes, 'id' | 'hora_fim' | 'duracao_minutos' | 'status'> { }

export class AtendimentoMedico extends Model<AtendimentoMedicoAttributes, AtendimentoMedicoCreationAttributes> implements AtendimentoMedicoAttributes {
    public id!: string;
    public funcionario_id!: string;
    public acao_id?: string;
    public cidadao_id?: string;
    public ponto_id?: string;
    public hora_inicio!: Date;
    public hora_fim?: Date;
    public duracao_minutos?: number;
    public status!: AtendimentoStatus;
    public observacoes?: string;
    public nome_paciente?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

AtendimentoMedico.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        funcionario_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'funcionarios', key: 'id' },
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'acoes', key: 'id' },
        },
        cidadao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'cidadaos', key: 'id' },
        },
        ponto_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'pontos_medicos', key: 'id' },
        },
        hora_inicio: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        hora_fim: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        duracao_minutos: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duração total do atendimento em minutos (calculado ao finalizar)',
        },
        status: {
            type: DataTypes.ENUM('aguardando', 'em_andamento', 'concluido', 'cancelado'),
            allowNull: false,
            defaultValue: 'em_andamento',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        nome_paciente: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Nome do paciente (preenchido caso não tenha cidadao_id vinculado)',
        },
    },
    {
        sequelize,
        tableName: 'atendimentos_medicos',
        timestamps: true,
        underscored: true,
    }
);
