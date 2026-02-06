module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Alterar campo custo_diario para autonomia_km_litro em caminhoes
        await queryInterface.renameColumn('caminhoes', 'custo_diario', 'autonomia_km_litro');

        await queryInterface.changeColumn('caminhoes', 'autonomia_km_litro', {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Autonomia do caminhão em km por litro',
        });

        // Adicionar campos em acoes
        await queryInterface.addColumn('acoes', 'distancia_km', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Distância em km de São Luís até o município da ação',
        });

        await queryInterface.addColumn('acoes', 'preco_combustivel_referencia', {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: true,
            comment: 'Preço de referência do combustível em R$/litro',
        });

        // Criar tabela abastecimentos
        await queryInterface.createTable('abastecimentos', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            acao_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'acoes',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            caminhao_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'caminhoes',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            data_abastecimento: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            litros: {
                type: Sequelize.DECIMAL(8, 2),
                allowNull: false,
                comment: 'Quantidade de litros abastecidos',
            },
            valor_total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Valor total pago pelo abastecimento',
            },
            preco_por_litro: {
                type: Sequelize.DECIMAL(6, 3),
                allowNull: false,
                comment: 'Preço por litro (calculado: valor_total / litros)',
            },
            observacoes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Reverter mudanças
        await queryInterface.dropTable('abastecimentos');
        await queryInterface.removeColumn('acoes', 'preco_combustivel_referencia');
        await queryInterface.removeColumn('acoes', 'distancia_km');

        await queryInterface.renameColumn('caminhoes', 'autonomia_km_litro', 'custo_diario');
        await queryInterface.changeColumn('caminhoes', 'custo_diario', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        });
    },
};
