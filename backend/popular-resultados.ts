import { sequelize } from './src/config/database';
import { ResultadoExame } from './src/models/ResultadoExame';
import { Inscricao } from './src/models/Inscricao';
import { Exame } from './src/models/Exame';

async function popularResultadosExames() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // Verificar quantos resultados já existem
        const countExistentes = await ResultadoExame.count();
        console.log(`📊 Resultados de exames existentes: ${countExistentes}`);

        if (countExistentes > 0) {
            console.log('⚠️  Já existem resultados de exames. Deseja continuar? (Ctrl+C para cancelar)');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Buscar todas as inscrições com status 'atendido'
        const inscricoesAtendidas = await Inscricao.findAll({
            where: { status: 'atendido' },
            include: [
                { model: require('./src/models/Acao').Acao, as: 'acao' },
                { model: require('./src/models/Cidadao').Cidadao, as: 'cidadao' }
            ]
        });

        console.log(`\n📋 Inscrições atendidas encontradas: ${inscricoesAtendidas.length}`);

        if (inscricoesAtendidas.length === 0) {
            console.log('❌ Nenhuma inscrição atendida encontrada. Não há dados para popular.');
            await sequelize.close();
            return;
        }

        // Buscar todos os exames disponíveis
        const exames = await Exame.findAll();
        console.log(`📋 Exames disponíveis: ${exames.length}\n`);

        if (exames.length === 0) {
            console.log('❌ Nenhum exame encontrado. Não é possível criar resultados.');
            await sequelize.close();
            return;
        }

        // Para cada inscrição atendida, criar resultados de exames
        let criados = 0;
        for (const inscricao of inscricoesAtendidas) {
            // Escolher 1-3 exames aleatórios para cada inscrição
            const numExames = Math.floor(Math.random() * 3) + 1;
            const examesEscolhidos = [];

            for (let i = 0; i < numExames && i < exames.length; i++) {
                const exameAleatorio = exames[Math.floor(Math.random() * exames.length)];
                if (!examesEscolhidos.find(e => e.id === exameAleatorio.id)) {
                    examesEscolhidos.push(exameAleatorio);
                }
            }

            for (const exame of examesEscolhidos) {
                try {
                    await ResultadoExame.create({
                        inscricao_id: inscricao.id,
                        exame_id: exame.id,
                        cidadao_id: (inscricao as any).cidadao_id,
                        acao_id: (inscricao as any).acao_id,
                        data_realizacao: (inscricao as any).acao?.data_inicio || new Date(),
                        resultado: 'Normal',
                        observacoes: 'Resultado gerado automaticamente para testes'
                    });
                    criados++;
                } catch (error: any) {
                    console.error(`❌ Erro ao criar resultado para inscrição ${inscricao.id}:`, error.message);
                }
            }
        }

        console.log(`\n✅ ${criados} resultados de exames criados com sucesso!`);
        console.log(`\n📊 Total de resultados agora: ${await ResultadoExame.count()}`);

        await sequelize.close();
        console.log('\n✅ Processo concluído!');
    } catch (error: any) {
        console.error('❌ Erro:', error.message);
        console.error(error);
        process.exit(1);
    }
}

popularResultadosExames();
