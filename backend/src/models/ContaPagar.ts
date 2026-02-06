import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export type TipoConta =
    // Contas habituais
    | 'agua' | 'energia' | 'aluguel' | 'internet' | 'telefone'
    // Problemas de estrada
    | 'pneu_furado' | 'troca_oleo' | 'abastecimento' | 'manutencao_mecanica'
    | 'reboque' | 'lavagem' | 'pedagio'
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
            type: DataTypes.DATE,
            allowNull: false,
        },
        data_pagamento: {
            type: DataTypes.DATE,
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
