const { sequelize } = require('./src/config/database');

async function popularResultadosExames() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // Verificar dados existentes
        const [countResultados] = await sequelize.query('SELECT COUNT(*) as total FROM resultados_exames');
        const [countInscricoes] = await sequelize.query("SELECT COUNT(*) as total FROM inscricoes WHERE status = 'atendido'");
        const [countExames] = await sequelize.query('SELECT COUNT(*) as total FROM exames');

        console.log(`📊 Resultados existentes: ${countResultados[0].total}`);
        console.log(`📊 Inscrições atendidas: ${countInscricoes[0].total}`);
        console.log(`📊 Exames disponíveis: ${countExames[0].total}\n`);

        if (countInscricoes[0].total === 0) {
            console.log('❌ Nenhuma inscrição atendida. Não há dados para popular.');
            await sequelize.close();
            return;
        }

        if (countExames[0].total === 0) {
            console.log('❌ Nenhum exame cadastrado. Não é possível criar resultados.');
            await sequelize.close();
            return;
        }

        // Buscar inscrições atendidas
        const [inscricoes] = await sequelize.query(`
            SELECT i.id, i.cidadao_id, i.acao_id, a.data_inicio
            FROM inscricoes i
            INNER JOIN acoes a ON i.acao_id = a.id
            WHERE i.status = 'atendido'
            LIMIT 100
        `);

        // Buscar exames
        const [exames] = await sequelize.query('SELECT id FROM exames');

        console.log(`\n🔄 Criando resultados de exames...`);
        let criados = 0;

        for (const inscricao of inscricoes) {
            // Criar 1-2 resultados por inscrição
            const numExames = Math.floor(Math.random() * 2) + 1;

            for (let i = 0; i < numExames && i < exames.length; i++) {
                const exameAleatorio = exames[Math.floor(Math.random() * exames.length)];

                try {
                    await sequelize.query(`
                        INSERT INTO resultados_exames 
                        (id, inscricao_id, exame_id, cidadao_id, acao_id, data_realizacao, resultado, observacoes, created_at, updated_at)
                        VALUES 
                        (gen_random_uuid(), $1, $2, $3, $4, $5, 'Normal', 'Resultado gerado automaticamente', NOW(), NOW())
                    `, {
                        bind: [
                            inscricao.id,
                            exameAleatorio.id,
                            inscricao.cidadao_id,
                            inscricao.acao_id,
                            inscricao.data_inicio || new Date()
                        ]
                    });
                    criados++;
                } catch (error) {
                    // Ignorar duplicatas
                }
            }
        }

        console.log(`\n✅ ${criados} resultados de exames criados!`);

        const [novoCount] = await sequelize.query('SELECT COUNT(*) as total FROM resultados_exames');
        console.log(`📊 Total de resultados agora: ${novoCount[0].total}`);

        await sequelize.close();
        console.log('\n✅ Processo concluído!');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

popularResultadosExames();
