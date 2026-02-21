import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface ManutencaoCaminhaoAttributes {
    id: string;
    caminhao_id: string;
    tipo: 'preventiva' | 'corretiva' | 'revisao' | 'pneu' | 'eletrica' | 'outro';
    titulo: string;
    descricao?: string;
    status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    km_atual?: number;
    km_proximo?: number;
    data_agendada?: Date;
    data_conclusao?: Date;
    custo_estimado?: number;
    custo_real?: number;
    status_pagamento?: 'pendente' | 'paga';
    fornecedor?: string;
    responsavel?: string;
    observacoes?: string;
}

export class ManutencaoCaminhao extends Model<ManutencaoCaminhaoAttributes> implements ManutencaoCaminhaoAttributes {
    public id!: string;
    public caminhao_id!: string;
    public tipo!: 'preventiva' | 'corretiva' | 'revisao' | 'pneu' | 'eletrica' | 'outro';
    public titulo!: string;
    public descricao?: string;
    public status!: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
    public prioridade!: 'baixa' | 'media' | 'alta' | 'critica';
    public km_atual?: number;
    public km_proximo?: number;
    public data_agendada?: Date;
    public data_conclusao?: Date;
    public custo_estimado?: number;
    public custo_real?: number;
    public status_pagamento?: 'pendente' | 'paga';
    public fornecedor?: string;
    public responsavel?: string;
    public observacoes?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ManutencaoCaminhao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'caminhoes', key: 'id' },
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'preventiva',
            validate: {
                isIn: [['preventiva', 'corretiva', 'revisao', 'pneu', 'eletrica', 'outro']],
            },
        },
        titulo: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'agendada',
            validate: {
                isIn: [['agendada', 'em_andamento', 'concluida', 'cancelada']],
            },
        },
        prioridade: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'media',
            validate: {
                isIn: [['baixa', 'media', 'alta', 'critica']],
            },
        },
        km_atual: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        km_proximo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        data_agendada: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        data_conclusao: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        custo_estimado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        custo_real: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        status_pagamento: {
            type: DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'pendente',
            validate: { isIn: [['pendente', 'paga']] },
        },
        fornecedor: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        responsavel: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'manutencoes_caminhao',
        timestamps: true,
        underscored: true,
    }
);
