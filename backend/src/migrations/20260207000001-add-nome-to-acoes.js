'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('acoes', 'nome', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Ação sem nome'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('acoes', 'nome');
    }
};
