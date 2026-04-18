import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// B5: adicionado 'intervalo' para pausas de almoço
export type PontoMedicoStatus = 'trabalhando' | 'saiu' | 'intervalo';

export interface PontoMedicoAttributes {
    id: string;
    funcionario_id: string;
    acao_id?: string;
    data_hora_entrada: Date;
    data_hora_saida?: Date;
    horas_trabalhadas?: number;
    status: PontoMedicoStatus;
    observacoes?: string;
    sala?: string;
    // B5: campos de intervalo de almoço
    inicio_almoco?: Date;
    fim_almoco?: Date;
    duracao_almoco_minutos?: number;
}

export interface PontoMedicoCreationAttributes extends Optional<PontoMedicoAttributes, 'id' | 'data_hora_saida' | 'horas_trabalhadas' | 'status' | 'sala' | 'inicio_almoco' | 'fim_almoco' | 'duracao_almoco_minutos'> { }

export class PontoMedico extends Model<PontoMedicoAttributes, PontoMedicoCreationAttributes> implements PontoMedicoAttributes {
    public id!: string;
    public funcionario_id!: string;
    public acao_id?: string;
    public data_hora_entrada!: Date;
    public data_hora_saida?: Date;
    public horas_trabalhadas?: number;
    public status!: PontoMedicoStatus;
    public observacoes?: string;
    public sala?: string;

    // B5: intervalos de almoço
    public inicio_almoco?: Date;
    public fim_almoco?: Date;
    public duracao_almoco_minutos?: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

PontoMedico.init(
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
        data_hora_entrada: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        data_hora_saida: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        horas_trabalhadas: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Total de horas trabalhadas no turno (calculado na saída)',
        },
        status: {
            type: DataTypes.ENUM('trabalhando', 'saiu', 'intervalo'),
            allowNull: false,
            defaultValue: 'trabalhando',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sala: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        // B5: almoço
        inicio_almoco: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        fim_almoco: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        duracao_almoco_minutos: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'pontos_medicos',
        timestamps: true,
        underscored: true,
    }
);
