import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface AcaoCursoExameAttributes {
    id?: string;
    acao_id: string;
    curso_exame_id: string;
    vagas: number;
    periodicidade_meses?: number | null;   // null = sem periodicidade (exame único ou livre)
    dias_aviso_vencimento?: number;         // dias antes do vencimento para alertar
    permitir_repeticao?: boolean;           // se false, cidadão só faz 1 vez
}

export class AcaoCursoExame extends Model<AcaoCursoExameAttributes> implements AcaoCursoExameAttributes {
    public id!: string;
    public acao_id!: string;
    public curso_exame_id!: string;
    public vagas!: number;
    public periodicidade_meses?: number | null;
    public dias_aviso_vencimento?: number;
    public permitir_repeticao?: boolean;
}

AcaoCursoExame.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
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
            allowNull: false,
            references: {
                model: 'cursos_exames',
                key: 'id',
            },
        },
        vagas: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        periodicidade_meses: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: 'Intervalo mínimo em meses entre realizações do mesmo exame. Null = livre/sem restrição.',
        },
        dias_aviso_vencimento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30,
            comment: 'Quantos dias antes do vencimento emitir alerta ao admin.',
        },
        permitir_repeticao: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Se false, o cidadão só pode realizar este exame uma única vez.',
        },
    },
    {
        sequelize,
        tableName: 'acao_curso_exame',
        timestamps: true,
        underscored: true,
    }
);
