import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type AcaoTipo = 'curso' | 'saude';
export type AcaoStatus = 'planejada' | 'ativa' | 'concluida';

export interface AcaoAttributes {
    id: string;
    numero_acao?: number;
    nome: string;
    instituicao_id: string;
    tipo: AcaoTipo;
    municipio: string;
    estado: string;
    data_inicio: Date;
    data_fim: Date;
    status: AcaoStatus;
    descricao?: string;
    local_execucao: string;
    vagas_disponiveis: number;
    distancia_km?: number;
    preco_combustivel_referencia?: number;
    campos_customizados?: Record<string, any>;
    permitir_inscricao_previa?: boolean;
}

export class Acao extends Model<AcaoAttributes> implements AcaoAttributes {
    public id!: string;
    public numero_acao?: number;
    public nome!: string;
    public instituicao_id!: string;
    public tipo!: AcaoTipo;
    public municipio!: string;
    public estado!: string;
    public data_inicio!: Date;
    public data_fim!: Date;
    public status!: AcaoStatus;
    public descricao?: string;
    public local_execucao!: string;
    public vagas_disponiveis!: number;
    public distancia_km?: number;
    public preco_combustivel_referencia?: number;
    public campos_customizados?: Record<string, any>;
    public permitir_inscricao_previa?: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Acao.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        numero_acao: {
            type: DataTypes.INTEGER,
            allowNull: true, // Permitir null pois será gerado no hook beforeCreate
            unique: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [3, 255],
                notEmpty: true,
            },
        },
        instituicao_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'instituicoes',
                key: 'id',
            },
        },
        tipo: {
            type: DataTypes.ENUM('curso', 'saude'),
            allowNull: false,
        },
        municipio: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING(2),
            allowNull: false,
        },
        data_inicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        data_fim: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('planejada', 'ativa', 'concluida'),
            allowNull: false,
            defaultValue: 'planejada',
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        local_execucao: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        vagas_disponiveis: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        distancia_km: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Distância em km de São Luís até o município da ação',
        },
        preco_combustivel_referencia: {
            type: DataTypes.DECIMAL(6, 3),
            allowNull: true,
            comment: 'Preço de referência do combustível em R$/litro',
        },
        campos_customizados: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        permitir_inscricao_previa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Permite inscrição antecipada para esta ação',
        },
    },
    {
        sequelize,
        tableName: 'acoes',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (acao: Acao) => {
                // Garante que numero_acao seja sempre gerado via sequence PostgreSQL
                if (!acao.numero_acao) {
                    const [result] = await sequelize.query(
                        "SELECT nextval('acoes_numero_acao_seq') as numero"
                    );
                    acao.numero_acao = (result[0] as any).numero;
                }
            },
        },
    }
);
