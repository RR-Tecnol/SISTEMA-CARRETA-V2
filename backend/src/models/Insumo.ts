import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface InsumoAttributes {
    id: string;
    nome: string;
    descricao?: string;
    categoria: 'EPI' | 'MEDICAMENTO' | 'MATERIAL_DESCARTAVEL' | 'EQUIPAMENTO' | 'OUTROS';
    unidade: string; // Ex: unidade, caixa, litro, kg
    quantidade_minima: number;
    quantidade_atual: number;
    preco_unitario?: number;
    codigo_barras?: string;
    lote?: string;
    data_validade?: Date;
    fornecedor?: string;
    nota_fiscal?: string;
    data_entrada?: Date;
    localizacao?: string;
    ativo: boolean;
}

export class Insumo extends Model<InsumoAttributes> implements InsumoAttributes {
    public id!: string;
    public nome!: string;
    public descricao?: string;
    public categoria!: 'EPI' | 'MEDICAMENTO' | 'MATERIAL_DESCARTAVEL' | 'EQUIPAMENTO' | 'OUTROS';
    public unidade!: string;
    public quantidade_minima!: number;
    public quantidade_atual!: number;
    public preco_unitario?: number;
    public codigo_barras?: string;
    public lote?: string;
    public data_validade?: Date;
    public fornecedor?: string;
    public nota_fiscal?: string;
    public data_entrada?: Date;
    public localizacao?: string;
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
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Descrição detalhada do insumo',
        },
        categoria: {
            type: DataTypes.ENUM('EPI', 'MEDICAMENTO', 'MATERIAL_DESCARTAVEL', 'EQUIPAMENTO', 'OUTROS'),
            allowNull: false,
            defaultValue: 'OUTROS',
            comment: 'Categoria do insumo',
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
        codigo_barras: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Código de barras do produto',
        },
        lote: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Número do lote',
        },
        data_validade: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Data de validade do lote',
        },
        fornecedor: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Nome do fornecedor',
        },
        nota_fiscal: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Número da nota fiscal de entrada',
        },
        data_entrada: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Data de entrada no estoque',
        },
        localizacao: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Localização física no estoque (prateleira, setor)',
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
