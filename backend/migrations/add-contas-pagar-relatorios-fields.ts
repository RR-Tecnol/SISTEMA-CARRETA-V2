import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.addColumn('contas_pagar', 'acao_id', {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID da ação relacionada (para relatórios por ação)',
        });

        await queryInterface.addColumn('contas_pagar', 'cidade', {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Cidade onde ocorreu o custo (para relatórios por cidade)',
        });

        await queryInterface.addColumn('contas_pagar', 'caminhao_id', {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID do caminhão relacionado (para custos de estrada)',
        });

        // Adicionar índices para melhorar performance de relatórios
        await queryInterface.addIndex('contas_pagar', ['acao_id'], {
            name: 'idx_contas_pagar_acao_id',
        });

        await queryInterface.addIndex('contas_pagar', ['cidade'], {
            name: 'idx_contas_pagar_cidade',
        });

        await queryInterface.addIndex('contas_pagar', ['caminhao_id'], {
            name: 'idx_contas_pagar_caminhao_id',
        });
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.removeIndex('contas_pagar', 'idx_contas_pagar_caminhao_id');
        await queryInterface.removeIndex('contas_pagar', 'idx_contas_pagar_cidade');
        await queryInterface.removeIndex('contas_pagar', 'idx_contas_pagar_acao_id');

        await queryInterface.removeColumn('contas_pagar', 'caminhao_id');
        await queryInterface.removeColumn('contas_pagar', 'cidade');
        await queryInterface.removeColumn('contas_pagar', 'acao_id');
    },
};
