import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type EstacaoStatus = 'ativa' | 'pausada' | 'manutencao';

export interface EstacaoExameAttributes {
    id: string;
    acao_id: string;
    curso_exame_id?: string | null;
    nome: string;
    status: EstacaoStatus;
    motivo_pausa?: string | null;
    pausada_em?: Date | null;
    retomada_em?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface EstacaoExameCreationAttributes extends Optional<
    EstacaoExameAttributes,
    'id' | 'status' | 'curso_exame_id' | 'motivo_pausa' | 'pausada_em' | 'retomada_em'
> {}

export class EstacaoExame extends Model<EstacaoExameAttributes, EstacaoExameCreationAttributes>
    implements EstacaoExameAttributes {
    public id!: string;
    public acao_id!: string;
    public curso_exame_id!: string | null;
    public nome!: string;
    public status!: EstacaoStatus;
    public motivo_pausa!: string | null;
    public pausada_em!: Date | null;
    public retomada_em!: Date | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EstacaoExame.init(
    {
        id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
        acao_id: {
            type: DataTypes.UUID, allowNull: false,
            references: { model: 'acoes', key: 'id' },
        },
        curso_exame_id: {
            type: DataTypes.UUID, allowNull: true,
            references: { model: 'cursos_exames', key: 'id' },
        },
        nome: { type: DataTypes.STRING(100), allowNull: false },
        status: {
            type: DataTypes.ENUM('ativa', 'pausada', 'manutencao'),
            defaultValue: 'ativa', allowNull: false,
        },
        motivo_pausa: { type: DataTypes.TEXT, allowNull: true },
        pausada_em: { type: DataTypes.DATE, allowNull: true },
        retomada_em: { type: DataTypes.DATE, allowNull: true },
    },
    {
        sequelize,
        tableName: 'estacoes_exame',
        timestamps: true,
        underscored: true,
    }
);

export default EstacaoExame;
