import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface AcaoCursoExameAttributes {
    id?: string;
    acao_id: string;
    curso_exame_id: string;
    vagas: number;
}

export class AcaoCursoExame extends Model<AcaoCursoExameAttributes> implements AcaoCursoExameAttributes {
    public id!: string;
    public acao_id!: string;
    public curso_exame_id!: string;
    public vagas!: number;
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
    },
    {
        sequelize,
        tableName: 'acao_curso_exame',
        timestamps: true,
        underscored: true,
    }
);
