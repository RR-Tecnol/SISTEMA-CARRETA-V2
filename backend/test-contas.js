const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Configuração do banco
const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
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
    status: {
        type: DataTypes.ENUM('pendente', 'paga', 'vencida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendente'
    },
    recorrente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'contas_pagar',
    timestamps: true,
    underscored: true
});

// Rota de teste
app.get('/test', async (req, res) => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão OK');

        const contas = await ContaPagar.findAll({ limit: 5 });
        console.log('✅ Query OK - Encontradas', contas.length, 'contas');

        res.json({ success: true, count: contas.length, contas });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

app.listen(3002, () => {
    console.log('🧪 Servidor de teste rodando na porta 3002');
    console.log('Teste: http://localhost:3002/test');
});
