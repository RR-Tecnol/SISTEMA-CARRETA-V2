import { AcaoFuncionario } from '../models/AcaoFuncionario';
import { Funcionario } from '../models/Funcionario';
import { Acao } from '../models/Acao';
import { ContaPagar } from '../models/ContaPagar';
import sequelize from '../models';

async function backfillContasPagar() {
    console.log('🔄 Iniciando backfill de Contas a Pagar para funcionários retroativos...');
    try {
        await sequelize.authenticate();
        console.log('📦 Conectado ao banco de dados');

        const vinculos = await AcaoFuncionario.findAll({
            include: [
                { model: Funcionario, as: 'funcionario' },
                { model: Acao, as: 'acao' },
            ],
        });

        console.log(`📋 Encontrados ${vinculos.length} vínculos de funcionários com ações.`);

        let criadas = 0;
        let jaExistentes = 0;

        for (const vinculo of vinculos) {
            const func = vinculo.getDataValue('funcionario') as any;
            const acao = vinculo.getDataValue('acao') as any;

            if (!func || !acao) continue;

            const diasTrabalhados = vinculo.dias_trabalhados || 1;
            const custoDiario = func.custo_diaria || 0;
            const valorTotal = custoDiario * diasTrabalhados;

            // Busca se já existe uma Conta Pagar para esse cara nessa ação
            const contaExistente = await ContaPagar.findOne({
                where: {
                    acao_id: acao.id,
                    tipo_conta: 'funcionario',
                    descricao: `Pagamento Diária - ${func.nome}`,
                },
            });

            if (contaExistente) {
                jaExistentes++;
            } else {
                await ContaPagar.create({
                    titulo: 'Pagamento de Diária',
                    descricao: `Pagamento Diária - ${func.nome}`,
                    valor: valorTotal,
                    tipo_conta: 'funcionario',
                    status: 'pendente',
                    acao_id: acao.id,
                    data_vencimento: acao.data_fim, // Assume que vence no fim da ação
                } as any);
                criadas++;
                console.log(`✅ Criada conta pendente para ${func.nome} na ação ${acao.numero_acao} no valor de R$ ${valorTotal}`);
            }
        }

        console.log('🚀 Backfill Concluído!');
        console.log(`📊 Contas Criadas: ${criadas}`);
        console.log(`📊 Contas Mantidas (já existiam): ${jaExistentes}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no backfill:', error);
        process.exit(1);
    }
}

backfillContasPagar();
