const { Sequelize, DataTypes } = require('sequelize');

// Configuração do banco
const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

// Definir modelo ContaPagar
const ContaPagar = sequelize.define('ContaPagar', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tipo_conta: {
        type: DataTypes.ENUM(
            'agua', 'energia', 'aluguel', 'internet', 'telefone',
            'pneu_furado', 'troca_oleo', 'abastecimento', 'manutencao_mecanica',
            'reboque', 'lavagem', 'pedagio',
            'manutencao', 'espontaneo', 'outros'
        ),
        allowNull: false
    },
    tipo_espontaneo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    data_vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_pagamento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pendente', 'paga', 'vencida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendente'
    },
    comprovante_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    recorrente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    observacoes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    acao_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    cidade: {
        type: DataTypes.STRING,
        allowNull: true
    },
    caminhao_id: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'contas_pagar',
    timestamps: true,
    underscored: true
});

// Sincronizar
async function sync() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida com sucesso!');

        await ContaPagar.sync({ force: false });
        console.log('✅ Tabela contas_pagar criada/sincronizada com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

sync();
