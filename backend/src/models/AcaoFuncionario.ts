import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AcaoFuncionarioAttributes {
    id: string;
    acao_id: string;
    funcionario_id: string;
    valor_diaria?: number;
    dias_trabalhados?: number;
}

export interface AcaoFuncionarioCreationAttributes extends Optional<AcaoFuncionarioAttributes, 'id'> { }

export class AcaoFuncionario extends Model<AcaoFuncionarioAttributes, AcaoFuncionarioCreationAttributes> implements AcaoFuncionarioAttributes {
    public id!: string;
    public acao_id!: string;
    public funcionario_id!: string;
    public valor_diaria?: number;
    public dias_trabalhados?: number;
}

AcaoFuncionario.init(
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
        funcionario_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'funcionarios',
                key: 'id',
            },
        },
        valor_diaria: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Valor da diária do funcionário nesta ação',
        },
        dias_trabalhados: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'Quantidade de dias trabalhados na ação',
        },
    },
    {
        sequelize,
        tableName: 'acao_funcionarios',
        timestamps: true,
        underscored: true,
    }
);
