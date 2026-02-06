import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface InsumoAttributes {
    id: string;
    nome: string;
    unidade: string; // Ex: unidade, caixa, litro, kg
    quantidade_minima: number;
    quantidade_atual: number;
    preco_unitario?: number;
    ativo: boolean;
}

export class Insumo extends Model<InsumoAttributes> implements InsumoAttributes {
    public id!: string;
    public nome!: string;
    public unidade!: string;
    public quantidade_minima!: number;
    public quantidade_atual!: number;
    public preco_unitario?: number;
    public ativo!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Insumo.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nome do insumo (ex: Luvas descartáveis, Máscaras N95)',
        },
        unidade: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Unidade de medida: unidade, caixa, litro, kg, etc.',
        },
        quantidade_minima: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Quantidade mínima para alerta de estoque baixo',
        },
        quantidade_atual: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Quantidade atual em estoque',
        },
        preco_unitario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Preço unitário médio do insumo',
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'insumos',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
