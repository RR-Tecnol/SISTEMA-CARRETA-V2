import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type TipoConta =
    // Contas habituais
    | 'agua' | 'energia' | 'aluguel' | 'internet' | 'telefone'
    // Problemas de estrada
    | 'pneu_furado' | 'troca_oleo' | 'abastecimento' | 'manutencao_mecanica'
    | 'reboque' | 'lavagem' | 'pedagio'
    // Custos de ação
    | 'funcionario'
    // Outros
    | 'manutencao' | 'espontaneo' | 'outros';

export type StatusConta = 'pendente' | 'paga' | 'vencida' | 'cancelada';

export interface ContaPagarAttributes {
    id: string;
    tipo_conta: TipoConta;
    tipo_espontaneo?: string;
    descricao: string;
    valor: number;
    data_vencimento: Date;
    data_pagamento?: Date;
    status: StatusConta;
    comprovante_url?: string;
    recorrente: boolean;
    observacoes?: string;
    // Campos para relatórios
    acao_id?: string;
    cidade?: string;
    caminhao_id?: string;
}

export class ContaPagar extends Model<ContaPagarAttributes> implements ContaPagarAttributes {
    public id!: string;
    public tipo_conta!: TipoConta;
    public tipo_espontaneo?: string;
    public descricao!: string;
    public valor!: number;
    public data_vencimento!: Date;
    public data_pagamento?: Date;
    public status!: StatusConta;
    public comprovante_url?: string;
    public recorrente!: boolean;
    public observacoes?: string;
    // Campos para relatórios
    public acao_id?: string;
    public cidade?: string;
    public caminhao_id?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ContaPagar.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        tipo_conta: {
            type: DataTypes.ENUM(
                'agua', 'energia', 'aluguel', 'internet', 'telefone',
                'pneu_furado', 'troca_oleo', 'abastecimento', 'manutencao_mecanica',
                'reboque', 'lavagem', 'pedagio',
                'funcionario',
                'manutencao', 'espontaneo', 'outros'
            ),
            allowNull: false,
        },
        tipo_espontaneo: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Descrição do tipo quando tipo_conta = espontaneo',
        },
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        data_vencimento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        data_pagamento: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pendente', 'paga', 'vencida', 'cancelada'),
            allowNull: false,
            defaultValue: 'pendente',
        },
        comprovante_url: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL do comprovante de pagamento',
        },
        recorrente: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indica se a conta é recorrente (mensal)',
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID da ação relacionada (para relatórios por ação)',
        },
        cidade: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Cidade onde ocorreu o custo (para relatórios por cidade)',
        },
        caminhao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID do caminhão relacionado (para custos de estrada)',
        },
    },
    {
        sequelize,
        tableName: 'contas_pagar',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
