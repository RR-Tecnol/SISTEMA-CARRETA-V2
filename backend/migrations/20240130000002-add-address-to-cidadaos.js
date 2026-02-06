module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('cidadaos', 'cep', {
            type: Sequelize.STRING(9),
            allowNull: true,
        });
        await queryInterface.addColumn('cidadaos', 'rua', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });
        await queryInterface.addColumn('cidadaos', 'numero', {
            type: Sequelize.STRING(10),
            allowNull: true,
        });
        await queryInterface.addColumn('cidadaos', 'complemento', {
            type: Sequelize.STRING(100),
            allowNull: true,
        });
        await queryInterface.addColumn('cidadaos', 'bairro', {
            type: Sequelize.STRING(100),
            allowNull: true,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('cidadaos', 'cep');
        await queryInterface.removeColumn('cidadaos', 'rua');
        await queryInterface.removeColumn('cidadaos', 'numero');
        await queryInterface.removeColumn('cidadaos', 'complemento');
        await queryInterface.removeColumn('cidadaos', 'bairro');
    },
};
