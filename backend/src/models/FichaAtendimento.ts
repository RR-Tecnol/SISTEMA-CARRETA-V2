import { Model, DataTypes, UUIDV4, Optional, Op } from 'sequelize';

import { sequelize } from '../config/database';

export type FichaStatus = 'aguardando' | 'chamado' | 'em_atendimento' | 'concluido' | 'cancelado';

export interface FichaAtendimentoAttributes {
    id: string;
    numero_ficha: number;
    cidadao_id: string;
    inscricao_id?: string | null;
    estacao_id?: string | null;
    acao_id: string;
    status: FichaStatus;
    hora_entrada: Date;
    hora_chamada?: Date | null;
    hora_atendimento?: Date | null;
    hora_conclusao?: Date | null;
    guiche?: string | null;
    observacoes?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface FichaAtendimentoCreationAttributes extends Optional<
    FichaAtendimentoAttributes,
    'id' | 'status' | 'hora_entrada' | 'numero_ficha' | 'hora_chamada' | 'hora_atendimento' | 'hora_conclusao' | 'guiche' | 'observacoes' | 'inscricao_id' | 'estacao_id'
> {}

export class FichaAtendimento extends Model<FichaAtendimentoAttributes, FichaAtendimentoCreationAttributes>
    implements FichaAtendimentoAttributes {
    public id!: string;
    public numero_ficha!: number;
    public cidadao_id!: string;
    public inscricao_id!: string | null;
    public estacao_id!: string | null;
    public acao_id!: string;
    public status!: FichaStatus;
    public hora_entrada!: Date;
    public hora_chamada!: Date | null;
    public hora_atendimento!: Date | null;
    public hora_conclusao!: Date | null;
    public guiche!: string | null;
    public observacoes!: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FichaAtendimento.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        numero_ficha: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Número sequencial da ficha para o dia (ex: 001, 002...)',
        },
        cidadao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'cidadaos', key: 'id' },
        },
        inscricao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'inscricoes', key: 'id' },
            comment: 'Inscrição específica do exame (opcional — pode ser gerada na hora)',
        },
        estacao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'estacoes_exame', key: 'id' },
            comment: 'Estação de exame onde o cidadão será atendido',
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'acoes', key: 'id' },
        },
        status: {
            type: DataTypes.ENUM('aguardando', 'chamado', 'em_atendimento', 'concluido', 'cancelado'),
            defaultValue: 'aguardando',
            allowNull: false,
        },
        hora_entrada: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        hora_chamada: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        hora_atendimento: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        hora_conclusao: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        guiche: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Guichê ou sala de atendimento (ex: "Sala 1", "Guichê 2")',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'fichas_atendimento',
        timestamps: true,
        underscored: true,
        hooks: {
            // Gera numero_ficha sequencial por dia/acao
            beforeValidate: async (ficha) => {
                if (!ficha.numero_ficha && ficha.acao_id) {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const amanha = new Date(hoje);
                    amanha.setDate(amanha.getDate() + 1);

                    const count = await FichaAtendimento.count({
                        where: {
                            acao_id: ficha.acao_id,
                            hora_entrada: {
                                [Op.gte]: hoje,
                                [Op.lt]: amanha,
                            },
                        },
                    });
                    ficha.numero_ficha = count + 1;
                }
            },
        },
    }
);

export default FichaAtendimento;
