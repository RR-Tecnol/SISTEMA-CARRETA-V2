'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('acao_funcionarios', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            acao_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'acoes',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            funcionario_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'funcionarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add unique constraint to prevent duplicate assignments
        await queryInterface.addConstraint('acao_funcionarios', {
            fields: ['acao_id', 'funcionario_id'],
            type: 'unique',
            name: 'unique_acao_funcionario',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('acao_funcionarios');
    },
};
