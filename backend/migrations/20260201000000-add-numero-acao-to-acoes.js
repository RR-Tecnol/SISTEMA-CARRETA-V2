'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Adiciona a coluna numero_acao
        await queryInterface.addColumn('acoes', 'numero_acao', {
            type: Sequelize.INTEGER,
            allowNull: true, // Temporariamente null para permitir popular dados existentes
            unique: true,
        });

        // Popula numero_acao para registros existentes
        const [acoes] = await queryInterface.sequelize.query(
            `SELECT id FROM acoes ORDER BY created_at ASC`
        );

        for (let i = 0; i < acoes.length; i++) {
            await queryInterface.sequelize.query(
                `UPDATE acoes SET numero_acao = :numero WHERE id = :id`,
                {
                    replacements: { numero: i + 1, id: acoes[i].id }
                }
            );
        }

        // Agora torna a coluna NOT NULL
        await queryInterface.changeColumn('acoes', 'numero_acao', {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
        });

        // Cria uma sequence para auto-increment
        await queryInterface.sequelize.query(
            `CREATE SEQUENCE IF NOT EXISTS acoes_numero_acao_seq START WITH ${acoes.length + 1}`
        );

        // Define o valor padrão como o próximo valor da sequence
        await queryInterface.sequelize.query(
            `ALTER TABLE acoes ALTER COLUMN numero_acao SET DEFAULT nextval('acoes_numero_acao_seq')`
        );
    },

    down: async (queryInterface, Sequelize) => {
        // Remove a sequence
        await queryInterface.sequelize.query(
            `DROP SEQUENCE IF EXISTS acoes_numero_acao_seq`
        );

        // Remove a coluna
        await queryInterface.removeColumn('acoes', 'numero_acao');
    }
};
