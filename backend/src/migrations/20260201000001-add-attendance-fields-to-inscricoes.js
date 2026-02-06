module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('inscricoes', 'data_confirmacao', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('inscricoes', 'data_atendimento', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn('inscricoes', 'cadastro_espontaneo', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('inscricoes', 'data_confirmacao');
        await queryInterface.removeColumn('inscricoes', 'data_atendimento');
        await queryInterface.removeColumn('inscricoes', 'cadastro_espontaneo');
    },
};
