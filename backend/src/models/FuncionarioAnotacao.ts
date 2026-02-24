import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface FuncionarioAnotacaoAttributes {
    id: string;
    funcionario_id: string;
    titulo: string;
    conteudo: string;
    cor: string; // hex color tag: #4682b4, #e67e22, #e74c3c, #2ecc71, #9b59b6
    pinned: boolean;
}

export class FuncionarioAnotacao extends Model<FuncionarioAnotacaoAttributes> implements FuncionarioAnotacaoAttributes {
    public id!: string;
    public funcionario_id!: string;
    public titulo!: string;
    public conteudo!: string;
    public cor!: string;
    public pinned!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FuncionarioAnotacao.init(
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
            onDelete: 'CASCADE',
        },
        titulo: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        conteudo: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        cor: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: '#4682b4',
        },
        pinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'funcionario_anotacoes',
        timestamps: true,
        underscored: true,
    }
);
