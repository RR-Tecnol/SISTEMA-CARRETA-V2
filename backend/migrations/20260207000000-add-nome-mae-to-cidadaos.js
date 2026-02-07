module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('cidadaos', 'nome_mae', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Nome da mãe do cidadão',
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('cidadaos', 'nome_mae');
    },
};
