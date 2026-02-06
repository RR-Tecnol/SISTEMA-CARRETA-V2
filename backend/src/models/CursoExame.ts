import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type CursoExameTipo = 'curso' | 'exame';

export interface CursoExameAttributes {
    id: string;
    nome: string;
    tipo: CursoExameTipo;
    carga_horaria?: number;
    descricao?: string;
    requisitos?: string;
    certificadora?: string;
    ativo: boolean;
}

export class CursoExame extends Model<CursoExameAttributes> implements CursoExameAttributes {
    public id!: string;
    public nome!: string;
    public tipo!: CursoExameTipo;
    public carga_horaria?: number;
    public descricao?: string;
    public requisitos?: string;
    public certificadora?: string;
    public ativo!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CursoExame.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.ENUM('curso', 'exame'),
            allowNull: false,
        },
        carga_horaria: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requisitos: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        certificadora: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'cursos_exames',
        timestamps: false,
        underscored: true,
    }
);
