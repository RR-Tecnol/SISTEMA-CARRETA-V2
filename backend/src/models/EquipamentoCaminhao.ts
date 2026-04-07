import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type EquipamentoStatus = 'ativo' | 'em_manutencao' | 'inativo' | 'descartado';
export type EquipamentoTipo = 'ecografo' | 'eletrocardiografo' | 'computador' | 'monitor' | 'impressora' | 'gerador' | 'ar_condicionado' | 'outro';

export interface EquipamentoCaminhaoAttributes {
    id: string;
    caminhao_id: string;
    nome: string;
    tipo: EquipamentoTipo;
    modelo?: string | null;
    fabricante?: string | null;
    numero_serie?: string | null;
    numero_patrimonio?: string | null;
    data_aquisicao?: string | null;
    data_ultima_manutencao?: string | null;
    data_proxima_manutencao?: string | null;
    valor_aquisicao?: number | null;
    status: EquipamentoStatus;
    observacoes?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface EquipamentoCaminhaoCreationAttributes extends Optional<
    EquipamentoCaminhaoAttributes,
    'id' | 'status' | 'modelo' | 'fabricante' | 'numero_serie' | 'numero_patrimonio' |
    'data_aquisicao' | 'data_ultima_manutencao' | 'data_proxima_manutencao' |
    'valor_aquisicao' | 'observacoes'
> {}

export class EquipamentoCaminhao extends Model<EquipamentoCaminhaoAttributes, EquipamentoCaminhaoCreationAttributes>
    implements EquipamentoCaminhaoAttributes {
    public id!: string;
    public caminhao_id!: string;
    public nome!: string;
    public tipo!: EquipamentoTipo;
    public modelo!: string | null;
    public fabricante!: string | null;
    public numero_serie!: string | null;
    public numero_patrimonio!: string | null;
    public data_aquisicao!: string | null;
    public data_ultima_manutencao!: string | null;
    public data_proxima_manutencao!: string | null;
    public valor_aquisicao!: number | null;
    public status!: EquipamentoStatus;
    public observacoes!: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EquipamentoCaminhao.init(
    {
        id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
        caminhao_id: {
            type: DataTypes.UUID, allowNull: false,
            references: { model: 'caminhoes', key: 'id' },
        },
        nome: { type: DataTypes.STRING(100), allowNull: false },
        tipo: {
            type: DataTypes.ENUM('ecografo', 'eletrocardiografo', 'computador', 'monitor', 'impressora', 'gerador', 'ar_condicionado', 'outro'),
            allowNull: false,
            defaultValue: 'outro',
        },
        modelo: { type: DataTypes.STRING(100), allowNull: true },
        fabricante: { type: DataTypes.STRING(100), allowNull: true },
        numero_serie: { type: DataTypes.STRING(100), allowNull: true },
        numero_patrimonio: { type: DataTypes.STRING(50), allowNull: true },
        data_aquisicao: { type: DataTypes.DATEONLY, allowNull: true },
        data_ultima_manutencao: { type: DataTypes.DATEONLY, allowNull: true },
        data_proxima_manutencao: { type: DataTypes.DATEONLY, allowNull: true },
        valor_aquisicao: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        status: {
            type: DataTypes.ENUM('ativo', 'em_manutencao', 'inativo', 'descartado'),
            defaultValue: 'ativo',
            allowNull: false,
        },
        observacoes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        sequelize,
        tableName: 'equipamentos_caminhao',
        timestamps: true,
        underscored: true,
    }
);

export default EquipamentoCaminhao;
